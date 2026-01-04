package main

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"sort"

	astrum "github.com/neper-stars/astrum/lib"
	"github.com/neper-stars/astrum/lib/logger"
	"github.com/neper-stars/astrum/model"
)

// =============================================================================
// DEFAULT SERVER
// =============================================================================

const (
	DefaultServerName = "Neper"
	DefaultServerURL  = "https://neper.fly.dev"
)

// EnsureDefaultServer creates the default Neper server if no servers exist.
// This is called at startup to provide a ready-to-use experience.
func (a *App) EnsureDefaultServer() error {
	servers, err := a.config.GetServers()
	if err != nil {
		return fmt.Errorf("failed to get servers: %w", err)
	}

	logger.App.Debug().
		Int("serverCount", len(servers)).
		Msg("EnsureDefaultServer: checking existing servers")

	// Only create default server if no servers exist at all
	if len(servers) > 0 {
		logger.App.Debug().Msg("EnsureDefaultServer: servers already exist, skipping default creation")
		return nil
	}

	logger.App.Info().Msg("No servers configured, creating default Neper server")

	server := model.Server{
		Name:  DefaultServerName,
		URL:   DefaultServerURL,
		Order: 0,
	}

	if err := a.config.AddServer(server); err != nil {
		return fmt.Errorf("failed to create default server: %w", err)
	}

	logger.App.Info().
		Str("name", DefaultServerName).
		Str("url", DefaultServerURL).
		Msg("Created default Neper server")

	return nil
}

// HasDefaultServer checks if the default Neper server exists
func (a *App) HasDefaultServer() (bool, error) {
	servers, err := a.config.GetServers()
	if err != nil {
		return false, fmt.Errorf("failed to get servers: %w", err)
	}

	for _, srv := range servers {
		if srv.URL == DefaultServerURL {
			return true, nil
		}
	}

	return false, nil
}

// IsDefaultServer checks if a server URL is the default Neper server
func (a *App) IsDefaultServer(serverURL string) bool {
	return serverURL == DefaultServerURL
}

// AddDefaultServer adds the default Neper server
func (a *App) AddDefaultServer() (*ServerInfo, error) {
	return a.AddServer(DefaultServerName, DefaultServerURL)
}

// =============================================================================
// SERVER MANAGEMENT
// =============================================================================

// GetServers returns all configured servers sorted by order
func (a *App) GetServers() ([]ServerInfo, error) {
	servers, err := a.config.GetServers()
	if err != nil {
		return nil, fmt.Errorf("failed to get servers: %w", err)
	}

	// Sort servers by order
	sort.Slice(servers, func(i, j int) bool {
		return servers[i].Order < servers[j].Order
	})

	a.mu.RLock()
	defer a.mu.RUnlock()

	result := make([]ServerInfo, len(servers))
	for i, srv := range servers {
		defaultCred := srv.GetDefaultCredentialRef()
		result[i] = ServerInfo{
			URL:            srv.URL,
			Name:           srv.Name,
			IconURL:        srv.IconURL,
			HasCredentials: len(srv.CredentialRefs) > 0,
			IsConnected:    a.connections[srv.URL] != nil && a.connections[srv.URL].Connected,
			Order:          srv.Order,
		}
		if defaultCred != nil {
			result[i].DefaultUsername = defaultCred.NickName
		}
	}

	return result, nil
}

// AddServer adds a new server
func (a *App) AddServer(name, url string) (*ServerInfo, error) {
	// Validate server name
	if err := a.config.ValidateServerName(name); err != nil {
		return nil, fmt.Errorf("invalid server name: the name must contain valid characters")
	}

	// Check for server name collision (sanitized names must be unique for directories/prefixes)
	conflictingName, err := a.config.CheckServerNameCollision(name, "")
	if err != nil {
		if errors.Is(err, astrum.ErrServerNameCollision) {
			return nil, fmt.Errorf("server name '%s' conflicts with existing server '%s' (both resolve to the same directory name)", name, conflictingName)
		}
		return nil, fmt.Errorf("failed to check server name: %w", err)
	}

	// Get existing servers to determine next order
	existingServers, err := a.config.GetServers()
	if err != nil {
		return nil, fmt.Errorf("failed to get existing servers: %w", err)
	}

	// Find the max order and add 1
	maxOrder := -1
	for _, srv := range existingServers {
		if srv.Order > maxOrder {
			maxOrder = srv.Order
		}
	}
	newOrder := maxOrder + 1

	server := model.Server{
		Name:  name,
		URL:   url,
		Order: newOrder,
	}

	if err := a.config.AddServer(server); err != nil {
		return nil, fmt.Errorf("failed to add server: %w", err)
	}

	logger.App.Info().Str("name", name).Str("url", url).Int("order", newOrder).Msg("Added server")

	return &ServerInfo{
		URL:            url,
		Name:           name,
		HasCredentials: false,
		IsConnected:    false,
		Order:          newOrder,
	}, nil
}

