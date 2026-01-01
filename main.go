package main

import (
	"context"
	"embed"
	"errors"
	"fmt"
	"os"
	"os/exec"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/linux"
	"github.com/wailsapp/wails/v2/pkg/runtime"

	"github.com/neper-stars/astrum/database"
	astrum "github.com/neper-stars/astrum/lib"
	"github.com/neper-stars/astrum/lib/logger"
)

//go:embed all:frontend/static
var assets embed.FS

//go:embed resources/astrum.png
var appIcon []byte

// Check if running in binding generation mode
var bindingMode = os.Getenv("ASTRUM_BINDING_MODE") == "true"

// checkSingleInstance verifies no other instance is running by trying to open the database.
// Returns nil if we can proceed, or an error if another instance is running.
func checkSingleInstance() error {
	if bindingMode {
		return nil // Skip check in binding mode
	}

	// Try to open the database to check if another instance has it locked
	db, err := database.Open(astrum.ConfigPath())
	if err != nil {
		if errors.Is(err, database.ErrDatabaseLocked) {
			return fmt.Errorf("another instance of Astrum is already running")
		}
		// Other database errors are not instance-related, let startup handle them
		return nil
	}
	// Close it immediately - the actual startup will open it again
	if err := db.Close(); err != nil {
		logger.Logger.Warn().Err(err).Msg("Failed to close database after instance check")
	}
	return nil
}

// showErrorDialog displays an error message using zenity (Linux) or similar
func showErrorDialog(message string) {
	// Try zenity first (common on GNOME)
	if _, err := exec.LookPath("zenity"); err == nil {
		cmd := exec.Command("zenity", "--error", "--title=Astrum", "--text="+message)
		_ = cmd.Run()
		return
	}
	// Try kdialog (KDE)
	if _, err := exec.LookPath("kdialog"); err == nil {
		cmd := exec.Command("kdialog", "--error", message, "--title", "Astrum")
		_ = cmd.Run()
		return
	}
	// Try xmessage (basic X11)
	if _, err := exec.LookPath("xmessage"); err == nil {
		cmd := exec.Command("xmessage", "-center", message)
		_ = cmd.Run()
		return
	}
	// Fallback to just logging
	logger.Logger.Error().Msg(message)
}

func main() {
	// Initialize logger (debug mode can be controlled via env var)
	debug := os.Getenv("ASTRUM_DEBUG") == "true"
	logger.Init(debug)

	// Check for another running instance before starting Wails
	if err := checkSingleInstance(); err != nil {
		showErrorDialog(err.Error())
		os.Exit(1)
	}

	app := NewApp()
	app.SetNotificationIcon(appIcon)

	err := wails.Run(&options.App{
		Title:     "Astrum",
		Width:     1024,
		Height:    768,
		MinWidth:  800,
		MinHeight: 600,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		// Discord-style dark background
		BackgroundColour: &options.RGBA{R: 54, G: 57, B: 63, A: 1},
		OnStartup: func(ctx context.Context) {
			if bindingMode {
				logger.Logger.Info().Msg("Binding generation mode - quitting")
				runtime.Quit(ctx)
				return
			}
			app.startup(ctx)
		},
		OnShutdown: app.shutdown,
		Bind: []interface{}{
			app,
		},
		Linux: &linux.Options{
			Icon: appIcon,
		},
	})

	if err != nil {
		logger.Logger.Fatal().Err(err).Msg("Error starting application")
	}
}
