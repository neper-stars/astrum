package main

import "time"

// =============================================================================
// CONNECTION STATE
// =============================================================================

// ConnectionState tracks the state of a server connection
type ConnectionState struct {
	Connected bool      `json:"connected"`
	Username  string    `json:"username"`
	UserID    string    `json:"userId"`
	Error     string    `json:"error,omitempty"`
	Since     time.Time `json:"since,omitempty"`
}

// =============================================================================
// SERVER TYPES
// =============================================================================

// ServerInfo is the JSON-friendly representation of a server for the frontend
type ServerInfo struct {
	URL             string `json:"url"`
	Name            string `json:"name"`
	IconURL         string `json:"iconUrl,omitempty"`
	HasCredentials  bool   `json:"hasCredentials"`
	DefaultUsername string `json:"defaultUsername,omitempty"`
	IsConnected     bool   `json:"isConnected"`
	Order           int    `json:"order"`
}

// ServerOrder is used for reordering servers
type ServerOrder struct {
	URL   string `json:"url"`
	Order int    `json:"order"`
}

// =============================================================================
// AUTHENTICATION TYPES
// =============================================================================

// ConnectResult is the result of a successful connection
type ConnectResult struct {
	Username  string `json:"username"`
	UserID    string `json:"userId"`
	IsManager bool   `json:"isManager"`
	SerialKey string `json:"serialKey,omitempty"`
}

// RegistrationResultInfo is the result of a successful registration
type RegistrationResultInfo struct {
	UserID   string `json:"userId"`
	Nickname string `json:"nickname"`
	Pending  bool   `json:"pending"` // True if user needs admin approval
}

// =============================================================================
// SESSION TYPES
// =============================================================================

// SessionInfo is the JSON-friendly representation of a session
type SessionInfo struct {
	ID                string              `json:"id"`
	Name              string              `json:"name"`
	IsPublic          bool                `json:"isPublic"`
	Members           []string            `json:"members"`
	Managers          []string            `json:"managers"`
	State             string              `json:"state"` // "pending", "started", "archived"
	RulesIsSet        bool                `json:"rulesIsSet"`
	Players           []SessionPlayerInfo `json:"players"`
	PendingInvitation bool                `json:"pending_invitation"`
}

// SessionPlayerInfo is the JSON-friendly representation of a session player
type SessionPlayerInfo struct {
	ID            string  `json:"id"`
	UserProfileID string  `json:"userProfileId"`
	Ready         bool    `json:"ready"`
	PlayerOrder   int     `json:"playerOrder"`
	IsBot         bool    `json:"isBot"`
	BotRaceName   *string `json:"botRaceName,omitempty"`
}

// =============================================================================
// USER TYPES
// =============================================================================

// UserProfileInfo is the JSON-friendly representation of a user profile
type UserProfileInfo struct {
	ID        string `json:"id"`
	Nickname  string `json:"nickname"`
	Email     string `json:"email"`
	IsActive  bool   `json:"isActive"`
	IsManager bool   `json:"isManager"`
	Pending   bool   `json:"pending"`           // True if registration is pending approval
	Message   string `json:"message,omitempty"` // Registration message (for pending users)
}

// InvitationInfo is the JSON-friendly representation of an invitation
type InvitationInfo struct {
	ID              string `json:"id"`
	SessionID       string `json:"sessionId"`
	SessionName     string `json:"sessionName"`
	UserProfileID   string `json:"userProfileId"`
	InviterID       string `json:"inviterId"`
	InviterNickname string `json:"inviterNickname"`
	InviteeNickname string `json:"inviteeNickname,omitempty"` // For sent invitations
}

// =============================================================================
// RACE TYPES
// =============================================================================

// RaceInfo is the JSON-friendly representation of a race
type RaceInfo struct {
	ID           string `json:"id"`
	UserID       string `json:"userId"`
	NameSingular string `json:"nameSingular"`
	NamePlural   string `json:"namePlural"`
}

// =============================================================================
// RULES TYPES
// =============================================================================

// RulesInfo is the JSON-friendly representation of game rules
type RulesInfo struct {
	// Universe Configuration
	UniverseSize     int  `json:"universeSize"`
	Density          int  `json:"density"`
	StartingDistance int  `json:"startingDistance"`
	RandomSeed       *int `json:"randomSeed,omitempty"`

	// Game Options
	MaximumMinerals              bool `json:"maximumMinerals"`
	SlowerTechAdvances           bool `json:"slowerTechAdvances"`
	AcceleratedBbsPlay           bool `json:"acceleratedBbsPlay"`
	NoRandomEvents               bool `json:"noRandomEvents"`
	ComputerPlayersFormAlliances bool `json:"computerPlayersFormAlliances"`
	PublicPlayerScores           bool `json:"publicPlayerScores"`
	GalaxyClumping               bool `json:"galaxyClumping"`

	// Victory Conditions
	VcOwnsPercentOfPlanets            bool `json:"vcOwnsPercentOfPlanets"`
	VcOwnsPercentOfPlanetsValue       int  `json:"vcOwnsPercentOfPlanetsValue"`
	VcAttainTechInFields              bool `json:"vcAttainTechInFields"`
	VcAttainTechInFieldsTechValue     int  `json:"vcAttainTechInFieldsTechValue"`
	VcAttainTechInFieldsFieldsValue   int  `json:"vcAttainTechInFieldsFieldsValue"`
	VcExceedScoreOf                   bool `json:"vcExceedScoreOf"`
	VcExceedScoreOfValue              int  `json:"vcExceedScoreOfValue"`
	VcExceedNextPlayerScoreBy         bool `json:"vcExceedNextPlayerScoreBy"`
	VcExceedNextPlayerScoreByValue    int  `json:"vcExceedNextPlayerScoreByValue"`
	VcHasProductionCapacityOf         bool `json:"vcHasProductionCapacityOf"`
	VcHasProductionCapacityOfValue    int  `json:"vcHasProductionCapacityOfValue"`
	VcOwnsCapitalShips                bool `json:"vcOwnsCapitalShips"`
	VcOwnsCapitalShipsValue           int  `json:"vcOwnsCapitalShipsValue"`
	VcHaveHighestScoreAfterYears      bool `json:"vcHaveHighestScoreAfterYears"`
	VcHaveHighestScoreAfterYearsValue int  `json:"vcHaveHighestScoreAfterYearsValue"`

	// Victory Condition Meta
	VcWinnerMustMeet       int `json:"vcWinnerMustMeet"`
	VcMinYearsBeforeWinner int `json:"vcMinYearsBeforeWinner"`
}

