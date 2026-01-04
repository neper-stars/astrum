package api

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/neper-stars/astrum/lib/logger"
)

// Authenticate authenticates with the server and returns a JWT token
func (c *Client) Authenticate(ctx context.Context, nickname, apikey string) (string, error) {
	creds := Credentials{
		Nickname: nickname,
		APIKey:   apikey,
	}

	// Note: Authenticate uses doRequest directly because the response is a plain text token
	resp, err := c.doRequest(ctx, http.MethodPost, AuthAuthenticate, creds, false)
	if err != nil {
		return "", err
	}
	defer func() {
		if err := resp.Body.Close(); err != nil {
			logger.API.Warn().Err(err).Msg("Failed to close response body")
		}
	}()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read response body: %w", err)
	}

	if resp.StatusCode != 200 {
		var apiErr APIError
		if err := json.Unmarshal(body, &apiErr); err == nil && apiErr.Message != "" {
			return "", &apiErr
		}
		return "", fmt.Errorf("authentication failed: HTTP %d: %s", resp.StatusCode, string(body))
	}

	// Response is just a plain string token
	token := strings.TrimSpace(string(body))
	// Remove quotes if present
	if len(token) > 0 && token[0] == '"' {
		token = token[1 : len(token)-1]
	}

	// Store credentials for auto-refresh
	c.SetCredentials(nickname, apikey)

	// JWT tokens from Neper expire in 5 minutes
	c.SetToken(token, time.Now().Add(5*time.Minute))

	return token, nil
}

// RefreshToken refreshes the JWT token using the current token and returns the new token
func (c *Client) RefreshToken(ctx context.Context) (string, error) {
	// Note: RefreshToken uses doRequestRaw to avoid infinite recursion
	// (doRequest would try to call RefreshToken again if token is invalid)
	resp, err := c.doRequestRaw(ctx, http.MethodPost, AuthRefreshToken, nil, true)
	if err != nil {
		return "", err
	}
	defer func() {
		if err := resp.Body.Close(); err != nil {
			logger.API.Warn().Err(err).Msg("Failed to close response body")
		}
	}()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read response body: %w", err)
	}

	if resp.StatusCode != 200 {
		// If refresh fails, try to re-authenticate
		c.mu.RLock()
		nickname := c.nickname
		apikey := c.apikey
		c.mu.RUnlock()

		if nickname != "" && apikey != "" {
			return c.Authenticate(ctx, nickname, apikey)
		}

		var apiErr APIError
		if err := json.Unmarshal(body, &apiErr); err == nil && apiErr.Message != "" {
			return "", &apiErr
		}
		return "", fmt.Errorf("token refresh failed: HTTP %d: %s", resp.StatusCode, string(body))
	}

	// Response is just a plain string token
	token := strings.TrimSpace(string(body))
	// Remove quotes if present
	if len(token) > 0 && token[0] == '"' {
		token = token[1 : len(token)-1]
	}

	// JWT tokens from Neper expire in 5 minutes
	c.SetToken(token, time.Now().Add(5*time.Minute))

	return token, nil
}

// GetUserInfo retrieves the current user information
func (c *Client) GetUserInfo(ctx context.Context) (*UserInfo, error) {
	var userInfo UserInfo
	if err := c.get(ctx, AuthUserInfo, &userInfo); err != nil {
		return nil, err
	}
	return &userInfo, nil
}

// RegistrationRequest is the request body for user self-registration
type RegistrationRequest struct {
	Nickname string `json:"nickname"`
	Email    string `json:"email"`
	Message  string `json:"message,omitempty"`
}

// Register submits a registration request for a new user account.
// Returns a RegistrationResult containing the API key.
// If pending is true, the user needs admin approval for full access.
func (c *Client) Register(ctx context.Context, req *RegistrationRequest) (*RegistrationResult, error) {
	var result RegistrationResult
	if err := c.postNoAuth(ctx, AuthRegister, req, &result); err != nil {
		return nil, err
	}
	return &result, nil
}

// CreateUserProfile creates a new user profile (admin only)
func (c *Client) CreateUserProfile(ctx context.Context, profile *UserProfile) (*UserProfile, error) {
	var created UserProfile
	if err := c.post(ctx, UserProfilesBase, profile, &created); err != nil {
		return nil, err
	}
	return &created, nil
}

// GetUserProfile retrieves a user profile by ID
func (c *Client) GetUserProfile(ctx context.Context, profileID string) (*UserProfile, error) {
	var profile UserProfile
	if err := c.get(ctx, UserProfilePath(profileID), &profile); err != nil {
		return nil, err
	}
	return &profile, nil
}

// UpdateUserProfile updates a user profile
func (c *Client) UpdateUserProfile(ctx context.Context, profileID string, profile *UserProfile) (*UserProfile, error) {
	var updated UserProfile
	if err := c.put(ctx, UserProfilePath(profileID), profile, &updated); err != nil {
		return nil, err
	}
	return &updated, nil
}

// DeleteUserProfile deletes a user profile (admin only)
func (c *Client) DeleteUserProfile(ctx context.Context, profileID string) error {
	return c.delete(ctx, UserProfilePath(profileID))
}

// ListUserProfiles lists all user profiles
func (c *Client) ListUserProfiles(ctx context.Context) ([]UserProfile, error) {
	var profiles []UserProfile
	if err := c.get(ctx, UserProfilesBase, &profiles); err != nil {
		return nil, err
	}
	return profiles, nil
}

// ResetApikeyResult is the response from resetting a user's API key
type ResetApikeyResult struct {
	Apikey string `json:"apikey"`
}

// ResetUserApikey resets the API key for a user profile (admin only)
func (c *Client) ResetUserApikey(ctx context.Context, profileID string) (*ResetApikeyResult, error) {
	var result ResetApikeyResult
	if err := c.post(ctx, UserProfileResetApikeyPath(profileID), nil, &result); err != nil {
		return nil, err
	}
	return &result, nil
}

// =============================================================================
// Pending Registrations
// =============================================================================

// ListPendingRegistrations lists all pending registration requests (manager only)
func (c *Client) ListPendingRegistrations(ctx context.Context) ([]UserProfile, error) {
	var profiles []UserProfile
	if err := c.get(ctx, PendingRegistrationsBase, &profiles); err != nil {
		return nil, err
	}
	return profiles, nil
}

// ApprovePendingRegistration approves a pending registration (manager only)
// Returns the API key for the newly approved user
func (c *Client) ApprovePendingRegistration(ctx context.Context, profileID string) (*ResetApikeyResult, error) {
	var result ResetApikeyResult
	if err := c.post(ctx, PendingRegistrationApprovePath(profileID), nil, &result); err != nil {
		return nil, err
	}
	return &result, nil
}

// RejectPendingRegistration rejects and deletes a pending registration (manager only)
func (c *Client) RejectPendingRegistration(ctx context.Context, profileID string) error {
	return c.delete(ctx, PendingRegistrationRejectPath(profileID))
}
