package main

import (
	"archive/zip"
	"encoding/base64"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	goruntime "runtime"

	"github.com/neper-stars/astrum/lib/logger"
	"github.com/neper-stars/neper/lib/wine"
)

// =============================================================================
// TURN FILES
// =============================================================================

// saveTurnFiles saves turn files to the game directory
// universe is base64 encoded .xy file, turn is base64 encoded .mN file
func (a *App) saveTurnFiles(serverURL, sessionID, universe, turn string) error {
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

	// Get player order to determine the .mN file number
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

	// Get the session to find player order
	session, err := client.GetSession(ctx, sessionID)
	if err != nil {
		return fmt.Errorf("failed to get session: %w", err)
	}

	// Find the current player's order (1-indexed)
	playerOrder := 0
	logger.App.Debug().
		Str("sessionID", sessionID).
		Str("currentUserID", userInfo.User.ID).
		Int("numPlayers", len(session.Players)).
		Msg("Looking for player order")
	for _, player := range session.Players {
		logger.App.Debug().
			Str("playerUserProfileID", player.UserProfileID).
			Int64("playerOrder", player.PlayerOrder).
			Bool("matches", player.UserProfileID == userInfo.User.ID).
			Msg("Checking player")
		if player.UserProfileID == userInfo.User.ID {
			playerOrder = int(player.PlayerOrder) + 1 // PlayerOrder is 0-indexed, Stars! uses 1-indexed
			break
		}
	}
	logger.App.Debug().
		Int("finalPlayerOrder", playerOrder).
		Msg("Player order determined")
	if playerOrder == 0 {
		return fmt.Errorf("current user is not a player in this session")
	}

	// Save universe file (.xy)
	if universe != "" {
		universeData, err := base64.StdEncoding.DecodeString(universe)
		if err != nil {
			return fmt.Errorf("failed to decode universe data: %w", err)
		}
		universePath := filepath.Join(gameDir, "game.xy")
		written, err := a.fileHashTracker.WriteFileIfChanged(serverURL, sessionID, universePath, universeData, 0644)
		if err != nil {
			return fmt.Errorf("failed to write universe file: %w", err)
		}
		if written {
			logger.App.Debug().
				Str("sessionID", sessionID).
				Str("path", universePath).
				Int("size", len(universeData)).
				Msg("Saved universe file")
		}
	}

	// Save turn file (.mN)
	if turn != "" {
		turnData, err := base64.StdEncoding.DecodeString(turn)
		if err != nil {
			return fmt.Errorf("failed to decode turn data: %w", err)
		}
		turnFileName := fmt.Sprintf("game.m%d", playerOrder)
		turnPath := filepath.Join(gameDir, turnFileName)
		written, err := a.fileHashTracker.WriteFileIfChanged(serverURL, sessionID, turnPath, turnData, 0644)
		if err != nil {
			return fmt.Errorf("failed to write turn file: %w", err)
		}
		if written {
			logger.App.Debug().
				Str("sessionID", sessionID).
				Str("path", turnPath).
				Int("playerOrder", playerOrder).
				Int("size", len(turnData)).
				Msg("Saved turn file")
		}
	}

	// Ensure race file (.rN) exists - fetch and save if missing
	raceFileName := fmt.Sprintf("game.r%d", playerOrder)
	raceFilePath := filepath.Join(gameDir, raceFileName)
	if _, err := os.Stat(raceFilePath); os.IsNotExist(err) {
		// Race file doesn't exist, fetch and save it
		race, err := client.GetSessionPlayerRace(ctx, sessionID)
		if err != nil {
			logger.App.Warn().Err(err).Msg("Failed to fetch race for saving")
		} else if race.ID != "" && race.Data != "" {
			raceData, err := base64.StdEncoding.DecodeString(race.Data)
			if err != nil {
				logger.App.Warn().Err(err).Msg("Failed to decode race data")
			} else {
				if err := os.WriteFile(raceFilePath, raceData, 0644); err != nil {
					logger.App.Warn().Err(err).Str("path", raceFilePath).Msg("Failed to write race file")
				} else {
					logger.App.Debug().
						Str("sessionID", sessionID).
						Str("path", raceFilePath).
						Int("playerOrder", playerOrder).
						Int("size", len(raceData)).
						Msg("Saved race file")
				}
			}
		}
	}

	// Ensure stars.exe is downloaded if auto-download is enabled
	a.ensureStarsExeInDir(serverURL, sessionID, gameDir)

	return nil
}

