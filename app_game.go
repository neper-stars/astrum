package main

import (
	"fmt"

	"github.com/neper-stars/astrum/api"
	"github.com/neper-stars/astrum/lib/logger"
)

// =============================================================================
// START GAME
// =============================================================================

// StartGame initializes the game for a session (generates first turn)
func (a *App) StartGame(serverURL, sessionID string) error {
	a.mu.RLock()
	client, ok := a.clients[serverURL]
	mgr, mgrOk := a.authManagers[serverURL]
	a.mu.RUnlock()

	if !ok || !mgrOk {
		return fmt.Errorf("not connected to server: %s", serverURL)
	}

	_, err := client.InitializeGame(mgr.GetContext(), sessionID)
	if err != nil {
		return fmt.Errorf("failed to start game: %w", err)
	}

	logger.App.Info().Str("sessionId", sessionID).Msg("Started game")
	return nil
}

// =============================================================================
// PLAYER REORDERING
// =============================================================================

// ReorderPlayers updates the player order in a session (manager only)
func (a *App) ReorderPlayers(serverURL, sessionID string, playerOrders []map[string]interface{}) error {
	a.mu.RLock()
	client, ok := a.clients[serverURL]
	mgr, mgrOk := a.authManagers[serverURL]
	a.mu.RUnlock()

	if !ok || !mgrOk {
		return fmt.Errorf("not connected to server: %s", serverURL)
	}

	// Convert from map to api.PlayerOrder
	orders := make([]api.PlayerOrder, len(playerOrders))
	for i, po := range playerOrders {
		userProfileID, _ := po["userProfileId"].(string)
		playerOrder, _ := po["playerOrder"].(float64)
		orders[i] = api.PlayerOrder{
			UserProfileID: userProfileID,
			PlayerOrder:   int64(playerOrder),
		}
		logger.App.Debug().
			Str("userProfileId", userProfileID).
			Int("playerOrder", int(playerOrder)).
			Msg("ReorderPlayers: player order entry")
	}

	logger.App.Debug().
		Str("sessionId", sessionID).
		Int("count", len(orders)).
		Msg("ReorderPlayers: calling API")

	updated, err := client.ReorderPlayers(mgr.GetContext(), sessionID, orders)
	if err != nil {
		return fmt.Errorf("failed to reorder players: %w", err)
	}

	logger.App.Info().
		Str("sessionId", sessionID).
		Int("updatedCount", len(updated)).
		Msg("Reordered players")
	return nil
}

// =============================================================================
// RULES
// =============================================================================

// convertRuleset converts API ruleset to frontend format
func convertRuleset(r *api.Ruleset) *RulesInfo {
	info := &RulesInfo{
		UniverseSize:                 int(r.UniverseSize),
		Density:                      int(r.Density),
		StartingDistance:             int(r.StartingDistance),
		MaximumMinerals:              r.MaximumMinerals,
		SlowerTechAdvances:           r.SlowerTechAdvances,
		AcceleratedBbsPlay:           r.AcceleratedBbsPlay,
		NoRandomEvents:               r.NoRandomEvents,
		ComputerPlayersFormAlliances: r.ComputerPlayersFormAlliances,
		PublicPlayerScores:           r.PublicPlayerScores,
		GalaxyClumping:               r.GalaxyClumping,
		VcOwnsPercentOfPlanets:       r.VcOwnsxPercentOfPlanets,
		VcAttainTechInFields:         r.VcAttainTechXInYField,
		VcExceedScoreOf:              r.VcExceedScoreOfx,
		VcExceedNextPlayerScoreBy:    r.VcExceedNextPlayerScoreByx,
		VcHasProductionCapacityOf:    r.VcHasProductionCapacityOfxThousand,
		VcOwnsCapitalShips:           r.VcOwnsxCapitalShips,
		VcHaveHighestScoreAfterYears: r.VcHaveHighestScoreAfterxYears,
		VcWinnerMustMeet:             int(r.VcWinnerMustMeetxOfTheAbove),
		VcMinYearsBeforeWinner:       int(r.VcAtLeastxYearsMustPassBeforeaWinnerIsDeclared),
	}

	// Handle random seed (0 means "no seed" in API)
	if r.RandomSeed != 0 {
		seed := int(r.RandomSeed)
		info.RandomSeed = &seed
	}

	// Handle victory condition values with defaults
	if r.VcOwnsxPercentOfPlanetsValue != 0 {
		info.VcOwnsPercentOfPlanetsValue = int(r.VcOwnsxPercentOfPlanetsValue)
	} else {
		info.VcOwnsPercentOfPlanetsValue = 60
	}
	if r.VcAttainTechXInYFieldTechValue != 0 {
		info.VcAttainTechInFieldsTechValue = int(r.VcAttainTechXInYFieldTechValue)
	} else {
		info.VcAttainTechInFieldsTechValue = 22
	}
	if r.VcAttainTechXInYFieldFieldsValue != 0 {
		info.VcAttainTechInFieldsFieldsValue = int(r.VcAttainTechXInYFieldFieldsValue)
	} else {
		info.VcAttainTechInFieldsFieldsValue = 4
	}
	if r.VcExceedScoreOfxValue != 0 {
		info.VcExceedScoreOfValue = int(r.VcExceedScoreOfxValue)
	} else {
		info.VcExceedScoreOfValue = 11000
	}
	if r.VcExceedNextPlayerScoreByxValue != 0 {
		info.VcExceedNextPlayerScoreByValue = int(r.VcExceedNextPlayerScoreByxValue)
	} else {
		info.VcExceedNextPlayerScoreByValue = 100
	}
	if r.VcHasProductionCapacityOfxThousandValue != 0 {
		info.VcHasProductionCapacityOfValue = int(r.VcHasProductionCapacityOfxThousandValue)
	} else {
		info.VcHasProductionCapacityOfValue = 100
	}
	if r.VcOwnsxCapitalShipsValue != 0 {
		info.VcOwnsCapitalShipsValue = int(r.VcOwnsxCapitalShipsValue)
	} else {
		info.VcOwnsCapitalShipsValue = 100
	}
	if r.VcHaveHighestScoreAfterxYearsValue != 0 {
		info.VcHaveHighestScoreAfterYearsValue = int(r.VcHaveHighestScoreAfterxYearsValue)
	} else {
		info.VcHaveHighestScoreAfterYearsValue = 100
	}

	return info
}