// =============================================================================
// TURN TYPES
// =============================================================================

// TurnFilesInfo is the JSON-friendly representation of turn files
type TurnFilesInfo struct {
	SessionID string `json:"sessionId"`
	Year      int    `json:"year"`
	Universe  string `json:"universe"` // Base64 encoded .xy file
	Turn      string `json:"turn"`     // Base64 encoded .mN file
}

// OrdersStatusInfo represents order submission status for all players
type OrdersStatusInfo struct {
	SessionID   string                  `json:"sessionId"`
	PendingYear int                     `json:"pendingYear"`
	Players     []PlayerOrderStatusInfo `json:"players"`
}

// PlayerOrderStatusInfo represents order submission status for a single player
type PlayerOrderStatusInfo struct {
	PlayerOrder int    `json:"playerOrder"`
	Nickname    string `json:"nickname"`
	IsBot       bool   `json:"isBot"`
	Submitted   bool   `json:"submitted"`
}

// =============================================================================
// SETTINGS TYPES
// =============================================================================

// AppSettingsInfo is the JSON-friendly representation of app settings
type AppSettingsInfo struct {
	ServersDir         string `json:"serversDir"`
	AutoDownloadStars  bool   `json:"autoDownloadStars"`
	ZoomLevel          int    `json:"zoomLevel"`
	UseWine            bool   `json:"useWine"`
	WinePrefixesDir    string `json:"winePrefixesDir"`
	ValidWineInstall   bool   `json:"validWineInstall"`
	EnableBrowserStars bool   `json:"enableBrowserStars"`
}

// WineCheckResult represents the result of a Wine 32-bit support check
type WineCheckResult struct {
	Valid   bool   `json:"valid"`
	Message string `json:"message"`
}

// NtvdmCheckResult represents the result of an NTVDM availability check (Windows)
type NtvdmCheckResult struct {
	Available bool   `json:"available"`
	Is64Bit   bool   `json:"is64Bit"`
	Message   string `json:"message"`
	HelpURL   string `json:"helpUrl,omitempty"`
}

// =============================================================================
// MAP VIEWER TYPES
// =============================================================================

// MapOptions controls how the map is rendered
type MapOptions struct {
	Width               int  `json:"width"`
	Height              int  `json:"height"`
	ShowNames           bool `json:"showNames"`
	ShowFleets          bool `json:"showFleets"`
	ShowFleetPaths      int  `json:"showFleetPaths"`
	ShowMines           bool `json:"showMines"`
	ShowWormholes       bool `json:"showWormholes"`
	ShowLegend          bool `json:"showLegend"`
	ShowScannerCoverage bool `json:"showScannerCoverage"`
}

// MapGenerateRequest contains the data needed to generate a map
type MapGenerateRequest struct {
	ServerURL   string     `json:"serverUrl"`
	SessionID   string     `json:"sessionId"`
	Year        int        `json:"year"`
	Options     MapOptions `json:"options"`
	UniverseB64 string     `json:"universeB64"` // Base64 encoded .xy file
	TurnB64     string     `json:"turnB64"`     // Base64 encoded .mN file
}

// MapSaveRequest contains the data needed to save a map
type MapSaveRequest struct {
	ServerURL    string `json:"serverUrl"`
	SessionID    string `json:"sessionId"`
	Year         int    `json:"year"`
	RaceName     string `json:"raceName"`
	PlayerNumber int    `json:"playerNumber"`
	SVGContent   string `json:"svgContent"`
}

// AnimatedMapRequest contains the data needed to generate an animated GIF map
type AnimatedMapRequest struct {
	ServerURL string     `json:"serverUrl"`
	SessionID string     `json:"sessionId"`
	Options   MapOptions `json:"options"`
	Delay     int        `json:"delay"` // Frame delay in milliseconds
}

// GifSaveRequest contains the data needed to save a GIF
type GifSaveRequest struct {
	ServerURL    string `json:"serverUrl"`
	SessionID    string `json:"sessionId"`
	RaceName     string `json:"raceName"`
	PlayerNumber int    `json:"playerNumber"`
	GifContent   string `json:"gifContent"` // Base64 encoded GIF
}
