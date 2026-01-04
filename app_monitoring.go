package main

import (
	"encoding/base64"
	"fmt"
	"os"
	"path/filepath"

	"github.com/wailsapp/wails/v2/pkg/runtime"

	"github.com/neper-stars/astrum/api"
	"github.com/neper-stars/astrum/api/models"
	astrum "github.com/neper-stars/astrum/lib"
	"github.com/neper-stars/astrum/lib/filehash"
	"github.com/neper-stars/astrum/lib/logger"
	"github.com/neper-stars/astrum/lib/monitor"
)

// =============================================================================
// ORDER FILE MONITORING
// =============================================================================

// startMonitoringForServer scans all sessions for a server and starts monitoring
// for sessions where the user is participating (started and ready)
func (a *App) startMonitoringForServer(serverURL string) {
	a.mu.RLock()
	client, ok := a.clients[serverURL]
	authMgr, authOk := a.authManagers[serverURL]
	a.mu.RUnlock()

	if !ok || !authOk {
		logger.Monitor.Warn().Str("serverURL", serverURL).Msg("Cannot start monitoring: not connected")
		return
	}

	// Get user info to identify which player we are
	userInfo := authMgr.GetUserInfo()
	if userInfo == nil {
		logger.Monitor.Warn().Str("serverURL", serverURL).Msg("Cannot start monitoring: no user info")
		return
	}

	// Get server name for directory calculation
	server, _ := a.config.GetServer(serverURL)
	serverName := serverURL
	if server != nil {
		serverName = server.Name
	}

	// Get all sessions
	sessions, err := client.ListSessions(authMgr.GetContext())
	if err != nil {
		logger.Monitor.Error().Err(err).Str("serverURL", serverURL).Msg("Failed to list sessions for monitoring")
		return
	}

	// Find sessions where we are participating (started and we were ready)
	for _, session := range sessions {
		if session.State != models.SessionStateStarted {
			continue
		}

		// Find our player entry and check if we were ready
		for playerIdx, player := range session.Players {
			if player.UserProfileID == userInfo.User.ID && player.Ready {
				// We are participating in this session - start monitoring
				a.startMonitoringSession(serverURL, serverName, session.ID, playerIdx)
				break
			}
		}
	}
}

// startMonitoringSession starts monitoring a single session for order files
func (a *App) startMonitoringSession(serverURL, serverName, sessionID string, playerOrder int) {
	// Get or create monitor manager for this server
	a.mu.Lock()
	orderMon, exists := a.orderMonitors[serverURL]
	if !exists {
		orderMon = monitor.NewManager(
			a.createOrderHandler(serverURL),
			a.createSubmitHandler(serverURL),
		)
		// Set up callback for order submission events
		orderMon.SetOnOrderSubmitted(func(sessID string, year int, success bool, err error) {
			a.mu.RLock()
			shuttingDown := a.shuttingDown
			a.mu.RUnlock()
			if shuttingDown {
				return
			}

			if success {
				runtime.EventsEmit(a.ctx, "order:submitted", serverURL, sessID, year)
			} else {
				errMsg := ""
				if err != nil {
					errMsg = err.Error()
				}
				runtime.EventsEmit(a.ctx, "order:error", serverURL, sessID, year, errMsg)
			}
		})
		a.orderMonitors[serverURL] = orderMon
	}
	a.mu.Unlock()

	// Get game directory
	gameDir, err := a.config.EnsureSessionGameDir(serverName, sessionID)
	if err != nil {
		logger.Monitor.Error().
			Err(err).
			Str("sessionID", sessionID).
			Msg("Failed to get game directory for monitoring")
		return
	}

	// Create watched session
	session := monitor.WatchedSession{
		ServerURL:   serverURL,
		ServerName:  serverName,
		SessionID:   sessionID,
		PlayerOrder: playerOrder,
		GameDir:     gameDir,
	}

	// Start watching
	if err := orderMon.Watch(session); err != nil {
		logger.Monitor.Error().
			Err(err).
			Str("sessionID", sessionID).
			Msg("Failed to start monitoring session")
	}

	// Check for pending order files on startup
	go a.rescanAndUploadPendingOrders(serverURL, sessionID, gameDir, playerOrder)
}

