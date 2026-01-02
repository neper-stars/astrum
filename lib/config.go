package lib

import (
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"
	"unicode"

	jsoniter "github.com/json-iterator/go"
	"github.com/kirsle/configdir"

	"github.com/neper-stars/astrum/database"
	"github.com/neper-stars/astrum/model"
)

func ConfigPath() string {
	// on linux this resolves to something like: ~/.config/<appname>
	// lower-cased AppName
	return configdir.LocalConfig(strings.ToLower(AppName))
}

func IconPath() string {
	return filepath.Join(ConfigPath(), MainIcon)
}

// Config manages application configuration using BBolt for metadata
// and system keyring for credentials
type Config struct {
	db    *database.DB
	creds *CredentialStore
}

// NewConfig creates a new Config instance
func NewConfig(db *database.DB) (*Config, error) {
	c := &Config{
		db:    db,
		creds: NewCredentialStore(),
	}
	return c, nil
}

// OnShutdown should be called before closing the application
// this ensures the config is properly saved to disk
func (c *Config) OnShutdown() {
	if err := c.db.Close(); err != nil {
		fmt.Printf("Error closing database: %v\n", err)
	}
}

// CredentialStore returns the credential store for direct access
func (c *Config) CredentialStore() *CredentialStore {
	return c.creds
}

// AddServer adds a new server to the database
func (c *Config) AddServer(server model.Server) error {
	data, err := jsoniter.Marshal(server)
	if err != nil {
		return fmt.Errorf("failed to marshal server: %w", err)
	}

	if err := c.db.Set(database.BucketServers, server.URL, data); err != nil {
		return fmt.Errorf("failed to save server: %w", err)
	}

	return nil
}

// GetServer retrieves a server by URL
func (c *Config) GetServer(url string) (*model.Server, error) {
	data, err := c.db.Get(database.BucketServers, url)
	if err != nil {
		return nil, fmt.Errorf("failed to get server: %w", err)
	}
	if data == nil {
		return nil, nil // Server not found
	}

	var server model.Server
	if err := jsoniter.Unmarshal(data, &server); err != nil {
		return nil, fmt.Errorf("failed to unmarshal server: %w", err)
	}

	return &server, nil
}

// GetServers returns all configured servers
func (c *Config) GetServers() (model.Servers, error) {
	allData, err := c.db.GetAll(database.BucketServers)
	if err != nil {
		return nil, fmt.Errorf("failed to get servers: %w", err)
	}

	servers := make(model.Servers, 0, len(allData))
	for _, data := range allData {
		var server model.Server
		if err := jsoniter.Unmarshal(data, &server); err != nil {
			// Skip corrupted entries but log the error
			fmt.Printf("Warning: failed to unmarshal server: %v\n", err)
			continue
		}
		servers = append(servers, server)
	}

	return servers, nil
}

// SetServers replaces all servers (used for bulk operations)
func (c *Config) SetServers(servers model.Servers) error {
	// Get existing servers to find ones to delete
	existingKeys, err := c.db.Keys(database.BucketServers)
	if err != nil {
		return fmt.Errorf("failed to get existing server keys: %w", err)
	}

	// Create a map of new server URLs
	newURLs := make(map[string]bool)
	for _, srv := range servers {
		newURLs[srv.URL] = true
	}

	// Delete servers that are no longer in the list
	for _, key := range existingKeys {
		if !newURLs[key] {
			// Also delete credentials for removed servers
			oldServer, _ := c.GetServer(key)
			if oldServer != nil {
				for _, cred := range oldServer.CredentialRefs {
					_ = c.creds.Delete(key, cred.NickName)
				}
			}
			if err := c.db.Delete(database.BucketServers, key); err != nil {
				fmt.Printf("Warning: failed to delete server %s: %v\n", key, err)
			}
		}
	}

	// Add/update all servers
	for _, srv := range servers {
		if err := c.AddServer(srv); err != nil {
			return err
		}
	}

	return nil
}

// UpdateServer updates an existing server
func (c *Config) UpdateServer(server model.Server) error {
	return c.AddServer(server) // Same operation for BBolt
}