// GetTurn retrieves turn files for a specific year in a session
// If saveToGameDir is true, it also saves the files to the game directory
func (a *App) GetTurn(serverURL, sessionID string, year int, saveToGameDir bool) (*TurnFilesInfo, error) {
	a.mu.RLock()
	client, ok := a.clients[serverURL]
	mgr, mgrOk := a.authManagers[serverURL]
	a.mu.RUnlock()

	if !ok || !mgrOk {
		return nil, fmt.Errorf("not connected to server: %s", serverURL)
	}

	ctx := mgr.GetContext()
	turnFiles, err := client.GetTurn(ctx, sessionID, year)
	if err != nil {
		return nil, fmt.Errorf("failed to get turn files: %w", err)
	}

	logger.App.Info().Str("sessionId", sessionID).Int("year", year).Bool("saveToGameDir", saveToGameDir).Msg("Retrieved turn files")

	// Save turn files to game directory only if requested (for latest year)
	if saveToGameDir {
		if err := a.saveTurnFiles(serverURL, sessionID, turnFiles.Turn.Universe, turnFiles.Turn.Turn); err != nil {
			logger.App.Warn().Err(err).Msg("Failed to auto-save turn files")
			// Don't fail the request, just log the warning
		}
	}

	return &TurnFilesInfo{
		SessionID: sessionID,
		Year:      year,
		Universe:  turnFiles.Turn.Universe,
		Turn:      turnFiles.Turn.Turn,
	}, nil
}

// GetLatestTurn retrieves the latest turn files for a session
// It also auto-saves the files to the game directory
func (a *App) GetLatestTurn(serverURL, sessionID string) (*TurnFilesInfo, error) {
	a.mu.RLock()
	client, ok := a.clients[serverURL]
	mgr, mgrOk := a.authManagers[serverURL]
	a.mu.RUnlock()

	if !ok || !mgrOk {
		return nil, fmt.Errorf("not connected to server: %s", serverURL)
	}

	turnFiles, err := client.GetLatestTurn(mgr.GetContext(), sessionID)
	if err != nil {
		return nil, fmt.Errorf("failed to get latest turn files: %w", err)
	}

	logger.App.Info().Str("sessionId", sessionID).Int64("year", turnFiles.Year).Msg("Retrieved latest turn files")

	// Auto-save turn files to game directory
	if err := a.saveTurnFiles(serverURL, sessionID, turnFiles.Turn.Universe, turnFiles.Turn.Turn); err != nil {
		logger.App.Warn().Err(err).Msg("Failed to auto-save turn files")
		// Don't fail the request, just log the warning
	}

	return &TurnFilesInfo{
		SessionID: sessionID,
		Year:      int(turnFiles.Year),
		Universe:  turnFiles.Turn.Universe,
		Turn:      turnFiles.Turn.Turn,
	}, nil
}

