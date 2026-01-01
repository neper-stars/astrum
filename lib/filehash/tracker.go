package filehash

import (
	"crypto/sha256"
	"encoding/hex"
	"os"
	"strings"
	"sync"

	"github.com/neper-stars/astrum/database"
	"github.com/neper-stars/astrum/lib/logger"
)

// KeySeparator is used to separate serverURL, sessionID, and filePath in DB keys
const KeySeparator = "\x00"

// Tracker maintains SHA256 hashes of files to avoid unnecessary writes
// Hashes are persisted to the database for durability across app restarts
// Keys are structured as: serverURL + KeySeparator + sessionID + KeySeparator + filePath
type Tracker struct {
	mu     sync.RWMutex
	db     *database.DB
	hashes map[string]string // compositeKey -> sha256 hex string (in-memory cache)
}

// NewTracker creates a new file hash tracker with database persistence
func NewTracker(db *database.DB) (*Tracker, error) {
	t := &Tracker{
		db:     db,
		hashes: make(map[string]string),
	}

	// Load existing hashes from database
	if err := t.loadFromDB(); err != nil {
		return nil, err
	}

	return t, nil
}

// makeKey creates a composite key from serverURL, sessionID, and filePath
func makeKey(serverURL, sessionID, filePath string) string {
	return serverURL + KeySeparator + sessionID + KeySeparator + filePath
}

// parseKey extracts serverURL, sessionID, and filePath from a composite key
func parseKey(key string) (serverURL, sessionID, filePath string, ok bool) {
	parts := strings.SplitN(key, KeySeparator, 3)
	if len(parts) != 3 {
		return "", "", "", false
	}
	return parts[0], parts[1], parts[2], true
}

// loadFromDB loads all hashes from the database into memory
func (t *Tracker) loadFromDB() error {
	data, err := t.db.GetAll(database.BucketFileHashes)
	if err != nil {
		return err
	}

	t.mu.Lock()
	defer t.mu.Unlock()

	for key, hash := range data {
		t.hashes[key] = string(hash)
	}

	logger.App.Debug().
		Int("count", len(t.hashes)).
		Msg("Loaded file hashes from database")

	return nil
}

// ComputeHash calculates the SHA256 hash of data and returns it as hex string
func ComputeHash(data []byte) string {
	hash := sha256.Sum256(data)
	return hex.EncodeToString(hash[:])
}

// ComputeFileHash calculates the SHA256 hash of a file on disk
func ComputeFileHash(filePath string) (string, error) {
	data, err := os.ReadFile(filePath)
	if err != nil {
		return "", err
	}
	return ComputeHash(data), nil
}

// GetHash returns the stored hash for a file, or empty string if not tracked
func (t *Tracker) GetHash(serverURL, sessionID, filePath string) string {
	key := makeKey(serverURL, sessionID, filePath)
	t.mu.RLock()
	defer t.mu.RUnlock()
	return t.hashes[key]
}

// SetHash stores the hash for a file (in memory and database)
func (t *Tracker) SetHash(serverURL, sessionID, filePath, hash string) error {
	key := makeKey(serverURL, sessionID, filePath)

	t.mu.Lock()
	t.hashes[key] = hash
	t.mu.Unlock()

	// Persist to database
	if err := t.db.Set(database.BucketFileHashes, key, []byte(hash)); err != nil {
		logger.App.Error().
			Err(err).
			Str("serverURL", serverURL).
			Str("sessionID", sessionID).
			Str("path", filePath).
			Msg("Failed to persist file hash to database")
		return err
	}

	return nil
}

// HasChanged returns true if the data hash differs from the stored hash
// Also returns true if the file is not yet tracked
func (t *Tracker) HasChanged(serverURL, sessionID, filePath string, data []byte) bool {
	newHash := ComputeHash(data)
	storedHash := t.GetHash(serverURL, sessionID, filePath)
	return storedHash != newHash
}

// WriteFileIfChanged writes data to filePath only if the content has changed
// Returns (written bool, err error) where written indicates if file was written
func (t *Tracker) WriteFileIfChanged(serverURL, sessionID, filePath string, data []byte, perm os.FileMode) (bool, error) {
	newHash := ComputeHash(data)
	storedHash := t.GetHash(serverURL, sessionID, filePath)

	// Check if content is the same
	if storedHash == newHash {
		logger.App.Debug().
			Str("path", filePath).
			Str("hash", newHash[:16]+"...").
			Msg("File unchanged, skipping write")
		return false, nil
	}

	// Content changed or new file, write it
	if err := os.WriteFile(filePath, data, perm); err != nil {
		return false, err
	}

	// Update stored hash (persists to DB)
	if err := t.SetHash(serverURL, sessionID, filePath, newHash); err != nil {
		// Log but don't fail - file was written successfully
		logger.App.Warn().
			Err(err).
			Str("path", filePath).
			Msg("File written but hash persistence failed")
	}

	logger.App.Debug().
		Str("path", filePath).
		Str("hash", newHash[:16]+"...").
		Bool("wasTracked", storedHash != "").
		Msg("File written and hash updated")

	return true, nil
}

// ForgetFile removes the hash for a specific file
func (t *Tracker) ForgetFile(serverURL, sessionID, filePath string) error {
	key := makeKey(serverURL, sessionID, filePath)

	t.mu.Lock()
	delete(t.hashes, key)
	t.mu.Unlock()

	return t.db.Delete(database.BucketFileHashes, key)
}