// RemoveServer removes a server and its credentials
func (c *Config) RemoveServer(url string) error {
	// Get server to find credentials to delete
	server, err := c.GetServer(url)
	if err != nil {
		return err
	}

	if server != nil {
		// Delete all credentials for this server
		for _, cred := range server.CredentialRefs {
			if err := c.creds.Delete(url, cred.NickName); err != nil {
				fmt.Printf("Warning: failed to delete credential %s: %v\n", cred.NickName, err)
			}
		}
	}

	// Delete the server
	if err := c.db.Delete(database.BucketServers, url); err != nil {
		return fmt.Errorf("failed to delete server: %w", err)
	}

	return nil
}

// SaveCredential stores a credential in the keyring and updates the server
func (c *Config) SaveCredential(serverURL, username, apiKey string) error {
	// Store in keyring
	if err := c.creds.Set(serverURL, username, apiKey, true); err != nil {
		return fmt.Errorf("failed to save credential to keyring: %w", err)
	}

	// Update server's credential refs
	server, err := c.GetServer(serverURL)
	if err != nil {
		return err
	}
	if server == nil {
		return fmt.Errorf("server %s not found", serverURL)
	}

	server.AddOrUpdateCredentialRef(username)
	return c.UpdateServer(*server)
}

// GetCredential retrieves a credential from the keyring
func (c *Config) GetCredential(serverURL, username string) (string, error) {
	return c.creds.GetAPIKey(serverURL, username)
}

// RemoveCredential removes a credential from the keyring and updates the server
func (c *Config) RemoveCredential(serverURL, username string) error {
	// Delete from keyring
	if err := c.creds.Delete(serverURL, username); err != nil {
		return fmt.Errorf("failed to delete credential from keyring: %w", err)
	}

	// Update server's credential refs
	server, err := c.GetServer(serverURL)
	if err != nil {
		return err
	}
	if server != nil {
		server.RemoveCredentialRef(username)
		return c.UpdateServer(*server)
	}

	return nil
}

// =============================================================================
// SERVERS DIRECTORY CONFIGURATION
// =============================================================================

const (
	// AppSettingsKey is the key for app settings in the database
	AppSettingsKey = "settings"
)

// WindowGeometry stores window position and size
type WindowGeometry struct {
	X      int `json:"x"`
	Y      int `json:"y"`
	Width  int `json:"width"`
	Height int `json:"height"`
}

// AppSettings stores global application settings
type AppSettings struct {
	ServersDir        string          `json:"serversDir"`
	AutoDownloadStars *bool           `json:"autoDownloadStars"` // nil means default (true)
	ZoomLevel         *int            `json:"zoomLevel"`         // nil means default (100)
	UseWine           *bool           `json:"useWine"`           // nil means default (false)
	WinePrefixesDir   *string         `json:"winePrefixesDir"`   // nil means default (~/.config/astrum/wine_prefixes)
	ValidWineInstall  *bool           `json:"validWineInstall"`  // nil means not checked yet (default: false)
	WindowGeometry    *WindowGeometry `json:"windowGeometry"`    // nil means use defaults
}

// GetAutoDownloadStars returns the auto download setting (default: true)
func (s *AppSettings) GetAutoDownloadStars() bool {
	if s.AutoDownloadStars == nil {
		return true // default
	}
	return *s.AutoDownloadStars
}

// GetZoomLevel returns the zoom level as percentage (default: 100)
func (s *AppSettings) GetZoomLevel() int {
	if s.ZoomLevel == nil {
		return 100 // default 100%
	}
	return *s.ZoomLevel
}

// GetUseWine returns the use wine setting (default: false)
func (s *AppSettings) GetUseWine() bool {
	if s.UseWine == nil {
		return false // default
	}
	return *s.UseWine
}

// GetWinePrefixesDir returns the wine prefixes directory path (default: ~/.config/astrum/wine_prefixes)
// This directory contains per-server wine prefixes, with each server getting its own subdirectory.
func (s *AppSettings) GetWinePrefixesDir() string {
	if s.WinePrefixesDir == nil {
		return DefaultWinePrefixesDir()
	}
	return *s.WinePrefixesDir
}

