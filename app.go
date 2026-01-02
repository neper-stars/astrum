package main

import (
	"context"
	"sync"

	"github.com/gen2brain/beeep"
	"github.com/wailsapp/wails/v2/pkg/runtime"

	"github.com/neper-stars/astrum/api"
	"github.com/neper-stars/astrum/database"
	astrum "github.com/neper-stars/astrum/lib"
	"github.com/neper-stars/astrum/lib/auth"
	"github.com/neper-stars/astrum/lib/filehash"
	"github.com/neper-stars/astrum/lib/logger"
	"github.com/neper-stars/astrum/lib/monitor"
	"github.com/neper-stars/astrum/lib/notification"
)

// =============================================================================
// APP STRUCT - Main application state
// =============================================================================

// App struct holds application state and is exposed to the frontend
type App struct {
	ctx    context.Context
	config *astrum.Config

	mu                   sync.RWMutex
	clients              map[string]*api.Client           // serverURL -> client
	authManagers         map[string]*auth.Manager         // serverURL -> auth manager
	notificationManagers map[string]*notification.Manager // serverURL -> notification manager
	orderMonitors        map[string]*monitor.Manager      // serverURL -> order file monitor
	connections          map[string]*ConnectionState      // serverURL -> connection state
	fileHashTracker      *filehash.Tracker                // tracks file hashes to avoid unnecessary writes
	shuttingDown         bool                             // true when app is shutting down
	notificationIcon     []byte                           // icon data for desktop notifications
}

// NewApp creates a new App instance
func NewApp() *App {
	return &App{
		clients:              make(map[string]*api.Client),
		authManagers:         make(map[string]*auth.Manager),
		notificationManagers: make(map[string]*notification.Manager),
		orderMonitors:        make(map[string]*monitor.Manager),
		connections:          make(map[string]*ConnectionState),
	}
}

// SetNotificationIcon stores the embedded icon data for use in desktop notifications
func (a *App) SetNotificationIcon(iconData []byte) {
	if len(iconData) == 0 {
		return
	}
	a.notificationIcon = iconData
	logger.App.Debug().Int("size", len(iconData)).Msg("Notification icon ready")
}

// startup is called when the app starts
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	// Set app name for desktop notifications
	beeep.AppName = "Astrum"

	// Open database (BBolt)
	db, err := database.Open(astrum.ConfigPath())
	if err != nil {
		logger.App.Fatal().Err(err).Msg("Failed to open database")
	}

	// Create config
	config, err := astrum.NewConfig(db)
	if err != nil {
		logger.App.Fatal().Err(err).Msg("Failed to create config")
	}
	a.config = config

	// Create file hash tracker with DB persistence
	tracker, err := filehash.NewTracker(db)
	if err != nil {
		logger.App.Fatal().Err(err).Msg("Failed to create file hash tracker")
	}
	a.fileHashTracker = tracker

	// Ensure servers directory exists
	if err := a.config.EnsureServersDir(); err != nil {
		logger.App.Warn().Err(err).Msg("Failed to create servers directory")
	}

	// Restore window geometry from previous session
	a.restoreWindowGeometry(ctx)

	logger.App.Info().Msg("Application started successfully")
}

// beforeClose is called before the window closes (while GTK window is still valid)
// Returns false to allow close, true to prevent close
func (a *App) beforeClose(ctx context.Context) bool {
	// Save window geometry while the window is still valid
	a.saveWindowGeometry(ctx)
	return false // Allow the window to close
}

// shutdown is called when the app closes
func (a *App) shutdown(ctx context.Context) {
	// Set shutdown flag to prevent emitting events to destroyed WebView
	a.mu.Lock()
	a.shuttingDown = true
	a.mu.Unlock()

	// Collect managers to disconnect (avoid holding lock during disconnect
	// which would deadlock with the connection state callback)
	a.mu.Lock()
	authManagers := make([]*auth.Manager, 0, len(a.authManagers))
	notifManagers := make([]*notification.Manager, 0, len(a.notificationManagers))
	orderMonitors := make([]*monitor.Manager, 0, len(a.orderMonitors))
	for url, mgr := range a.authManagers {
		logger.App.Debug().Str("url", url).Msg("Stopping auth manager")
		authManagers = append(authManagers, mgr)
	}
	for url, mgr := range a.notificationManagers {
		logger.App.Debug().Str("url", url).Msg("Stopping notification manager")
		notifManagers = append(notifManagers, mgr)
	}
	for url, mgr := range a.orderMonitors {
		logger.App.Debug().Str("url", url).Msg("Stopping order monitor")
		orderMonitors = append(orderMonitors, mgr)
	}
	a.mu.Unlock()

	// Disconnect all managers (this may trigger callbacks that need the lock)
	for _, mgr := range orderMonitors {
		mgr.Stop()
	}
	for _, mgr := range notifManagers {
		mgr.Disconnect()
	}
	for _, mgr := range authManagers {
		mgr.Disconnect()
	}

	// Clear the maps
	a.mu.Lock()
	a.authManagers = make(map[string]*auth.Manager)
	a.notificationManagers = make(map[string]*notification.Manager)
	a.orderMonitors = make(map[string]*monitor.Manager)
	a.clients = make(map[string]*api.Client)
	a.connections = make(map[string]*ConnectionState)
	a.mu.Unlock()

	// Close database
	if a.config != nil {
		a.config.OnShutdown()
	}

	logger.App.Info().Msg("Application shutdown complete")
}

