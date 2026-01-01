package main

import (
	"fmt"
	"sort"

	"github.com/neper-stars/astrum/api"
	"github.com/neper-stars/astrum/lib/logger"
)

// =============================================================================
// SESSIONS
// =============================================================================

// convertPlayers converts API session players to the frontend format
// Players are sorted by their PlayerOrder to ensure consistent display order
func convertPlayers(players []*api.SessionPlayer) []SessionPlayerInfo {
	result := make([]SessionPlayerInfo, len(players))
	for i, p := range players {
		result[i] = SessionPlayerInfo{
			UserProfileID: p.UserProfileID,
			Ready:         p.Ready,
			PlayerOrder:   int(p.PlayerOrder),
		}
	}
	// Sort by PlayerOrder
	sort.Slice(result, func(i, j int) bool {
		return result[i].PlayerOrder < result[j].PlayerOrder
	})
	return result
}

// GetSessions returns all sessions for a server
func (a *App) GetSessions(serverURL string) ([]SessionInfo, error) {
	a.mu.RLock()
	client, ok := a.clients[serverURL]
	mgr, mgrOk := a.authManagers[serverURL]
	a.mu.RUnlock()

	if !ok || !mgrOk {
		return nil, fmt.Errorf("not connected to server: %s", serverURL)
	}

	sessions, err := client.ListSessions(mgr.GetContext())
	if err != nil {
		return nil, fmt.Errorf("failed to get sessions: %w", err)
	}

	// Build map of server session IDs for orphan detection
	serverSessionIDs := make(map[string]bool, len(sessions))
	result := make([]SessionInfo, len(sessions))
	for i, s := range sessions {
		serverSessionIDs[s.ID] = true
		result[i] = SessionInfo{
			ID:                s.ID,
			Name:              s.Name,
			IsPublic:          !s.Private,
			Members:           s.Members,
			Managers:          s.Managers,
			Started:           s.Started,
			RulesIsSet:        s.RulesIsSet,
			Players:           convertPlayers(s.Players),
			PendingInvitation: s.PendingInvitation,
		}
	}

	// Archive any local session directories that no longer exist on the server
	go a.archiveOrphanedSessions(serverURL, serverSessionIDs)

	return result, nil
}

