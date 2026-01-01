package main

import (
	"fmt"

	"github.com/neper-stars/astrum/api"
	"github.com/neper-stars/astrum/lib/logger"
)

// =============================================================================
// USER PROFILES
// =============================================================================

// GetUserProfiles returns all user profiles from the server
func (a *App) GetUserProfiles(serverURL string) ([]UserProfileInfo, error) {
	a.mu.RLock()
	client, ok := a.clients[serverURL]
	mgr, mgrOk := a.authManagers[serverURL]
	a.mu.RUnlock()

	if !ok || !mgrOk {
		return nil, fmt.Errorf("not connected to server: %s", serverURL)
	}

	profiles, err := client.ListUserProfiles(mgr.GetContext())
	if err != nil {
		return nil, fmt.Errorf("failed to get user profiles: %w", err)
	}

	result := make([]UserProfileInfo, len(profiles))
	for i, p := range profiles {
		result[i] = UserProfileInfo{
			ID:        p.ID,
			Nickname:  p.Nickname,
			Email:     p.Email,
			IsActive:  p.IsActive,
			IsManager: p.IsManager,
		}
	}

	return result, nil
}

// CreateUserProfile creates a new user profile (admin only)
// Returns the created user profile info
func (a *App) CreateUserProfile(serverURL, nickname, email string) (*UserProfileInfo, error) {
	a.mu.RLock()
	client, ok := a.clients[serverURL]
	mgr, mgrOk := a.authManagers[serverURL]
	a.mu.RUnlock()

	if !ok || !mgrOk {
		return nil, fmt.Errorf("not connected to server: %s", serverURL)
	}

	profile := &api.UserProfile{
		Nickname: nickname,
		Email:    email,
	}

	created, err := client.CreateUserProfile(mgr.GetContext(), profile)
	if err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	logger.App.Info().
		Str("nickname", created.Nickname).
		Str("id", created.ID).
		Str("serverUrl", serverURL).
		Msg("User created by admin")

	return &UserProfileInfo{
		ID:        created.ID,
		Nickname:  created.Nickname,
		Email:     created.Email,
		IsActive:  created.IsActive,
		IsManager: created.IsManager,
	}, nil
}

// DeleteUserProfile deletes a user profile (admin only)
func (a *App) DeleteUserProfile(serverURL, userID string) error {
	a.mu.RLock()
	client, ok := a.clients[serverURL]
	mgr, mgrOk := a.authManagers[serverURL]
	a.mu.RUnlock()

	if !ok || !mgrOk {
		return fmt.Errorf("not connected to server: %s", serverURL)
	}

	if err := client.DeleteUserProfile(mgr.GetContext(), userID); err != nil {
		return fmt.Errorf("failed to delete user: %w", err)
	}

	logger.App.Info().
		Str("userId", userID).
		Str("serverUrl", serverURL).
		Msg("User deleted by admin")

	return nil
}

// ResetUserApikey resets the API key for a user (admin only)
// Returns the new API key
func (a *App) ResetUserApikey(serverURL, userID string) (string, error) {
	a.mu.RLock()
	client, ok := a.clients[serverURL]
	mgr, mgrOk := a.authManagers[serverURL]
	a.mu.RUnlock()

	if !ok || !mgrOk {
		return "", fmt.Errorf("not connected to server: %s", serverURL)
	}

	result, err := client.ResetUserApikey(mgr.GetContext(), userID)
	if err != nil {
		return "", fmt.Errorf("failed to reset API key: %w", err)
	}

	logger.App.Info().Str("userID", userID).Msg("Reset API key for user")
	return result.Apikey, nil
}

// ChangeMyApikey resets the current user's API key, updates stored credentials, and re-authenticates
func (a *App) ChangeMyApikey(serverURL string) (string, error) {
	a.mu.RLock()
	client, ok := a.clients[serverURL]
	mgr, mgrOk := a.authManagers[serverURL]
	conn := a.connections[serverURL]
	a.mu.RUnlock()

	if !ok || !mgrOk {
		return "", fmt.Errorf("not connected to server: %s", serverURL)
	}

	if conn == nil || !conn.Connected {
		return "", fmt.Errorf("not connected to server: %s", serverURL)
	}

	// Get current user info
	userInfo := mgr.GetUserInfo()
	if userInfo == nil || userInfo.User.ID == "" {
		return "", fmt.Errorf("no user info available")
	}

	// Reset the API key on the server
	result, err := client.ResetUserApikey(mgr.GetContext(), userInfo.User.ID)
	if err != nil {
		return "", fmt.Errorf("failed to reset API key: %w", err)
	}

	newApikey := result.Apikey

	// Update stored credentials in keyring
	if err := a.config.SaveCredential(serverURL, userInfo.User.Nickname, newApikey); err != nil {
		logger.App.Warn().Err(err).Msg("Failed to save new credentials to keyring")
		// Continue anyway - we'll return the new key so user can save it
	}

	// Update the client's credentials for auto-refresh
	client.SetCredentials(userInfo.User.Nickname, newApikey)

	// Re-authenticate with the new API key
	if err := mgr.Connect(userInfo.User.Nickname, newApikey); err != nil {
		logger.App.Warn().Err(err).Msg("Failed to re-authenticate with new API key")
		// The key was changed on the server, so we need to return it even if re-auth fails
	}

	logger.App.Info().Str("userID", userInfo.User.ID).Msg("Changed own API key")
	return newApikey, nil
}