// DownloadSessionBackup downloads all session files and creates a backup zip (manager only)
// The zip is saved to the game directory as <year>-backup.zip with files in backup/<year>/ subfolder
func (a *App) DownloadSessionBackup(serverURL, sessionID string) error {
	a.mu.RLock()
	client, ok := a.clients[serverURL]
	mgr, mgrOk := a.authManagers[serverURL]
	a.mu.RUnlock()

	if !ok || !mgrOk {
		return fmt.Errorf("not connected to server: %s", serverURL)
	}

	// Get session files from API
	files, err := client.GetSessionFiles(mgr.GetContext(), sessionID)
	if err != nil {
		return fmt.Errorf("failed to get session files: %w", err)
	}

	// Get the server name for calculating game directory
	server, _ := a.config.GetServer(serverURL)
	serverName := serverURL // fallback to URL if server not found
	if server != nil {
		serverName = server.Name
	}

	// Get game directory
	gameDir, err := a.config.EnsureSessionGameDir(serverName, sessionID)
	if err != nil {
		return fmt.Errorf("failed to get game directory: %w", err)
	}

	// Create the zip file
	zipPath := filepath.Join(gameDir, fmt.Sprintf("%d-backup.zip", files.Year))
	zipFile, err := os.Create(zipPath)
	if err != nil {
		return fmt.Errorf("failed to create zip file: %w", err)
	}
	defer func() { _ = zipFile.Close() }()

	zipWriter := zip.NewWriter(zipFile)
	defer func() { _ = zipWriter.Close() }()

	subFolder := fmt.Sprintf("backup/%d/", files.Year)

	// Add universe file (.xy)
	if files.Universe != "" {
		data, err := base64.StdEncoding.DecodeString(files.Universe)
		if err != nil {
			return fmt.Errorf("failed to decode universe file: %w", err)
		}
		w, err := zipWriter.Create(subFolder + "game.xy")
		if err != nil {
			return fmt.Errorf("failed to create universe entry in zip: %w", err)
		}
		if _, err := w.Write(data); err != nil {
			return fmt.Errorf("failed to write universe to zip: %w", err)
		}
	}

	// Add host file (.hst)
	if files.HostFile != "" {
		data, err := base64.StdEncoding.DecodeString(files.HostFile)
		if err != nil {
			return fmt.Errorf("failed to decode host file: %w", err)
		}
		w, err := zipWriter.Create(subFolder + "game.hst")
		if err != nil {
			return fmt.Errorf("failed to create host entry in zip: %w", err)
		}
		if _, err := w.Write(data); err != nil {
			return fmt.Errorf("failed to write host to zip: %w", err)
		}
	}

	// Add turn files (.m1 to .m16)
	for i, turn := range files.Turns {
		if turn.B64Data == "" {
			continue
		}
		data, err := base64.StdEncoding.DecodeString(turn.B64Data)
		if err != nil {
			return fmt.Errorf("failed to decode turn file %d: %w", i+1, err)
		}
		filename := fmt.Sprintf("game.m%d", i+1)
		w, err := zipWriter.Create(subFolder + filename)
		if err != nil {
			return fmt.Errorf("failed to create turn entry in zip: %w", err)
		}
		if _, err := w.Write(data); err != nil {
			return fmt.Errorf("failed to write turn to zip: %w", err)
		}
	}

	// Add order files (.x1 to .x16)
	for i, order := range files.Orders {
		if order.B64Data == "" {
			continue
		}
		data, err := base64.StdEncoding.DecodeString(order.B64Data)
		if err != nil {
			return fmt.Errorf("failed to decode order file %d: %w", i+1, err)
		}
		filename := fmt.Sprintf("game.x%d", i+1)
		w, err := zipWriter.Create(subFolder + filename)
		if err != nil {
			return fmt.Errorf("failed to create order entry in zip: %w", err)
		}
		if _, err := w.Write(data); err != nil {
			return fmt.Errorf("failed to write order to zip: %w", err)
		}
	}

	logger.App.Info().
		Str("sessionId", sessionID).
		Int64("year", files.Year).
		Str("zipPath", zipPath).
		Msg("Downloaded session backup")

	return nil
}

// DownloadHistoricBackup downloads all historic session files as a zip from the server
// The zip is saved to the game directory as historic-backup.zip
func (a *App) DownloadHistoricBackup(serverURL, sessionID string) error {
	a.mu.RLock()
	client, ok := a.clients[serverURL]
	mgr, mgrOk := a.authManagers[serverURL]
	a.mu.RUnlock()

	if !ok || !mgrOk {
		return fmt.Errorf("not connected to server: %s", serverURL)
	}

	// Download the backup zip from the server
	zipData, err := client.DownloadHistoricBackup(mgr.GetContext(), sessionID)
	if err != nil {
		return fmt.Errorf("failed to download historic backup: %w", err)
	}

	// Get the server name for calculating game directory
	server, _ := a.config.GetServer(serverURL)
	serverName := serverURL // fallback to URL if server not found
	if server != nil {
		serverName = server.Name
	}

	// Get game directory
	gameDir, err := a.config.EnsureSessionGameDir(serverName, sessionID)
	if err != nil {
		return fmt.Errorf("failed to get game directory: %w", err)
	}

	// Save the zip file
	zipPath := filepath.Join(gameDir, "historic-backup.zip")
	if err := os.WriteFile(zipPath, zipData, 0644); err != nil {
		return fmt.Errorf("failed to save historic backup: %w", err)
	}

	logger.App.Info().
		Str("sessionId", sessionID).
		Str("zipPath", zipPath).
		Int("size", len(zipData)).
		Msg("Downloaded historic backup")

	return nil
}

