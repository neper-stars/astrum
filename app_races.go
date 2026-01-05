package main

import (
	"encoding/base64"
	"fmt"
	"os"
	"path/filepath"

	"github.com/neper-stars/astrum/api"
	"github.com/neper-stars/astrum/lib/logger"
)

// =============================================================================
// RACES
// =============================================================================

// GetMyRaces returns all races for the current user
func (a *App) GetMyRaces(serverURL string) ([]RaceInfo, error) {
	a.mu.RLock()
	client, ok := a.clients[serverURL]
	mgr, mgrOk := a.authManagers[serverURL]
	a.mu.RUnlock()

	if !ok || !mgrOk {
		return nil, fmt.Errorf("not connected to server: %s", serverURL)
	}

	userInfo := mgr.GetUserInfo()
	if userInfo == nil {
		return nil, fmt.Errorf("no user info available")
	}

	races, err := client.ListRaces(mgr.GetContext(), userInfo.User.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to get races: %w", err)
	}

	result := make([]RaceInfo, len(races))
	for i, r := range races {
		result[i] = RaceInfo{
			ID:           r.ID,
			UserID:       r.UserID,
			NameSingular: r.NameSingular,
			NamePlural:   r.NamePlural,
		}
	}

	return result, nil
}

// UploadRace uploads a new race file (data is base64 encoded)
func (a *App) UploadRace(serverURL, raceData string) (*RaceInfo, error) {
	a.mu.RLock()
	client, ok := a.clients[serverURL]
	mgr, mgrOk := a.authManagers[serverURL]
	a.mu.RUnlock()

	if !ok || !mgrOk {
		return nil, fmt.Errorf("not connected to server: %s", serverURL)
	}

	userInfo := mgr.GetUserInfo()
	if userInfo == nil {
		return nil, fmt.Errorf("no user info available")
	}

	race := &api.Race{
		Data: raceData,
	}

	created, err := client.CreateRace(mgr.GetContext(), userInfo.User.ID, race)
	if err != nil {
		return nil, fmt.Errorf("failed to upload race: %w", err)
	}

	logger.App.Info().Str("name", created.NameSingular).Str("id", created.ID).Msg("Uploaded race")

	return &RaceInfo{
		ID:           created.ID,
		UserID:       created.UserID,
		NameSingular: created.NameSingular,
		NamePlural:   created.NamePlural,
	}, nil
}

// DownloadRace downloads a race file (returns base64 encoded data)
func (a *App) DownloadRace(serverURL, raceID string) (string, error) {
	a.mu.RLock()
	client, ok := a.clients[serverURL]
	mgr, mgrOk := a.authManagers[serverURL]
	a.mu.RUnlock()

	if !ok || !mgrOk {
		return "", fmt.Errorf("not connected to server: %s", serverURL)
	}

	userInfo := mgr.GetUserInfo()
	if userInfo == nil {
		return "", fmt.Errorf("no user info available")
	}

	race, err := client.GetRace(mgr.GetContext(), userInfo.User.ID, raceID)
	if err != nil {
		return "", fmt.Errorf("failed to download race: %w", err)
	}

	return race.Data, nil
}

// DeleteRace deletes a race from the user's profile
func (a *App) DeleteRace(serverURL, raceID string) error {
	a.mu.RLock()
	client, ok := a.clients[serverURL]
	mgr, mgrOk := a.authManagers[serverURL]
	a.mu.RUnlock()

	if !ok || !mgrOk {
		return fmt.Errorf("not connected to server: %s", serverURL)
	}

	userInfo := mgr.GetUserInfo()
	if userInfo == nil {
		return fmt.Errorf("no user info available")
	}

	if err := client.DeleteRace(mgr.GetContext(), userInfo.User.ID, raceID); err != nil {
		return fmt.Errorf("failed to delete race: %w", err)
	}

	logger.App.Info().Str("id", raceID).Msg("Deleted race")

	return nil
}

// SetSessionRace sets the race for the current user in a session
func (a *App) SetSessionRace(serverURL, sessionID, raceID string) error {
	a.mu.RLock()
	client, ok := a.clients[serverURL]
	mgr, mgrOk := a.authManagers[serverURL]
	a.mu.RUnlock()

	if !ok || !mgrOk {
		return fmt.Errorf("not connected to server: %s", serverURL)
	}

	playerRace := &api.SessionPlayerRace{
		RaceID: raceID,
	}

	_, err := client.SetSessionPlayerRace(mgr.GetContext(), sessionID, playerRace)
	if err != nil {
		return fmt.Errorf("failed to set session race: %w", err)
	}

	logger.App.Info().Str("raceId", raceID).Str("sessionId", sessionID).Msg("Set race for session")

	return nil
}

