package api

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"sync"
	"time"

	"github.com/neper-stars/astrum/lib/logger"
)

// Client is the HTTP client for the Neper API
type Client struct {
	BaseURL    string
	HTTPClient *http.Client
	token      string
	tokenExp   time.Time
	mu         sync.RWMutex

	// Credentials for auto-refresh
	nickname string
	apikey   string
}

// NewClient creates a new Neper API client
func NewClient(baseURL string) *Client {
	// Ensure baseURL doesn't have trailing slash
	if len(baseURL) > 0 && baseURL[len(baseURL)-1] == '/' {
		baseURL = baseURL[:len(baseURL)-1]
	}

	return &Client{
		BaseURL: baseURL,
		HTTPClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// SetToken sets the JWT token and expiry time
func (c *Client) SetToken(token string, expiry time.Time) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.token = token
	c.tokenExp = expiry
}

// GetToken returns the current JWT token
func (c *Client) GetToken() string {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.token
}

// IsTokenValid checks if the current token is still valid
func (c *Client) IsTokenValid() bool {
	c.mu.RLock()
	defer c.mu.RUnlock()
	if c.token == "" {
		return false
	}
	// Consider token invalid if it expires in less than 30 seconds
	return time.Now().Add(30 * time.Second).Before(c.tokenExp)
}

// SetCredentials stores credentials for auto-refresh
func (c *Client) SetCredentials(nickname, apikey string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.nickname = nickname
	c.apikey = apikey
}

// doRequest performs an HTTP request with automatic token refresh
func (c *Client) doRequest(ctx context.Context, method, path string, body interface{}, requireAuth bool) (*http.Response, error) {
	// Auto-refresh token if needed and we have credentials
	if requireAuth && !c.IsTokenValid() {
		c.mu.RLock()
		hasCredentials := c.nickname != "" && c.apikey != ""
		c.mu.RUnlock()

		if hasCredentials {
			if _, err := c.RefreshToken(ctx); err != nil {
				return nil, fmt.Errorf("failed to refresh token: %w", err)
			}
		}
	}

	return c.doRequestRaw(ctx, method, path, body, requireAuth)
}

// doRequestRaw performs an HTTP request without automatic token refresh.
// This is used internally by RefreshToken to avoid infinite recursion.
func (c *Client) doRequestRaw(ctx context.Context, method, path string, body interface{}, includeAuth bool) (*http.Response, error) {
	// Build URL
	u, err := url.Parse(c.BaseURL + path)
	if err != nil {
		return nil, fmt.Errorf("invalid URL: %w", err)
	}

	// Marshal body if provided
	var bodyReader io.Reader
	if body != nil {
		jsonData, err := json.Marshal(body)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal request body: %w", err)
		}
		bodyReader = bytes.NewReader(jsonData)
	}

	// Create request
	req, err := http.NewRequestWithContext(ctx, method, u.String(), bodyReader)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Set headers
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")

	// Add authorization header if token is available and required
	if includeAuth {
		c.mu.RLock()
		token := c.token
		c.mu.RUnlock()
		if token != "" {
			req.Header.Set("Authorization", "Bearer "+token)
		}
	}

	// Execute request
	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}

	return resp, nil
}

// parseResponse parses a JSON response into the provided interface
func parseResponse(resp *http.Response, v interface{}) error {
	defer func() {
		if err := resp.Body.Close(); err != nil {
			logger.API.Warn().Err(err).Msg("Failed to close response body")
		}
	}()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("failed to read response body: %w", err)
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		// Try to parse error response
		var apiErr APIError
		if err := json.Unmarshal(body, &apiErr); err == nil && apiErr.Message != "" {
			return &apiErr
		}
		return fmt.Errorf("HTTP %d: %s", resp.StatusCode, string(body))
	}

	if v != nil {
		if err := json.Unmarshal(body, v); err != nil {
			return fmt.Errorf("failed to unmarshal response: %w", err)
		}
	}

	return nil
}

// APIError represents an error response from the API
type APIError struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
}

func (e *APIError) Error() string {
	return fmt.Sprintf("API error %d: %s", e.Code, e.Message)
}

// =============================================================================
// HTTP method helpers
// =============================================================================

// get performs a GET request and parses the response into v
func (c *Client) get(ctx context.Context, path string, v interface{}) error {
	resp, err := c.doRequest(ctx, http.MethodGet, path, nil, true)
	if err != nil {
		return err
	}
	return parseResponse(resp, v)
}

// post performs a POST request with body and parses the response into v
func (c *Client) post(ctx context.Context, path string, body, v interface{}) error {
	resp, err := c.doRequest(ctx, http.MethodPost, path, body, true)
	if err != nil {
		return err
	}
	return parseResponse(resp, v)
}

// postNoAuth performs a POST request without authentication
func (c *Client) postNoAuth(ctx context.Context, path string, body, v interface{}) error {
	resp, err := c.doRequest(ctx, http.MethodPost, path, body, false)
	if err != nil {
		return err
	}
	return parseResponse(resp, v)
}

// put performs a PUT request with body and parses the response into v
func (c *Client) put(ctx context.Context, path string, body, v interface{}) error {
	resp, err := c.doRequest(ctx, http.MethodPut, path, body, true)
	if err != nil {
		return err
	}
	return parseResponse(resp, v)
}

// delete performs a DELETE request
func (c *Client) delete(ctx context.Context, path string) error {
	resp, err := c.doRequest(ctx, http.MethodDelete, path, nil, true)
	if err != nil {
		return err
	}
	return parseResponse(resp, nil)
}

// downloadBinary performs a GET request and returns the raw binary response body
func (c *Client) downloadBinary(ctx context.Context, path string) ([]byte, error) {
	resp, err := c.doRequest(ctx, http.MethodGet, path, nil, true)
	if err != nil {
		return nil, err
	}
	defer func() { _ = resp.Body.Close() }()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("download failed with status %d: %s", resp.StatusCode, string(body))
	}

	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	return data, nil
}

// DownloadStarsExe downloads the Stars! game executable from the server
func (c *Client) DownloadStarsExe(ctx context.Context) ([]byte, error) {
	return c.downloadBinary(ctx, DownloadStarsExe)
}

// DownloadHistoricBackup downloads the historic backup ZIP for a session
func (c *Client) DownloadHistoricBackup(ctx context.Context, sessionID string) ([]byte, error) {
	return c.downloadBinary(ctx, SessionBackupPath(sessionID))
}
