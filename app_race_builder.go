package main

import (
	"encoding/base64"
	"fmt"

	hs "github.com/neper-stars/houston"
	"github.com/neper-stars/houston/blocks"
	"github.com/neper-stars/houston/data"
	"github.com/neper-stars/houston/race"
	"github.com/neper-stars/houston/store"

	"github.com/neper-stars/astrum/lib/logger"
)

// =============================================================================
// RACE BUILDER TYPES
// =============================================================================

// RaceConfig is the JSON-encodable race configuration from Elm
type RaceConfig struct {
	// Identity
	SingularName string `json:"singularName"`
	PluralName   string `json:"pluralName"`
	Password     string `json:"password"`
	Icon         int    `json:"icon"`

	// Traits
	PRT int   `json:"prt"`
	LRT []int `json:"lrt"` // List of LRT indices (0-13)

	// Habitability
	GravityCenter     int  `json:"gravityCenter"`
	GravityWidth      int  `json:"gravityWidth"`
	GravityImmune     bool `json:"gravityImmune"`
	TemperatureCenter int  `json:"temperatureCenter"`
	TemperatureWidth  int  `json:"temperatureWidth"`
	TemperatureImmune bool `json:"temperatureImmune"`
	RadiationCenter   int  `json:"radiationCenter"`
	RadiationWidth    int  `json:"radiationWidth"`
	RadiationImmune   bool `json:"radiationImmune"`

	// Growth
	GrowthRate int `json:"growthRate"`

	// Economy
	ColonistsPerResource int  `json:"colonistsPerResource"`
	FactoryOutput        int  `json:"factoryOutput"`
	FactoryCost          int  `json:"factoryCost"`
	FactoryCount         int  `json:"factoryCount"`
	FactoriesUseLessGerm bool `json:"factoriesUseLessGerm"`
	MineOutput           int  `json:"mineOutput"`
	MineCost             int  `json:"mineCost"`
	MineCount            int  `json:"mineCount"`

	// Research
	ResearchEnergy       int  `json:"researchEnergy"`
	ResearchWeapons      int  `json:"researchWeapons"`
	ResearchPropulsion   int  `json:"researchPropulsion"`
	ResearchConstruction int  `json:"researchConstruction"`
	ResearchElectronics  int  `json:"researchElectronics"`
	ResearchBiotech      int  `json:"researchBiotech"`
	TechsStartHigh       bool `json:"techsStartHigh"`

	// Leftover points
	LeftoverPointsOn int `json:"leftoverPointsOn"`
}

// ValidationErrorInfo for JSON encoding
type ValidationErrorInfo struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}

// HabitabilityDisplayInfo contains display strings for habitability values
type HabitabilityDisplayInfo struct {
	// Gravity display values
	GravityMin    string `json:"gravityMin"`    // e.g., "0.23g"
	GravityMax    string `json:"gravityMax"`    // e.g., "4.26g"
	GravityRange  string `json:"gravityRange"`  // e.g., "0.23g to 4.26g" or "Immune"
	GravityImmune bool   `json:"gravityImmune"`

	// Temperature display values
	TemperatureMin    string `json:"temperatureMin"`    // e.g., "-140°C"
	TemperatureMax    string `json:"temperatureMax"`    // e.g., "140°C"
	TemperatureRange  string `json:"temperatureRange"`  // e.g., "-140°C to 140°C" or "Immune"
	TemperatureImmune bool   `json:"temperatureImmune"`

	// Radiation display values
	RadiationMin    string `json:"radiationMin"`    // e.g., "15mR"
	RadiationMax    string `json:"radiationMax"`    // e.g., "85mR"
	RadiationRange  string `json:"radiationRange"`  // e.g., "15mR to 85mR" or "Immune"
	RadiationImmune bool   `json:"radiationImmune"`
}

// PRTInfo contains information about a Primary Racial Trait
type PRTInfo struct {
	Index     int    `json:"index"`
	Code      string `json:"code"`
	Name      string `json:"name"`
	Desc      string `json:"desc"`
	PointCost int    `json:"pointCost"`
}

// LRTInfo contains information about a Lesser Racial Trait
type LRTInfo struct {
	Index     int    `json:"index"`
	Code      string `json:"code"`
	Name      string `json:"name"`
	Desc      string `json:"desc"`
	PointCost int    `json:"pointCost"`
}

