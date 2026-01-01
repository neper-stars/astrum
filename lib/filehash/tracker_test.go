package filehash

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/neper-stars/astrum/database"
	"github.com/neper-stars/astrum/lib/logger"
)

func TestMain(m *testing.M) {
	// Initialize logger for tests
	logger.Init(false)
	os.Exit(m.Run())
}

func setupTestTracker(t *testing.T) (*Tracker, func()) {
	t.Helper()

	// Create a temporary directory for the test database
	tmpDir, err := os.MkdirTemp("", "filehash_test")
	require.NoError(t, err)

	// Open database
	db, err := database.Open(tmpDir)
	require.NoError(t, err)

	// Create tracker
	tracker, err := NewTracker(db)
	require.NoError(t, err)

	// Return cleanup function
	cleanup := func() {
		_ = db.Close()
		_ = os.RemoveAll(tmpDir)
	}

	return tracker, cleanup
}

func TestTracker_NewOrderNoStoredHash(t *testing.T) {
	tracker, cleanup := setupTestTracker(t)
	defer cleanup()

	serverURL := "https://test.server.com"
	sessionID := "session-123"
	orderKey := "order:2400"

	// No stored hash should return empty string
	storedHash := tracker.GetHash(serverURL, sessionID, orderKey)
	assert.Empty(t, storedHash, "New order should have no stored hash")
}

func TestTracker_OrderUploadedHashStored(t *testing.T) {
	tracker, cleanup := setupTestTracker(t)
	defer cleanup()

	serverURL := "https://test.server.com"
	sessionID := "session-123"
	orderKey := "order:2400"
	orderData := []byte("test order data for year 2400")
	orderHash := ComputeHash(orderData)

	// Store the hash after "upload"
	err := tracker.SetHash(serverURL, sessionID, orderKey, orderHash)
	require.NoError(t, err)

	// Verify hash is stored
	storedHash := tracker.GetHash(serverURL, sessionID, orderKey)
	assert.Equal(t, orderHash, storedHash, "Stored hash should match computed hash")
}

func TestTracker_SameOrderSameYearHashMatches(t *testing.T) {
	tracker, cleanup := setupTestTracker(t)
	defer cleanup()

	serverURL := "https://test.server.com"
	sessionID := "session-123"
	orderKey := "order:2400"
	orderData := []byte("test order data for year 2400")
	orderHash := ComputeHash(orderData)

	// Store the hash after "upload"
	err := tracker.SetHash(serverURL, sessionID, orderKey, orderHash)
	require.NoError(t, err)

	// Same data should produce same hash - this means "already uploaded, skip"
	newHash := ComputeHash(orderData)
	storedHash := tracker.GetHash(serverURL, sessionID, orderKey)

	assert.Equal(t, storedHash, newHash, "Same data should produce matching hash (skip upload)")
}

func TestTracker_ModifiedOrderSameYearConflict(t *testing.T) {
	tracker, cleanup := setupTestTracker(t)
	defer cleanup()

	serverURL := "https://test.server.com"
	sessionID := "session-123"
	orderKey := "order:2400"

	// Original order data
	originalData := []byte("original order data for year 2400")
	originalHash := ComputeHash(originalData)

	// Store the hash after "upload"
	err := tracker.SetHash(serverURL, sessionID, orderKey, originalHash)
	require.NoError(t, err)

	// Modified data for same year - this is a CONFLICT
	modifiedData := []byte("modified order data for year 2400")
	modifiedHash := ComputeHash(modifiedData)

	storedHash := tracker.GetHash(serverURL, sessionID, orderKey)

	// Stored hash exists but doesn't match - this indicates conflict
	assert.NotEmpty(t, storedHash, "Should have stored hash")
	assert.NotEqual(t, storedHash, modifiedHash, "Modified data should have different hash (conflict)")
}