// GetSession returns a specific session
func (a *App) GetSession(serverURL, sessionID string) (*SessionInfo, error) {
	a.mu.RLock()
	client, ok := a.clients[serverURL]
	mgr, mgrOk := a.authManagers[serverURL]
	a.mu.RUnlock()

	if !ok || !mgrOk {
		return nil, fmt.Errorf("not connected to server: %s", serverURL)
	}

	session, err := client.GetSession(mgr.GetContext(), sessionID)
	if err != nil {
		return nil, fmt.Errorf("failed to get session: %w", err)
	}

	logger.App.Debug().
		Str("serverUrl", serverURL).
		Str("sessionId", sessionID).
		Bool("pendingInvitation", session.PendingInvitation).
		Int("playerCount", len(session.Players)).
		Msg("GetSession: fetched session")

	// Debug: log player order
	for i, p := range session.Players {
		logger.App.Debug().
			Int("index", i).
			Str("userProfileId", p.UserProfileID).
			Bool("ready", p.Ready).
			Int64("playerOrder", p.PlayerOrder).
			Msg("GetSession: player in order")
	}

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

// CreateSession creates a new session
func (a *App) CreateSession(serverURL, name string, isPublic bool) (*SessionInfo, error) {
	a.mu.RLock()
	client, ok := a.clients[serverURL]
	mgr, mgrOk := a.authManagers[serverURL]
	a.mu.RUnlock()

	if !ok || !mgrOk {
		return nil, fmt.Errorf("not connected to server: %s", serverURL)
	}

	session := &api.Session{
		Name:    name,
		Private: !isPublic,
	}

	created, err := client.CreateSession(mgr.GetContext(), session)
	if err != nil {
		return nil, fmt.Errorf("failed to create session: %w", err)
	}

	logger.App.Info().Str("name", created.Name).Str("id", created.ID).Msg("Created session")

	// Create the game directory for this session and download stars.exe if enabled
	server, _ := a.config.GetServer(serverURL)
	serverName := serverURL // fallback to URL if server not found
	if server != nil {
		serverName = server.Name
	}
	a.setupSessionGameDir(serverURL, serverName, created.ID)

	return &SessionInfo{
		ID:                created.ID,
		Name:              created.Name,
		IsPublic:          !created.Private,
		Members:           created.Members,
		Managers:          created.Managers,
		Started:           created.Started,
		RulesIsSet:        created.RulesIsSet,
		Players:           convertPlayers(created.Players),
		PendingInvitation: created.PendingInvitation,
	}, nil
}

// JoinSession joins an existing session
func (a *App) JoinSession(serverURL, sessionID string) (*SessionInfo, error) {
	a.mu.RLock()
	client, ok := a.clients[serverURL]
	mgr, mgrOk := a.authManagers[serverURL]
	a.mu.RUnlock()

	if !ok || !mgrOk {
		return nil, fmt.Errorf("not connected to server: %s", serverURL)
	}

	session, err := client.JoinSession(mgr.GetContext(), sessionID)
	if err != nil {
		return nil, fmt.Errorf("failed to join session: %w", err)
	}

	logger.App.Info().Str("name", session.Name).Str("id", session.ID).Msg("Joined session")

	// Create the game directory for this session and download stars.exe if enabled
	server, _ := a.config.GetServer(serverURL)
	serverName := serverURL // fallback to URL if server not found
	if server != nil {
		serverName = server.Name
	}
	a.setupSessionGameDir(serverURL, serverName, session.ID)

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

// DeleteSession deletes a session (manager only)
func (a *App) DeleteSession(serverURL, sessionID string) error {
	a.mu.RLock()
	client, ok := a.clients[serverURL]
	mgr, mgrOk := a.authManagers[serverURL]
	a.mu.RUnlock()

	if !ok || !mgrOk {
		return fmt.Errorf("not connected to server: %s", serverURL)
	}

	if err := client.DeleteSession(mgr.GetContext(), sessionID); err != nil {
		return fmt.Errorf("failed to delete session: %w", err)
	}

	logger.App.Info().Str("id", sessionID).Msg("Deleted session")
	return nil
}

// QuitSession removes the current user from a session
func (a *App) QuitSession(serverURL, sessionID string) error {
	a.mu.RLock()
	client, ok := a.clients[serverURL]
	mgr, mgrOk := a.authManagers[serverURL]
	a.mu.RUnlock()

	if !ok || !mgrOk {
		return fmt.Errorf("not connected to server: %s", serverURL)
	}

	if err := client.QuitSession(mgr.GetContext(), sessionID); err != nil {
		return fmt.Errorf("failed to quit session: %w", err)
	}

	// Stop monitoring this session if we were monitoring it
	a.mu.RLock()
	orderMon, monExists := a.orderMonitors[serverURL]
	a.mu.RUnlock()
	if monExists {
		orderMon.Unwatch(sessionID)
	}

	// Clean up file hashes for this session (files are left on disk for user review)
	if err := a.fileHashTracker.ForgetSession(serverURL, sessionID); err != nil {
		logger.App.Warn().
			Err(err).
			Str("sessionID", sessionID).
			Msg("Failed to clean up file hashes after quitting session")
	}

	logger.App.Info().Str("id", sessionID).Msg("Quit session")
	return nil
}

// PromoteMember promotes a member to manager in a session
func (a *App) PromoteMember(serverURL, sessionID, memberID string) error {
	a.mu.RLock()
	client, ok := a.clients[serverURL]
	mgr, mgrOk := a.authManagers[serverURL]
	a.mu.RUnlock()

	if !ok || !mgrOk {
		return fmt.Errorf("not connected to server: %s", serverURL)
	}

	if err := client.PromoteMember(mgr.GetContext(), sessionID, memberID); err != nil {
		return fmt.Errorf("failed to promote member: %w", err)
	}

	logger.App.Info().Str("sessionId", sessionID).Str("memberId", memberID).Msg("Promoted member to manager")
	return nil
}

// archiveDeletedSession moves a deleted session's directory to ZZ_OLD_SESSIONS
func (a *App) archiveDeletedSession(serverURL, sessionID string) {
	// Get server name from URL
	server, err := a.config.GetServer(serverURL)
	if err != nil || server == nil {
		logger.App.Warn().
			Err(err).
			Str("serverURL", serverURL).
			Str("sessionID", sessionID).
			Msg("Failed to get server for archiving deleted session")
		return
	}

	// Archive the session directory
	archivedPath, err := a.config.ArchiveSessionDir(server.Name, sessionID)
	if err != nil {
		logger.App.Warn().
			Err(err).
			Str("serverName", server.Name).
			Str("sessionID", sessionID).
			Msg("Failed to archive deleted session directory")
		return
	}

	if archivedPath != "" {
		logger.App.Info().
			Str("sessionID", sessionID).
			Str("archivedTo", archivedPath).
			Msg("Archived deleted session directory")
	}
}

// archiveOrphanedSessions checks for local session directories that don't exist on the server
// and moves them to ZZ_OLD_SESSIONS. This is called after fetching sessions from the server.
func (a *App) archiveOrphanedSessions(serverURL string, serverSessionIDs map[string]bool) {
	// Get server name from URL
	server, err := a.config.GetServer(serverURL)
	if err != nil || server == nil {
		return
	}

	// Get local session directories
	localSessionDirs, err := a.config.ListSessionDirs(server.Name)
	if err != nil {
		logger.App.Warn().
			Err(err).
			Str("serverName", server.Name).
			Msg("Failed to list local session directories")
		return
	}

	// Check each local directory against server sessions
	for _, localSessionID := range localSessionDirs {
		if !serverSessionIDs[localSessionID] {
			// This session doesn't exist on server - archive it
			archivedPath, err := a.config.ArchiveSessionDir(server.Name, localSessionID)
			if err != nil {
				logger.App.Warn().
					Err(err).
					Str("sessionID", localSessionID).
					Msg("Failed to archive orphaned session directory")
				continue
			}
			if archivedPath != "" {
				logger.App.Info().
					Str("sessionID", localSessionID).
					Str("archivedTo", archivedPath).
					Msg("Archived orphaned session directory")
			}
		}
	}
}