// =============================================================================
// WINDOW GEOMETRY PERSISTENCE
// =============================================================================

// saveWindowGeometry saves the current window position and size
func (a *App) saveWindowGeometry(ctx context.Context) {
	if a.config == nil {
		return
	}

	width, height := runtime.WindowGetSize(ctx)
	x, y := runtime.WindowGetPosition(ctx)

	geom := &astrum.WindowGeometry{
		X:      x,
		Y:      y,
		Width:  width,
		Height: height,
	}

	if err := a.config.SetWindowGeometry(geom); err != nil {
		logger.App.Warn().Err(err).Msg("Failed to save window geometry")
	} else {
		logger.App.Debug().
			Int("x", x).Int("y", y).
			Int("width", width).Int("height", height).
			Msg("Window geometry saved")
	}
}

// restoreWindowGeometry restores the saved window position and size if valid
func (a *App) restoreWindowGeometry(ctx context.Context) {
	if a.config == nil {
		return
	}

	geom, err := a.config.GetWindowGeometry()
	if err != nil {
		logger.App.Warn().Err(err).Msg("Failed to get saved window geometry")
		return
	}
	if geom == nil {
		logger.App.Debug().Msg("No saved window geometry found")
		return
	}

	// Validate geometry is on a visible screen
	if !a.isGeometryOnScreen(ctx, geom) {
		logger.App.Info().
			Int("x", geom.X).Int("y", geom.Y).
			Int("width", geom.Width).Int("height", geom.Height).
			Msg("Saved geometry is off-screen, using defaults")
		return
	}

	// Restore position and size
	runtime.WindowSetPosition(ctx, geom.X, geom.Y)
	runtime.WindowSetSize(ctx, geom.Width, geom.Height)

	logger.App.Debug().
		Int("x", geom.X).Int("y", geom.Y).
		Int("width", geom.Width).Int("height", geom.Height).
		Msg("Window geometry restored")
}

// isGeometryOnScreen checks if the window geometry would be reasonably visible
// Wails Screen doesn't provide X/Y positions, so we validate against screen dimensions
func (a *App) isGeometryOnScreen(ctx context.Context, geom *astrum.WindowGeometry) bool {
	screens, err := runtime.ScreenGetAll(ctx)
	if err != nil {
		logger.App.Warn().Err(err).Msg("Failed to get screen info")
		return false
	}

	if len(screens) == 0 {
		return false
	}

	// Find the largest screen dimensions (accounts for multi-monitor setups)
	var maxWidth, maxHeight int
	for _, screen := range screens {
		if screen.Size.Width > maxWidth {
			maxWidth = screen.Size.Width
		}
		if screen.Size.Height > maxHeight {
			maxHeight = screen.Size.Height
		}
	}

	// We require at least 100x100 pixels to be potentially visible
	const minVisible = 100

	// Check if window position would place at least some of it on screen
	// Allow negative positions up to (screenSize - minVisible) to support
	// windows partially off the left/top edge
	if geom.X < -geom.Width+minVisible || geom.X > maxWidth-minVisible {
		return false
	}
	if geom.Y < -geom.Height+minVisible || geom.Y > maxHeight-minVisible {
		return false
	}

	// Ensure saved size is reasonable (not larger than any known screen)
	if geom.Width > maxWidth*2 || geom.Height > maxHeight*2 {
		return false
	}

	return true
}

// =============================================================================
// DEBUG LOGGING (from Elm frontend)
// =============================================================================

// LogDebug logs a debug message from the Elm frontend
func (a *App) LogDebug(message string) {
	logger.App.Debug().Str("source", "elm").Msg(message)
}