func TestTracker_NewYearOrderNoConflict(t *testing.T) {
	tracker, cleanup := setupTestTracker(t)
	defer cleanup()

	serverURL := "https://test.server.com"
	sessionID := "session-123"

	// Upload order for year 2400
	orderKey2400 := "order:2400"
	orderData2400 := []byte("order data for year 2400")
	orderHash2400 := ComputeHash(orderData2400)

	err := tracker.SetHash(serverURL, sessionID, orderKey2400, orderHash2400)
	require.NoError(t, err)

	// Now check year 2401 - should have NO stored hash (new year = new order)
	orderKey2401 := "order:2401"
	storedHash2401 := tracker.GetHash(serverURL, sessionID, orderKey2401)

	assert.Empty(t, storedHash2401, "New year should have no stored hash (not a conflict)")

	// Even if the data is different, it's a new year so it's valid
	orderData2401 := []byte("different order data for year 2401")
	orderHash2401 := ComputeHash(orderData2401)

	// Store the new year's hash
	err = tracker.SetHash(serverURL, sessionID, orderKey2401, orderHash2401)
	require.NoError(t, err)

	// Both years should have their own hashes
	assert.Equal(t, orderHash2400, tracker.GetHash(serverURL, sessionID, orderKey2400))
	assert.Equal(t, orderHash2401, tracker.GetHash(serverURL, sessionID, orderKey2401))
}

func TestTracker_ForgetSessionClearsHashes(t *testing.T) {
	tracker, cleanup := setupTestTracker(t)
	defer cleanup()

	serverURL := "https://test.server.com"
	sessionID := "session-123"

	// Store hashes for multiple years
	err := tracker.SetHash(serverURL, sessionID, "order:2400", "hash2400")
	require.NoError(t, err)
	err = tracker.SetHash(serverURL, sessionID, "order:2401", "hash2401")
	require.NoError(t, err)

	// Verify they exist
	assert.NotEmpty(t, tracker.GetHash(serverURL, sessionID, "order:2400"))
	assert.NotEmpty(t, tracker.GetHash(serverURL, sessionID, "order:2401"))

	// Forget the session
	err = tracker.ForgetSession(serverURL, sessionID)
	require.NoError(t, err)

	// Verify they're gone
	assert.Empty(t, tracker.GetHash(serverURL, sessionID, "order:2400"))
	assert.Empty(t, tracker.GetHash(serverURL, sessionID, "order:2401"))
}

func TestTracker_ForgetServerClearsAllSessions(t *testing.T) {
	tracker, cleanup := setupTestTracker(t)
	defer cleanup()

	serverURL := "https://test.server.com"

	// Store hashes for multiple sessions
	err := tracker.SetHash(serverURL, "session-1", "order:2400", "hash1")
	require.NoError(t, err)
	err = tracker.SetHash(serverURL, "session-2", "order:2400", "hash2")
	require.NoError(t, err)

	// Verify they exist
	assert.NotEmpty(t, tracker.GetHash(serverURL, "session-1", "order:2400"))
	assert.NotEmpty(t, tracker.GetHash(serverURL, "session-2", "order:2400"))

	// Forget the server
	err = tracker.ForgetServer(serverURL)
	require.NoError(t, err)

	// Verify all sessions are cleared
	assert.Empty(t, tracker.GetHash(serverURL, "session-1", "order:2400"))
	assert.Empty(t, tracker.GetHash(serverURL, "session-2", "order:2400"))
}

func TestTracker_DifferentServersSeparateHashes(t *testing.T) {
	tracker, cleanup := setupTestTracker(t)
	defer cleanup()

	server1 := "https://server1.com"
	server2 := "https://server2.com"
	sessionID := "session-123"
	orderKey := "order:2400"

	// Store different hashes for same session on different servers
	err := tracker.SetHash(server1, sessionID, orderKey, "hash-server1")
	require.NoError(t, err)
	err = tracker.SetHash(server2, sessionID, orderKey, "hash-server2")
	require.NoError(t, err)

	// Each server should have its own hash
	assert.Equal(t, "hash-server1", tracker.GetHash(server1, sessionID, orderKey))
	assert.Equal(t, "hash-server2", tracker.GetHash(server2, sessionID, orderKey))
}

func TestTracker_PersistenceAcrossRestart(t *testing.T) {
	// Create a temporary directory for the test database
	tmpDir, err := os.MkdirTemp("", "filehash_persist_test")
	require.NoError(t, err)
	defer func() { _ = os.RemoveAll(tmpDir) }()

	serverURL := "https://test.server.com"
	sessionID := "session-123"
	orderKey := "order:2400"
	orderHash := "test-hash-for-persistence"

	// First "session" - store hash
	{
		db, err := database.Open(tmpDir)
		require.NoError(t, err)

		tracker, err := NewTracker(db)
		require.NoError(t, err)

		err = tracker.SetHash(serverURL, sessionID, orderKey, orderHash)
		require.NoError(t, err)

		_ = db.Close()
	}

	// Second "session" - verify hash persisted
	{
		db, err := database.Open(tmpDir)
		require.NoError(t, err)
		defer func() { _ = db.Close() }()

		tracker, err := NewTracker(db)
		require.NoError(t, err)

		storedHash := tracker.GetHash(serverURL, sessionID, orderKey)
		assert.Equal(t, orderHash, storedHash, "Hash should persist across tracker restart")
	}
}

