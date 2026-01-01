package api

import (
	"encoding/json"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"

	"github.com/gorilla/websocket"

	"github.com/neper-stars/astrum/api/async"
	"github.com/neper-stars/astrum/lib/logger"
)

const (
	// Time allowed to read the next pong message from the server
	pongWait = 60 * time.Second

	// Time allowed to write a message to the server
	writeWait = 10 * time.Second
)

// safeDeref returns the dereferenced string or empty string if nil
func safeDeref(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

// NotificationClient handles WebSocket connection for push notifications
type NotificationClient struct {
	baseURL       string
	conn          *websocket.Conn
	onNotify      func(async.ResourceChange)
	onError       func(error)
	done          chan struct{}
	mu            sync.Mutex
	connected     bool
	reconnects    int
	reconnecting  bool // Flag to suppress errors during intentional reconnection
}

// NewNotificationClient creates a new notification client for the given server URL
func NewNotificationClient(baseURL string) *NotificationClient {
	return &NotificationClient{
		baseURL: baseURL,
		done:    make(chan struct{}),
	}
}

// SetOnNotify sets the callback for received notifications
func (nc *NotificationClient) SetOnNotify(callback func(async.ResourceChange)) {
	nc.mu.Lock()
	defer nc.mu.Unlock()
	nc.onNotify = callback
}

// SetOnError sets the callback for connection errors
func (nc *NotificationClient) SetOnError(callback func(error)) {
	nc.mu.Lock()
	defer nc.mu.Unlock()
	nc.onError = callback
}

// Connect establishes the WebSocket connection with the given JWT token
func (nc *NotificationClient) Connect(token string) error {
	nc.mu.Lock()
	defer nc.mu.Unlock()

	if nc.connected {
		return nil // Already connected
	}

	// Convert HTTP URL to WebSocket URL
	wsURL, err := nc.buildWSURL()
	if err != nil {
		return err
	}

	// Create headers with JWT token
	headers := http.Header{}
	headers.Set("Authorization", "Bearer "+token)

	// Connect with custom headers
	dialer := websocket.Dialer{
		HandshakeTimeout: 10 * time.Second,
	}

	conn, _, err := dialer.Dial(wsURL, headers)
	if err != nil {
		return err
	}

	nc.conn = conn
	nc.connected = true
	nc.reconnects = 0

	// Set up ping/pong handlers
	// The server sends pings every 30 seconds, we need to respond with pongs
	conn.SetPongHandler(func(string) error {
		if err := conn.SetReadDeadline(time.Now().Add(pongWait)); err != nil {
			logger.WebSocket.Warn().Err(err).Msg("Failed to set read deadline")
		}
		return nil
	})

	// Also handle pings from server by automatically responding with pong
	conn.SetPingHandler(func(appData string) error {
		if err := conn.SetReadDeadline(time.Now().Add(pongWait)); err != nil {
			logger.WebSocket.Warn().Err(err).Msg("Failed to set read deadline")
		}
		if err := conn.WriteControl(websocket.PongMessage, []byte(appData), time.Now().Add(writeWait)); err != nil {
			logger.WebSocket.Warn().Err(err).Msg("Failed to send pong")
		}
		return nil
	})

	// Set initial read deadline
	if err := conn.SetReadDeadline(time.Now().Add(pongWait)); err != nil {
		logger.WebSocket.Warn().Err(err).Msg("Failed to set initial read deadline")
	}

	// Start read loop in background
	go nc.readLoop()

	logger.WebSocket.Info().Str("url", wsURL).Msg("Connected")
	return nil
}

// Close closes the WebSocket connection
func (nc *NotificationClient) Close() {
	nc.mu.Lock()
	defer nc.mu.Unlock()

	if !nc.connected {
		return
	}

	nc.connected = false
	close(nc.done)

	if nc.conn != nil {
		// Send close message
		if err := nc.conn.WriteMessage(websocket.CloseMessage,
			websocket.FormatCloseMessage(websocket.CloseNormalClosure, "")); err != nil {
			logger.WebSocket.Warn().Err(err).Msg("Failed to send close message")
		}
		if err := nc.conn.Close(); err != nil {
			logger.WebSocket.Warn().Err(err).Msg("Failed to close connection")
		}
		nc.conn = nil
	}

	logger.WebSocket.Info().Msg("Connection closed")
}

// IsConnected returns whether the WebSocket is currently connected
func (nc *NotificationClient) IsConnected() bool {
	nc.mu.Lock()
	defer nc.mu.Unlock()
	return nc.connected
}

// buildWSURL converts the HTTP base URL to a WebSocket URL
func (nc *NotificationClient) buildWSURL() (string, error) {
	u, err := url.Parse(nc.baseURL)
	if err != nil {
		return "", err
	}

	// Convert http(s) to ws(s)
	switch u.Scheme {
	case "https":
		u.Scheme = "wss"
	case "http":
		u.Scheme = "ws"
	case "wss", "ws":
		// Already WebSocket scheme
	default:
		u.Scheme = "ws"
	}

	// Add the notifications path
	u.Path = strings.TrimSuffix(u.Path, "/") + NotificationsPath

	return u.String(), nil
}

// readLoop continuously reads messages from the WebSocket
func (nc *NotificationClient) readLoop() {
	defer func() {
		nc.mu.Lock()
		nc.connected = false
		nc.mu.Unlock()
	}()

	for {
		select {
		case <-nc.done:
			return
		default:
			nc.mu.Lock()
			conn := nc.conn
			nc.mu.Unlock()

			if conn == nil {
				return
			}

			// ReadMessage will block until a message is received or deadline expires
			// The ping handler will reset the deadline when pings are received
			_, message, err := conn.ReadMessage()
			if err != nil {
				if websocket.IsCloseError(err, websocket.CloseNormalClosure, websocket.CloseGoingAway) {
					logger.WebSocket.Info().Msg("Connection closed normally")
					return
				}

				// Check if we're shutting down
				select {
				case <-nc.done:
					return
				default:
				}

				nc.mu.Lock()
				onError := nc.onError
				reconnecting := nc.reconnecting
				nc.mu.Unlock()

				// Only log and call error handler if this isn't an intentional reconnection
				if !reconnecting {
					logger.WebSocket.Error().Err(err).Msg("Read error")
					if onError != nil {
						onError(err)
					}
				}
				return
			}

			// Reset read deadline after receiving a message
			if err := conn.SetReadDeadline(time.Now().Add(pongWait)); err != nil {
				logger.WebSocket.Warn().Err(err).Msg("Failed to reset read deadline")
			}

			// Parse the notification
			var notification async.ResourceChange
			if err := json.Unmarshal(message, &notification); err != nil {
				logger.WebSocket.Warn().Err(err).Msg("Failed to parse notification")
				continue
			}

			logger.WebSocket.Debug().
				Str("type", safeDeref(notification.Type)).
				Str("id", safeDeref(notification.ID)).
				Str("action", safeDeref(notification.Action)).
				Msg("Received notification")

			// Call the notification handler
			nc.mu.Lock()
			onNotify := nc.onNotify
			nc.mu.Unlock()

			if onNotify != nil {
				onNotify(notification)
			}
		}
	}
}

// Reconnect closes the existing connection and establishes a new one
func (nc *NotificationClient) Reconnect(token string) error {
	nc.mu.Lock()

	// Set reconnecting flag to suppress error handler from old connection
	nc.reconnecting = true

	// Close existing connection gracefully if any
	if nc.conn != nil {
		// Send a proper close frame before closing the connection
		if err := nc.conn.WriteControl(
			websocket.CloseMessage,
			websocket.FormatCloseMessage(websocket.CloseNormalClosure, "reconnecting"),
			time.Now().Add(writeWait),
		); err != nil {
			logger.WebSocket.Warn().Err(err).Msg("Failed to send close control")
		}
		if err := nc.conn.Close(); err != nil {
			logger.WebSocket.Warn().Err(err).Msg("Failed to close connection")
		}
		nc.conn = nil
	}
	nc.connected = false

	// Reset done channel for new connection
	select {
	case <-nc.done:
		nc.done = make(chan struct{})
	default:
	}

	nc.mu.Unlock()

	// Small delay to let the old readLoop exit cleanly
	time.Sleep(50 * time.Millisecond)

	// Clear reconnecting flag before connecting
	nc.mu.Lock()
	nc.reconnecting = false
	nc.mu.Unlock()

	return nc.Connect(token)
}
