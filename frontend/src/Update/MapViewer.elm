module Update.MapViewer exposing
    ( handleAnimatedMapGenerated
    , handleGenerateAnimatedMap
    , handleGenerateMap
    , handleGifSaved
    , handleMapGenerated
    , handleMapSaved
    , handleOpenMapViewer
    , handleSaveGif
    , handleSaveMap
    , handleSelectMapFormat
    , handleSelectMapPreset
    , handleToggleMapFullscreen
    , handleToggleShowFleets
    , handleToggleShowLegend
    , handleToggleShowMines
    , handleToggleShowNames
    , handleToggleShowScannerCoverage
    , handleToggleShowWormholes
    , handleUpdateGifDelay
    , handleUpdateMapHeight
    , handleUpdateMapWidth
    , handleUpdateShowFleetPaths
    )

{-| Update handlers for map viewer messages.

Handles map generation, options, and export.

-}

import Api.Encode as Encode
import Dict
import Model exposing (..)
import Msg exposing (Msg)
import Ports
import Update.Helpers exposing (clearMapContent, updateMapOptions, updateMapViewerForm)



-- =============================================================================
-- MAP VIEWER DIALOG
-- =============================================================================


{-| Open map viewer dialog.
-}
handleOpenMapViewer : Model -> String -> Int -> String -> Int -> ( Model, Cmd Msg )
handleOpenMapViewer model sessionId year raceName playerNumber =
    ( { model | dialog = Just (MapViewerDialog (emptyMapViewerForm sessionId year raceName playerNumber)) }
    , Cmd.none
    )



-- =============================================================================
-- MAP SIZE OPTIONS
-- =============================================================================


{-| Update map width.
-}
handleUpdateMapWidth : Model -> String -> ( Model, Cmd Msg )
handleUpdateMapWidth model widthStr =
    case String.toInt widthStr of
        Just width ->
            ( updateMapOptions model (\opts -> { opts | width = clamp 400 4096 width })
            , Cmd.none
            )

        Nothing ->
            ( model, Cmd.none )


{-| Update map height.
-}
handleUpdateMapHeight : Model -> String -> ( Model, Cmd Msg )
handleUpdateMapHeight model heightStr =
    case String.toInt heightStr of
        Just height ->
            ( updateMapOptions model (\opts -> { opts | height = clamp 300 4096 height })
            , Cmd.none
            )

        Nothing ->
            ( model, Cmd.none )


{-| Select map size preset.
-}
handleSelectMapPreset : Model -> String -> ( Model, Cmd Msg )
handleSelectMapPreset model preset =
    let
        ( width, height ) =
            case preset of
                "800x600" ->
                    ( 800, 600 )

                "1024x768" ->
                    ( 1024, 768 )

                "1920x1080" ->
                    ( 1920, 1080 )

                "2560x1440" ->
                    ( 2560, 1440 )

                _ ->
                    ( 1024, 768 )
    in
    ( updateMapOptions model (\opts -> { opts | width = width, height = height })
    , Cmd.none
    )



-- =============================================================================
-- MAP DISPLAY OPTIONS
-- =============================================================================


{-| Toggle show names option.
-}
handleToggleShowNames : Model -> ( Model, Cmd Msg )
handleToggleShowNames model =
    ( updateMapOptions model (\opts -> { opts | showNames = not opts.showNames })
    , Cmd.none
    )


{-| Toggle show fleets option.
-}
handleToggleShowFleets : Model -> ( Model, Cmd Msg )
handleToggleShowFleets model =
    ( updateMapOptions model (\opts -> { opts | showFleets = not opts.showFleets })
    , Cmd.none
    )


{-| Update show fleet paths years.
-}
handleUpdateShowFleetPaths : Model -> String -> ( Model, Cmd Msg )
handleUpdateShowFleetPaths model yearsStr =
    case String.toInt yearsStr of
        Just years ->
            ( updateMapOptions model (\opts -> { opts | showFleetPaths = clamp 0 10 years })
            , Cmd.none
            )

        Nothing ->
            ( model, Cmd.none )