// UpdateServer updates an existing server
func (a *App) UpdateServer(oldURL, name, newURL string) error {
	// Validate server name
	if err := a.config.ValidateServerName(name); err != nil {
		return fmt.Errorf("invalid server name: the name must contain valid characters")
	}

	// Get the existing server
	server, err := a.config.GetServer(oldURL)
	if err != nil {
		return fmt.Errorf("failed to get server: %w", err)
	}
	if server == nil {
		return fmt.Errorf("server with URL %s not found", oldURL)
	}

	// Check if name is changing
	nameChanging := server.Name != name

	// Prevent renaming a connected server to avoid file conflicts
	if nameChanging {
		a.mu.RLock()
		conn := a.connections[oldURL]
		isConnected := conn != nil && conn.Connected
		a.mu.RUnlock()

		if isConnected {
			return fmt.Errorf("cannot rename a connected server - please disconnect first")
		}
	}

	// Check for server name collision if name is changing
	if nameChanging {
		conflictingName, err := a.config.CheckServerNameCollision(name, oldURL)
		if err != nil {
			if errors.Is(err, astrum.ErrServerNameCollision) {
				return fmt.Errorf("server name '%s' conflicts with existing server '%s' (both resolve to the same directory name)", name, conflictingName)
			}
			return fmt.Errorf("failed to check server name: %w", err)
		}

		// Rename server directory if it exists
		if err := a.renameServerDirectory(server.Name, name); err != nil {
			return fmt.Errorf("failed to rename server directory: %w", err)
		}

		// Rename wine prefix directory if it exists
		if err := a.renameWinePrefixDirectory(server.Name, name); err != nil {
			// Log warning but don't fail - wine prefix might not exist
			logger.App.Warn().Err(err).Msg("Failed to rename wine prefix directory")
		}
	}

	// If URL changed, we need to migrate credentials and remove old server
	if oldURL != newURL {
		// Migrate credentials to new URL in keyring
		for _, cred := range server.CredentialRefs {
			apiKey, err := a.config.GetCredential(oldURL, cred.NickName)
			if err == nil && apiKey != "" {
				// Save to new URL
				_ = a.config.CredentialStore().Set(newURL, cred.NickName, apiKey, cred.IsDefault)
				// Delete from old URL
				_ = a.config.CredentialStore().Delete(oldURL, cred.NickName)
			}
		}

		// Remove old server entry
		if err := a.config.RemoveServer(oldURL); err != nil {
			logger.App.Warn().Err(err).Msg("Failed to remove old server entry")
		}
	}

	// Update server metadata
	server.Name = name
	server.URL = newURL

	if err := a.config.AddServer(*server); err != nil {
		return fmt.Errorf("failed to update server: %w", err)
	}

	// If URL changed and we had a connection, update the maps
	if oldURL != newURL {
		a.mu.Lock()
		if client, ok := a.clients[oldURL]; ok {
			a.clients[newURL] = client
			delete(a.clients, oldURL)
		}
		if mgr, ok := a.authManagers[oldURL]; ok {
			a.authManagers[newURL] = mgr
			delete(a.authManagers, oldURL)
		}
		if mgr, ok := a.notificationManagers[oldURL]; ok {
			a.notificationManagers[newURL] = mgr
			delete(a.notificationManagers, oldURL)
		}
		if conn, ok := a.connections[oldURL]; ok {
			a.connections[newURL] = conn
			delete(a.connections, oldURL)
		}
		a.mu.Unlock()
	}

	logger.App.Info().Str("name", name).Str("url", newURL).Msg("Updated server")
	return nil
}

