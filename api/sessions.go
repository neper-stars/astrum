package api

import "context"

// ListSessions retrieves all sessions visible to the current user
func (c *Client) ListSessions(ctx context.Context) ([]Session, error) {
	var sessions []Session
	if err := c.get(ctx, SessionsBase, &sessions); err != nil {
		return nil, err
	}
	return sessions, nil
}

// ListSessionsIncludeArchived retrieves all sessions including archived ones
func (c *Client) ListSessionsIncludeArchived(ctx context.Context) ([]Session, error) {
	var sessions []Session
	if err := c.get(ctx, SessionsBase+"?include_archived=true", &sessions); err != nil {
		return nil, err
	}
	return sessions, nil
}

// GetSession retrieves a specific session by ID
func (c *Client) GetSession(ctx context.Context, sessionID string) (*Session, error) {
	var session Session
	if err := c.get(ctx, SessionPath(sessionID), &session); err != nil {
		return nil, err
	}
	return &session, nil
}

// CreateSession creates a new game session
func (c *Client) CreateSession(ctx context.Context, session *Session) (*Session, error) {
	var created Session
	if err := c.post(ctx, SessionsBase, session, &created); err != nil {
		return nil, err
	}
	return &created, nil
}

// UpdateSession updates an existing session
func (c *Client) UpdateSession(ctx context.Context, sessionID string, session *Session) (*Session, error) {
	var updated Session
	if err := c.put(ctx, SessionPath(sessionID), session, &updated); err != nil {
		return nil, err
	}
	return &updated, nil
}

// DeleteSession deletes a session (manager only)
func (c *Client) DeleteSession(ctx context.Context, sessionID string) error {
	return c.delete(ctx, SessionPath(sessionID))
}

// JoinSession joins a public session or accepts an invitation to a private session
func (c *Client) JoinSession(ctx context.Context, sessionID string) (*Session, error) {
	var session Session
	if err := c.post(ctx, SessionJoinPath(sessionID), nil, &session); err != nil {
		return nil, err
	}
	return &session, nil
}

// QuitSession removes the current user from a session
func (c *Client) QuitSession(ctx context.Context, sessionID string) error {
	return c.post(ctx, SessionQuitPath(sessionID), nil, nil)
}

// PromoteMember promotes a member to manager in a session
func (c *Client) PromoteMember(ctx context.Context, sessionID, memberID string) error {
	return c.post(ctx, SessionPromoteMemberPath(sessionID, memberID), nil, nil)
}

// CreateInvitation creates an invitation for a user to join a session
func (c *Client) CreateInvitation(ctx context.Context, sessionID string, invitation *Invitation) (*Invitation, error) {
	var created Invitation
	if err := c.post(ctx, SessionInvitePath(sessionID), invitation, &created); err != nil {
		return nil, err
	}
	return &created, nil
}

// ListInvitations retrieves all invitations for the current user
func (c *Client) ListInvitations(ctx context.Context) ([]Invitation, error) {
	var invitations []Invitation
	if err := c.get(ctx, InvitationsBase, &invitations); err != nil {
		return nil, err
	}
	return invitations, nil
}

// ListSentInvitations retrieves all invitations sent by the current user
func (c *Client) ListSentInvitations(ctx context.Context) ([]Invitation, error) {
	var invitations []Invitation
	if err := c.get(ctx, InvitationsSentBase, &invitations); err != nil {
		return nil, err
	}
	return invitations, nil
}

// AcceptInvitation accepts an invitation and joins the session
func (c *Client) AcceptInvitation(ctx context.Context, invitationID string) (*Session, error) {
	var session Session
	if err := c.put(ctx, InvitationPath(invitationID), nil, &session); err != nil {
		return nil, err
	}
	return &session, nil
}

// DeclineInvitation declines an invitation and removes it from the system
func (c *Client) DeclineInvitation(ctx context.Context, invitationID string) error {
	return c.delete(ctx, InvitationPath(invitationID))
}

// GetSessionPlayerRace gets the current player's race for a session
// Note: This returns the Race object directly (with data), not SessionPlayerRace
func (c *Client) GetSessionPlayerRace(ctx context.Context, sessionID string) (*Race, error) {
	var race Race
	if err := c.get(ctx, SessionPlayerRacePath(sessionID), &race); err != nil {
		return nil, err
	}
	return &race, nil
}

// SetSessionPlayerRace sets or updates the race for a player in a session
func (c *Client) SetSessionPlayerRace(ctx context.Context, sessionID string, playerRace *SessionPlayerRace) (*SessionPlayerRace, error) {
	var created SessionPlayerRace
	if err := c.post(ctx, SessionPlayerRacePath(sessionID), playerRace, &created); err != nil {
		return nil, err
	}
	return &created, nil
}

