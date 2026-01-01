//go:build !windows

package main

// CheckNtvdmSupport is a no-op on non-Windows platforms
// NTVDM is a Windows-only feature for running 16-bit applications
func (a *App) CheckNtvdmSupport() (*NtvdmCheckResult, error) {
	return &NtvdmCheckResult{
		Available: false,
		Is64Bit:   false,
		Message:   "NTVDM check is only applicable on Windows. Use Wine on this platform.",
	}, nil
}
