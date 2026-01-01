package main

import (
	"fmt"
	"time"

	"github.com/gen2brain/beeep"
	"github.com/wailsapp/wails/v2/pkg/runtime"

	"github.com/neper-stars/astrum/api"
	"github.com/neper-stars/astrum/api/async"
	"github.com/neper-stars/astrum/lib/auth"
	"github.com/neper-stars/astrum/lib/logger"
	"github.com/neper-stars/astrum/lib/notification"
)

// =============================================================================
// AUTHENTICATION
// =============================================================================

// Connect authenticates with a server
func (a *App) Connect(serverURL, username, password string) (*ConnectResult, error) {
	// Get server info
	server, err := a.config.GetServer(serverURL)
	if err != nil {
		return nil, fmt.Errorf("failed to get server: %w", err)
	}
	if server == nil {
		return nil, fmt.Errorf("server not found: %s", serverURL)
	}

	// Create API client
	client := api.NewClient(serverURL)

	// Create auth manager
	authMgr := auth.NewManager(client)

	// Create notification manager
	notifMgr := notification.NewManager(serverURL)

	// Set up notification callbacks
	a.setupNotificationCallbacks(notifMgr, serverURL)

	// Set up connection state callback
	authMgr.SetOnConnectionStateChange(func(connected bool, err error) {
		a.mu.Lock()
		shuttingDown := a.shuttingDown
		if connected {
			userInfo := authMgr.GetUserInfo()
			a.connections[serverURL] = &ConnectionState{
				Connected: true,
				Username:  userInfo.User.Nickname,
				UserID:    userInfo.User.ID,
				Since:     time.Now(),
			}
		} else {
			errMsg := ""
			if err != nil {
				errMsg = err.Error()
			}
			a.connections[serverURL] = &ConnectionState{
				Connected: false,
				Error:     errMsg,
			}
		}
		a.mu.Unlock()

		// Don't emit events during shutdown (WebView may be destroyed)
		if shuttingDown {
			return
		}

		// Emit connection state change event
		runtime.EventsEmit(a.ctx, "connection:changed", serverURL, connected)
	})

	// Wire auth token refresh to notification manager reconnect
	authMgr.SetOnTokenRefreshed(func(token string) {
		if err := notifMgr.Reconnect(token); err != nil {
			logger.App.Warn().Err(err).Msg("Failed to reconnect notification manager")
		}
	})

	// Connect auth (this will trigger OnTokenRefreshed which connects notifications)
	if err := authMgr.Connect(username, password); err != nil {
		return nil, fmt.Errorf("connection failed: %w", err)
	}

	// Start polling fallback
	notifMgr.StartPolling()

	// Store client and managers
	a.mu.Lock()
	a.clients[serverURL] = client
	a.authManagers[serverURL] = authMgr
	a.notificationManagers[serverURL] = notifMgr
	a.mu.Unlock()

	// Save credentials to keyring
	if err := a.config.SaveCredential(serverURL, username, password); err != nil {
		logger.App.Warn().Err(err).Msg("Failed to save credentials")
	}

	// Start monitoring for sessions where we are participating
	go a.startMonitoringForServer(serverURL)

	userInfo := authMgr.GetUserInfo()

	// Fetch user profile to get isManager status
	isManager := false
	profile, err := client.GetUserProfile(authMgr.GetContext(), userInfo.User.ID)
	if err != nil {
		logger.App.Warn().Err(err).Msg("Failed to get user profile for manager status")
	} else {
		isManager = profile.IsManager
	}

	logger.App.Debug().
		Str("username", userInfo.User.Nickname).
		Str("serialKey", userInfo.SerialKey).
		Msg("Connect result with serial key")

	return &ConnectResult{
		Username:  userInfo.User.Nickname,
		UserID:    userInfo.User.ID,
		IsManager: isManager,
		SerialKey: userInfo.SerialKey,
	}, nil
}

