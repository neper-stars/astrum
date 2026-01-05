module Update.RaceBuilder exposing
    ( handleCreateRaceFromExisting
    , handleHabButtonPressed
    , handleHabButtonReleased
    , handleHabButtonTick
    , handleLoadRaceTemplate
    , handleOpenRaceBuilder
    , handleRaceBuilderSaved
    , handleRaceBuilderValidationReceived
    , handleRaceFileLoaded
    , handleRaceTemplateLoaded
    , handleSelectCustomTemplate
    , handleSelectRaceBuilderTab
    , handleSubmitRaceBuilder
    , handleToggleRaceBuilderLRT
    , handleUpdateRaceBuilderColonistsPerResource
    , handleUpdateRaceBuilderFactoriesUseLessGerm
    , handleUpdateRaceBuilderFactoryCost
    , handleUpdateRaceBuilderFactoryCount
    , handleUpdateRaceBuilderFactoryOutput
    , handleUpdateRaceBuilderGravityCenter
    , handleUpdateRaceBuilderGravityImmune
    , handleUpdateRaceBuilderGravityWidth
    , handleUpdateRaceBuilderGrowthRate
    , handleUpdateRaceBuilderIcon
    , handleUpdateRaceBuilderLeftoverPoints
    , handleUpdateRaceBuilderMineCost
    , handleUpdateRaceBuilderMineCount
    , handleUpdateRaceBuilderMineOutput
    , handleUpdateRaceBuilderPRT
    , handleUpdateRaceBuilderPassword
    , handleUpdateRaceBuilderPluralName
    , handleUpdateRaceBuilderRadiationCenter
    , handleUpdateRaceBuilderRadiationImmune
    , handleUpdateRaceBuilderRadiationWidth
    , handleUpdateRaceBuilderResearchBiotech
    , handleUpdateRaceBuilderResearchConstruction
    , handleUpdateRaceBuilderResearchElectronics
    , handleUpdateRaceBuilderResearchEnergy
    , handleUpdateRaceBuilderResearchPropulsion
    , handleUpdateRaceBuilderResearchWeapons
    , handleUpdateRaceBuilderSingularName
    , handleUpdateRaceBuilderTechsStartHigh
    , handleUpdateRaceBuilderTemperatureCenter
    , handleUpdateRaceBuilderTemperatureImmune
    , handleUpdateRaceBuilderTemperatureWidth
    , handleViewRaceInBuilder
    )

{-| Update handlers for race builder messages.

Handles race builder form, templates, and validation.

-}

import Api.Encode as Encode
import Api.Race exposing (Race)
import Model exposing (..)
import Msg exposing (Msg)
import Ports
import Update.Helpers exposing (updateRaceBuilderForm)



-- =============================================================================
-- RACE BUILDER DIALOG
-- =============================================================================


{-| Open race builder dialog.
-}
handleOpenRaceBuilder : Model -> RaceBuilderOrigin -> ( Model, Cmd Msg )
handleOpenRaceBuilder model origin =
    case model.selectedServerUrl of
        Just serverUrl ->
            let
                form =
                    emptyRaceBuilderForm origin
            in
            ( { model | dialog = Just (RaceBuilderDialog form) }
            , Ports.getRaceTemplate (Encode.getRaceTemplate serverUrl "humanoid")
            )

        Nothing ->
            ( model, Cmd.none )


{-| Select race builder tab.
-}
handleSelectRaceBuilderTab : Model -> RaceBuilderTab -> ( Model, Cmd Msg )
handleSelectRaceBuilderTab model tab =
    ( updateRaceBuilderForm model (\f -> { f | activeTab = tab })
    , Cmd.none
    )



-- =============================================================================
-- TEMPLATES
-- =============================================================================


{-| Load race template.
-}
handleLoadRaceTemplate : Model -> String -> ( Model, Cmd Msg )
handleLoadRaceTemplate model templateName =
    case model.selectedServerUrl of
        Just serverUrl ->
            ( updateRaceBuilderForm model (\f -> { f | selectedTemplate = templateName })
            , Ports.getRaceTemplate (Encode.getRaceTemplate serverUrl templateName)
            )

        Nothing ->
            ( model, Cmd.none )


