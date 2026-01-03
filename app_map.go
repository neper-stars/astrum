package main

import (
	"archive/zip"
	"bytes"
	"encoding/base64"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/neper-stars/astrum/lib/logger"
	"github.com/neper-stars/houston/lib/tools/maprenderer"
)

// =============================================================================
// MAP GENERATION
// =============================================================================

// GenerateMap generates an SVG map from turn files
func (a *App) GenerateMap(request MapGenerateRequest) (string, error) {
	logger.App.Debug().
		Str("serverUrl", request.ServerURL).
		Str("sessionId", request.SessionID).
		Int("year", request.Year).
		Msg("Generating map")

	// Decode base64 universe (.xy) file
	xyBytes, err := base64.StdEncoding.DecodeString(request.UniverseB64)
	if err != nil {
		return "", fmt.Errorf("failed to decode universe file: %w", err)
	}

	// Decode base64 turn (.mN) file
	turnBytes, err := base64.StdEncoding.DecodeString(request.TurnB64)
	if err != nil {
		return "", fmt.Errorf("failed to decode turn file: %w", err)
	}

	// Create renderer and load files
	renderer := maprenderer.New()

	// Load the xy file first
	if err := renderer.LoadBytes("game.xy", xyBytes); err != nil {
		return "", fmt.Errorf("failed to load universe file: %w", err)
	}

	// Load the turn file
	if err := renderer.LoadBytes("game.m1", turnBytes); err != nil {
		return "", fmt.Errorf("failed to load turn file: %w", err)
	}

	// Convert MapOptions to RenderOptions
	opts := &maprenderer.RenderOptions{
		Width:               request.Options.Width,
		Height:              request.Options.Height,
		ShowNames:           request.Options.ShowNames,
		ShowFleets:          request.Options.ShowFleets,
		ShowFleetPaths:      request.Options.ShowFleetPaths,
		ShowMines:           request.Options.ShowMines,
		ShowWormholes:       request.Options.ShowWormholes,
		ShowLegend:          request.Options.ShowLegend,
		ShowScannerCoverage: request.Options.ShowScannerCoverage,
		Padding:             20,
	}

	// Generate SVG
	svg := renderer.RenderSVG(opts)

	logger.App.Debug().
		Int("svgLength", len(svg)).
		Msg("Map generated successfully")

	return svg, nil
}

// SaveMap saves an SVG map to the session's game directory
func (a *App) SaveMap(request MapSaveRequest) error {
	logger.App.Debug().
		Str("serverUrl", request.ServerURL).
		Str("sessionId", request.SessionID).
		Int("year", request.Year).
		Str("raceName", request.RaceName).
		Msg("Saving map")

	// Get the server name for calculating game directory
	server, _ := a.config.GetServer(request.ServerURL)
	serverName := request.ServerURL // fallback to URL if server not found
	if server != nil {
		serverName = server.Name
	}

	// Get the game directory
	gameDir, err := a.config.EnsureSessionGameDir(serverName, request.SessionID)
	if err != nil {
		return fmt.Errorf("failed to get game directory: %w", err)
	}

	// Sanitize race name for use in filename
	safeName := sanitizeFilename(request.RaceName)
	if safeName == "" {
		safeName = "unknown"
	}

	// Create filename: {year}-{raceName}-player{N}-map.svg
	filename := fmt.Sprintf("%d-%s-player%d-map.svg", request.Year, safeName, request.PlayerNumber)
	filePath := filepath.Join(gameDir, filename)

	// Write SVG to file
	if err := os.WriteFile(filePath, []byte(request.SVGContent), 0644); err != nil {
		return fmt.Errorf("failed to save map: %w", err)
	}

	logger.App.Info().
		Str("path", filePath).
		Msg("Map saved successfully")

	return nil
}

// sanitizeFilename removes or replaces characters that are not safe for filenames
func sanitizeFilename(name string) string {
	// Replace spaces with underscores
	name = strings.ReplaceAll(name, " ", "_")

	// Remove any characters that are not alphanumeric, underscore, or hyphen
	reg := regexp.MustCompile(`[^a-zA-Z0-9_-]`)
	name = reg.ReplaceAllString(name, "")

	// Trim to reasonable length
	if len(name) > 50 {
		name = name[:50]
	}

	return name
}

// =============================================================================
// ANIMATED GIF GENERATION
// =============================================================================

