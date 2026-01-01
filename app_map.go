package main

import (
	"encoding/base64"
	"fmt"
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