// RaceValidationResult is returned from validation
type RaceValidationResult struct {
	Points       int                     `json:"points"`
	IsValid      bool                    `json:"isValid"`
	Errors       []ValidationErrorInfo   `json:"errors"`
	Warnings     []string                `json:"warnings"`
	Habitability HabitabilityDisplayInfo `json:"habitability"`
	PRTInfos     []PRTInfo               `json:"prtInfos"`     // Info about all PRTs
	LRTInfos     []LRTInfo               `json:"lrtInfos"`     // Info about all LRTs
}

// =============================================================================
// RACE BUILDER FUNCTIONS
// =============================================================================

// ValidateRaceConfig validates a race configuration and returns points/errors
func (a *App) ValidateRaceConfig(config RaceConfig) RaceValidationResult {
	builder := race.New()

	// Apply all config to builder
	applyConfigToBuilder(builder, config)

	result := builder.Get()

	// Convert errors
	errors := make([]ValidationErrorInfo, len(result.Errors))
	for i, err := range result.Errors {
		errors[i] = ValidationErrorInfo{
			Field:   err.Field,
			Message: err.Message,
		}
	}

	// Ensure warnings is never nil
	warnings := result.Warnings
	if warnings == nil {
		warnings = []string{}
	}

	// Calculate habitability display info using Houston helpers
	habDisplay := buildHabitabilityDisplay(config)

	// Get all PRT and LRT infos from Houston data
	prtInfos := getAllPRTInfos()
	lrtInfos := getAllLRTInfos()

	return RaceValidationResult{
		Points:       result.Points,
		IsValid:      result.IsValid,
		Errors:       errors,
		Warnings:     warnings,
		Habitability: habDisplay,
		PRTInfos:     prtInfos,
		LRTInfos:     lrtInfos,
	}
}

// GetRaceTemplate returns a predefined race template configuration
func (a *App) GetRaceTemplate(templateName string) (RaceConfig, error) {
	var r *race.Race

	switch templateName {
	case "humanoid":
		r = race.Humanoid()
	case "rabbitoid":
		r = race.Rabbitoid()
	case "insectoid":
		r = race.Insectoid()
	case "nucleotid":
		r = race.Nucleotid()
	case "silicanoid":
		r = race.Silicanoid()
	case "antetheral":
		r = race.Antetheral()
	case "random":
		r = race.Random()
	default:
		return RaceConfig{}, fmt.Errorf("unknown template: %s", templateName)
	}

	return raceToConfig(r), nil
}

// LoadRaceFileConfig downloads a race file and parses it into RaceConfig.
// This allows viewing and copying existing races.
func (a *App) LoadRaceFileConfig(serverURL, raceID string) (RaceConfig, error) {
	// Download the race file (returns base64 encoded data)
	raceData, err := a.DownloadRace(serverURL, raceID)
	if err != nil {
		return RaceConfig{}, fmt.Errorf("failed to download race: %w", err)
	}

	// Decode base64
	rawData, err := base64.StdEncoding.DecodeString(raceData)
	if err != nil {
		return RaceConfig{}, fmt.Errorf("failed to decode race data: %w", err)
	}

	// Parse the race file using Houston
	fd := hs.FileData(rawData)
	blockList, err := fd.BlockList()
	if err != nil {
		return RaceConfig{}, fmt.Errorf("failed to parse race file: %w", err)
	}

	// Find the PlayerBlock
	var pb *hs.PlayerBlock
	for _, b := range blockList {
		if b.BlockTypeID() == hs.PlayerBlockType {
			playerBlock, ok := b.(hs.PlayerBlock)
			if ok && playerBlock.Valid {
				pb = &playerBlock
				break
			}
		}
	}

	if pb == nil {
		return RaceConfig{}, fmt.Errorf("no valid player block found in race file")
	}

	// Convert PlayerBlock to RaceConfig
	return playerBlockToConfig(pb), nil
}

