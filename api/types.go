package api

import (
	"time"

	"github.com/neper-stars/astrum/api/models"
)

// Type aliases for generated models - allows using api.X instead of models.X
type (
	UserProfile       = models.UserProfile
	Session           = models.Session
	SessionPlayer     = models.SessionPlayer
	Invitation        = models.Invitation
	SessionPlayerRace = models.SessionPlayerRace
	Race              = models.Race
	TurnFiles         = models.TurnFiles
	PlayerTurn        = models.PlayerTurn
	Ruleset           = models.Ruleset
	SessionFiles      = models.SessionFiles
	PlayerOrder       = models.PlayerOrder
)

// Credentials for authentication
type Credentials struct {
	Nickname string `json:"nickname"`
	APIKey   string `json:"apikey"`
}

// UserInfo represents the current user information
type UserInfo struct {
	User      User   `json:"user"`
	SerialKey string `json:"serial_key,omitempty"`
}

// User represents a user (simplified for auth responses)
type User struct {
	ID       string `json:"id"`
	Nickname string `json:"nickname"`
}

// Order represents a turn order submission
type Order struct {
	B64Data string `json:"b64_data"` // Base64 encoded .xN file
}

// Turn represents a turn file
type Turn struct {
	B64Data string `json:"b64_data"`
}

// PlayerOrderStatus represents the order submission status for a player
type PlayerOrderStatus struct {
	PlayerOrder int    `json:"player_order"` // 0-15
	Nickname    string `json:"nickname"`
	IsBot       bool   `json:"is_bot"`
	Submitted   bool   `json:"submitted"`
}

// ConnectionState represents the current connection state
type ConnectionState struct {
	Status      string    // "connected", "disconnected", "connecting", "error"
	LastError   error     // Last error if any
	UserInfo    *UserInfo // User info from server
	ConnectedAt time.Time // When connection was established
}

// Notification type constants - aliases to generated constants in api/async
const (
	NotificationTypeSession             = "session"
	NotificationTypeInvitation          = "invitation"
	NotificationTypeRace                = "race"
	NotificationTypeRuleset             = "ruleset"
	NotificationTypeSessionPlayerRace   = "session_player_race"
	NotificationTypeSessionTurn         = "session_turn"
	NotificationTypeOrderStatus         = "order_status"
	NotificationTypePendingRegistration = "pending_registration"
)