{-| Toggle show mines option.
-}
handleToggleShowMines : Model -> ( Model, Cmd Msg )
handleToggleShowMines model =
    ( updateMapOptions model (\opts -> { opts | showMines = not opts.showMines })
    , Cmd.none
    )


{-| Toggle show wormholes option.
-}
handleToggleShowWormholes : Model -> ( Model, Cmd Msg )
handleToggleShowWormholes model =
    ( updateMapOptions model (\opts -> { opts | showWormholes = not opts.showWormholes })
    , Cmd.none
    )


{-| Toggle show legend option.
-}
handleToggleShowLegend : Model -> ( Model, Cmd Msg )
handleToggleShowLegend model =
    ( updateMapOptions model (\opts -> { opts | showLegend = not opts.showLegend })
    , Cmd.none
    )


{-| Toggle show scanner coverage option.
-}
handleToggleShowScannerCoverage : Model -> ( Model, Cmd Msg )
handleToggleShowScannerCoverage model =
    ( updateMapOptions model (\opts -> { opts | showScannerCoverage = not opts.showScannerCoverage })
    , Cmd.none
    )


{-| Toggle fullscreen mode.
-}
handleToggleMapFullscreen : Model -> ( Model, Cmd Msg )
handleToggleMapFullscreen model =
    ( model, Ports.requestFullscreen "map-viewer-frame" )



-- =============================================================================
-- MAP FORMAT OPTIONS
-- =============================================================================


{-| Select map format (SVG or GIF).
-}
handleSelectMapFormat : Model -> String -> ( Model, Cmd Msg )
handleSelectMapFormat model formatStr =
    let
        format =
            if formatStr == "gif" then
                GIFFormat

            else
                SVGFormat
    in
    ( updateMapOptions model (\opts -> { opts | outputFormat = format })
        |> clearMapContent
    , Cmd.none
    )


{-| Update GIF delay.
-}
handleUpdateGifDelay : Model -> String -> ( Model, Cmd Msg )
handleUpdateGifDelay model delayStr =
    case String.toInt delayStr of
        Just delay ->
            ( updateMapOptions model (\opts -> { opts | gifDelay = clamp 100 2000 delay })
            , Cmd.none
            )

        Nothing ->
            ( model, Cmd.none )



-- =============================================================================
-- SVG MAP GENERATION
-- =============================================================================


{-| Generate SVG map.
-}
handleGenerateMap : Model -> ( Model, Cmd Msg )
handleGenerateMap model =
    case model.dialog of
        Just (MapViewerDialog form) ->
            case model.selectedServerUrl of
                Just serverUrl ->
                    let
                        serverData =
                            getServerData serverUrl model.serverData

                        maybeTurnFiles =
                            Dict.get form.sessionId serverData.sessionTurns
                                |> Maybe.andThen (Dict.get form.year)
                    in
                    case maybeTurnFiles of
                        Just turnFiles ->
                            ( { model | dialog = Just (MapViewerDialog { form | generating = True, error = Nothing }) }
                            , Ports.generateMap (Encode.generateMap serverUrl form.sessionId form.year form.options turnFiles)
                            )

                        Nothing ->
                            ( { model | dialog = Just (MapViewerDialog { form | error = Just "Turn files not available. Please open the Turn Files dialog first." }) }
                            , Cmd.none
                            )

                Nothing ->
                    ( model, Cmd.none )

        _ ->
            ( model, Cmd.none )


{-| Handle SVG map generated result.
-}
handleMapGenerated : Model -> Result String String -> ( Model, Cmd Msg )
handleMapGenerated model result =
    case model.dialog of
        Just (MapViewerDialog form) ->
            case result of
                Ok svg ->
                    ( { model | dialog = Just (MapViewerDialog { form | generatedSvg = Just svg, generating = False }) }
                    , Cmd.none
                    )

                Err err ->
                    ( { model | dialog = Just (MapViewerDialog { form | error = Just err, generating = False }) }
                    , Cmd.none
                    )

        _ ->
            ( model, Cmd.none )