// playerBlockToConfig converts a Houston PlayerBlock to RaceConfig
func playerBlockToConfig(pb *hs.PlayerBlock) RaceConfig {
	// Convert LRT bitmask to list of indices
	var lrtList []int
	for i := 0; i < 14; i++ {
		if pb.LRT&(1<<i) != 0 {
			lrtList = append(lrtList, i)
		}
	}
	if lrtList == nil {
		lrtList = []int{}
	}

	// Calculate center and width from low/high values
	// Center = (low + high) / 2, Width = (high - low) / 2
	gravityCenter := (pb.Hab.GravityLow + pb.Hab.GravityHigh) / 2
	gravityWidth := (pb.Hab.GravityHigh - pb.Hab.GravityLow) / 2
	tempCenter := (pb.Hab.TemperatureLow + pb.Hab.TemperatureHigh) / 2
	tempWidth := (pb.Hab.TemperatureHigh - pb.Hab.TemperatureLow) / 2
	radCenter := (pb.Hab.RadiationLow + pb.Hab.RadiationHigh) / 2
	radWidth := (pb.Hab.RadiationHigh - pb.Hab.RadiationLow) / 2

	return RaceConfig{
		SingularName: pb.NameSingular,
		PluralName:   pb.NamePlural,
		Password:     "", // Password is hashed, can't recover it
		Icon:         pb.Logo,

		PRT: pb.PRT,
		LRT: lrtList,

		GravityCenter:     gravityCenter,
		GravityWidth:      gravityWidth,
		GravityImmune:     pb.Hab.IsGravityImmune(),
		TemperatureCenter: tempCenter,
		TemperatureWidth:  tempWidth,
		TemperatureImmune: pb.Hab.IsTemperatureImmune(),
		RadiationCenter:   radCenter,
		RadiationWidth:    radWidth,
		RadiationImmune:   pb.Hab.IsRadiationImmune(),

		GrowthRate: pb.GrowthRate,

		ColonistsPerResource: pb.Production.ResourcePerColonist * 100, // Convert back to 700-2500 scale
		FactoryOutput:        pb.Production.FactoryProduction,
		FactoryCost:          pb.Production.FactoryCost,
		FactoryCount:         pb.Production.FactoriesOperate,
		FactoriesUseLessGerm: pb.FactoriesCost1LessGerm,
		MineOutput:           pb.Production.MineProduction,
		MineCost:             pb.Production.MineCost,
		MineCount:            pb.Production.MinesOperate,

		ResearchEnergy:       pb.ResearchCost.Energy,
		ResearchWeapons:      pb.ResearchCost.Weapons,
		ResearchPropulsion:   pb.ResearchCost.Propulsion,
		ResearchConstruction: pb.ResearchCost.Construction,
		ResearchElectronics:  pb.ResearchCost.Electronics,
		ResearchBiotech:      pb.ResearchCost.Biotech,
		TechsStartHigh:       pb.ExpensiveTechStartsAt3,

		LeftoverPointsOn: pb.SpendLeftoverPoints,
	}
}