// =============================================================================
// INVITATIONS
// =============================================================================

// InviteUser creates an invitation for a user to join a session
func (a *App) InviteUser(serverURL, sessionID, userProfileID string) (*InvitationInfo, error) {
	a.mu.RLock()
	client, ok := a.clients[serverURL]
	mgr, mgrOk := a.authManagers[serverURL]
	a.mu.RUnlock()

	if !ok || !mgrOk {
		return nil, fmt.Errorf("not connected to server: %s", serverURL)
	}

	invitation := &api.Invitation{
		SessionID:     sessionID,
		UserProfileID: userProfileID,
	}

	created, err := client.CreateInvitation(mgr.GetContext(), sessionID, invitation)
	if err != nil {
		return nil, fmt.Errorf("failed to create invitation: %w", err)
	}

	logger.App.Info().Str("userProfileId", userProfileID).Str("sessionId", sessionID).Msg("Created invitation")

	return &InvitationInfo{
		ID:              created.ID,
		SessionID:       created.SessionID,
		SessionName:     created.SessionName,
		UserProfileID:   created.UserProfileID,
		InviterID:       created.InviterID,
		InviterNickname: created.InviterNickname,
	}, nil
}

// GetInvitations returns all invitations for the current user
func (a *App) GetInvitations(serverURL string) ([]InvitationInfo, error) {
	logger.App.Debug().Str("serverUrl", serverURL).Msg("GetInvitations called")

	a.mu.RLock()
	client, ok := a.clients[serverURL]
	mgr, mgrOk := a.authManagers[serverURL]
	a.mu.RUnlock()

	if !ok || !mgrOk {
		logger.App.Warn().Str("serverUrl", serverURL).Msg("GetInvitations: not connected to server")
		return nil, fmt.Errorf("not connected to server: %s", serverURL)
	}

	invitations, err := client.ListInvitations(mgr.GetContext())
	if err != nil {
		return nil, fmt.Errorf("failed to get invitations: %w", err)
	}

	logger.App.Debug().Str("serverUrl", serverURL).Int("count", len(invitations)).Msg("GetInvitations: fetched invitations")

	result := make([]InvitationInfo, len(invitations))
	for i, inv := range invitations {
		result[i] = InvitationInfo{
			ID:              inv.ID,
			SessionID:       inv.SessionID,
			SessionName:     inv.SessionName,
			UserProfileID:   inv.UserProfileID,
			InviterID:       inv.InviterID,
			InviterNickname: inv.InviterNickname,
			InviteeNickname: inv.InviteeNickname,
		}
	}

	return result, nil
}

// GetSentInvitations retrieves all invitations sent by the current user
func (a *App) GetSentInvitations(serverURL string) ([]InvitationInfo, error) {
	logger.App.Debug().Str("serverUrl", serverURL).Msg("GetSentInvitations called")

	a.mu.RLock()
	client, ok := a.clients[serverURL]
	mgr, mgrOk := a.authManagers[serverURL]
	a.mu.RUnlock()

	if !ok || !mgrOk {
		logger.App.Warn().Str("serverUrl", serverURL).Msg("GetSentInvitations: not connected to server")
		return nil, fmt.Errorf("not connected to server: %s", serverURL)
	}

	invitations, err := client.ListSentInvitations(mgr.GetContext())
	if err != nil {
		return nil, fmt.Errorf("failed to get sent invitations: %w", err)
	}

	logger.App.Debug().Str("serverUrl", serverURL).Int("count", len(invitations)).Msg("GetSentInvitations: fetched sent invitations")

	result := make([]InvitationInfo, len(invitations))
	for i, inv := range invitations {
		result[i] = InvitationInfo{
			ID:              inv.ID,
			SessionID:       inv.SessionID,
			SessionName:     inv.SessionName,
			UserProfileID:   inv.UserProfileID,
			InviterID:       inv.InviterID,
			InviterNickname: inv.InviterNickname,
			InviteeNickname: inv.InviteeNickname,
		}
	}

	return result, nil
}

