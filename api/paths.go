package api

import "fmt"

// API path constants
const (
	// Base API path
	APIBase = "/api/v1"

	// Authentication paths
	AuthBase         = APIBase + "/auth"
	AuthAuthenticate = AuthBase + "/authenticate"
	AuthRefreshToken = AuthBase + "/refresh_token"
	AuthUserInfo     = AuthBase + "/userinfo"
	AuthRegister     = AuthBase + "/register"

	// Sessions paths
	SessionsBase = APIBase + "/sessions"

	// Invitations paths
	InvitationsBase     = APIBase + "/invitations"
	InvitationsSentBase = InvitationsBase + "/sent"

	// User profiles paths
	UserProfilesBase = APIBase + "/user_profiles"

	// Pending registrations paths
	PendingRegistrationsBase = APIBase + "/pending_registrations"

	// Downloads paths
	DownloadsBase    = APIBase + "/downloads"
	DownloadStarsExe = DownloadsBase + "/stars.exe"

	// Notifications (WebSocket)
	NotificationsPath = APIBase + "/notifications"
)

// =============================================================================
// Session URL builders
// =============================================================================

// SessionPath returns the path for a specific session
func SessionPath(sessionID string) string {
	return fmt.Sprintf("%s/%s", SessionsBase, sessionID)
}

// SessionJoinPath returns the path to join a session
func SessionJoinPath(sessionID string) string {
	return fmt.Sprintf("%s/%s/join", SessionsBase, sessionID)
}

// SessionQuitPath returns the path to quit a session
func SessionQuitPath(sessionID string) string {
	return fmt.Sprintf("%s/%s/quit", SessionsBase, sessionID)
}

// SessionPromoteMemberPath returns the path to promote a member to manager
func SessionPromoteMemberPath(sessionID, memberID string) string {
	return fmt.Sprintf("%s/%s/promote/%s", SessionsBase, sessionID, memberID)
}

// SessionInvitePath returns the path to invite to a session
func SessionInvitePath(sessionID string) string {
	return fmt.Sprintf("%s/%s/invite", SessionsBase, sessionID)
}

// SessionPlayerRacePath returns the path for player race in a session
func SessionPlayerRacePath(sessionID string) string {
	return fmt.Sprintf("%s/%s/player_race", SessionsBase, sessionID)
}

// SessionPlayerReadyPath returns the path for player ready state in a session
func SessionPlayerReadyPath(sessionID string) string {
	return fmt.Sprintf("%s/%s/player_race/ready", SessionsBase, sessionID)
}

// SessionReorderPlayersPath returns the path to reorder players in a session
func SessionReorderPlayersPath(sessionID string) string {
	return fmt.Sprintf("%s/%s/reorder_players", SessionsBase, sessionID)
}

// SessionRulesPath returns the path for session rules
func SessionRulesPath(sessionID string) string {
	return fmt.Sprintf("%s/%s/rules", SessionsBase, sessionID)
}

// SessionGamePath returns the path for session game initialization
func SessionGamePath(sessionID string) string {
	return fmt.Sprintf("%s/%s/game", SessionsBase, sessionID)
}

// SessionTurnPath returns the path for a specific turn in a session
func SessionTurnPath(sessionID string, year int) string {
	return fmt.Sprintf("%s/%s/turn/%d", SessionsBase, sessionID, year)
}

// SessionTurnLatestPath returns the path for the latest turn in a session
func SessionTurnLatestPath(sessionID string) string {
	return fmt.Sprintf("%s/%s/turn/latest", SessionsBase, sessionID)
}

// SessionOrdersStatusPath returns the path for orders status in a session for a year
func SessionOrdersStatusPath(sessionID string, year int) string {
	return fmt.Sprintf("%s/%s/orders/%d", SessionsBase, sessionID, year)
}

// SessionFilesPath returns the path to get all session files (manager only)
func SessionFilesPath(sessionID string) string {
	return fmt.Sprintf("%s/%s/files", SessionsBase, sessionID)
}

// SessionBackupPath returns the path to download historic backup zip
func SessionBackupPath(sessionID string) string {
	return fmt.Sprintf("%s/%s/backup", SessionsBase, sessionID)
}

// =============================================================================
// Invitation URL builders
// =============================================================================

// InvitationPath returns the path for a specific invitation
func InvitationPath(invitationID string) string {
	return fmt.Sprintf("%s/%s", InvitationsBase, invitationID)
}

// =============================================================================
// User profile URL builders
// =============================================================================

// UserProfilePath returns the path for a specific user profile
func UserProfilePath(profileID string) string {
	return fmt.Sprintf("%s/%s", UserProfilesBase, profileID)
}

// UserProfileRacesPath returns the path for races of a user profile
func UserProfileRacesPath(profileID string) string {
	return fmt.Sprintf("%s/%s/races", UserProfilesBase, profileID)
}

// UserProfileRacePath returns the path for a specific race of a user profile
func UserProfileRacePath(profileID, raceID string) string {
	return fmt.Sprintf("%s/%s/races/%s", UserProfilesBase, profileID, raceID)
}

// UserProfileResetApikeyPath returns the path to reset a user's API key
func UserProfileResetApikeyPath(profileID string) string {
	return fmt.Sprintf("%s/%s/reset_apikey", UserProfilesBase, profileID)
}

// =============================================================================
// Pending registration URL builders
// =============================================================================

// PendingRegistrationApprovePath returns the path to approve a pending registration
func PendingRegistrationApprovePath(profileID string) string {
	return fmt.Sprintf("%s/%s/approve", PendingRegistrationsBase, profileID)
}

// PendingRegistrationRejectPath returns the path to reject a pending registration
func PendingRegistrationRejectPath(profileID string) string {
	return fmt.Sprintf("%s/%s/reject", PendingRegistrationsBase, profileID)
}
