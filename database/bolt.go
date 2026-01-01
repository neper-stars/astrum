package database

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"time"

	bolt "go.etcd.io/bbolt"
	berrors "go.etcd.io/bbolt/errors"

	"github.com/neper-stars/astrum/lib/logger"
)

// ErrDatabaseLocked is returned when another instance already has the database open
var ErrDatabaseLocked = errors.New("database is locked by another instance")

// DB wraps a BBolt database
type DB struct {
	bolt *bolt.DB
}

// BucketServers is the bucket name for server metadata
const BucketServers = "servers"

// BucketAppSettings is the bucket name for global app settings
const BucketAppSettings = "app_settings"

// BucketFileHashes is the bucket name for tracking file hashes
const BucketFileHashes = "file_hashes"

// Open returns a BBolt database or an error
// It will initialize one if none is found in the config dir
// configPath should be the directory where the database file will be stored
func Open(configPath string) (*DB, error) {
	// Ensure config directory exists
	if err := os.MkdirAll(configPath, 0700); err != nil {
		return nil, fmt.Errorf("failed to create config directory: %w", err)
	}

	// Open BBolt database (single file)
	// Use a short timeout to quickly detect if another instance has the lock
	dbPath := filepath.Join(configPath, "astrum.db")
	boltDB, err := bolt.Open(dbPath, 0600, &bolt.Options{
		Timeout: 1 * time.Second,
	})
	if err != nil {
		// Check if this is a timeout error (database locked by another process)
		if errors.Is(err, berrors.ErrTimeout) {
			return nil, ErrDatabaseLocked
		}
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	db := &DB{bolt: boltDB}

	// Initialize buckets
	if err := db.initBuckets(); err != nil {
		if closeErr := boltDB.Close(); closeErr != nil {
			logger.DB.Warn().Err(closeErr).Msg("Failed to close database after init error")
		}
		return nil, fmt.Errorf("failed to initialize buckets: %w", err)
	}

	return db, nil
}

// initBuckets creates the required buckets if they don't exist
func (db *DB) initBuckets() error {
	return db.bolt.Update(func(tx *bolt.Tx) error {
		if _, err := tx.CreateBucketIfNotExists([]byte(BucketServers)); err != nil {
			return err
		}
		if _, err := tx.CreateBucketIfNotExists([]byte(BucketAppSettings)); err != nil {
			return err
		}
		if _, err := tx.CreateBucketIfNotExists([]byte(BucketFileHashes)); err != nil {
			return err
		}
		return nil
	})
}

// Close closes the database
func (db *DB) Close() error {
	return db.bolt.Close()
}

// Get retrieves a value by key from a bucket
func (db *DB) Get(bucket, key string) ([]byte, error) {
	var value []byte
	err := db.bolt.View(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte(bucket))
		if b == nil {
			return fmt.Errorf("bucket %s not found", bucket)
		}
		v := b.Get([]byte(key))
		if v != nil {
			// Copy the value since it's only valid within the transaction
			value = make([]byte, len(v))
			copy(value, v)
		}
		return nil
	})
	return value, err
}

// Set stores a value by key in a bucket
func (db *DB) Set(bucket, key string, value []byte) error {
	return db.bolt.Update(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte(bucket))
		if b == nil {
			return fmt.Errorf("bucket %s not found", bucket)
		}
		return b.Put([]byte(key), value)
	})
}

// Delete removes a key from a bucket
func (db *DB) Delete(bucket, key string) error {
	return db.bolt.Update(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte(bucket))
		if b == nil {
			return fmt.Errorf("bucket %s not found", bucket)
		}
		return b.Delete([]byte(key))
	})
}

// GetAll retrieves all key-value pairs from a bucket
func (db *DB) GetAll(bucket string) (map[string][]byte, error) {
	result := make(map[string][]byte)
	err := db.bolt.View(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte(bucket))
		if b == nil {
			return fmt.Errorf("bucket %s not found", bucket)
		}
		return b.ForEach(func(k, v []byte) error {
			// Copy key and value
			key := make([]byte, len(k))
			copy(key, k)
			value := make([]byte, len(v))
			copy(value, v)
			result[string(key)] = value
			return nil
		})
	})
	return result, err
}

// Keys returns all keys in a bucket
func (db *DB) Keys(bucket string) ([]string, error) {
	var keys []string
	err := db.bolt.View(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte(bucket))
		if b == nil {
			return fmt.Errorf("bucket %s not found", bucket)
		}
		return b.ForEach(func(k, v []byte) error {
			keys = append(keys, string(k))
			return nil
		})
	})
	return keys, err
}