{-| Save SVG map.
-}
handleSaveMap : Model -> ( Model, Cmd Msg )
handleSaveMap model =
    case model.dialog of
        Just (MapViewerDialog form) ->
            case ( model.selectedServerUrl, form.generatedSvg ) of
                ( Just serverUrl, Just svg ) ->
                    ( { model | dialog = Just (MapViewerDialog { form | saving = True }) }
                    , Ports.saveMap (Encode.saveMap serverUrl form.sessionId form.year form.raceName form.playerNumber svg)
                    )

                _ ->
                    ( model, Cmd.none )

        _ ->
            ( model, Cmd.none )


{-| Handle map saved result.
-}
handleMapSaved : Model -> Result String () -> ( Model, Cmd Msg )
handleMapSaved model result =
    case model.dialog of
        Just (MapViewerDialog form) ->
            case result of
                Ok () ->
                    ( { model | dialog = Just (MapViewerDialog { form | saving = False }) }
                    , Cmd.none
                    )

                Err err ->
                    ( { model | dialog = Just (MapViewerDialog { form | error = Just err, saving = False }) }
                    , Cmd.none
                    )

        _ ->
            ( model, Cmd.none )



-- =============================================================================
-- ANIMATED GIF GENERATION
-- =============================================================================


{-| Generate animated GIF map.
-}
handleGenerateAnimatedMap : Model -> ( Model, Cmd Msg )
handleGenerateAnimatedMap model =
    case model.dialog of
        Just (MapViewerDialog form) ->
            case model.selectedServerUrl of
                Just serverUrl ->
                    ( { model | dialog = Just (MapViewerDialog { form | generatingGif = True, error = Nothing, generatedGif = Nothing }) }
                    , Ports.generateAnimatedMap (Encode.generateAnimatedMap serverUrl form.sessionId form.options)
                    )

                Nothing ->
                    ( model, Cmd.none )

        _ ->
            ( model, Cmd.none )


{-| Handle animated map generated result.
-}
handleAnimatedMapGenerated : Model -> Result String String -> ( Model, Cmd Msg )
handleAnimatedMapGenerated model result =
    case model.dialog of
        Just (MapViewerDialog form) ->
            case result of
                Ok gifB64 ->
                    ( { model | dialog = Just (MapViewerDialog { form | generatedGif = Just gifB64, generatingGif = False, generatedSvg = Nothing }) }
                    , Cmd.none
                    )

                Err err ->
                    ( { model | dialog = Just (MapViewerDialog { form | error = Just err, generatingGif = False }) }
                    , Cmd.none
                    )

        _ ->
            ( model, Cmd.none )


{-| Save GIF.
-}
handleSaveGif : Model -> ( Model, Cmd Msg )
handleSaveGif model =
    case model.dialog of
        Just (MapViewerDialog form) ->
            case ( model.selectedServerUrl, form.generatedGif ) of
                ( Just serverUrl, Just gifB64 ) ->
                    ( { model | dialog = Just (MapViewerDialog { form | saving = True }) }
                    , Ports.saveGif (Encode.saveGif serverUrl form.sessionId form.raceName form.playerNumber gifB64)
                    )

                _ ->
                    ( model, Cmd.none )

        _ ->
            ( model, Cmd.none )


{-| Handle GIF saved result.
-}
handleGifSaved : Model -> Result String () -> ( Model, Cmd Msg )
handleGifSaved model result =
    case model.dialog of
        Just (MapViewerDialog form) ->
            case result of
                Ok () ->
                    ( { model | dialog = Just (MapViewerDialog { form | saving = False }) }
                    , Cmd.none
                    )

                Err err ->
                    ( { model | dialog = Just (MapViewerDialog { form | error = Just err, saving = False }) }
                    , Cmd.none
                    )

        _ ->
            ( model, Cmd.none )