func TestTracker_WriteFileIfChanged(t *testing.T) {
	tracker, cleanup := setupTestTracker(t)
	defer cleanup()

	// Create a temp file
	tmpDir, err := os.MkdirTemp("", "filehash_write_test")
	require.NoError(t, err)
	defer func() { _ = os.RemoveAll(tmpDir) }()

	serverURL := "https://test.server.com"
	sessionID := "session-123"
	filePath := filepath.Join(tmpDir, "test.xy")
	data := []byte("test file content")

	// First write - should write and return true
	written, err := tracker.WriteFileIfChanged(serverURL, sessionID, filePath, data, 0644)
	require.NoError(t, err)
	assert.True(t, written, "First write should actually write")

	// Verify file was written
	content, err := os.ReadFile(filePath)
	require.NoError(t, err)
	assert.Equal(t, data, content)

	// Second write with same data - should skip and return false
	written, err = tracker.WriteFileIfChanged(serverURL, sessionID, filePath, data, 0644)
	require.NoError(t, err)
	assert.False(t, written, "Second write with same data should skip")

	// Third write with different data - should write and return true
	newData := []byte("different content")
	written, err = tracker.WriteFileIfChanged(serverURL, sessionID, filePath, newData, 0644)
	require.NoError(t, err)
	assert.True(t, written, "Write with different data should actually write")

	// Verify new content
	content, err = os.ReadFile(filePath)
	require.NoError(t, err)
	assert.Equal(t, newData, content)
}

// TestOrderConflictDetectionLogic tests the exact logic used in createSubmitHandler
// to determine if an order should be uploaded, skipped, or is a conflict
func TestOrderConflictDetectionLogic(t *testing.T) {
	tracker, cleanup := setupTestTracker(t)
	defer cleanup()

	serverURL := "https://test.server.com"
	sessionID := "session-123"

	// Helper to simulate the submit handler logic
	type SubmitResult int
	const (
		ShouldUpload SubmitResult = iota
		ShouldSkip
		IsConflict
	)

	checkOrder := func(year int, data []byte) SubmitResult {
		currentHash := ComputeHash(data)
		orderKey := "order:" + string(rune('0'+year%10)) // simplified key
		storedHash := tracker.GetHash(serverURL, sessionID, orderKey)

		if storedHash != "" {
			if storedHash == currentHash {
				return ShouldSkip
			}
			return IsConflict
		}
		return ShouldUpload
	}

	storeOrder := func(year int, data []byte) {
		currentHash := ComputeHash(data)
		orderKey := "order:" + string(rune('0'+year%10))
		_ = tracker.SetHash(serverURL, sessionID, orderKey, currentHash)
	}

	// Test case 1: New order for year 2400 - should upload
	orderData2400 := []byte("order data year 2400")
	result := checkOrder(2400, orderData2400)
	assert.Equal(t, ShouldUpload, result, "New order should upload")

	// Simulate successful upload
	storeOrder(2400, orderData2400)

	// Test case 2: Same order again - should skip
	result = checkOrder(2400, orderData2400)
	assert.Equal(t, ShouldSkip, result, "Same order should skip")

	// Test case 3: Modified order same year - CONFLICT
	modifiedData2400 := []byte("MODIFIED order data year 2400")
	result = checkOrder(2400, modifiedData2400)
	assert.Equal(t, IsConflict, result, "Modified order same year should be conflict")

	// Test case 4: New year 2401 - should upload (not conflict)
	orderData2401 := []byte("order data year 2401")
	result = checkOrder(2401, orderData2401)
	assert.Equal(t, ShouldUpload, result, "New year order should upload, not conflict")

	// Simulate successful upload for year 2401
	storeOrder(2401, orderData2401)

	// Test case 5: Year 2400 still shows conflict (old hash still there)
	result = checkOrder(2400, modifiedData2400)
	assert.Equal(t, IsConflict, result, "Old year modified should still be conflict")

	// Test case 6: Year 2401 same data - should skip
	result = checkOrder(2401, orderData2401)
	assert.Equal(t, ShouldSkip, result, "Same order year 2401 should skip")
}