// setupNotificationCallbacks configures callbacks for a notification manager
func (a *App) setupNotificationCallbacks(notifMgr *notification.Manager, serverURL string) {
	// Set up notification callback
	notifMgr.SetOnNotification(func(n async.ResourceChange) {
		a.mu.RLock()
		shuttingDown := a.shuttingDown
		a.mu.RUnlock()
		if shuttingDown {
			return
		}

		// Safely get pointer values
		nType := ""
		nAction := ""
		nID := ""
		if n.Type != nil {
			nType = *n.Type
		}
		if n.Action != nil {
			nAction = *n.Action
		}
		if n.ID != nil {
			nID = *n.ID
		}

		// Emit typed notification event: "notification:<type>:<action>"
		eventName := fmt.Sprintf("notification:%s:%s", nType, nAction)

		// For session_turn, include metadata (year)
		if nType == api.NotificationTypeSessionTurn && n.Metadata != nil {
			runtime.EventsEmit(a.ctx, eventName, serverURL, nID, n.Metadata)
			logger.App.Debug().
				Str("event", eventName).
				Str("serverUrl", serverURL).
				Str("id", nID).
				Interface("metadata", n.Metadata).
				Msg("Notification received")

			// Show desktop notification for new turns (action is "ready" for both game start and new turn generation)
			if nAction == async.ResourceChangeActionReady {
				go a.showTurnReadyNotification(serverURL, nID, n.Metadata)
			}
		} else {
			runtime.EventsEmit(a.ctx, eventName, serverURL, nID)
			logger.App.Debug().
				Str("event", eventName).
				Str("serverUrl", serverURL).
				Str("id", nID).
				Msg("Notification received")
		}

		// Handle session updates - check if session started and we should begin monitoring
		if nType == api.NotificationTypeSession && nAction == async.ResourceChangeActionUpdated {
			go a.checkAndStartMonitoring(serverURL, nID)
		}

		// Handle session deleted - archive the session directory
		if nType == api.NotificationTypeSession && nAction == async.ResourceChangeActionDeleted {
			go a.archiveDeletedSession(serverURL, nID)
		}
	})

	// Set up polling fallback callback
	notifMgr.SetOnPollFallback(func() {
		a.mu.RLock()
		shuttingDown := a.shuttingDown
		a.mu.RUnlock()
		if shuttingDown {
			return
		}
		runtime.EventsEmit(a.ctx, "sessions:updated", serverURL)
	})
}

// showTurnReadyNotification shows a desktop notification when a new turn is ready
func (a *App) showTurnReadyNotification(serverURL, sessionID string, metadata interface{}) {
	// Get the year from metadata
	year := 0
	if metaMap, ok := metadata.(map[string]interface{}); ok {
		if yearVal, ok := metaMap["year"]; ok {
			switch v := yearVal.(type) {
			case float64:
				year = int(v)
			case int:
				year = v
			}
		}
	}

	// Get session name from the server
	sessionName := sessionID // fallback to ID
	a.mu.RLock()
	client, ok := a.clients[serverURL]
	mgr, mgrOk := a.authManagers[serverURL]
	a.mu.RUnlock()

	if ok && mgrOk {
		ctx := mgr.GetContext()
		if session, err := client.GetSession(ctx, sessionID); err == nil {
			sessionName = session.Name
		}
	}

	// Build notification message
	title := "Turn Ready"
	message := fmt.Sprintf("Year %d is ready in %s", year, sessionName)

	// Show desktop notification with icon (pass bytes directly for D-Bus compatibility)
	if err := beeep.Notify(title, message, a.notificationIcon); err != nil {
		logger.App.Warn().Err(err).Msg("Failed to show desktop notification")
	} else {
		logger.App.Debug().
			Str("sessionId", sessionID).
			Str("sessionName", sessionName).
			Int("year", year).
			Msg("Desktop notification shown for new turn")
	}
}