{-| Handle race template loaded result.
-}
handleRaceTemplateLoaded : Model -> Result String RaceConfig -> ( Model, Cmd Msg )
handleRaceTemplateLoaded model result =
    case result of
        Ok config ->
            let
                newModel =
                    updateRaceBuilderForm model (\f -> { f | config = config })
            in
            case model.selectedServerUrl of
                Just serverUrl ->
                    ( newModel
                    , Ports.validateRaceConfig (Encode.validateRaceConfig serverUrl config)
                    )

                Nothing ->
                    ( newModel, Cmd.none )

        Err err ->
            ( updateRaceBuilderForm model (\f -> { f | error = Just err, selectedTemplate = "custom" })
            , Cmd.none
            )


{-| Select custom template.
-}
handleSelectCustomTemplate : Model -> ( Model, Cmd Msg )
handleSelectCustomTemplate model =
    ( updateRaceBuilderForm model (\f -> { f | selectedTemplate = "custom" })
    , Cmd.none
    )



-- =============================================================================
-- IDENTITY TAB
-- =============================================================================


handleUpdateRaceBuilderSingularName : Model -> String -> ( Model, Cmd Msg )
handleUpdateRaceBuilderSingularName model name =
    updateRaceConfigAndValidate model (\c -> { c | singularName = name })


handleUpdateRaceBuilderPluralName : Model -> String -> ( Model, Cmd Msg )
handleUpdateRaceBuilderPluralName model name =
    updateRaceConfigAndValidate model (\c -> { c | pluralName = name })


handleUpdateRaceBuilderPassword : Model -> String -> ( Model, Cmd Msg )
handleUpdateRaceBuilderPassword model password =
    updateRaceConfigAndValidate model (\c -> { c | password = password })


handleUpdateRaceBuilderIcon : Model -> Int -> ( Model, Cmd Msg )
handleUpdateRaceBuilderIcon model icon =
    updateRaceConfigAndValidate model (\c -> { c | icon = icon })


handleUpdateRaceBuilderLeftoverPoints : Model -> Int -> ( Model, Cmd Msg )
handleUpdateRaceBuilderLeftoverPoints model option =
    updateRaceConfigAndValidate model (\c -> { c | leftoverPointsOn = option })



-- =============================================================================
-- PRT/LRT TABS
-- =============================================================================


handleUpdateRaceBuilderPRT : Model -> Int -> ( Model, Cmd Msg )
handleUpdateRaceBuilderPRT model prt =
    updateRaceConfigAndValidate model (\c -> { c | prt = prt })


handleToggleRaceBuilderLRT : Model -> Int -> ( Model, Cmd Msg )
handleToggleRaceBuilderLRT model lrtIndex =
    updateRaceConfigAndValidate model
        (\c ->
            if List.member lrtIndex c.lrt then
                { c | lrt = List.filter (\i -> i /= lrtIndex) c.lrt }

            else
                { c | lrt = lrtIndex :: c.lrt }
        )



-- =============================================================================
-- HABITABILITY TAB
-- =============================================================================


handleUpdateRaceBuilderGravityCenter : Model -> Int -> ( Model, Cmd Msg )
handleUpdateRaceBuilderGravityCenter model val =
    updateRaceConfigAndValidate model (\c -> { c | gravityCenter = val })


handleUpdateRaceBuilderGravityWidth : Model -> Int -> ( Model, Cmd Msg )
handleUpdateRaceBuilderGravityWidth model val =
    updateRaceConfigAndValidate model (\c -> { c | gravityWidth = val })


handleUpdateRaceBuilderGravityImmune : Model -> Bool -> ( Model, Cmd Msg )
handleUpdateRaceBuilderGravityImmune model val =
    updateRaceConfigAndValidate model (\c -> { c | gravityImmune = val })


handleUpdateRaceBuilderTemperatureCenter : Model -> Int -> ( Model, Cmd Msg )
handleUpdateRaceBuilderTemperatureCenter model val =
    updateRaceConfigAndValidate model (\c -> { c | temperatureCenter = val })


handleUpdateRaceBuilderTemperatureWidth : Model -> Int -> ( Model, Cmd Msg )
handleUpdateRaceBuilderTemperatureWidth model val =
    updateRaceConfigAndValidate model (\c -> { c | temperatureWidth = val })


handleUpdateRaceBuilderTemperatureImmune : Model -> Bool -> ( Model, Cmd Msg )
handleUpdateRaceBuilderTemperatureImmune model val =
    updateRaceConfigAndValidate model (\c -> { c | temperatureImmune = val })


handleUpdateRaceBuilderRadiationCenter : Model -> Int -> ( Model, Cmd Msg )
handleUpdateRaceBuilderRadiationCenter model val =
    updateRaceConfigAndValidate model (\c -> { c | radiationCenter = val })


