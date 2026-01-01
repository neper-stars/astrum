package logger

import (
	"os"
	"time"

	"github.com/rs/zerolog"
)

// Pre-configured loggers for different components
var (
	// Logger is the base logger instance
	Logger *zerolog.Logger

	// Component-specific loggers
	API          *zerolog.Logger
	WebSocket    *zerolog.Logger
	App          *zerolog.Logger
	DB           *zerolog.Logger
	Auth         *zerolog.Logger
	Config       *zerolog.Logger
	Notification *zerolog.Logger
	Monitor      *zerolog.Logger
)

// Init initializes all loggers with console output
func Init(debug bool) {
	// Configure console writer for human-readable output
	output := zerolog.ConsoleWriter{
		Out:        os.Stderr,
		TimeFormat: time.RFC3339,
	}

	level := zerolog.InfoLevel
	if debug {
		level = zerolog.DebugLevel
	}

	// Create base logger
	baseLogger := zerolog.New(output).
		Level(level).
		With().
		Timestamp().
		Logger()
	Logger = &baseLogger

	// Create component-specific loggers (once, at startup)
	apiLogger := baseLogger.With().Str("component", "api").Logger()
	API = &apiLogger

	wsLogger := baseLogger.With().Str("component", "websocket").Logger()
	WebSocket = &wsLogger

	appLogger := baseLogger.With().Str("component", "app").Logger()
	App = &appLogger

	dbLogger := baseLogger.With().Str("component", "db").Logger()
	DB = &dbLogger

	authLogger := baseLogger.With().Str("component", "auth").Logger()
	Auth = &authLogger

	configLogger := baseLogger.With().Str("component", "config").Logger()
	Config = &configLogger

	notifLogger := baseLogger.With().Str("component", "notification").Logger()
	Notification = &notifLogger

	monitorLogger := baseLogger.With().Str("component", "monitor").Logger()
	Monitor = &monitorLogger
}