// BuildAndSaveRace creates a race file and uploads it to the server.
// If sessionId is provided, also sets it as the player's race for that session.
func (a *App) BuildAndSaveRace(serverURL string, config RaceConfig, sessionID string) (*RaceInfo, error) {
	// Validate first
	result := a.ValidateRaceConfig(config)
	if !result.IsValid {
		if len(result.Errors) > 0 {
			return nil, fmt.Errorf("validation failed: %s", result.Errors[0].Message)
		}
		return nil, fmt.Errorf("race has negative advantage points")
	}

	// Build the houston Race from config
	r := configToRace(config)

	// Create race file bytes
	raceBytes, err := store.CreateRaceFile(r, 1)
	if err != nil {
		return nil, fmt.Errorf("failed to create race file: %w", err)
	}

	// Upload to server
	raceData := base64.StdEncoding.EncodeToString(raceBytes)
	raceInfo, err := a.UploadRace(serverURL, raceData)
	if err != nil {
		return nil, err
	}

	logger.App.Info().
		Str("name", raceInfo.NameSingular).
		Str("id", raceInfo.ID).
		Msg("Created race via builder")

	// If sessionID provided, set as session race
	if sessionID != "" {
		if err := a.SetSessionRace(serverURL, sessionID, raceInfo.ID); err != nil {
			return nil, fmt.Errorf("race created but failed to set for session: %w", err)
		}
	}

	return raceInfo, nil
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

// applyConfigToBuilder applies all configuration values to a builder
func applyConfigToBuilder(builder *race.Builder, config RaceConfig) {
	// Identity
	builder.Name(config.SingularName, config.PluralName)
	builder.Password(config.Password)
	builder.Icon(config.Icon)

	// Traits
	builder.PRT(config.PRT)

	// Convert LRT list to bitmask
	var lrtMask uint16
	for _, lrt := range config.LRT {
		if lrt >= 0 && lrt < 14 {
			lrtMask |= (1 << lrt)
		}
	}
	builder.SetLRTs(lrtMask)

	// Habitability
	builder.GravityImmune(config.GravityImmune)
	builder.GravityCenter(config.GravityCenter)
	builder.GravityWidth(config.GravityWidth)
	builder.TemperatureImmune(config.TemperatureImmune)
	builder.TemperatureCenter(config.TemperatureCenter)
	builder.TemperatureWidth(config.TemperatureWidth)
	builder.RadiationImmune(config.RadiationImmune)
	builder.RadiationCenter(config.RadiationCenter)
	builder.RadiationWidth(config.RadiationWidth)

	// Growth
	builder.GrowthRate(config.GrowthRate)

	// Economy
	builder.ColonistsPerResource(config.ColonistsPerResource)
	builder.FactoryOutput(config.FactoryOutput)
	builder.FactoryCost(config.FactoryCost)
	builder.FactoryCount(config.FactoryCount)
	builder.FactoriesUseLessGerm(config.FactoriesUseLessGerm)
	builder.MineOutput(config.MineOutput)
	builder.MineCost(config.MineCost)
	builder.MineCount(config.MineCount)

	// Research
	builder.ResearchEnergy(config.ResearchEnergy)
	builder.ResearchWeapons(config.ResearchWeapons)
	builder.ResearchPropulsion(config.ResearchPropulsion)
	builder.ResearchConstruction(config.ResearchConstruction)
	builder.ResearchElectronics(config.ResearchElectronics)
	builder.ResearchBiotech(config.ResearchBiotech)
	builder.TechsStartHigh(config.TechsStartHigh)

	// Leftover points
	builder.LeftoverPointsOn(race.LeftoverPointsOption(config.LeftoverPointsOn))
}

// raceToConfig converts a houston Race to RaceConfig
func raceToConfig(r *race.Race) RaceConfig {
	// Convert LRT bitmask to list of indices
	var lrtList []int
	for i := 0; i < 14; i++ {
		if r.LRT&(1<<i) != 0 {
			lrtList = append(lrtList, i)
		}
	}
	if lrtList == nil {
		lrtList = []int{}
	}

	return RaceConfig{
		SingularName: r.SingularName,
		PluralName:   r.PluralName,
		Password:     r.Password,
		Icon:         r.Icon,

		PRT: r.PRT,
		LRT: lrtList,

		GravityCenter:     r.GravityCenter,
		GravityWidth:      r.GravityWidth,
		GravityImmune:     r.GravityImmune,
		TemperatureCenter: r.TemperatureCenter,
		TemperatureWidth:  r.TemperatureWidth,
		TemperatureImmune: r.TemperatureImmune,
		RadiationCenter:   r.RadiationCenter,
		RadiationWidth:    r.RadiationWidth,
		RadiationImmune:   r.RadiationImmune,

		GrowthRate: r.GrowthRate,

		ColonistsPerResource: r.ColonistsPerResource,
		FactoryOutput:        r.FactoryOutput,
		FactoryCost:          r.FactoryCost,
		FactoryCount:         r.FactoryCount,
		FactoriesUseLessGerm: r.FactoriesUseLessGerm,
		MineOutput:           r.MineOutput,
		MineCost:             r.MineCost,
		MineCount:            r.MineCount,

		ResearchEnergy:       r.ResearchEnergy,
		ResearchWeapons:      r.ResearchWeapons,
		ResearchPropulsion:   r.ResearchPropulsion,
		ResearchConstruction: r.ResearchConstruction,
		ResearchElectronics:  r.ResearchElectronics,
		ResearchBiotech:      r.ResearchBiotech,
		TechsStartHigh:       r.TechsStartHigh,

		LeftoverPointsOn: int(r.LeftoverPointsOn),
	}
}

// configToRace converts RaceConfig to houston Race
func configToRace(config RaceConfig) *race.Race {
	var lrtMask uint16
	for _, lrt := range config.LRT {
		if lrt >= 0 && lrt < 14 {
			lrtMask |= (1 << lrt)
		}
	}

	return &race.Race{
		SingularName: config.SingularName,
		PluralName:   config.PluralName,
		Password:     config.Password,
		Icon:         config.Icon,

		PRT: config.PRT,
		LRT: lrtMask,

		GravityCenter:     config.GravityCenter,
		GravityWidth:      config.GravityWidth,
		GravityImmune:     config.GravityImmune,
		TemperatureCenter: config.TemperatureCenter,
		TemperatureWidth:  config.TemperatureWidth,
		TemperatureImmune: config.TemperatureImmune,
		RadiationCenter:   config.RadiationCenter,
		RadiationWidth:    config.RadiationWidth,
		RadiationImmune:   config.RadiationImmune,

		GrowthRate: config.GrowthRate,

		ColonistsPerResource: config.ColonistsPerResource,
		FactoryOutput:        config.FactoryOutput,
		FactoryCost:          config.FactoryCost,
		FactoryCount:         config.FactoryCount,
		FactoriesUseLessGerm: config.FactoriesUseLessGerm,
		MineOutput:           config.MineOutput,
		MineCost:             config.MineCost,
		MineCount:            config.MineCount,

		ResearchEnergy:       config.ResearchEnergy,
		ResearchWeapons:      config.ResearchWeapons,
		ResearchPropulsion:   config.ResearchPropulsion,
		ResearchConstruction: config.ResearchConstruction,
		ResearchElectronics:  config.ResearchElectronics,
		ResearchBiotech:      config.ResearchBiotech,
		TechsStartHigh:       config.TechsStartHigh,

		LeftoverPointsOn: race.LeftoverPointsOption(config.LeftoverPointsOn),
	}
}

// buildHabitabilityDisplay creates habitability display info from race config
func buildHabitabilityDisplay(config RaceConfig) HabitabilityDisplayInfo {
	// Convert center+width to low/high for blocks.Habitability
	// Low = center - width, High = center + width
	gravLow := config.GravityCenter - config.GravityWidth
	gravHigh := config.GravityCenter + config.GravityWidth
	tempLow := config.TemperatureCenter - config.TemperatureWidth
	tempHigh := config.TemperatureCenter + config.TemperatureWidth
	radLow := config.RadiationCenter - config.RadiationWidth
	radHigh := config.RadiationCenter + config.RadiationWidth

	// Clamp to valid range 0-100
	gravLow = clamp(gravLow, 0, 100)
	gravHigh = clamp(gravHigh, 0, 100)
	tempLow = clamp(tempLow, 0, 100)
	tempHigh = clamp(tempHigh, 0, 100)
	radLow = clamp(radLow, 0, 100)
	radHigh = clamp(radHigh, 0, 100)

	// Build the blocks.Habitability struct for range string methods
	// Note: The Habitability struct uses Center=255 to indicate immune
	hab := &blocks.Habitability{
		GravityLow:        gravLow,
		GravityCenter:     config.GravityCenter,
		GravityHigh:       gravHigh,
		TemperatureLow:    tempLow,
		TemperatureCenter: config.TemperatureCenter,
		TemperatureHigh:   tempHigh,
		RadiationLow:      radLow,
		RadiationCenter:   config.RadiationCenter,
		RadiationHigh:     radHigh,
	}

	// Set immune flags via center=255 convention
	if config.GravityImmune {
		hab.GravityCenter = 255
	}
	if config.TemperatureImmune {
		hab.TemperatureCenter = 255
	}
	if config.RadiationImmune {
		hab.RadiationCenter = 255
	}

	return HabitabilityDisplayInfo{
		GravityMin:        blocks.GravityDisplayString(gravLow),
		GravityMax:        blocks.GravityDisplayString(gravHigh),
		GravityRange:      hab.GravityRangeString(),
		GravityImmune:     config.GravityImmune,
		TemperatureMin:    blocks.TemperatureDisplayString(tempLow),
		TemperatureMax:    blocks.TemperatureDisplayString(tempHigh),
		TemperatureRange:  hab.TemperatureRangeString(),
		TemperatureImmune: config.TemperatureImmune,
		RadiationMin:      blocks.RadiationDisplayString(radLow),
		RadiationMax:      blocks.RadiationDisplayString(radHigh),
		RadiationRange:    hab.RadiationRangeString(),
		RadiationImmune:   config.RadiationImmune,
	}
}

// clamp restricts a value to a given range
func clamp(val, min, max int) int {
	if val < min {
		return min
	}
	if val > max {
		return max
	}
	return val
}

// getAllPRTInfos returns info about all PRTs from Houston data
func getAllPRTInfos() []PRTInfo {
	infos := make([]PRTInfo, len(data.AllPRTs))
	for i, prt := range data.AllPRTs {
		infos[i] = PRTInfo{
			Index:     prt.Index,
			Code:      prt.Code,
			Name:      prt.Name,
			Desc:      prt.Desc,
			PointCost: prt.PointCost,
		}
	}
	return infos
}

// getAllLRTInfos returns info about all LRTs from Houston data
func getAllLRTInfos() []LRTInfo {
	infos := make([]LRTInfo, len(data.AllLRTs))
	for i, lrt := range data.AllLRTs {
		infos[i] = LRTInfo{
			Index:     lrt.Index,
			Code:      lrt.Code,
			Name:      lrt.Name,
			Desc:      lrt.Desc,
			PointCost: lrt.PointCost,
		}
	}
	return infos
}
