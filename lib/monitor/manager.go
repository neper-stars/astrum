package monitor

import (
	"fmt"
	"sync"

	"github.com/neper-stars/astrum/lib/logger"
)

// Manager coordinates file monitoring for all active sessions on a server
type Manager struct {
	mu       sync.RWMutex
	watchers map[string]*SessionWatcher // key: sessionID

	orderHandler  OrderFileHandler
	submitHandler SubmitHandler

	// Callbacks for events
	onOrderSubmitted func(sessionID string, year int, success bool, err error)
}

// NewManager creates a new monitoring manager
func NewManager(orderHandler OrderFileHandler, submitHandler SubmitHandler) *Manager {
	return &Manager{
		watchers:      make(map[string]*SessionWatcher),
		orderHandler:  orderHandler,
		submitHandler: submitHandler,
	}
}

// SetOnOrderSubmitted sets the callback for when an order is submitted
func (m *Manager) SetOnOrderSubmitted(fn func(sessionID string, year int, success bool, err error)) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.onOrderSubmitted = fn
}

// Watch starts monitoring a session's game directory
func (m *Manager) Watch(session WatchedSession) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	// Check if already watching
	if _, exists := m.watchers[session.SessionID]; exists {
		logger.Monitor.Debug().
			Str("sessionID", session.SessionID).
			Msg("Already watching session")
		return nil
	}

	// Create submit handler wrapper that emits callback
	submitWrapper := func(serverURL, sessionID string, year int, data []byte) error {
		err := m.submitHandler(serverURL, sessionID, year, data)

		m.mu.RLock()
		callback := m.onOrderSubmitted
		m.mu.RUnlock()

		if callback != nil {
			callback(sessionID, year, err == nil, err)
		}

		return err
	}

	// Create watcher
	watcher, err := NewSessionWatcher(session, m.orderHandler, submitWrapper)
	if err != nil {
		return fmt.Errorf("failed to create watcher for session %s: %w", session.SessionID, err)
	}

	// Start watching
	if err := watcher.Start(); err != nil {
		return fmt.Errorf("failed to start watcher for session %s: %w", session.SessionID, err)
	}

	m.watchers[session.SessionID] = watcher

	logger.Monitor.Info().
		Str("sessionID", session.SessionID).
		Str("gameDir", session.GameDir).
		Msg("Started monitoring session")

	return nil
}

// Unwatch stops monitoring a specific session
func (m *Manager) Unwatch(sessionID string) {
	m.mu.Lock()
	defer m.mu.Unlock()

	if watcher, exists := m.watchers[sessionID]; exists {
		watcher.Stop()
		delete(m.watchers, sessionID)
		logger.Monitor.Info().
			Str("sessionID", sessionID).
			Msg("Stopped monitoring session")
	}
}

// Stop stops all watchers
func (m *Manager) Stop() {
	m.mu.Lock()
	defer m.mu.Unlock()

	for sessionID, watcher := range m.watchers {
		watcher.Stop()
		logger.Monitor.Debug().
			Str("sessionID", sessionID).
			Msg("Stopped watcher")
	}
	m.watchers = make(map[string]*SessionWatcher)

	logger.Monitor.Info().Msg("Stopped all monitors")
}

// WatchedSessions returns a list of currently watched session IDs
func (m *Manager) WatchedSessions() []string {
	m.mu.RLock()
	defer m.mu.RUnlock()

	sessions := make([]string, 0, len(m.watchers))
	for sessionID := range m.watchers {
		sessions = append(sessions, sessionID)
	}
	return sessions
}
