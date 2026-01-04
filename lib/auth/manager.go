package auth

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/neper-stars/astrum/api"
	"github.com/neper-stars/astrum/lib/logger"
)

// Manager handles authentication and automatic token refresh
type Manager struct {
	client *api.Client
	ctx    context.Context
	cancel context.CancelFunc
	wg     sync.WaitGroup
	mu     sync.RWMutex

	connected bool
	userInfo  *api.UserInfo

	// Callbacks
	onConnectionStateChange func(connected bool, err error)
	onTokenRefreshed        func(newToken string)
}

// NewManager creates a new authentication manager
func NewManager(client *api.Client) *Manager {
	ctx, cancel := context.WithCancel(context.Background())
	return &Manager{
		client: client,
		ctx:    ctx,
		cancel: cancel,
	}
}

// SetOnConnectionStateChange sets a callback for connection state changes
func (m *Manager) SetOnConnectionStateChange(fn func(connected bool, err error)) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.onConnectionStateChange = fn
}

// SetOnTokenRefreshed sets a callback for when the token is refreshed
func (m *Manager) SetOnTokenRefreshed(fn func(newToken string)) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.onTokenRefreshed = fn
}

// Connect authenticates with the server and starts the auto-refresh loop
func (m *Manager) Connect(nickname, apikey string) error {
	// Authenticate
	token, err := m.client.Authenticate(m.ctx, nickname, apikey)
	if err != nil {
		m.notifyConnectionState(false, err)
		return fmt.Errorf("authentication failed: %w", err)
	}

	logger.Auth.Debug().Str("token_prefix", token[:20]).Msg("Authenticated successfully")

	// Get user info
	userInfo, err := m.client.GetUserInfo(m.ctx)
	if err != nil {
		m.notifyConnectionState(false, err)
		return fmt.Errorf("failed to get user info: %w", err)
	}

	m.mu.Lock()
	m.connected = true
	m.userInfo = userInfo
	m.mu.Unlock()

	logger.Auth.Info().Str("nickname", userInfo.User.Nickname).Str("id", userInfo.User.ID).Msg("Connected")

	// Notify token available (for initial WebSocket connection)
	m.notifyTokenRefreshed(token)

	// Notify connection success
	m.notifyConnectionState(true, nil)

	// Start auto-refresh loop
	m.wg.Add(1)
	go m.tokenRefreshLoop()

	return nil
}

// Disconnect stops the authentication manager
func (m *Manager) Disconnect() {
	m.cancel()
	m.wg.Wait()

	m.mu.Lock()
	m.connected = false
	m.userInfo = nil
	m.mu.Unlock()

	m.notifyConnectionState(false, nil)
	logger.Auth.Info().Msg("Disconnected from server")
}

// IsConnected returns whether the manager is currently connected
func (m *Manager) IsConnected() bool {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.connected
}

// GetContext returns the manager's context
func (m *Manager) GetContext() context.Context {
	return m.ctx
}

// GetUserInfo returns the current user information
func (m *Manager) GetUserInfo() *api.UserInfo {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.userInfo
}

// GetToken returns the current token from the client
func (m *Manager) GetToken() string {
	return m.client.GetToken()
}

// tokenRefreshLoop automatically refreshes the JWT token before it expires
func (m *Manager) tokenRefreshLoop() {
	defer m.wg.Done()

	// Refresh token every 4 minutes (tokens expire in 5 minutes)
	ticker := time.NewTicker(4 * time.Minute)
	defer ticker.Stop()

	for {
		select {
		case <-m.ctx.Done():
			return
		case <-ticker.C:
			newToken, err := m.client.RefreshToken(m.ctx)
			if err != nil {
				logger.Auth.Error().Err(err).Msg("Failed to refresh token")
				m.mu.Lock()
				m.connected = false
				m.mu.Unlock()
				m.notifyConnectionState(false, err)
				return
			}
			logger.Auth.Debug().Msg("Token refreshed successfully")

			// Notify about the new token
			m.notifyTokenRefreshed(newToken)
		}
	}
}

// notifyConnectionState calls the connection state callback if set
func (m *Manager) notifyConnectionState(connected bool, err error) {
	m.mu.RLock()
	callback := m.onConnectionStateChange
	m.mu.RUnlock()

	if callback != nil {
		callback(connected, err)
	}
}

// notifyTokenRefreshed calls the token refreshed callback if set
func (m *Manager) notifyTokenRefreshed(token string) {
	m.mu.RLock()
	callback := m.onTokenRefreshed
	m.mu.RUnlock()

	if callback != nil {
		callback(token)
	}
}

// Register submits a registration request for a new user account.
// Returns a RegistrationResult containing the API key.
// If pending is true, the user needs admin approval for full access.
func (m *Manager) Register(nickname, email, message string) (*api.RegistrationResult, error) {
	req := &api.RegistrationRequest{
		Nickname: nickname,
		Email:    email,
		Message:  message,
	}

	result, err := m.client.Register(m.ctx, req)
	if err != nil {
		return nil, fmt.Errorf("registration failed: %w", err)
	}

	logger.Auth.Info().
		Str("nickname", result.Nickname).
		Str("userId", result.UserID).
		Bool("pending", result.Pending).
		Bool("hasApikey", result.Apikey != "").
		Msg("Registration request submitted")

	return result, nil
}