// GetValidWineInstall returns the wine installation validation status (default: false)
func (s *AppSettings) GetValidWineInstall() bool {
	if s.ValidWineInstall == nil {
		return false // default: not validated
	}
	return *s.ValidWineInstall
}

// DefaultWinePrefixesDir returns the default wine prefixes directory path
// Each server will have its own wine prefix subdirectory under this path,
// allowing different serial keys per server.
func DefaultWinePrefixesDir() string {
	home, err := os.UserHomeDir()
	if err != nil {
		return filepath.Join(".", ".config", "astrum", "wine_prefixes")
	}
	return filepath.Join(home, ".config", "astrum", "wine_prefixes")
}

// DefaultServersDir returns the default servers directory path
func DefaultServersDir() string {
	home, err := os.UserHomeDir()
	if err != nil {
		// Fallback to current directory
		return filepath.Join(".", ".astrum", "servers")
	}
	return filepath.Join(home, ".astrum", "servers")
}

// GetAppSettings retrieves the app settings from the database
func (c *Config) GetAppSettings() (*AppSettings, error) {
	data, err := c.db.Get(database.BucketAppSettings, AppSettingsKey)
	if err != nil {
		return nil, fmt.Errorf("failed to get app settings: %w", err)
	}
	if data == nil {
		// Return default settings if not found
		return &AppSettings{
			ServersDir: DefaultServersDir(),
		}, nil
	}

	var settings AppSettings
	if err := jsoniter.Unmarshal(data, &settings); err != nil {
		return nil, fmt.Errorf("failed to unmarshal app settings: %w", err)
	}

	return &settings, nil
}

// SetAppSettings stores the app settings in the database
func (c *Config) SetAppSettings(settings *AppSettings) error {
	data, err := jsoniter.Marshal(settings)
	if err != nil {
		return fmt.Errorf("failed to marshal app settings: %w", err)
	}

	if err := c.db.Set(database.BucketAppSettings, AppSettingsKey, data); err != nil {
		return fmt.Errorf("failed to save app settings: %w", err)
	}

	return nil
}

// GetServersDir retrieves the servers directory from settings
func (c *Config) GetServersDir() (string, error) {
	settings, err := c.GetAppSettings()
	if err != nil {
		return "", err
	}
	return settings.ServersDir, nil
}

// SetServersDir updates the servers directory in settings
func (c *Config) SetServersDir(serversDir string) error {
	settings, err := c.GetAppSettings()
	if err != nil {
		return err
	}
	settings.ServersDir = serversDir
	return c.SetAppSettings(settings)
}

// SetAutoDownloadStars updates the auto download stars setting
func (c *Config) SetAutoDownloadStars(enabled bool) error {
	settings, err := c.GetAppSettings()
	if err != nil {
		return err
	}
	settings.AutoDownloadStars = &enabled
	return c.SetAppSettings(settings)
}

// SetZoomLevel updates the zoom level setting (clamped to 50-200%)
func (c *Config) SetZoomLevel(level int) error {
	// Clamp to reasonable range
	if level < 50 {
		level = 50
	}
	if level > 200 {
		level = 200
	}

	settings, err := c.GetAppSettings()
	if err != nil {
		return err
	}
	settings.ZoomLevel = &level
	return c.SetAppSettings(settings)
}

// SetUseWine updates the use wine setting
func (c *Config) SetUseWine(enabled bool) error {
	settings, err := c.GetAppSettings()
	if err != nil {
		return err
	}
	settings.UseWine = &enabled
	return c.SetAppSettings(settings)
}

// SetWinePrefixesDir updates the wine prefixes directory path
func (c *Config) SetWinePrefixesDir(prefixesDir string) error {
	settings, err := c.GetAppSettings()
	if err != nil {
		return err
	}
	settings.WinePrefixesDir = &prefixesDir
	return c.SetAppSettings(settings)
}

// GetWinePrefixesDir returns the wine prefixes directory path from settings
func (c *Config) GetWinePrefixesDir() (string, error) {
	settings, err := c.GetAppSettings()
	if err != nil {
		return "", err
	}
	return settings.GetWinePrefixesDir(), nil
}