// rescanAndUploadPendingOrders checks for local order files that need to be uploaded on connect
func (a *App) rescanAndUploadPendingOrders(serverURL, sessionID, gameDir string, playerOrder int) {
	// Build the order file path: game.xN where N = playerOrder + 1 (1-indexed)
	orderFileName := fmt.Sprintf("game.x%d", playerOrder+1)
	orderPath := filepath.Join(gameDir, orderFileName)

	// Check if file exists
	data, err := os.ReadFile(orderPath)
	if err != nil {
		if os.IsNotExist(err) {
			logger.Monitor.Debug().
				Str("sessionID", sessionID).
				Str("path", orderPath).
				Msg("No order file found during rescan")
			return
		}
		logger.Monitor.Error().
			Err(err).
			Str("sessionID", sessionID).
			Str("path", orderPath).
			Msg("Failed to read order file during rescan")
		return
	}

	// Validate the order file
	validator, err := astrum.NewOrderValidator(orderPath)
	if err != nil {
		logger.Monitor.Debug().
			Err(err).
			Str("sessionID", sessionID).
			Str("path", orderPath).
			Msg("Failed to parse order file during rescan")
		return
	}

	// Check if turn is submitted
	if !validator.TurnIsSubmitted() {
		logger.Monitor.Debug().
			Str("sessionID", sessionID).
			Str("path", orderPath).
			Msg("Order file not submitted during rescan")
		return
	}

	// Get year from order file
	orderYear := validator.Year()

	// Check if we already have a hash stored for this year (to know if upload is needed)
	orderKey := fmt.Sprintf("order:%d", orderYear)
	hadHashBefore := a.fileHashTracker.GetHash(serverURL, sessionID, orderKey) != ""

	// Use submit handler which handles hash checking, conflict detection, and uploading
	submitHandler := a.createSubmitHandler(serverURL)
	if err := submitHandler(serverURL, sessionID, orderYear, data); err != nil {
		// Error already logged in submitHandler (including conflicts)
		logger.Monitor.Debug().
			Err(err).
			Str("sessionID", sessionID).
			Int("year", orderYear).
			Msg("Submit handler returned error during rescan")
		return
	}

	// Only emit event if we actually uploaded (didn't have hash before, have it now)
	if hadHashBefore {
		logger.Monitor.Debug().
			Str("sessionID", sessionID).
			Int("year", orderYear).
			Msg("Order already uploaded during rescan (hash matched)")
		return
	}

	logger.Monitor.Info().
		Str("sessionID", sessionID).
		Int("year", orderYear).
		Msg("Successfully uploaded order during rescan")

	// Emit event to frontend
	a.mu.RLock()
	shuttingDown := a.shuttingDown
	a.mu.RUnlock()
	if !shuttingDown {
		runtime.EventsEmit(a.ctx, "order:submitted", serverURL, sessionID, orderYear)
	}
}

// createOrderHandler creates a handler function that validates order files
func (a *App) createOrderHandler(serverURL string) monitor.OrderFileHandler {
	return func(filePath string) (year int, data []byte, err error) {
		// Validate the order file
		validator, err := astrum.NewOrderValidator(filePath)
		if err != nil {
			return 0, nil, fmt.Errorf("failed to parse order file: %w", err)
		}

		// Check if turn is submitted
		if !validator.TurnIsSubmitted() {
			return 0, nil, fmt.Errorf("turn not submitted")
		}

		// Get year from order file
		orderYear := validator.Year()

		// Read the file data
		data, err = os.ReadFile(filePath)
		if err != nil {
			return 0, nil, fmt.Errorf("failed to read order file: %w", err)
		}

		return orderYear, data, nil
	}
}