// Disconnect disconnects from a server
func (a *App) Disconnect(serverURL string) error {
	// Get the managers while holding the lock, but don't call Disconnect
	// while holding it (would deadlock with the connection state callback)
	a.mu.Lock()
	authMgr := a.authManagers[serverURL]
	notifMgr := a.notificationManagers[serverURL]
	orderMon := a.orderMonitors[serverURL]
	a.mu.Unlock()

	// Disconnect outside the lock (this triggers callbacks which need the lock)
	if orderMon != nil {
		orderMon.Stop()
	}
	if notifMgr != nil {
		notifMgr.Disconnect()
	}
	if authMgr != nil {
		authMgr.Disconnect()
	}

	// Now clean up the maps
	a.mu.Lock()
	delete(a.authManagers, serverURL)
	delete(a.notificationManagers, serverURL)
	delete(a.orderMonitors, serverURL)
	delete(a.clients, serverURL)
	a.connections[serverURL] = &ConnectionState{
		Connected: false,
	}
	a.mu.Unlock()

	logger.App.Info().Str("serverUrl", serverURL).Msg("Disconnected")
	return nil
}

// GetConnectionState returns the current connection state for a server
func (a *App) GetConnectionState(serverURL string) *ConnectionState {
	a.mu.RLock()
	defer a.mu.RUnlock()

	if conn, ok := a.connections[serverURL]; ok {
		return conn
	}
	return &ConnectionState{Connected: false}
}

// GetCurrentAPIKey returns the API key for the currently connected user on a server
func (a *App) GetCurrentAPIKey(serverURL string) (string, error) {
	a.mu.RLock()
	conn := a.connections[serverURL]
	a.mu.RUnlock()

	if conn == nil || !conn.Connected {
		return "", fmt.Errorf("not connected to server")
	}

	apiKey, err := a.config.CredentialStore().GetAPIKey(serverURL, conn.Username)
	if err != nil {
		return "", fmt.Errorf("failed to get API key: %w", err)
	}
	if apiKey == "" {
		return "", fmt.Errorf("no API key found for user")
	}

	return apiKey, nil
}

// AutoConnect attempts to connect to a server using saved credentials
// Returns the connect result if successful, or an error describing why auto-connect failed
func (a *App) AutoConnect(serverURL string) (*ConnectResult, error) {
	// Get server info
	server, err := a.config.GetServer(serverURL)
	if err != nil {
		return nil, fmt.Errorf("failed to get server: %w", err)
	}
	if server == nil {
		return nil, fmt.Errorf("server not found: %s", serverURL)
	}

	// Check if we have saved credentials
	defaultCred := server.GetDefaultCredentialRef()
	if defaultCred == nil {
		return nil, fmt.Errorf("no saved credentials for server %s", serverURL)
	}

	// Get the API key from keyring
	apiKey, err := a.config.GetCredential(serverURL, defaultCred.NickName)
	if err != nil {
		return nil, fmt.Errorf("failed to retrieve credentials: %w", err)
	}
	if apiKey == "" {
		return nil, fmt.Errorf("credentials not found in keyring for %s", defaultCred.NickName)
	}

	logger.App.Info().Str("serverUrl", serverURL).Str("nickname", defaultCred.NickName).Msg("Auto-connecting")

	// Use the regular Connect method with retrieved credentials
	return a.Connect(serverURL, defaultCred.NickName, apiKey)
}

// Register submits a registration request for a new user account on a server.
// The user will be pending approval by a global manager.
// No connection is established - user must wait for approval.
func (a *App) Register(serverURL, nickname, email, message string) error {
	client := api.NewClient(serverURL)
	authMgr := auth.NewManager(client)

	_, err := authMgr.Register(nickname, email, message)
	if err != nil {
		return fmt.Errorf("registration failed: %w", err)
	}

	logger.App.Info().
		Str("nickname", nickname).
		Str("serverUrl", serverURL).
		Msg("Registration request submitted, pending approval")

	return nil
}