// SetPlayerReady sets the ready state for the current player in a session
func (c *Client) SetPlayerReady(ctx context.Context, sessionID string, ready bool) (*SessionPlayerRace, error) {
	var updated SessionPlayerRace
	if err := c.put(ctx, SessionPlayerReadyPath(sessionID), ready, &updated); err != nil {
		return nil, err
	}
	return &updated, nil
}

// DeleteSessionPlayerRace removes a player from a session (manager only for bots)
func (c *Client) DeleteSessionPlayerRace(ctx context.Context, sessionID, playerRaceID string) error {
	return c.delete(ctx, SessionPlayerRaceDeletePath(sessionID, playerRaceID))
}

// ReorderPlayers updates the player order in a session (manager only)
func (c *Client) ReorderPlayers(ctx context.Context, sessionID string, playerOrders []PlayerOrder) ([]PlayerOrder, error) {
	var updated []PlayerOrder
	if err := c.put(ctx, SessionReorderPlayersPath(sessionID), playerOrders, &updated); err != nil {
		return nil, err
	}
	return updated, nil
}

// CreateRules creates rules for a session (manager only)
func (c *Client) CreateRules(ctx context.Context, sessionID string, ruleset *Ruleset) (*Ruleset, error) {
	var created Ruleset
	if err := c.post(ctx, SessionRulesPath(sessionID), ruleset, &created); err != nil {
		return nil, err
	}
	return &created, nil
}

// GetRules retrieves the rules for a session
func (c *Client) GetRules(ctx context.Context, sessionID string) (*Ruleset, error) {
	var ruleset Ruleset
	if err := c.get(ctx, SessionRulesPath(sessionID), &ruleset); err != nil {
		return nil, err
	}
	return &ruleset, nil
}

// InitializeGame initializes the game for a session (generates first turn)
func (c *Client) InitializeGame(ctx context.Context, sessionID string) (*TurnFiles, error) {
	var files TurnFiles
	if err := c.post(ctx, SessionGamePath(sessionID), nil, &files); err != nil {
		return nil, err
	}
	return &files, nil
}

// GetTurn retrieves turn files for a specific year
func (c *Client) GetTurn(ctx context.Context, sessionID string, year int) (*TurnFiles, error) {
	var turnFiles TurnFiles
	if err := c.get(ctx, SessionTurnPath(sessionID, year), &turnFiles); err != nil {
		return nil, err
	}
	return &turnFiles, nil
}

// GetLatestTurn retrieves the latest turn files for a session
func (c *Client) GetLatestTurn(ctx context.Context, sessionID string) (*TurnFiles, error) {
	var turnFiles TurnFiles
	if err := c.get(ctx, SessionTurnLatestPath(sessionID), &turnFiles); err != nil {
		return nil, err
	}
	return &turnFiles, nil
}

// SubmitTurn submits turn orders for a specific year
func (c *Client) SubmitTurn(ctx context.Context, sessionID string, year int, order *Order) error {
	return c.put(ctx, SessionTurnPath(sessionID, year), order, nil)
}

// GetOrdersStatus retrieves order submission status for all players for a specific year
func (c *Client) GetOrdersStatus(ctx context.Context, sessionID string, year int) ([]PlayerOrderStatus, error) {
	var status []PlayerOrderStatus
	if err := c.get(ctx, SessionOrdersStatusPath(sessionID, year), &status); err != nil {
		return nil, err
	}
	return status, nil
}

// GetSessionFiles retrieves all session files (manager only, for backup)
func (c *Client) GetSessionFiles(ctx context.Context, sessionID string) (*SessionFiles, error) {
	var files SessionFiles
	if err := c.get(ctx, SessionFilesPath(sessionID), &files); err != nil {
		return nil, err
	}
	return &files, nil
}

// ListRaces retrieves all races for a user profile
func (c *Client) ListRaces(ctx context.Context, userProfileID string) ([]Race, error) {
	var races []Race
	if err := c.get(ctx, UserProfileRacesPath(userProfileID), &races); err != nil {
		return nil, err
	}
	return races, nil
}

// GetRace retrieves a specific race by ID
func (c *Client) GetRace(ctx context.Context, userProfileID, raceID string) (*Race, error) {
	var race Race
	if err := c.get(ctx, UserProfileRacePath(userProfileID, raceID), &race); err != nil {
		return nil, err
	}
	return &race, nil
}

// CreateRace uploads a new race file
func (c *Client) CreateRace(ctx context.Context, userProfileID string, race *Race) (*Race, error) {
	var created Race
	if err := c.post(ctx, UserProfileRacesPath(userProfileID), race, &created); err != nil {
		return nil, err
	}
	return &created, nil
}

// DeleteRace deletes a race from a user profile
func (c *Client) DeleteRace(ctx context.Context, userProfileID, raceID string) error {
	return c.delete(ctx, UserProfileRacePath(userProfileID, raceID))
}

// ArchiveSession archives a finished session (manager only)
func (c *Client) ArchiveSession(ctx context.Context, sessionID string) error {
	return c.post(ctx, SessionArchivePath(sessionID), nil, nil)
}