// GetServerWinePrefix returns the wine prefix path for a specific server
// Each server gets its own wine prefix to allow different serial keys per server.
// Path format: <winePrefixesDir>/<sanitizedServerName>
func (c *Config) GetServerWinePrefix(serverName string) (string, error) {
	prefixesDir, err := c.GetWinePrefixesDir()
	if err != nil {
		return "", err
	}
	sanitizedName := sanitizeServerName(serverName)
	return filepath.Join(prefixesDir, sanitizedName), nil
}

// GetUseWine returns the use wine setting from settings
func (c *Config) GetUseWine() (bool, error) {
	settings, err := c.GetAppSettings()
	if err != nil {
		return false, err
	}
	return settings.GetUseWine(), nil
}

// SetValidWineInstall updates the wine installation validation status
func (c *Config) SetValidWineInstall(valid bool) error {
	settings, err := c.GetAppSettings()
	if err != nil {
		return err
	}
	settings.ValidWineInstall = &valid
	return c.SetAppSettings(settings)
}

// GetValidWineInstall returns the wine installation validation status
func (c *Config) GetValidWineInstall() (bool, error) {
	settings, err := c.GetAppSettings()
	if err != nil {
		return false, err
	}
	return settings.GetValidWineInstall(), nil
}

// GetWindowGeometry returns the saved window geometry, or nil if not set
func (c *Config) GetWindowGeometry() (*WindowGeometry, error) {
	settings, err := c.GetAppSettings()
	if err != nil {
		return nil, err
	}
	return settings.WindowGeometry, nil
}

// SetWindowGeometry saves the window geometry
func (c *Config) SetWindowGeometry(geom *WindowGeometry) error {
	settings, err := c.GetAppSettings()
	if err != nil {
		return err
	}
	settings.WindowGeometry = geom
	return c.SetAppSettings(settings)
}

// EnsureServersDir creates the servers directory if it doesn't exist
func (c *Config) EnsureServersDir() error {
	serversDir, err := c.GetServersDir()
	if err != nil {
		return err
	}

	if err := os.MkdirAll(serversDir, 0755); err != nil {
		return fmt.Errorf("failed to create servers directory: %w", err)
	}

	return nil
}

// sanitizeServerName converts a server name to a filesystem-safe directory name
func sanitizeServerName(name string) string {
	// Replace all Unicode whitespace characters (space, tab, nbsp, etc.) with underscores
	sanitized := strings.Map(func(r rune) rune {
		if unicode.IsSpace(r) {
			return '_'
		}
		return r
	}, name)

	// Replace characters that are problematic on various filesystems
	re := regexp.MustCompile(`[<>:."/\\|?*\x00-\x1f]`)
	sanitized = re.ReplaceAllString(sanitized, "_")

	// Trim underscores and dots from ends
	sanitized = strings.Trim(sanitized, "_.")

	return sanitized
}

// SanitizeServerName exposes the server name sanitization for external use
func (c *Config) SanitizeServerName(name string) string {
	return sanitizeServerName(name)
}

// ErrServerNameEmpty is returned when a server name is empty or contains only invalid characters
var ErrServerNameEmpty = fmt.Errorf("server name is empty or invalid")

// ErrServerNameCollision is returned when a server name would result in a collision
// with an existing server's sanitized name (used for directories and wine prefixes)
var ErrServerNameCollision = fmt.Errorf("server name collision")

// ValidateServerName checks if a server name is valid (non-empty after sanitization)
func (c *Config) ValidateServerName(name string) error {
	if strings.TrimSpace(name) == "" {
		return ErrServerNameEmpty
	}
	sanitized := sanitizeServerName(name)
	if sanitized == "" {
		return ErrServerNameEmpty
	}
	return nil
}

// CheckServerNameCollision checks if a server name would collide with an existing server.
// excludeURL is the URL of the server being updated (to allow keeping the same name).
// Returns the conflicting server's name if there's a collision, empty string otherwise.
func (c *Config) CheckServerNameCollision(name string, excludeURL string) (string, error) {
	sanitized := sanitizeServerName(name)

	servers, err := c.GetServers()
	if err != nil {
		return "", fmt.Errorf("failed to get servers: %w", err)
	}

	for _, srv := range servers {
		// Skip the server being updated
		if srv.URL == excludeURL {
			continue
		}

		if sanitizeServerName(srv.Name) == sanitized {
			return srv.Name, ErrServerNameCollision
		}
	}

	return "", nil
}