// GetOrdersStatus retrieves order submission status for all players for the current turn
// Orders are submitted for the current year (latestYear), and will be used to generate the next year
func (a *App) GetOrdersStatus(serverURL, sessionID string) (*OrdersStatusInfo, error) {
	a.mu.RLock()
	client, ok := a.clients[serverURL]
	mgr, mgrOk := a.authManagers[serverURL]
	a.mu.RUnlock()

	if !ok || !mgrOk {
		return nil, fmt.Errorf("not connected to server: %s", serverURL)
	}

	// Get the latest turn to determine the current year
	latestTurn, err := client.GetLatestTurn(mgr.GetContext(), sessionID)
	if err != nil {
		return nil, fmt.Errorf("failed to get latest turn: %w", err)
	}

	// Orders are submitted for the current year
	currentYear := int(latestTurn.Year)

	// Get orders status for the current year
	status, err := client.GetOrdersStatus(mgr.GetContext(), sessionID, currentYear)
	if err != nil {
		return nil, fmt.Errorf("failed to get orders status: %w", err)
	}

	// Convert to frontend-friendly format
	players := make([]PlayerOrderStatusInfo, len(status))
	for i, p := range status {
		players[i] = PlayerOrderStatusInfo{
			PlayerOrder: p.PlayerOrder,
			Nickname:    p.Nickname,
			IsBot:       p.IsBot,
			Submitted:   p.Submitted,
		}
	}

	return &OrdersStatusInfo{
		SessionID:   sessionID,
		PendingYear: currentYear,
		Players:     players,
	}, nil
}

// OpenGameDir opens the game directory for a session in the system file explorer
func (a *App) OpenGameDir(serverURL, sessionID string) error {
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

	// Open the directory in the system file explorer
	var cmd *exec.Cmd
	switch goruntime.GOOS {
	case "darwin":
		cmd = exec.Command("open", gameDir)
	case "windows":
		cmd = exec.Command("explorer", gameDir)
	default: // linux and others
		cmd = exec.Command("xdg-open", gameDir)
	}

	if err := cmd.Start(); err != nil {
		return fmt.Errorf("failed to open directory: %w", err)
	}

	logger.App.Info().Str("path", gameDir).Msg("Opened game directory")
	return nil
}

// HasStarsExe checks if stars.exe exists in the game directory for a session
func (a *App) HasStarsExe(serverURL, sessionID string) bool {
	a.mu.RLock()
	conn := a.connections[serverURL]
	a.mu.RUnlock()

	if conn == nil || !conn.Connected {
		return false
	}

	// Get the server name for calculating game directory
	server, _ := a.config.GetServer(serverURL)
	serverName := serverURL
	if server != nil {
		serverName = server.Name
	}

	gameDir, err := a.config.GetSessionGameDir(serverName, sessionID)
	if err != nil {
		return false
	}

	starsPath := filepath.Join(gameDir, "stars.exe")
	_, err = os.Stat(starsPath)
	return err == nil
}

