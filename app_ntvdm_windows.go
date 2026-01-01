//go:build windows

package main

import (
	"os"
	"path/filepath"
	"runtime"

	"golang.org/x/sys/windows/registry"
	"github.com/neper-stars/astrum/lib/logger"
)

// CheckNtvdmSupport checks if 16-bit application support is available on Windows.
// On 64-bit Windows, it checks for winevdm/otvdm (github.com/otya128/winevdm) in the registry.
// On 32-bit Windows, it checks for native NTVDM.
func (a *App) CheckNtvdmSupport() (*NtvdmCheckResult, error) {
	// Check if we're on 64-bit Windows
	is64Bit := runtime.GOARCH == "amd64"

	systemRoot := os.Getenv("SystemRoot")
	if systemRoot == "" {
		systemRoot = `C:\Windows`
	}

	if is64Bit {
		// 64-bit Windows cannot run 16-bit applications natively
		// Check for winevdm/otvdm in the registry
		// OTVDM registers at: HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\NtVdm64\0OTVDM
		otvdmFound, mappedExe := checkOtvdmRegistry()

		if otvdmFound {
			logger.App.Info().Str("mappedExe", mappedExe).Msg("OTVDM/winevdm found in registry")
			return &NtvdmCheckResult{
				Available: true,
				Is64Bit:   true,
				Message:   "OTVDM (winevdm) is installed. Stars! should run on this 64-bit Windows system.",
			}, nil
		}

		logger.App.Info().Msg("64-bit Windows detected - no 16-bit support found")
		return &NtvdmCheckResult{
			Available: false,
			Is64Bit:   true,
			Message:   "64-bit Windows cannot run 16-bit applications natively. Install OTVDM to enable Stars! support. Recent Windows versions require the nightly build: go to the link below, click 'Environment: THIS_BUILD_IS_RECOMMENDED__VCXPROJ_BUILD=1' then 'Artifacts' and download the zip file.",
			HelpURL:   "https://ci.appveyor.com/project/otya128/winevdm",
		}, nil
	}

	// On 32-bit Windows, check if NTVDM is available
	// NTVDM should be in System32
	ntvdmPath := filepath.Join(systemRoot, "System32", "ntvdm.exe")

	if _, err := os.Stat(ntvdmPath); err != nil {
		// NTVDM not found - might need to be enabled as a Windows feature
		logger.App.Info().Str("path", ntvdmPath).Msg("NTVDM not found")
		return &NtvdmCheckResult{
			Available: false,
			Is64Bit:   false,
			Message:   "NTVDM (16-bit support) is not installed. On Windows 10/11, go to Settings > Apps > Optional Features > Add a feature > NTVDM.",
		}, nil
	}

	logger.App.Info().Str("path", ntvdmPath).Msg("NTVDM found")
	return &NtvdmCheckResult{
		Available: true,
		Is64Bit:   false,
		Message:   "NTVDM is installed. Stars! should run natively on this 32-bit Windows system.",
	}, nil
}

// checkOtvdmRegistry checks if OTVDM is registered in the Windows registry.
// Returns (found, mappedExePath).
func checkOtvdmRegistry() (bool, string) {
	// Try the 64-bit registry view first
	key, err := registry.OpenKey(
		registry.LOCAL_MACHINE,
		`SOFTWARE\Microsoft\Windows NT\CurrentVersion\NtVdm64\0OTVDM`,
		registry.QUERY_VALUE,
	)
	if err == nil {
		defer key.Close()
		mappedExe, _, _ := key.GetStringValue("MappedExeName")
		return true, mappedExe
	}

	// Try the WOW6432Node (32-bit registry view on 64-bit Windows)
	key, err = registry.OpenKey(
		registry.LOCAL_MACHINE,
		`SOFTWARE\WOW6432Node\Microsoft\Windows NT\CurrentVersion\NtVdm64\0OTVDM`,
		registry.QUERY_VALUE,
	)
	if err == nil {
		defer key.Close()
		mappedExe, _, _ := key.GetStringValue("MappedExeName")
		return true, mappedExe
	}

	return false, ""
}