// RemoveServer removes a server
func (a *App) RemoveServer(url string) error {
	if err := a.config.RemoveServer(url); err != nil {
		return fmt.Errorf("failed to remove server: %w", err)
	}

	// Clean up connections
	a.mu.Lock()
	if mgr, ok := a.orderMonitors[url]; ok {
		mgr.Stop()
		delete(a.orderMonitors, url)
	}
	if mgr, ok := a.notificationManagers[url]; ok {
		mgr.Disconnect()
		delete(a.notificationManagers, url)
	}
	if mgr, ok := a.authManagers[url]; ok {
		mgr.Disconnect()
		delete(a.authManagers, url)
	}
	delete(a.clients, url)
	delete(a.connections, url)
	a.mu.Unlock()

	// Clean up file hashes for all sessions on this server (files are left on disk)
	if err := a.fileHashTracker.ForgetServer(url); err != nil {
		logger.App.Warn().
			Err(err).
			Str("serverURL", url).
			Msg("Failed to clean up file hashes after removing server")
	}

	logger.App.Info().Str("url", url).Msg("Removed server")
	return nil
}

// ReorderServers updates the order of servers
func (a *App) ReorderServers(serverOrders []ServerOrder) error {
	for _, so := range serverOrders {
		server, err := a.config.GetServer(so.URL)
		if err != nil {
			return fmt.Errorf("failed to get server %s: %w", so.URL, err)
		}
		if server == nil {
			continue // Server not found, skip
		}

		server.Order = so.Order
		if err := a.config.UpdateServer(*server); err != nil {
			return fmt.Errorf("failed to update server order for %s: %w", so.URL, err)
		}
	}

	logger.App.Info().Int("count", len(serverOrders)).Msg("Reordered servers")
	return nil
}

// renameServerDirectory renames the server directory when a server name changes.
// If the old directory doesn't exist, this is a no-op.
// If the new directory already exists, this returns an error.
func (a *App) renameServerDirectory(oldName, newName string) error {
	serversDir, err := a.config.GetServersDir()
	if err != nil {
		return fmt.Errorf("failed to get servers directory: %w", err)
	}

	if serversDir == "" {
		return fmt.Errorf("servers directory is not configured")
	}

	oldSanitized := a.config.SanitizeServerName(oldName)
	newSanitized := a.config.SanitizeServerName(newName)

	// If sanitized names are the same, no rename needed
	if oldSanitized == newSanitized {
		return nil
	}

	oldDir := filepath.Join(serversDir, oldSanitized)
	newDir := filepath.Join(serversDir, newSanitized)

	// Check if old directory exists
	if _, err := os.Stat(oldDir); os.IsNotExist(err) {
		return nil
	}

	// Check if new directory already exists
	if _, err := os.Stat(newDir); err == nil {
		return fmt.Errorf("target directory '%s' already exists", newDir)
	}

	// Rename the directory
	if err := os.Rename(oldDir, newDir); err != nil {
		return fmt.Errorf("failed to rename directory from '%s' to '%s': %w", oldDir, newDir, err)
	}

	logger.App.Info().
		Str("from", oldDir).
		Str("to", newDir).
		Msg("Renamed server directory")

	return nil
}

// renameWinePrefixDirectory renames the wine prefix directory when a server name changes.
// If the old directory doesn't exist, this is a no-op.
// If the new directory already exists, this returns an error.
func (a *App) renameWinePrefixDirectory(oldName, newName string) error {
	prefixesDir, err := a.config.GetWinePrefixesDir()
	if err != nil {
		return nil
	}

	if prefixesDir == "" {
		return nil
	}

	oldSanitized := a.config.SanitizeServerName(oldName)
	newSanitized := a.config.SanitizeServerName(newName)

	if oldSanitized == newSanitized {
		return nil
	}

	oldDir := filepath.Join(prefixesDir, oldSanitized)
	newDir := filepath.Join(prefixesDir, newSanitized)

	if _, err := os.Stat(oldDir); os.IsNotExist(err) {
		return nil
	}

	if _, err := os.Stat(newDir); err == nil {
		return fmt.Errorf("target wine prefix directory '%s' already exists", newDir)
	}

	if err := os.Rename(oldDir, newDir); err != nil {
		return fmt.Errorf("failed to rename wine prefix from '%s' to '%s': %w", oldDir, newDir, err)
	}

	logger.App.Info().
		Str("from", oldDir).
		Str("to", newDir).
		Msg("Renamed wine prefix directory")

	return nil
}