// AcceptInvitation accepts an invitation and joins the session
func (a *App) AcceptInvitation(serverURL, invitationID string) (*SessionInfo, error) {
	a.mu.RLock()
	client, ok := a.clients[serverURL]
	mgr, mgrOk := a.authManagers[serverURL]
	a.mu.RUnlock()

	if !ok || !mgrOk {
		return nil, fmt.Errorf("not connected to server: %s", serverURL)
	}

	session, err := client.AcceptInvitation(mgr.GetContext(), invitationID)
	if err != nil {
		return nil, fmt.Errorf("failed to accept invitation: %w", err)
	}

	logger.App.Info().Str("name", session.Name).Str("id", session.ID).Msg("Accepted invitation, joined session")

	return &SessionInfo{
		ID:                session.ID,
		Name:              session.Name,
		IsPublic:          !session.Private,
		Members:           session.Members,
		Managers:          session.Managers,
		Started:           session.Started,
		RulesIsSet:        session.RulesIsSet,
		Players:           convertPlayers(session.Players),
		PendingInvitation: session.PendingInvitation,
	}, nil
}

// DeclineInvitation declines an invitation
func (a *App) DeclineInvitation(serverURL, invitationID string) error {
	a.mu.RLock()
	client, ok := a.clients[serverURL]
	mgr, mgrOk := a.authManagers[serverURL]
	a.mu.RUnlock()

	if !ok || !mgrOk {
		return fmt.Errorf("not connected to server: %s", serverURL)
	}

	if err := client.DeclineInvitation(mgr.GetContext(), invitationID); err != nil {
		return fmt.Errorf("failed to decline invitation: %w", err)
	}

	logger.App.Info().Str("id", invitationID).Msg("Declined invitation")

	return nil
}

// =============================================================================
// PENDING REGISTRATIONS
// =============================================================================

// GetPendingRegistrations returns all pending registration requests (manager only)
func (a *App) GetPendingRegistrations(serverURL string) ([]UserProfileInfo, error) {
	a.mu.RLock()
	client, ok := a.clients[serverURL]
	mgr, mgrOk := a.authManagers[serverURL]
	a.mu.RUnlock()

	if !ok || !mgrOk {
		return nil, fmt.Errorf("not connected to server: %s", serverURL)
	}

	profiles, err := client.ListPendingRegistrations(mgr.GetContext())
	if err != nil {
		return nil, fmt.Errorf("failed to get pending registrations: %w", err)
	}

	result := make([]UserProfileInfo, len(profiles))
	for i, p := range profiles {
		var message string
		if p.RegistrationMessage != nil {
			message = *p.RegistrationMessage
		}
		result[i] = UserProfileInfo{
			ID:        p.ID,
			Nickname:  p.Nickname,
			Email:     p.Email,
			IsActive:  p.IsActive,
			IsManager: p.IsManager,
			Message:   message,
		}
	}

	return result, nil
}

// ApprovePendingRegistration approves a pending registration (manager only)
// Returns the API key for the newly approved user
func (a *App) ApprovePendingRegistration(serverURL, userID string) (string, error) {
	a.mu.RLock()
	client, ok := a.clients[serverURL]
	mgr, mgrOk := a.authManagers[serverURL]
	a.mu.RUnlock()

	if !ok || !mgrOk {
		return "", fmt.Errorf("not connected to server: %s", serverURL)
	}

	result, err := client.ApprovePendingRegistration(mgr.GetContext(), userID)
	if err != nil {
		return "", fmt.Errorf("failed to approve registration: %w", err)
	}

	logger.App.Info().Str("userID", userID).Msg("Approved pending registration")
	return result.Apikey, nil
}

// RejectPendingRegistration rejects and deletes a pending registration (manager only)
func (a *App) RejectPendingRegistration(serverURL, userID string) error {
	a.mu.RLock()
	client, ok := a.clients[serverURL]
	mgr, mgrOk := a.authManagers[serverURL]
	a.mu.RUnlock()

	if !ok || !mgrOk {
		return fmt.Errorf("not connected to server: %s", serverURL)
	}

	if err := client.RejectPendingRegistration(mgr.GetContext(), userID); err != nil {
		return fmt.Errorf("failed to reject registration: %w", err)
	}

	logger.App.Info().Str("userID", userID).Msg("Rejected pending registration")
	return nil
}