handleUpdateRaceBuilderRadiationWidth : Model -> Int -> ( Model, Cmd Msg )
handleUpdateRaceBuilderRadiationWidth model val =
    updateRaceConfigAndValidate model (\c -> { c | radiationWidth = val })


handleUpdateRaceBuilderRadiationImmune : Model -> Bool -> ( Model, Cmd Msg )
handleUpdateRaceBuilderRadiationImmune model val =
    updateRaceConfigAndValidate model (\c -> { c | radiationImmune = val })


handleUpdateRaceBuilderGrowthRate : Model -> Int -> ( Model, Cmd Msg )
handleUpdateRaceBuilderGrowthRate model val =
    updateRaceConfigAndValidate model (\c -> { c | growthRate = val })



-- =============================================================================
-- HAB BUTTON HOLD-TO-REPEAT
-- =============================================================================


{-| Handle hab button pressed.
-}
handleHabButtonPressed : Model -> HabButton -> ( Model, Cmd Msg )
handleHabButtonPressed model btn =
    case model.dialog of
        Just (RaceBuilderDialog form) ->
            let
                newForm =
                    { form | heldHabButton = Just btn }

                modelWithHeld =
                    { model | dialog = Just (RaceBuilderDialog newForm) }
            in
            performHabButtonAction modelWithHeld btn

        _ ->
            ( model, Cmd.none )


{-| Handle hab button released.
-}
handleHabButtonReleased : Model -> ( Model, Cmd Msg )
handleHabButtonReleased model =
    case model.dialog of
        Just (RaceBuilderDialog form) ->
            let
                newForm =
                    { form | heldHabButton = Nothing }
            in
            ( { model | dialog = Just (RaceBuilderDialog newForm) }, Cmd.none )

        _ ->
            ( model, Cmd.none )


{-| Handle hab button tick.
-}
handleHabButtonTick : Model -> ( Model, Cmd Msg )
handleHabButtonTick model =
    case model.dialog of
        Just (RaceBuilderDialog form) ->
            case form.heldHabButton of
                Just btn ->
                    performHabButtonAction model btn

                Nothing ->
                    ( model, Cmd.none )

        _ ->
            ( model, Cmd.none )



-- =============================================================================
-- ECONOMY TAB
-- =============================================================================


handleUpdateRaceBuilderColonistsPerResource : Model -> Int -> ( Model, Cmd Msg )
handleUpdateRaceBuilderColonistsPerResource model val =
    updateRaceConfigAndValidate model (\c -> { c | colonistsPerResource = val })


handleUpdateRaceBuilderFactoryOutput : Model -> Int -> ( Model, Cmd Msg )
handleUpdateRaceBuilderFactoryOutput model val =
    updateRaceConfigAndValidate model (\c -> { c | factoryOutput = val })


handleUpdateRaceBuilderFactoryCost : Model -> Int -> ( Model, Cmd Msg )
handleUpdateRaceBuilderFactoryCost model val =
    updateRaceConfigAndValidate model (\c -> { c | factoryCost = val })


handleUpdateRaceBuilderFactoryCount : Model -> Int -> ( Model, Cmd Msg )
handleUpdateRaceBuilderFactoryCount model val =
    updateRaceConfigAndValidate model (\c -> { c | factoryCount = val })


handleUpdateRaceBuilderFactoriesUseLessGerm : Model -> Bool -> ( Model, Cmd Msg )
handleUpdateRaceBuilderFactoriesUseLessGerm model val =
    updateRaceConfigAndValidate model (\c -> { c | factoriesUseLessGerm = val })


handleUpdateRaceBuilderMineOutput : Model -> Int -> ( Model, Cmd Msg )
handleUpdateRaceBuilderMineOutput model val =
    updateRaceConfigAndValidate model (\c -> { c | mineOutput = val })


handleUpdateRaceBuilderMineCost : Model -> Int -> ( Model, Cmd Msg )
handleUpdateRaceBuilderMineCost model val =
    updateRaceConfigAndValidate model (\c -> { c | mineCost = val })


handleUpdateRaceBuilderMineCount : Model -> Int -> ( Model, Cmd Msg )
handleUpdateRaceBuilderMineCount model val =
    updateRaceConfigAndValidate model (\c -> { c | mineCount = val })



-- =============================================================================
-- RESEARCH TAB
-- =============================================================================


handleUpdateRaceBuilderResearchEnergy : Model -> Int -> ( Model, Cmd Msg )
handleUpdateRaceBuilderResearchEnergy model val =
    updateRaceConfigAndValidate model (\c -> { c | researchEnergy = val })


