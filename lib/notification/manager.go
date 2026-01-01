package notification

import (
	"sync"
	"time"

	"github.com/neper-stars/astrum/api"
	"github.com/neper-stars/astrum/api/async"
	"github.com/neper-stars/astrum/lib/logger"
)

// Reconnection backoff settings
const (
	initialBackoff = 5 * time.Second
	maxBackoff     = 60 * time.Second
	backoffFactor  = 2
)

// Manager handles WebSocket notifications and polling fallback
type Manager struct {
	client      *api.NotificationClient
	mu          sync.RWMutex
	connected   bool
	token       string           // Current token for reconnection attempts
	stopPolling chan struct{}
	stopReconnect chan struct{}
	pollWg      sync.WaitGroup
	reconnectWg sync.WaitGroup

	// Callbacks
	onNotification     func(async.ResourceChange)
	onConnectionChange func(connected bool)
	onPollFallback     func() // Called when polling as fallback
}

// NewManager creates a new notification manager
func NewManager(baseURL string) *Manager {
	return &Manager{
		client:        api.NewNotificationClient(baseURL),
		stopPolling:   make(chan struct{}),
		stopReconnect: make(chan struct{}),
	}
}

// SetOnNotification sets the callback for received notifications
func (m *Manager) SetOnNotification(fn func(async.ResourceChange)) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.onNotification = fn

	// Wire up to the client
	m.client.SetOnNotify(func(n async.ResourceChange) {
		m.mu.RLock()
		callback := m.onNotification
		m.mu.RUnlock()
		if callback != nil {
			callback(n)
		}
	})
}

// SetOnConnectionChange sets the callback for WebSocket connection state changes
func (m *Manager) SetOnConnectionChange(fn func(connected bool)) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.onConnectionChange = fn
}

// SetOnPollFallback sets the callback for polling fallback (when WebSocket is down)
func (m *Manager) SetOnPollFallback(fn func()) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.onPollFallback = fn
}

// Connect establishes the WebSocket connection with the given token
func (m *Manager) Connect(token string) error {
	// Store token for reconnection attempts
	m.mu.Lock()
	m.token = token
	m.mu.Unlock()

	// Set up error handler that triggers reconnection
	m.client.SetOnError(func(err error) {
		logger.Notification.Error().Err(err).Msg("WebSocket error")
		m.mu.Lock()
		m.connected = false
		m.mu.Unlock()
		m.notifyConnectionChange(false)

		// Start reconnection attempts
		m.startReconnectLoop()
	})

	// Connect
	if err := m.client.Connect(token); err != nil {
		logger.Notification.Error().Err(err).Msg("Failed to connect WebSocket")
		m.mu.Lock()
		m.connected = false
		m.mu.Unlock()
		m.notifyConnectionChange(false)
		return err
	}

	logger.Notification.Info().Msg("WebSocket connected")
	m.mu.Lock()
	m.connected = true
	m.mu.Unlock()
	m.notifyConnectionChange(true)

	return nil
}

// Reconnect closes the existing connection and establishes a new one
func (m *Manager) Reconnect(token string) error {
	// Stop any ongoing reconnection attempts (new token supersedes them)
	m.stopReconnectLoop()

	// Store new token
	m.mu.Lock()
	m.token = token
	m.mu.Unlock()

	// Set up error handler that triggers reconnection
	m.client.SetOnError(func(err error) {
		logger.Notification.Error().Err(err).Msg("WebSocket error")
		m.mu.Lock()
		m.connected = false
		m.mu.Unlock()
		m.notifyConnectionChange(false)

		// Start reconnection attempts
		m.startReconnectLoop()
	})

	// Reconnect
	if err := m.client.Reconnect(token); err != nil {
		logger.Notification.Error().Err(err).Msg("Failed to reconnect WebSocket")
		m.mu.Lock()
		m.connected = false
		m.mu.Unlock()
		m.notifyConnectionChange(false)
		return err
	}

	logger.Notification.Info().Msg("WebSocket reconnected")
	m.mu.Lock()
	m.connected = true
	m.mu.Unlock()
	m.notifyConnectionChange(true)

	return nil
}

