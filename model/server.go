package model

import (
	"time"
)

// CredentialRef is a reference to a credential stored in the keyring
// Only the username is stored in the database, the API key is in the keyring
type CredentialRef struct {
	NickName  string `json:"nickname"`
	IsDefault bool   `json:"is_default,omitempty"`
}

type CredentialRefs []CredentialRef

// Server represents a Neper server to which we will connect
// Credentials are stored separately in the system keyring
type Server struct {
	Name            string         `json:"name"`
	URL             string         `json:"url"`
	IconURL         string         `json:"icon_url,omitempty"`
	CredentialRefs  CredentialRefs `json:"credential_refs,omitempty"`
	LastConnected   time.Time      `json:"last_connected,omitempty"`
	DefaultCredName string         `json:"default_cred_name,omitempty"`
	Order           int            `json:"order"` // Display order in server bar (0-indexed)
}

type Servers []Server

// GetDefaultCredentialRef returns the default credential reference for a server
func (s *Server) GetDefaultCredentialRef() *CredentialRef {
	// If default cred name is set, find it
	if s.DefaultCredName != "" {
		for i := range s.CredentialRefs {
			if s.CredentialRefs[i].NickName == s.DefaultCredName {
				return &s.CredentialRefs[i]
			}
		}
	}

	// Otherwise, find first credential marked as default
	for i := range s.CredentialRefs {
		if s.CredentialRefs[i].IsDefault {
			return &s.CredentialRefs[i]
		}
	}

	// If no default found, return first credential if available
	if len(s.CredentialRefs) > 0 {
		return &s.CredentialRefs[0]
	}

	return nil
}

// AddOrUpdateCredentialRef adds a new credential reference or updates an existing one
// Sets it as the default credential
// Note: The actual API key should be stored separately in the keyring
func (s *Server) AddOrUpdateCredentialRef(nickname string) {
	// Check if credential already exists
	found := false
	for i := range s.CredentialRefs {
		if s.CredentialRefs[i].NickName == nickname {
			found = true
			break
		}
	}

	// Add new credential ref if not found
	if !found {
		s.CredentialRefs = append(s.CredentialRefs, CredentialRef{
			NickName: nickname,
		})
	}

	// Set as default
	s.DefaultCredName = nickname
}

// RemoveCredentialRef removes a credential reference by nickname
func (s *Server) RemoveCredentialRef(nickname string) {
	for i := range s.CredentialRefs {
		if s.CredentialRefs[i].NickName == nickname {
			s.CredentialRefs = append(s.CredentialRefs[:i], s.CredentialRefs[i+1:]...)
			break
		}
	}

	// If the removed credential was the default, clear default
	if s.DefaultCredName == nickname {
		s.DefaultCredName = ""
		// Set a new default if there are remaining credentials
		if len(s.CredentialRefs) > 0 {
			s.DefaultCredName = s.CredentialRefs[0].NickName
		}
	}
}

// GetCredentialUsernames returns a list of all credential usernames for this server
func (s *Server) GetCredentialUsernames() []string {
	usernames := make([]string, len(s.CredentialRefs))
	for i, ref := range s.CredentialRefs {
		usernames[i] = ref.NickName
	}
	return usernames
}

// HasCredential checks if a credential with the given nickname exists
func (s *Server) HasCredential(nickname string) bool {
	for _, ref := range s.CredentialRefs {
		if ref.NickName == nickname {
			return true
		}
	}
	return false
}