// GetSessionGameDir calculates the game directory path for a session
// Path format: <serversdir>/<servername>/<sessionID>
func (c *Config) GetSessionGameDir(serverName, sessionID string) (string, error) {
	serversDir, err := c.GetServersDir()
	if err != nil {
		return "", err
	}

	sanitizedName := sanitizeServerName(serverName)
	return filepath.Join(serversDir, sanitizedName, sessionID), nil
}

// EnsureSessionGameDir creates the game directory for a session if it doesn't exist
func (c *Config) EnsureSessionGameDir(serverName, sessionID string) (string, error) {
	gameDir, err := c.GetSessionGameDir(serverName, sessionID)
	if err != nil {
		return "", err
	}

	if err := os.MkdirAll(gameDir, 0755); err != nil {
		return "", fmt.Errorf("failed to create session game directory: %w", err)
	}

	return gameDir, nil
}

// OldSessionsDir is the name of the directory where archived sessions are moved
const OldSessionsDir = "ZZ_OLD_SESSIONS"

// GetServerDir returns the server directory path
// Path format: <serversdir>/<servername>
func (c *Config) GetServerDir(serverName string) (string, error) {
	serversDir, err := c.GetServersDir()
	if err != nil {
		return "", err
	}

	sanitizedName := sanitizeServerName(serverName)
	return filepath.Join(serversDir, sanitizedName), nil
}

// ArchiveSessionDir moves a session directory to ZZ_OLD_SESSIONS within the server directory.
// This preserves user files while cleaning up stale session directories.
// If the session directory doesn't exist, this is a no-op.
// Returns the path where the session was moved to, or empty string if nothing was moved.
func (c *Config) ArchiveSessionDir(serverName, sessionID string) (string, error) {
	gameDir, err := c.GetSessionGameDir(serverName, sessionID)
	if err != nil {
		return "", err
	}

	// Check if session directory exists
	if _, err := os.Stat(gameDir); os.IsNotExist(err) {
		return "", nil // Nothing to archive
	}

	// Get server directory
	serverDir, err := c.GetServerDir(serverName)
	if err != nil {
		return "", err
	}

	// Create the archive directory
	archiveDir := filepath.Join(serverDir, OldSessionsDir)
	if err := os.MkdirAll(archiveDir, 0755); err != nil {
		return "", fmt.Errorf("failed to create archive directory: %w", err)
	}

	// Generate unique name if target already exists (append timestamp)
	targetDir := filepath.Join(archiveDir, sessionID)
	if _, err := os.Stat(targetDir); err == nil {
		// Target exists, append timestamp
		timestamp := time.Now().Format("20060102_150405")
		targetDir = filepath.Join(archiveDir, sessionID+"_"+timestamp)
	}

	// Move the session directory
	if err := os.Rename(gameDir, targetDir); err != nil {
		return "", fmt.Errorf("failed to move session directory to archive: %w", err)
	}

	return targetDir, nil
}

// ListSessionDirs returns a list of session directory names in the server directory.
// It excludes the ZZ_OLD_SESSIONS directory.
func (c *Config) ListSessionDirs(serverName string) ([]string, error) {
	serverDir, err := c.GetServerDir(serverName)
	if err != nil {
		return nil, err
	}

	// Check if server directory exists
	if _, err := os.Stat(serverDir); os.IsNotExist(err) {
		return nil, nil // No sessions
	}

	entries, err := os.ReadDir(serverDir)
	if err != nil {
		return nil, fmt.Errorf("failed to read server directory: %w", err)
	}

	var sessionIDs []string
	for _, entry := range entries {
		if entry.IsDir() && entry.Name() != OldSessionsDir {
			sessionIDs = append(sessionIDs, entry.Name())
		}
	}

	return sessionIDs, nil
}
