package main

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"

	"github.com/neper-stars/astrum/lib/logger"
	"github.com/neper-stars/neper/lib/wine"
)

// =============================================================================
// APP SETTINGS
// =============================================================================

// GetAppSettings retrieves the app settings
func (a *App) GetAppSettings() (*AppSettingsInfo, error) {
	settings, err := a.config.GetAppSettings()
	if err != nil {
		return nil, fmt.Errorf("failed to get app settings: %w", err)
	}

	return &AppSettingsInfo{
		ServersDir:        settings.ServersDir,
		AutoDownloadStars: settings.GetAutoDownloadStars(),
		ZoomLevel:         settings.GetZoomLevel(),
		UseWine:           settings.GetUseWine(),
		WinePrefixesDir:   settings.GetWinePrefixesDir(),
		ValidWineInstall:  settings.GetValidWineInstall(),
	}, nil
}

// SetServersDir updates the servers directory
func (a *App) SetServersDir(serversDir string) (*AppSettingsInfo, error) {
	if err := a.config.SetServersDir(serversDir); err != nil {
		return nil, fmt.Errorf("failed to set servers dir: %w", err)
	}

	// Ensure the directory exists
	if err := a.config.EnsureServersDir(); err != nil {
		return nil, fmt.Errorf("failed to create servers directory: %w", err)
	}

	logger.App.Info().Str("path", serversDir).Msg("Set servers directory")

	return a.GetAppSettings()
}

// SelectServersDir opens a directory picker and sets the servers directory
func (a *App) SelectServersDir() (*AppSettingsInfo, error) {
	// Get current servers dir as default
	currentDir, _ := a.config.GetServersDir()

	// Open directory picker dialog
	selectedDir, err := runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{
		Title:            "Select Servers Directory",
		DefaultDirectory: currentDir,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to open directory dialog: %w", err)
	}

	// User cancelled the dialog
	if selectedDir == "" {
		return a.GetAppSettings()
	}

	// Save the selected directory
	if err := a.config.SetServersDir(selectedDir); err != nil {
		return nil, fmt.Errorf("failed to save servers dir: %w", err)
	}

	// Ensure the directory exists
	if err := a.config.EnsureServersDir(); err != nil {
		return nil, fmt.Errorf("failed to create servers directory: %w", err)
	}

	logger.App.Info().Str("path", selectedDir).Msg("Selected servers directory")

	return a.GetAppSettings()
}

// SetAutoDownloadStars updates the auto download stars setting
func (a *App) SetAutoDownloadStars(enabled bool) (*AppSettingsInfo, error) {
	if err := a.config.SetAutoDownloadStars(enabled); err != nil {
		return nil, fmt.Errorf("failed to set auto download stars: %w", err)
	}

	logger.App.Info().Bool("enabled", enabled).Msg("Set auto download stars")

	// When enabling, scan all game directories and download stars.exe where missing
	if enabled {
		go a.scanAndDownloadStarsExe()
	}

	return a.GetAppSettings()
}

// SetZoomLevel updates the UI zoom level (50-200%)
func (a *App) SetZoomLevel(level int) (*AppSettingsInfo, error) {
	if err := a.config.SetZoomLevel(level); err != nil {
		return nil, fmt.Errorf("failed to set zoom level: %w", err)
	}

	logger.App.Info().Int("level", level).Msg("Set zoom level")

	return a.GetAppSettings()
}

// SetUseWine updates the use wine setting
func (a *App) SetUseWine(enabled bool) (*AppSettingsInfo, error) {
	if err := a.config.SetUseWine(enabled); err != nil {
		return nil, fmt.Errorf("failed to set use wine: %w", err)
	}

	logger.App.Info().Bool("enabled", enabled).Msg("Set use wine")

	// When enabling, ensure the wine prefixes directory exists
	if enabled {
		if err := a.ensureWinePrefixesDir(); err != nil {
			return nil, fmt.Errorf("failed to ensure wine prefixes directory: %w", err)
		}
	}

	return a.GetAppSettings()
}

// SetWinePrefixesDir updates the wine prefixes directory path
func (a *App) SetWinePrefixesDir(prefixesDir string) (*AppSettingsInfo, error) {
	if err := a.config.SetWinePrefixesDir(prefixesDir); err != nil {
		return nil, fmt.Errorf("failed to set wine prefixes directory: %w", err)
	}

	logger.App.Info().Str("prefixesDir", prefixesDir).Msg("Set wine prefixes directory")

	// If useWine is enabled, ensure the new directory exists
	useWine, err := a.config.GetUseWine()
	if err != nil {
		return nil, fmt.Errorf("failed to get use wine setting: %w", err)
	}
	if useWine {
		if err := a.ensureWinePrefixesDir(); err != nil {
			return nil, fmt.Errorf("failed to ensure wine prefixes directory: %w", err)
		}
	}

	return a.GetAppSettings()
}