// convertRulesInfoToRuleset converts frontend format to API ruleset
func convertRulesInfoToRuleset(info *RulesInfo) *api.Ruleset {
	r := &api.Ruleset{
		UniverseSize:                                 int64(info.UniverseSize),
		Density:                                      int64(info.Density),
		StartingDistance:                             int64(info.StartingDistance),
		MaximumMinerals:                              info.MaximumMinerals,
		SlowerTechAdvances:                           info.SlowerTechAdvances,
		AcceleratedBbsPlay:                           info.AcceleratedBbsPlay,
		NoRandomEvents:                               info.NoRandomEvents,
		ComputerPlayersFormAlliances:                 info.ComputerPlayersFormAlliances,
		PublicPlayerScores:                           info.PublicPlayerScores,
		GalaxyClumping:                               info.GalaxyClumping,
		VcOwnsxPercentOfPlanets:                      info.VcOwnsPercentOfPlanets,
		VcAttainTechXInYField:                        info.VcAttainTechInFields,
		VcExceedScoreOfx:                             info.VcExceedScoreOf,
		VcExceedNextPlayerScoreByx:                   info.VcExceedNextPlayerScoreBy,
		VcHasProductionCapacityOfxThousand:           info.VcHasProductionCapacityOf,
		VcOwnsxCapitalShips:                          info.VcOwnsCapitalShips,
		VcHaveHighestScoreAfterxYears:                info.VcHaveHighestScoreAfterYears,
		VcWinnerMustMeetxOfTheAbove:                  int64(info.VcWinnerMustMeet),
		VcAtLeastxYearsMustPassBeforeaWinnerIsDeclared: int64(info.VcMinYearsBeforeWinner),
	}

	// Handle random seed
	if info.RandomSeed != nil {
		r.RandomSeed = int64(*info.RandomSeed)
	}

	// Set victory condition values
	r.VcOwnsxPercentOfPlanetsValue = int64(info.VcOwnsPercentOfPlanetsValue)
	r.VcAttainTechXInYFieldTechValue = int64(info.VcAttainTechInFieldsTechValue)
	r.VcAttainTechXInYFieldFieldsValue = int64(info.VcAttainTechInFieldsFieldsValue)
	r.VcExceedScoreOfxValue = int64(info.VcExceedScoreOfValue)
	r.VcExceedNextPlayerScoreByxValue = int64(info.VcExceedNextPlayerScoreByValue)
	r.VcHasProductionCapacityOfxThousandValue = int64(info.VcHasProductionCapacityOfValue)
	r.VcOwnsxCapitalShipsValue = int64(info.VcOwnsCapitalShipsValue)
	r.VcHaveHighestScoreAfterxYearsValue = int64(info.VcHaveHighestScoreAfterYearsValue)

	return r
}

// GetRules returns the ruleset for a session
func (a *App) GetRules(serverURL, sessionID string) (*RulesInfo, error) {
	a.mu.RLock()
	client, ok := a.clients[serverURL]
	mgr, mgrOk := a.authManagers[serverURL]
	a.mu.RUnlock()

	if !ok || !mgrOk {
		return nil, fmt.Errorf("not connected to server: %s", serverURL)
	}

	rules, err := client.GetRules(mgr.GetContext(), sessionID)
	if err != nil {
		return nil, fmt.Errorf("failed to get rules: %w", err)
	}

	return convertRuleset(rules), nil
}

// SetRules updates the ruleset for a session (manager only)
func (a *App) SetRules(serverURL, sessionID string, rulesInfo *RulesInfo) (*RulesInfo, error) {
	a.mu.RLock()
	client, ok := a.clients[serverURL]
	mgr, mgrOk := a.authManagers[serverURL]
	a.mu.RUnlock()

	if !ok || !mgrOk {
		return nil, fmt.Errorf("not connected to server: %s", serverURL)
	}

	ruleset := convertRulesInfoToRuleset(rulesInfo)
	updated, err := client.CreateRules(mgr.GetContext(), sessionID, ruleset)
	if err != nil {
		return nil, fmt.Errorf("failed to set rules: %w", err)
	}

	logger.App.Info().Str("sessionId", sessionID).Msg("Updated rules")

	return convertRuleset(updated), nil
}