// ForgetSession removes all hashes for a specific session
func (t *Tracker) ForgetSession(serverURL, sessionID string) error {
	prefix := serverURL + KeySeparator + sessionID + KeySeparator

	t.mu.Lock()
	var toDelete []string
	for key := range t.hashes {
		if strings.HasPrefix(key, prefix) {
			toDelete = append(toDelete, key)
		}
	}
	for _, key := range toDelete {
		delete(t.hashes, key)
	}
	t.mu.Unlock()

	// Delete from database
	for _, key := range toDelete {
		if err := t.db.Delete(database.BucketFileHashes, key); err != nil {
			logger.App.Warn().
				Err(err).
				Str("key", key).
				Msg("Failed to delete hash from database")
		}
	}

	logger.App.Debug().
		Str("serverURL", serverURL).
		Str("sessionID", sessionID).
		Int("deleted", len(toDelete)).
		Msg("Forgot session file hashes")

	return nil
}

// ForgetServer removes all hashes for a specific server
func (t *Tracker) ForgetServer(serverURL string) error {
	prefix := serverURL + KeySeparator

	t.mu.Lock()
	var toDelete []string
	for key := range t.hashes {
		if strings.HasPrefix(key, prefix) {
			toDelete = append(toDelete, key)
		}
	}
	for _, key := range toDelete {
		delete(t.hashes, key)
	}
	t.mu.Unlock()

	// Delete from database
	for _, key := range toDelete {
		if err := t.db.Delete(database.BucketFileHashes, key); err != nil {
			logger.App.Warn().
				Err(err).
				Str("key", key).
				Msg("Failed to delete hash from database")
		}
	}

	logger.App.Debug().
		Str("serverURL", serverURL).
		Int("deleted", len(toDelete)).
		Msg("Forgot server file hashes")

	return nil
}

// Clear removes all tracked hashes
func (t *Tracker) Clear() error {
	t.mu.Lock()
	keys := make([]string, 0, len(t.hashes))
	for key := range t.hashes {
		keys = append(keys, key)
	}
	t.hashes = make(map[string]string)
	t.mu.Unlock()

	// Delete all from database
	for _, key := range keys {
		if err := t.db.Delete(database.BucketFileHashes, key); err != nil {
			logger.App.Warn().
				Err(err).
				Str("key", key).
				Msg("Failed to delete hash from database")
		}
	}

	return nil
}

// TrackedCount returns the number of tracked files
func (t *Tracker) TrackedCount() int {
	t.mu.RLock()
	defer t.mu.RUnlock()
	return len(t.hashes)
}

// FileInfo holds information about a tracked file
type FileInfo struct {
	ServerURL string
	SessionID string
	FilePath  string
	Hash      string
}

// GetAllFiles returns info about all tracked files
func (t *Tracker) GetAllFiles() []FileInfo {
	t.mu.RLock()
	defer t.mu.RUnlock()

	result := make([]FileInfo, 0, len(t.hashes))
	for key, hash := range t.hashes {
		serverURL, sessionID, filePath, ok := parseKey(key)
		if !ok {
			continue
		}
		result = append(result, FileInfo{
			ServerURL: serverURL,
			SessionID: sessionID,
			FilePath:  filePath,
			Hash:      hash,
		})
	}
	return result
}

// GetSessionFiles returns all tracked files for a specific session
func (t *Tracker) GetSessionFiles(serverURL, sessionID string) []FileInfo {
	prefix := serverURL + KeySeparator + sessionID + KeySeparator

	t.mu.RLock()
	defer t.mu.RUnlock()

	var result []FileInfo
	for key, hash := range t.hashes {
		if strings.HasPrefix(key, prefix) {
			_, _, filePath, ok := parseKey(key)
			if !ok {
				continue
			}
			result = append(result, FileInfo{
				ServerURL: serverURL,
				SessionID: sessionID,
				FilePath:  filePath,
				Hash:      hash,
			})
		}
	}
	return result
}

// GetServerFiles returns all tracked files for a specific server
func (t *Tracker) GetServerFiles(serverURL string) []FileInfo {
	prefix := serverURL + KeySeparator

	t.mu.RLock()
	defer t.mu.RUnlock()

	var result []FileInfo
	for key, hash := range t.hashes {
		if strings.HasPrefix(key, prefix) {
			srvURL, sessionID, filePath, ok := parseKey(key)
			if !ok {
				continue
			}
			result = append(result, FileInfo{
				ServerURL: srvURL,
				SessionID: sessionID,
				FilePath:  filePath,
				Hash:      hash,
			})
		}
	}
	return result
}

// SyncFileHash reads a file from disk and updates the stored hash
// Returns the hash and whether the file existed
func (t *Tracker) SyncFileHash(serverURL, sessionID, filePath string) (string, bool, error) {
	hash, err := ComputeFileHash(filePath)
	if err != nil {
		if os.IsNotExist(err) {
			// File doesn't exist, remove from tracker if present
			_ = t.ForgetFile(serverURL, sessionID, filePath)
			return "", false, nil
		}
		return "", false, err
	}

	if err := t.SetHash(serverURL, sessionID, filePath, hash); err != nil {
		return hash, true, err
	}

	return hash, true, nil
}