// SelectWinePrefixesDir opens a directory picker and sets the wine prefixes directory path
func (a *App) SelectWinePrefixesDir() (*AppSettingsInfo, error) {
	// Get current wine prefixes directory as default
	currentPrefixesDir, _ := a.config.GetWinePrefixesDir()

	// Open directory picker dialog
	selectedDir, err := runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{
		Title:            "Select Wine Prefixes Directory",
		DefaultDirectory: currentPrefixesDir,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to open directory dialog: %w", err)
	}

	// User cancelled the dialog
	if selectedDir == "" {
		return a.GetAppSettings()
	}

	// Save the selected directory
	return a.SetWinePrefixesDir(selectedDir)
}

// ensureWinePrefixesDir ensures the wine prefixes directory exists
func (a *App) ensureWinePrefixesDir() error {
	prefixesDir, err := a.config.GetWinePrefixesDir()
	if err != nil {
		return err
	}

	if err := os.MkdirAll(prefixesDir, 0755); err != nil {
		return fmt.Errorf("failed to create wine prefixes directory: %w", err)
	}

	logger.App.Debug().Str("prefixesDir", prefixesDir).Msg("Ensured wine prefixes directory exists")
	return nil
}

// ensureServerWinePrefix ensures the wine prefix for a specific server exists, creating it if necessary
func (a *App) ensureServerWinePrefix(serverName string) (string, error) {
	prefixPath, err := a.config.GetServerWinePrefix(serverName)
	if err != nil {
		return "", err
	}

	prefix, err := wine.NewPrefix(logger.App, wine.PrefixOptions{
		PrefixPath: prefixPath,
	})
	if err != nil {
		return "", fmt.Errorf("failed to create wine prefix manager: %w", err)
	}

	if err := prefix.EnsurePrefix(); err != nil {
		return "", fmt.Errorf("failed to ensure wine prefix: %w", err)
	}

	logger.App.Info().Str("prefix", prefixPath).Str("serverName", serverName).Msg("Server wine prefix ensured")
	return prefixPath, nil
}

