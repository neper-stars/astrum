package lib

import (
	"encoding/json"
	"errors"
	"fmt"

	"github.com/zalando/go-keyring"
)

const (
	// KeyringService is the service name used in the system keyring
	KeyringService = "astrum"
)

// CredentialStore handles secure storage of credentials in the OS keychain
type CredentialStore struct {
	service string
}

// StoredCredential represents a credential stored in the keyring
type StoredCredential struct {
	APIKey    string `json:"api_key"`
	IsDefault bool   `json:"is_default,omitempty"`
}

// NewCredentialStore creates a new credential store
func NewCredentialStore() *CredentialStore {
	return &CredentialStore{
		service: KeyringService,
	}
}

// credentialKey generates a unique key for a server+username combination
func (cs *CredentialStore) credentialKey(serverURL, username string) string {
	return fmt.Sprintf("%s:%s", serverURL, username)
}

// Set stores a credential in the system keyring
func (cs *CredentialStore) Set(serverURL, username, apiKey string, isDefault bool) error {
	cred := StoredCredential{
		APIKey:    apiKey,
		IsDefault: isDefault,
	}

	data, err := json.Marshal(cred)
	if err != nil {
		return fmt.Errorf("failed to marshal credential: %w", err)
	}

	key := cs.credentialKey(serverURL, username)
	if err := keyring.Set(cs.service, key, string(data)); err != nil {
		return fmt.Errorf("failed to store credential in keyring: %w", err)
	}

	return nil
}

// Get retrieves a credential from the system keyring
func (cs *CredentialStore) Get(serverURL, username string) (*StoredCredential, error) {
	key := cs.credentialKey(serverURL, username)
	data, err := keyring.Get(cs.service, key)
	if err != nil {
		if errors.Is(err, keyring.ErrNotFound) {
			return nil, nil // Credential not found
		}
		return nil, fmt.Errorf("failed to get credential from keyring: %w", err)
	}

	var cred StoredCredential
	if err := json.Unmarshal([]byte(data), &cred); err != nil {
		return nil, fmt.Errorf("failed to unmarshal credential: %w", err)
	}

	return &cred, nil
}

// Delete removes a credential from the system keyring
func (cs *CredentialStore) Delete(serverURL, username string) error {
	key := cs.credentialKey(serverURL, username)
	if err := keyring.Delete(cs.service, key); err != nil {
		if errors.Is(err, keyring.ErrNotFound) {
			return nil // Already deleted
		}
		return fmt.Errorf("failed to delete credential from keyring: %w", err)
	}
	return nil
}

// DeleteAllForServer removes all credentials for a specific server
func (cs *CredentialStore) DeleteAllForServer(serverURL string, usernames []string) error {
	var lastErr error
	for _, username := range usernames {
		if err := cs.Delete(serverURL, username); err != nil {
			lastErr = err
		}
	}
	return lastErr
}

// GetAPIKey is a convenience method to get just the API key
func (cs *CredentialStore) GetAPIKey(serverURL, username string) (string, error) {
	cred, err := cs.Get(serverURL, username)
	if err != nil {
		return "", err
	}
	if cred == nil {
		return "", nil
	}
	return cred.APIKey, nil
}