// LaunchStars launches Stars! for the given session
// It finds the player's turn file (game.mX) and launches stars.exe with it
// If useWine is enabled in settings, it uses wine to run stars.exe
func (a *App) LaunchStars(serverURL, sessionID string) error {
	a.mu.RLock()
	client, ok := a.clients[serverURL]
	mgr, mgrOk := a.authManagers[serverURL]
	conn := a.connections[serverURL]
	a.mu.RUnlock()

	if !ok || !mgrOk {
		return fmt.Errorf("not connected to server")
	}
	if conn == nil || !conn.Connected {
		return fmt.Errorf("not connected to server")
	}

	// Get current user info
	userInfo := mgr.GetUserInfo()
	if userInfo == nil || userInfo.User.ID == "" {
		return fmt.Errorf("no user info available")
	}

	// Get the session to find player order
	ctx := mgr.GetContext()
	session, err := client.GetSession(ctx, sessionID)
	if err != nil {
		return fmt.Errorf("failed to get session: %w", err)
	}

	// Find the current user's player order (1-indexed)
	playerOrder := 0
	for _, player := range session.Players {
		if player.UserProfileID == userInfo.User.ID {
			playerOrder = int(player.PlayerOrder) + 1 // Convert to 1-indexed
			break
		}
	}
	if playerOrder == 0 {
		return fmt.Errorf("you are not a player in this session")
	}

	// Get the server name for calculating game directory
	server, _ := a.config.GetServer(serverURL)
	serverName := serverURL
	if server != nil {
		serverName = server.Name
	}

	// Get the game directory
	gameDir, err := a.config.EnsureSessionGameDir(serverName, sessionID)
	if err != nil {
		return fmt.Errorf("failed to get game directory: %w", err)
	}

	// Build the turn file path
	turnFileName := fmt.Sprintf("game.m%d", playerOrder)
	turnFilePath := filepath.Join(gameDir, turnFileName)

	// Check if turn file exists
	if _, err := os.Stat(turnFilePath); os.IsNotExist(err) {
		return fmt.Errorf("turn file not found: %s (download the turn first)", turnFileName)
	}

	// Check if stars.exe exists
	starsExePath := filepath.Join(gameDir, "stars.exe")
	if _, err := os.Stat(starsExePath); os.IsNotExist(err) {
		return fmt.Errorf("stars.exe not found in game directory")
	}

	// Check if we should use Wine
	useWine, err := a.config.GetUseWine()
	if err != nil {
		return fmt.Errorf("failed to get wine setting: %w", err)
	}

	var cmd *exec.Cmd
	if useWine {
		// Check if wine installation has been validated
		validWine, err := a.config.GetValidWineInstall()
		if err != nil {
			return fmt.Errorf("failed to get wine validation status: %w", err)
		}
		if !validWine {
			return fmt.Errorf("wine installation not validated, please run 'Check Wine Installation' in Settings first")
		}

		// Get per-server wine prefix and ensure it exists
		winePrefix, err := a.ensureServerWinePrefix(serverName)
		if err != nil {
			return fmt.Errorf("failed to ensure server wine prefix: %w", err)
		}

		// Create the wine prefix manager for environment
		prefix, err := wine.NewPrefix(logger.App, wine.PrefixOptions{
			PrefixPath: winePrefix,
		})
		if err != nil {
			return fmt.Errorf("failed to create wine prefix manager: %w", err)
		}

		// Launch with wine
		cmd = exec.Command("wine", starsExePath, turnFileName)
		cmd.Dir = gameDir
		cmd.Env = append(os.Environ(), prefix.Env()...)

		logger.App.Info().
			Str("sessionID", sessionID).
			Str("gameDir", gameDir).
			Str("turnFile", turnFileName).
			Str("winePrefix", winePrefix).
			Str("serverName", serverName).
			Msg("Launching Stars! with Wine using per-server prefix")
	} else {
		// On Windows, launch directly
		if goruntime.GOOS == "windows" {
			cmd = exec.Command(starsExePath, turnFileName)
			cmd.Dir = gameDir

			logger.App.Info().
				Str("sessionID", sessionID).
				Str("gameDir", gameDir).
				Str("turnFile", turnFileName).
				Msg("Launching Stars! directly")
		} else {
			return fmt.Errorf("wine is required to run Stars! on %s, enable it in Settings", goruntime.GOOS)
		}
	}

	// Start the process (don't wait for it to complete)
	if err := cmd.Start(); err != nil {
		return fmt.Errorf("failed to launch Stars!: %w", err)
	}

	return nil
}