// CheckWine32Support checks if Wine is installed and supports 32-bit applications
// This performs an actual test by creating a temporary wine prefix and running a simple command
func (a *App) CheckWine32Support() (*WineCheckResult, error) {
	// 1. Check if wine command exists
	winePath, err := exec.LookPath("wine")
	if err != nil {
		if err := a.config.SetValidWineInstall(false); err != nil {
			logger.App.Warn().Err(err).Msg("Failed to save wine validation status")
		}
		return &WineCheckResult{
			Valid:   false,
			Message: "Wine binary not found. Please install Wine (e.g., 'apt install wine' or 'dnf install wine').",
		}, nil
	}

	// 2. Get wine prefixes directory
	prefixesDir, err := a.config.GetWinePrefixesDir()
	if err != nil {
		if err := a.config.SetValidWineInstall(false); err != nil {
			logger.App.Warn().Err(err).Msg("Failed to save wine validation status")
		}
		return &WineCheckResult{
			Valid:   false,
			Message: "Failed to get wine prefixes directory. Check your settings.",
		}, nil
	}

	// 3. Ensure wine prefixes directory exists
	if err := os.MkdirAll(prefixesDir, 0755); err != nil {
		if err := a.config.SetValidWineInstall(false); err != nil {
			logger.App.Warn().Err(err).Msg("Failed to save wine validation status")
		}
		return &WineCheckResult{
			Valid:   false,
			Message: fmt.Sprintf("Cannot create wine prefixes directory '%s': %v", prefixesDir, err),
		}, nil
	}

	// 4. Create test prefix directory
	testPrefixDir := filepath.Join(prefixesDir, "_wine_test")

	// IMPORTANT: Always remove existing test prefix before testing
	// A prefix created with wine64 will always fail for wine32, so we must start fresh
	if err := os.RemoveAll(testPrefixDir); err != nil {
		logger.App.Warn().Err(err).Str("path", testPrefixDir).Msg("Failed to remove existing test prefix")
	}

	if err := os.MkdirAll(testPrefixDir, 0755); err != nil {
		if err := a.config.SetValidWineInstall(false); err != nil {
			logger.App.Warn().Err(err).Msg("Failed to save wine validation status")
		}
		return &WineCheckResult{
			Valid:   false,
			Message: fmt.Sprintf("Cannot create test directory '%s': %v", testPrefixDir, err),
		}, nil
	}

	logger.App.Info().Str("testPrefix", testPrefixDir).Msg("Testing Wine 32-bit support...")

	// 5. Test 32-bit wine
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	cmd := exec.CommandContext(ctx, "wine", "cmd", "/c", "echo", "test")
	cmd.Env = append(os.Environ(),
		"WINEPREFIX="+testPrefixDir,
		"WINEARCH=win32",
	)

	output, err := cmd.CombinedOutput()
	outputStr := string(output)

	if err != nil {
		if err := a.config.SetValidWineInstall(false); err != nil {
			logger.App.Warn().Err(err).Msg("Failed to save wine validation status")
		}

		// Provide specific error messages based on common failure patterns
		if strings.Contains(outputStr, "wine: could not load") ||
			strings.Contains(outputStr, "wine32 is missing") ||
			strings.Contains(outputStr, "wrong ELF class") {
			return &WineCheckResult{
				Valid:   false,
				Message: "Wine found but 32-bit support is missing. Install wine32 package (e.g., 'dpkg --add-architecture i386 && apt update && apt install wine32:i386').",
			}, nil
		}

		if ctx.Err() == context.DeadlineExceeded {
			return &WineCheckResult{
				Valid:   false,
				Message: "Wine test timed out after 60 seconds. Wine may be misconfigured or system is too slow.",
			}, nil
		}

		// Generic error with output for debugging
		return &WineCheckResult{
			Valid:   false,
			Message: fmt.Sprintf("Wine 32-bit test failed: %v. Output: %s", err, outputStr),
		}, nil
	}

	// Success - clean up test directory
	if err := os.RemoveAll(testPrefixDir); err != nil {
		logger.App.Warn().Err(err).Str("path", testPrefixDir).Msg("Failed to clean up test prefix")
	}

	if err := a.config.SetValidWineInstall(true); err != nil {
		logger.App.Warn().Err(err).Msg("Failed to save wine validation status")
	}

	logger.App.Info().Str("winePath", winePath).Msg("Wine 32-bit support validated successfully")

	return &WineCheckResult{
		Valid:   true,
		Message: fmt.Sprintf("Wine 32-bit is working correctly (found at %s).", winePath),
	}, nil
}

// scanAndDownloadStarsExe scans all game directories and downloads stars.exe where missing
func (a *App) scanAndDownloadStarsExe() {
	serversDir, err := a.config.GetServersDir()
	if err != nil {
		logger.App.Warn().Err(err).Msg("Failed to get servers directory for stars.exe scan")
		return
	}

	// Get all configured servers to map server names to URLs
	servers, err := a.config.GetServers()
	if err != nil {
		logger.App.Warn().Err(err).Msg("Failed to get servers for stars.exe scan")
		return
	}

	// Build a map of sanitized server names to server URLs
	serverNameToURL := make(map[string]string)
	for _, srv := range servers {
		sanitizedName := a.config.SanitizeServerName(srv.Name)
		serverNameToURL[sanitizedName] = srv.URL
	}

	// Scan the servers directory for server subdirectories
	serverDirs, err := os.ReadDir(serversDir)
	if err != nil {
		logger.App.Warn().Err(err).Msg("Failed to read servers directory for stars.exe scan")
		return
	}

	for _, serverDir := range serverDirs {
		if !serverDir.IsDir() {
			continue
		}

		serverName := serverDir.Name()
		serverURL, ok := serverNameToURL[serverName]
		if !ok {
			logger.App.Debug().Str("dir", serverName).Msg("Skipping unknown server directory")
			continue
		}

		// Check if we're connected to this server
		a.mu.RLock()
		client, connected := a.clients[serverURL]
		a.mu.RUnlock()

		if !connected {
			logger.App.Debug().Str("server", serverName).Msg("Skipping disconnected server for stars.exe scan")
			continue
		}

		// Scan for session directories that need stars.exe
		serverPath := filepath.Join(serversDir, serverName)
		sessionDirs, err := os.ReadDir(serverPath)
		if err != nil {
			logger.App.Warn().Err(err).Str("server", serverName).Msg("Failed to read server directory")
			continue
		}

		// Collect directories that need stars.exe
		var dirsNeedingStars []string
		for _, sessionDir := range sessionDirs {
			if !sessionDir.IsDir() {
				continue
			}

			gameDir := filepath.Join(serverPath, sessionDir.Name())
			starsPath := filepath.Join(gameDir, "stars.exe")

			// Check if stars.exe already exists
			if _, err := os.Stat(starsPath); err == nil {
				continue // File exists
			}

			dirsNeedingStars = append(dirsNeedingStars, gameDir)
		}

		if len(dirsNeedingStars) == 0 {
			continue
		}

		// Download stars.exe once for this server
		logger.App.Info().
			Str("server", serverName).
			Int("count", len(dirsNeedingStars)).
			Msg("Downloading stars.exe for session directories")

		ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
		data, err := client.DownloadStarsExe(ctx)
		cancel()

		if err != nil {
			logger.App.Warn().Err(err).Str("server", serverName).Msg("Failed to download stars.exe")
			continue
		}

		// Copy to all directories that need it
		for _, gameDir := range dirsNeedingStars {
			starsPath := filepath.Join(gameDir, "stars.exe")
			if err := os.WriteFile(starsPath, data, 0755); err != nil {
				logger.App.Warn().Err(err).Str("path", starsPath).Msg("Failed to write stars.exe")
				continue
			}
			logger.App.Debug().Str("path", starsPath).Msg("Copied stars.exe")

			// Extract sessionID from directory name and emit event
			sessionID := filepath.Base(gameDir)
			runtime.EventsEmit(a.ctx, "starsExe:downloaded", serverURL, sessionID)
		}
	}

	logger.App.Info().Msg("Completed stars.exe scan")
}