handleUpdateRaceBuilderResearchWeapons : Model -> Int -> ( Model, Cmd Msg )
handleUpdateRaceBuilderResearchWeapons model val =
    updateRaceConfigAndValidate model (\c -> { c | researchWeapons = val })


handleUpdateRaceBuilderResearchPropulsion : Model -> Int -> ( Model, Cmd Msg )
handleUpdateRaceBuilderResearchPropulsion model val =
    updateRaceConfigAndValidate model (\c -> { c | researchPropulsion = val })


handleUpdateRaceBuilderResearchConstruction : Model -> Int -> ( Model, Cmd Msg )
handleUpdateRaceBuilderResearchConstruction model val =
    updateRaceConfigAndValidate model (\c -> { c | researchConstruction = val })


handleUpdateRaceBuilderResearchElectronics : Model -> Int -> ( Model, Cmd Msg )
handleUpdateRaceBuilderResearchElectronics model val =
    updateRaceConfigAndValidate model (\c -> { c | researchElectronics = val })


handleUpdateRaceBuilderResearchBiotech : Model -> Int -> ( Model, Cmd Msg )
handleUpdateRaceBuilderResearchBiotech model val =
    updateRaceConfigAndValidate model (\c -> { c | researchBiotech = val })


handleUpdateRaceBuilderTechsStartHigh : Model -> Bool -> ( Model, Cmd Msg )
handleUpdateRaceBuilderTechsStartHigh model val =
    updateRaceConfigAndValidate model (\c -> { c | techsStartHigh = val })



-- =============================================================================
-- VALIDATION AND SAVE
-- =============================================================================


{-| Handle validation result.
-}
handleRaceBuilderValidationReceived : Model -> Result String RaceValidation -> ( Model, Cmd Msg )
handleRaceBuilderValidationReceived model result =
    case result of
        Ok validation ->
            ( updateRaceBuilderForm model (\f -> { f | validation = validation })
            , Cmd.none
            )

        Err err ->
            ( updateRaceBuilderForm model (\f -> { f | error = Just err })
            , Cmd.none
            )


{-| Submit race builder.
-}
handleSubmitRaceBuilder : Model -> ( Model, Cmd Msg )
handleSubmitRaceBuilder model =
    case ( model.dialog, model.selectedServerUrl ) of
        ( Just (RaceBuilderDialog form), Just serverUrl ) ->
            if form.validation.isValid then
                let
                    maybeSessionId =
                        case form.origin of
                            FromSetupRaceDialog sessionId ->
                                Just sessionId

                            FromRacesDialog ->
                                Nothing
                in
                ( updateRaceBuilderForm model (\f -> { f | submitting = True, error = Nothing })
                , Ports.buildAndSaveRace (Encode.buildAndSaveRace serverUrl form.config maybeSessionId)
                )

            else
                ( model, Cmd.none )

        _ ->
            ( model, Cmd.none )


{-| Handle race builder saved result.
-}
handleRaceBuilderSaved : Model -> Result String Race -> ( Model, Cmd Msg )
handleRaceBuilderSaved model result =
    case result of
        Ok _ ->
            case ( model.dialog, model.selectedServerUrl ) of
                ( Just (RaceBuilderDialog form), Just serverUrl ) ->
                    let
                        baseCmds =
                            [ Ports.getRaces serverUrl ]

                        allCmds =
                            case form.origin of
                                FromSetupRaceDialog sessionId ->
                                    baseCmds
                                        ++ [ Ports.getSessions serverUrl
                                           , Ports.getSessionPlayerRace (Encode.getSessionPlayerRace serverUrl sessionId)
                                           ]

                                FromRacesDialog ->
                                    baseCmds
                    in
                    ( { model | dialog = Nothing }
                    , Cmd.batch allCmds
                    )

                _ ->
                    ( { model | dialog = Nothing }, Cmd.none )

        Err err ->
            ( updateRaceBuilderForm model (\f -> { f | submitting = False, error = Just err })
            , Cmd.none
            )



-- =============================================================================
-- VIEW EXISTING RACE
-- =============================================================================