// GetSessionPlayerRace gets the current user's race for a session
func (a *App) GetSessionPlayerRace(serverURL, sessionID string) (*RaceInfo, error) {
	a.mu.RLock()
	client, ok := a.clients[serverURL]
	mgr, mgrOk := a.authManagers[serverURL]
	a.mu.RUnlock()

	if !ok || !mgrOk {
		return nil, fmt.Errorf("not connected to server: %s", serverURL)
	}

	race, err := client.GetSessionPlayerRace(mgr.GetContext(), sessionID)
	if err != nil {
		return nil, fmt.Errorf("failed to get session player race: %w", err)
	}

	// Return nil if no race is set (empty ID)
	if race.ID == "" {
		return nil, nil
	}

	return &RaceInfo{
		ID:           race.ID,
		UserID:       race.UserID,
		NameSingular: race.NameSingular,
		NamePlural:   race.NamePlural,
	}, nil
}

// SetPlayerReady sets the ready state for the current player in a session
// When setting ready=true, it also copies the race file to the game directory
func (a *App) SetPlayerReady(serverURL, sessionID string, ready bool) error {
	a.mu.RLock()
	client, ok := a.clients[serverURL]
	mgr, mgrOk := a.authManagers[serverURL]
	a.mu.RUnlock()

	if !ok || !mgrOk {
		return fmt.Errorf("not connected to server: %s", serverURL)
	}

	ctx := mgr.GetContext()
	userInfo := mgr.GetUserInfo()
	if userInfo == nil {
		return fmt.Errorf("no user info available")
	}

	// If setting ready=true, copy the race file to the game directory first
	if ready {
		// Get the server name for calculating game directory
		server, _ := a.config.GetServer(serverURL)
		serverName := serverURL // fallback to URL if server not found
		if server != nil {
			serverName = server.Name
		}

		// Get the game directory (calculated from servers dir)
		gameDir, err := a.config.EnsureSessionGameDir(serverName, sessionID)
		if err != nil {
			return fmt.Errorf("failed to get game directory: %w", err)
		}

		// Get the player's race for this session
		// Note: GET /sessions/{id}/player_race returns the Race object directly, not SessionPlayerRace
		race, err := client.GetSessionPlayerRace(ctx, sessionID)
		if err != nil {
			return fmt.Errorf("failed to get player race: %w", err)
		}
		if race.ID == "" || race.Data == "" {
			return fmt.Errorf("no race selected - please select a race first")
		}

		// Decode the base64 race data
		raceData, err := base64.StdEncoding.DecodeString(race.Data)
		if err != nil {
			return fmt.Errorf("failed to decode race data: %w", err)
		}

		// Get the player order from the session to determine the file number
		session, err := client.GetSession(ctx, sessionID)
		if err != nil {
			return fmt.Errorf("failed to get session: %w", err)
		}

		// Find the current player in the session to get their player order
		playerOrder := 0
		for _, player := range session.Players {
			if player.UserProfileID == userInfo.User.ID {
				playerOrder = int(player.PlayerOrder) + 1 // PlayerOrder is 0-indexed, Stars! uses 1-indexed
				break
			}
		}
		if playerOrder == 0 {
			return fmt.Errorf("current user is not a player in this session")
		}

		// Build the race file path (player order determines the file number)
		// Stars! race files are named like: game.r1, game.r2, etc.
		raceFileName := fmt.Sprintf("game.r%d", playerOrder)
		raceFilePath := filepath.Join(gameDir, raceFileName)

		// Write the race file
		if err := os.WriteFile(raceFilePath, raceData, 0644); err != nil {
			return fmt.Errorf("failed to write race file: %w", err)
		}

		logger.App.Info().Str("path", raceFilePath).Msg("Copied race file")
	}

	// Now set the ready state on the server
	_, err := client.SetPlayerReady(ctx, sessionID, ready)
	if err != nil {
		return fmt.Errorf("failed to set player ready state: %w", err)
	}

	logger.App.Info().Bool("ready", ready).Str("sessionId", sessionID).Msg("Set player ready state")

	return nil
}

// AddBotPlayer adds a bot player to a session
// Only session managers or global managers can add bots
// raceID must be 0-6 (bot race types), botLevel must be 0-4 (difficulty)
func (a *App) AddBotPlayer(serverURL, sessionID string, raceID string, botLevel int) error {
	a.mu.RLock()
	client, ok := a.clients[serverURL]
	mgr, mgrOk := a.authManagers[serverURL]
	a.mu.RUnlock()

	if !ok || !mgrOk {
		return fmt.Errorf("not connected to server: %s", serverURL)
	}

	botLevelInt64 := int64(botLevel)
	playerRace := &api.SessionPlayerRace{
		RaceID:   raceID,
		IsBot:    true,
		BotLevel: &botLevelInt64,
	}

	_, err := client.SetSessionPlayerRace(mgr.GetContext(), sessionID, playerRace)
	if err != nil {
		return fmt.Errorf("failed to add bot player: %w", err)
	}

	logger.App.Info().
		Str("raceId", raceID).
		Int("botLevel", botLevel).
		Str("sessionId", sessionID).
		Msg("Added bot player to session")

	return nil
}