// =============================================================================
// STARS.EXE AUTO-DOWNLOAD
// =============================================================================

// setupSessionGameDir creates the game directory for a session and
// optionally downloads stars.exe if auto-download is enabled
func (a *App) setupSessionGameDir(serverURL, serverName, sessionID string) {
	gameDir, err := a.config.EnsureSessionGameDir(serverName, sessionID)
	if err != nil {
		logger.App.Warn().Err(err).Msg("Failed to create game directory")
		return
	}
	logger.App.Info().Str("path", gameDir).Msg("Created game directory")

	// Ensure stars.exe is downloaded if auto-download is enabled
	a.ensureStarsExeInDir(serverURL, sessionID, gameDir)
}

// ensureStarsExeInDir checks if stars.exe should be downloaded and triggers download if needed
func (a *App) ensureStarsExeInDir(serverURL, sessionID, gameDir string) {
	// Check if auto-download is enabled
	settings, err := a.config.GetAppSettings()
	if err != nil {
		logger.App.Warn().Err(err).Msg("Failed to get app settings for stars.exe check")
		return
	}

	if !settings.GetAutoDownloadStars() {
		return
	}

	// Check if stars.exe already exists
	starsPath := filepath.Join(gameDir, "stars.exe")
	if _, err := os.Stat(starsPath); err == nil {
		// File already exists
		return
	}

	// Download in background to not block the caller
	go a.downloadStarsExeToDir(serverURL, sessionID, gameDir)
}

// downloadStarsExeToDir downloads stars.exe from the server and saves it to the directory
func (a *App) downloadStarsExeToDir(serverURL, sessionID, gameDir string) {
	a.mu.RLock()
	client, ok := a.clients[serverURL]
	a.mu.RUnlock()

	if !ok {
		logger.App.Warn().Str("serverURL", serverURL).Msg("Cannot download stars.exe: not connected")
		return
	}

	logger.App.Info().Str("serverURL", serverURL).Str("gameDir", gameDir).Msg("Downloading stars.exe")

	data, err := client.DownloadStarsExe(context.Background())
	if err != nil {
		logger.App.Warn().Err(err).Str("serverURL", serverURL).Msg("Failed to download stars.exe")
		return
	}

	starsPath := filepath.Join(gameDir, "stars.exe")
	if err := os.WriteFile(starsPath, data, 0755); err != nil {
		logger.App.Warn().Err(err).Str("path", starsPath).Msg("Failed to save stars.exe")
		return
	}

	logger.App.Info().Str("path", starsPath).Int("size", len(data)).Msg("Downloaded stars.exe")

	// Notify frontend that stars.exe is now available for this session
	runtime.EventsEmit(a.ctx, "starsExe:downloaded", serverURL, sessionID)
}