{-| View race in builder.
-}
handleViewRaceInBuilder : Model -> String -> String -> ( Model, Cmd Msg )
handleViewRaceInBuilder model raceId raceName =
    case model.selectedServerUrl of
        Just serverUrl ->
            let
                form =
                    { origin = FromRacesDialog
                    , mode = ViewMode { raceId = raceId, raceName = raceName }
                    , activeTab = IdentityTab
                    , config = defaultRaceConfig
                    , validation =
                        { points = 0
                        , isValid = False
                        , errors = []
                        , warnings = []
                        , habitability = emptyHabitabilityDisplay
                        , prtInfos = []
                        , lrtInfos = []
                        }
                    , submitting = False
                    , loading = True
                    , error = Nothing
                    , selectedTemplate = "custom"
                    , heldHabButton = Nothing
                    }
            in
            ( { model | dialog = Just (RaceBuilderDialog form) }
            , Ports.loadRaceFileConfig (Encode.loadRaceFileConfig serverUrl raceId)
            )

        Nothing ->
            ( model, Cmd.none )


{-| Handle race file loaded result.
-}
handleRaceFileLoaded : Model -> Result String RaceConfig -> ( Model, Cmd Msg )
handleRaceFileLoaded model result =
    case result of
        Ok config ->
            case model.selectedServerUrl of
                Just serverUrl ->
                    ( updateRaceBuilderForm model (\f -> { f | config = config, loading = False })
                    , Ports.validateRaceConfig (Encode.validateRaceConfig serverUrl config)
                    )

                Nothing ->
                    ( updateRaceBuilderForm model (\f -> { f | config = config, loading = False })
                    , Cmd.none
                    )

        Err err ->
            ( updateRaceBuilderForm model (\f -> { f | loading = False, error = Just err })
            , Cmd.none
            )


{-| Create race from existing (switch to edit mode).
-}
handleCreateRaceFromExisting : Model -> ( Model, Cmd Msg )
handleCreateRaceFromExisting model =
    ( updateRaceBuilderForm model (\f -> { f | mode = EditMode })
    , Cmd.none
    )



-- =============================================================================
-- HELPER
-- =============================================================================


{-| Update race config and trigger validation.
-}
updateRaceConfigAndValidate : Model -> (RaceConfig -> RaceConfig) -> ( Model, Cmd Msg )
updateRaceConfigAndValidate model configUpdater =
    case model.dialog of
        Just (RaceBuilderDialog form) ->
            let
                newConfig =
                    configUpdater form.config

                newModel =
                    { model
                        | dialog =
                            Just
                                (RaceBuilderDialog
                                    { form
                                        | config = newConfig
                                        , selectedTemplate = "custom"
                                    }
                                )
                    }
            in
            case model.selectedServerUrl of
                Just serverUrl ->
                    ( newModel
                    , Ports.validateRaceConfig (Encode.validateRaceConfig serverUrl newConfig)
                    )

                Nothing ->
                    ( newModel, Cmd.none )

        _ ->
            ( model, Cmd.none )


{-| Perform hab button action.
-}
performHabButtonAction : Model -> HabButton -> ( Model, Cmd Msg )
performHabButtonAction model btn =
    let
        configUpdater =
            case btn of
                -- Gravity
                GravityRightBtn ->
                    \c -> { c | gravityCenter = clamp 0 100 (c.gravityCenter + 1) }

                GravityLeftBtn ->
                    \c -> { c | gravityCenter = clamp 0 100 (c.gravityCenter - 1) }

                GravityExpandBtn ->
                    \c -> { c | gravityWidth = clamp 0 50 (c.gravityWidth + 1) }

                GravityShrinkBtn ->
                    \c -> { c | gravityWidth = clamp 0 50 (c.gravityWidth - 1) }

                -- Temperature
                TemperatureRightBtn ->
                    \c -> { c | temperatureCenter = clamp 0 100 (c.temperatureCenter + 1) }

                TemperatureLeftBtn ->
                    \c -> { c | temperatureCenter = clamp 0 100 (c.temperatureCenter - 1) }

                TemperatureExpandBtn ->
                    \c -> { c | temperatureWidth = clamp 0 50 (c.temperatureWidth + 1) }

                TemperatureShrinkBtn ->
                    \c -> { c | temperatureWidth = clamp 0 50 (c.temperatureWidth - 1) }

                -- Radiation
                RadiationRightBtn ->
                    \c -> { c | radiationCenter = clamp 0 100 (c.radiationCenter + 1) }

                RadiationLeftBtn ->
                    \c -> { c | radiationCenter = clamp 0 100 (c.radiationCenter - 1) }

                RadiationExpandBtn ->
                    \c -> { c | radiationWidth = clamp 0 50 (c.radiationWidth + 1) }

                RadiationShrinkBtn ->
                    \c -> { c | radiationWidth = clamp 0 50 (c.radiationWidth - 1) }
    in
    updateRaceConfigAndValidate model configUpdater
