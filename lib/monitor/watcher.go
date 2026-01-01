package monitor

import (
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"time"

	"github.com/fsnotify/fsnotify"

	"github.com/neper-stars/astrum/lib/logger"
)

// WatchedSession holds the state needed to monitor a session's game directory
type WatchedSession struct {
	ServerURL   string
	ServerName  string
	SessionID   string
	PlayerOrder int // 0-indexed (file will be game.x{PlayerOrder+1})
	GameDir     string
}

// OrderFileHandler is called when a valid order file is detected
// It receives the file path and should return the year and data if valid, or an error
type OrderFileHandler func(filePath string) (year int, data []byte, err error)

// SubmitHandler is called to submit the order to the server
type SubmitHandler func(serverURL, sessionID string, year int, data []byte) error

// SessionWatcher monitors a single session's game directory for order files
type SessionWatcher struct {
	session WatchedSession
	watcher *fsnotify.Watcher

	orderHandler  OrderFileHandler
	submitHandler SubmitHandler

	mu            sync.Mutex
	debounceTimer *time.Timer
	stopCh        chan struct{}
	stopped       bool
}

// NewSessionWatcher creates a new watcher for a session's game directory
func NewSessionWatcher(session WatchedSession, orderHandler OrderFileHandler, submitHandler SubmitHandler) (*SessionWatcher, error) {
	watcher, err := fsnotify.NewWatcher()
	if err != nil {
		return nil, fmt.Errorf("failed to create fsnotify watcher: %w", err)
	}

	return &SessionWatcher{
		session:       session,
		watcher:       watcher,
		orderHandler:  orderHandler,
		submitHandler: submitHandler,
		stopCh:        make(chan struct{}),
	}, nil
}

// Start begins watching the game directory
func (w *SessionWatcher) Start() error {
	// Ensure directory exists
	info, err := os.Stat(w.session.GameDir)
	if os.IsNotExist(err) {
		return fmt.Errorf("game directory does not exist: %s", w.session.GameDir)
	}
	if err != nil {
		return fmt.Errorf("failed to stat game directory %s: %w", w.session.GameDir, err)
	}
	if !info.IsDir() {
		return fmt.Errorf("game directory path is not a directory: %s", w.session.GameDir)
	}

	// Add directory to watcher
	if err := w.watcher.Add(w.session.GameDir); err != nil {
		return fmt.Errorf("failed to watch directory %s: %w", w.session.GameDir, err)
	}

	logger.Monitor.Info().
		Str("sessionID", w.session.SessionID).
		Str("gameDir", w.session.GameDir).
		Int("playerOrder", w.session.PlayerOrder).
		Str("expectedFile", w.expectedOrderFile()).
		Msg("Started watching session directory")

	// Start event loop
	go w.eventLoop()

	return nil
}

// Stop stops watching the directory
func (w *SessionWatcher) Stop() {
	w.mu.Lock()
	if w.stopped {
		w.mu.Unlock()
		return
	}
	w.stopped = true

	if w.debounceTimer != nil {
		w.debounceTimer.Stop()
	}
	w.mu.Unlock()

	close(w.stopCh)
	_ = w.watcher.Close()

	logger.Monitor.Info().
		Str("sessionID", w.session.SessionID).
		Msg("Stopped watching session directory")
}

// expectedOrderFile returns the expected order filename for this player
func (w *SessionWatcher) expectedOrderFile() string {
	// PlayerOrder is 0-indexed, files use 1-indexed (player 0 -> game.x1)
	return fmt.Sprintf("game.x%d", w.session.PlayerOrder+1)
}

// eventLoop processes fsnotify events
func (w *SessionWatcher) eventLoop() {
	for {
		select {
		case <-w.stopCh:
			return

		case event, ok := <-w.watcher.Events:
			if !ok {
				return
			}
			w.handleEvent(event)

		case err, ok := <-w.watcher.Errors:
			if !ok {
				return
			}
			logger.Monitor.Error().
				Err(err).
				Str("sessionID", w.session.SessionID).
				Msg("Watcher error")
		}
	}
}

// handleEvent processes a single fsnotify event
func (w *SessionWatcher) handleEvent(event fsnotify.Event) {
	// Only care about write and create events
	if !event.Has(fsnotify.Write) && !event.Has(fsnotify.Create) {
		return
	}

	// Check if this is the order file we're looking for
	fileName := filepath.Base(event.Name)
	if fileName != w.expectedOrderFile() {
		return
	}

	logger.Monitor.Debug().
		Str("file", fileName).
		Str("sessionID", w.session.SessionID).
		Msg("Order file change detected")

	// Debounce: Stars! writes multiple times during save
	w.mu.Lock()
	if w.debounceTimer != nil {
		w.debounceTimer.Stop()
	}
	w.debounceTimer = time.AfterFunc(500*time.Millisecond, func() {
		w.processOrderFile(event.Name)
	})
	w.mu.Unlock()
}

// processOrderFile validates and submits an order file
func (w *SessionWatcher) processOrderFile(filePath string) {
	w.mu.Lock()
	if w.stopped {
		w.mu.Unlock()
		return
	}
	w.mu.Unlock()

	logger.Monitor.Debug().
		Str("file", filePath).
		Str("sessionID", w.session.SessionID).
		Msg("Processing order file")

	// Call handler to validate and get order data
	year, data, err := w.orderHandler(filePath)
	if err != nil {
		logger.Monitor.Debug().
			Err(err).
			Str("file", filePath).
			Msg("Order file not ready for upload")
		return
	}

	logger.Monitor.Info().
		Str("sessionID", w.session.SessionID).
		Int("year", year).
		Msg("Submitting order to server")

	// Submit to server
	if err := w.submitHandler(w.session.ServerURL, w.session.SessionID, year, data); err != nil {
		logger.Monitor.Error().
			Err(err).
			Str("sessionID", w.session.SessionID).
			Int("year", year).
			Msg("Failed to submit order")
		return
	}

	logger.Monitor.Info().
		Str("sessionID", w.session.SessionID).
		Int("year", year).
		Msg("Order submitted successfully")
}