// GenerateAnimatedMap generates an animated GIF map from session history
func (a *App) GenerateAnimatedMap(request AnimatedMapRequest) (string, error) {
	logger.App.Debug().
		Str("serverUrl", request.ServerURL).
		Str("sessionId", request.SessionID).
		Int("delay", request.Delay).
		Msg("Generating animated map")

	// Get client and auth manager
	a.mu.RLock()
	client, ok := a.clients[request.ServerURL]
	mgr, mgrOk := a.authManagers[request.ServerURL]
	a.mu.RUnlock()

	if !ok || !mgrOk {
		return "", fmt.Errorf("not connected to server: %s", request.ServerURL)
	}

	// Download the historic backup ZIP from the server
	zipData, err := client.DownloadHistoricBackup(mgr.GetContext(), request.SessionID)
	if err != nil {
		return "", fmt.Errorf("failed to download historic backup: %w", err)
	}

	logger.App.Debug().
		Int("zipSize", len(zipData)).
		Msg("Downloaded historic backup for animation")

	// Create animator
	animator := maprenderer.NewAnimator()

	// Read files from ZIP and load into animator
	zipReader, err := zip.NewReader(bytes.NewReader(zipData), int64(len(zipData)))
	if err != nil {
		return "", fmt.Errorf("failed to read backup zip: %w", err)
	}

	fileCount := 0
	for _, file := range zipReader.File {
		// Only load .xy (universe) and .m* (turn) files
		name := strings.ToLower(file.Name)
		baseName := filepath.Base(name)

		if !strings.HasSuffix(baseName, ".xy") && !isMapFile(baseName) {
			continue
		}

		rc, err := file.Open()
		if err != nil {
			logger.App.Warn().
				Str("file", file.Name).
				Err(err).
				Msg("Failed to open file in zip")
			continue
		}

		data, err := io.ReadAll(rc)
		rc.Close()
		if err != nil {
			logger.App.Warn().
				Str("file", file.Name).
				Err(err).
				Msg("Failed to read file from zip")
			continue
		}

		// Set XY file as base data (will be included in every frame)
		if strings.HasSuffix(baseName, ".xy") {
			animator.SetBaseData(baseName, data)
			logger.App.Debug().
				Str("file", baseName).
				Int("size", len(data)).
				Msg("Set XY file as base data for all frames")
			continue
		}

		// Add turn file (XY base data will be automatically included)
		if err := animator.AddBytes(baseName, data); err != nil {
			logger.App.Warn().
				Str("file", baseName).
				Err(err).
				Msg("Failed to load file into animator")
			continue
		}

		fileCount++
		logger.App.Debug().
			Str("file", baseName).
			Int("size", len(data)).
			Msg("Loaded turn file into animator")
	}

	if fileCount == 0 {
		return "", fmt.Errorf("no valid game files found in backup")
	}

	// Sort frames by year
	animator.SortByYear()

	logger.App.Debug().
		Int("frameCount", animator.FrameCount()).
		Msg("Frames sorted by year")

	// Set render options
	opts := &maprenderer.RenderOptions{
		Width:               request.Options.Width,
		Height:              request.Options.Height,
		ShowNames:           request.Options.ShowNames,
		ShowFleets:          request.Options.ShowFleets,
		ShowFleetPaths:      request.Options.ShowFleetPaths,
		ShowMines:           request.Options.ShowMines,
		ShowWormholes:       request.Options.ShowWormholes,
		ShowLegend:          request.Options.ShowLegend,
		ShowScannerCoverage: request.Options.ShowScannerCoverage,
		Padding:             20,
	}
	animator.SetOptions(opts)

	// Use default GIF palette
	animator.SetPalette(maprenderer.DefaultGIFPalette())

	// Render GIF (houston expects milliseconds)
	delayMs := request.Delay
	if delayMs < 100 {
		delayMs = 500 // Default to 500ms if invalid
	}

	gifBytes, err := animator.RenderGIFBytes(delayMs)
	if err != nil {
		return "", fmt.Errorf("failed to render GIF: %w", err)
	}

	// Encode to base64
	gifB64 := base64.StdEncoding.EncodeToString(gifBytes)

	logger.App.Info().
		Int("gifSize", len(gifBytes)).
		Int("frameCount", animator.FrameCount()).
		Int("delayMs", delayMs).
		Msg("Animated map generated successfully")

	return gifB64, nil
}

// isMapFile checks if a filename is a Stars! turn file (.m1, .m2, etc.)
func isMapFile(name string) bool {
	// Match .m followed by one or more digits
	matched, _ := regexp.MatchString(`\.m\d+$`, strings.ToLower(name))
	return matched
}

// SaveGif saves a GIF to the session's game directory
func (a *App) SaveGif(request GifSaveRequest) error {
	logger.App.Debug().
		Str("serverUrl", request.ServerURL).
		Str("sessionId", request.SessionID).
		Str("raceName", request.RaceName).
		Msg("Saving GIF")

	// Get the server name for calculating game directory
	server, _ := a.config.GetServer(request.ServerURL)
	serverName := request.ServerURL // fallback to URL if server not found
	if server != nil {
		serverName = server.Name
	}

	// Get the game directory
	gameDir, err := a.config.EnsureSessionGameDir(serverName, request.SessionID)
	if err != nil {
		return fmt.Errorf("failed to get game directory: %w", err)
	}

	// Decode base64 GIF content
	gifData, err := base64.StdEncoding.DecodeString(request.GifContent)
	if err != nil {
		return fmt.Errorf("failed to decode GIF content: %w", err)
	}

	// Sanitize race name for use in filename
	safeName := sanitizeFilename(request.RaceName)
	if safeName == "" {
		safeName = "unknown"
	}

	// Create filename: {raceName}-player{N}-animated-map.gif
	filename := fmt.Sprintf("%s-player%d-animated-map.gif", safeName, request.PlayerNumber)
	filePath := filepath.Join(gameDir, filename)

	// Write GIF to file
	if err := os.WriteFile(filePath, gifData, 0644); err != nil {
		return fmt.Errorf("failed to save GIF: %w", err)
	}

	logger.App.Info().
		Str("path", filePath).
		Int("size", len(gifData)).
		Msg("GIF saved successfully")

	return nil
}