// checkAndStartMonitoring checks if a session has started and we should begin monitoring
func (a *App) checkAndStartMonitoring(serverURL, sessionID string) {
	a.mu.RLock()
	client, ok := a.clients[serverURL]
	authMgr, authOk := a.authManagers[serverURL]
	a.mu.RUnlock()

	if !ok || !authOk {
		return
	}

	// Get session details
	session, err := client.GetSession(authMgr.GetContext(), sessionID)
	if err != nil {
		logger.Monitor.Debug().
			Err(err).
			Str("sessionID", sessionID).
			Msg("Failed to get session for monitoring check")
		return
	}

	// Only interested in started sessions
	if session.State != models.SessionStateStarted {
		return
	}

	// Get user info
	userInfo := authMgr.GetUserInfo()
	if userInfo == nil {
		return
	}

	// Check if we're a ready player in this session
	for playerIdx, player := range session.Players {
		if player.UserProfileID == userInfo.User.ID && player.Ready {
			// Get server name for directory calculation
			server, _ := a.config.GetServer(serverURL)
			serverName := serverURL
			if server != nil {
				serverName = server.Name
			}

			// Start monitoring this session
			logger.Monitor.Info().
				Str("sessionID", sessionID).
				Msg("Session started, beginning monitoring")
			a.startMonitoringSession(serverURL, serverName, sessionID, playerIdx)
			return
		}
	}
}

// createSubmitHandler creates a handler function that submits orders to the server
func (a *App) createSubmitHandler(serverURL string) monitor.SubmitHandler {
	return func(srvURL, sessionID string, year int, data []byte) error {
		// Check hash first to detect conflicts or skip already-uploaded orders
		currentHash := filehash.ComputeHash(data)
		orderKey := fmt.Sprintf("order:%d", year)
		storedHash := a.fileHashTracker.GetHash(srvURL, sessionID, orderKey)

		if storedHash != "" {
			if storedHash == currentHash {
				// Already uploaded this exact file, skip
				logger.Monitor.Debug().
					Str("sessionID", sessionID).
					Int("year", year).
					Msg("Order file already uploaded (hash matches), skipping")
				return nil
			}

			// Hash differs for same year - this is a conflict
			// Stars! shouldn't allow modifying submitted orders
			logger.Monitor.Error().
				Str("sessionID", sessionID).
				Int("year", year).
				Str("storedHash", storedHash[:16]+"...").
				Str("currentHash", currentHash[:16]+"...").
				Msg("Order file was modified after upload - this indicates a problem")

			// Emit conflict event to frontend
			a.mu.RLock()
			shuttingDown := a.shuttingDown
			a.mu.RUnlock()
			if !shuttingDown {
				runtime.EventsEmit(a.ctx, "order:conflict", srvURL, sessionID, year)
			}
			return fmt.Errorf("order conflict: file modified after upload for year %d", year)
		}

		// No stored hash for this year - this is a new order, proceed with upload
		a.mu.RLock()
		client, ok := a.clients[srvURL]
		authMgr, authOk := a.authManagers[srvURL]
		a.mu.RUnlock()

		if !ok || !authOk {
			return fmt.Errorf("not connected to server: %s", srvURL)
		}

		// Get the latest turn year from the server to validate
		latestTurn, err := client.GetLatestTurn(authMgr.GetContext(), sessionID)
		if err != nil {
			return fmt.Errorf("failed to get latest turn from server: %w", err)
		}

		// Check if the order year matches the server year
		if year != int(latestTurn.Year) {
			return fmt.Errorf("order year %d does not match server year %d", year, latestTurn.Year)
		}

		// Submit the order
		order := &api.Order{
			B64Data: base64.StdEncoding.EncodeToString(data),
		}
		if err := client.SubmitTurn(authMgr.GetContext(), sessionID, year, order); err != nil {
			return fmt.Errorf("failed to submit turn: %w", err)
		}

		// Track the uploaded order hash
		if err := a.fileHashTracker.SetHash(srvURL, sessionID, orderKey, currentHash); err != nil {
			logger.Monitor.Warn().
				Err(err).
				Str("sessionID", sessionID).
				Int("year", year).
				Msg("Failed to track uploaded order hash")
		}

		return nil
	}
}