// Disconnect closes the WebSocket connection and stops all background loops
func (m *Manager) Disconnect() {
	// Stop reconnection loop
	m.stopReconnectLoop()

	// Stop polling
	m.StopPolling()

	// Close WebSocket
	if m.client != nil {
		m.client.Close()
	}

	m.mu.Lock()
	m.connected = false
	m.token = ""
	m.mu.Unlock()

	logger.Notification.Info().Msg("Disconnected")
}

// IsConnected returns whether the WebSocket is currently connected
func (m *Manager) IsConnected() bool {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.connected
}

// StartPolling starts the polling fallback loop
func (m *Manager) StartPolling() {
	m.mu.Lock()
	// Reset stop channel if it was closed
	select {
	case <-m.stopPolling:
		m.stopPolling = make(chan struct{})
	default:
	}
	m.mu.Unlock()

	m.pollWg.Add(1)
	go m.pollLoop()
}

// StopPolling stops the polling fallback loop
func (m *Manager) StopPolling() {
	m.mu.Lock()
	select {
	case <-m.stopPolling:
		// Already closed
	default:
		close(m.stopPolling)
	}
	m.mu.Unlock()

	m.pollWg.Wait()
}

// startReconnectLoop starts the reconnection loop in a goroutine
func (m *Manager) startReconnectLoop() {
	m.mu.Lock()
	// Reset stop channel if it was closed
	select {
	case <-m.stopReconnect:
		m.stopReconnect = make(chan struct{})
	default:
		// Already have an active channel, check if loop is running
		// If reconnectWg counter is > 0, loop is already running
	}
	m.mu.Unlock()

	m.reconnectWg.Add(1)
	go m.reconnectLoop()
}

// stopReconnectLoop stops the reconnection loop
func (m *Manager) stopReconnectLoop() {
	m.mu.Lock()
	select {
	case <-m.stopReconnect:
		// Already closed
	default:
		close(m.stopReconnect)
	}
	m.mu.Unlock()

	m.reconnectWg.Wait()

	// Reset channel for future use
	m.mu.Lock()
	m.stopReconnect = make(chan struct{})
	m.mu.Unlock()
}

// reconnectLoop attempts to reconnect with exponential backoff
func (m *Manager) reconnectLoop() {
	defer m.reconnectWg.Done()

	backoff := initialBackoff

	for {
		// Check if we should stop
		select {
		case <-m.stopReconnect:
			logger.Notification.Debug().Msg("Reconnection loop stopped")
			return
		default:
		}

		// Check if already connected (another reconnect might have succeeded)
		m.mu.RLock()
		connected := m.connected
		token := m.token
		m.mu.RUnlock()

		if connected {
			logger.Notification.Debug().Msg("Already connected, stopping reconnection loop")
			return
		}

		if token == "" {
			logger.Notification.Debug().Msg("No token available, stopping reconnection loop")
			return
		}

		logger.Notification.Debug().Dur("backoff", backoff).Msg("Attempting reconnection")

		// Wait for backoff duration or stop signal
		select {
		case <-m.stopReconnect:
			logger.Notification.Debug().Msg("Reconnection loop stopped during backoff")
			return
		case <-time.After(backoff):
		}

		// Attempt reconnection
		if err := m.client.Reconnect(token); err != nil {
			logger.Notification.Warn().Err(err).Msg("Reconnection attempt failed")

			// Increase backoff (exponential)
			backoff *= backoffFactor
			if backoff > maxBackoff {
				backoff = maxBackoff
			}
			continue
		}

		// Success!
		logger.Notification.Info().Msg("Reconnection successful")
		m.mu.Lock()
		m.connected = true
		m.mu.Unlock()
		m.notifyConnectionChange(true)
		return
	}
}

// pollLoop polls for updates when WebSocket is disconnected
func (m *Manager) pollLoop() {
	defer m.pollWg.Done()

	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-m.stopPolling:
			return
		case <-ticker.C:
			m.mu.RLock()
			wsConnected := m.connected
			callback := m.onPollFallback
			m.mu.RUnlock()

			// Only poll if WebSocket is not connected
			if !wsConnected && callback != nil {
				logger.Notification.Debug().Msg("WebSocket disconnected, using polling fallback")
				callback()
			}
		}
	}
}

// notifyConnectionChange calls the connection change callback if set
func (m *Manager) notifyConnectionChange(connected bool) {
	m.mu.RLock()
	callback := m.onConnectionChange
	m.mu.RUnlock()

	if callback != nil {
		callback(connected)
	}
}
