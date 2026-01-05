module Update.Settings exposing
    ( handleAutoDownloadStarsSet
    , handleCheckNtvdmSupport
    , handleCheckWineInstall
    , handleGotAppSettings
    , handleNtvdmChecked
    , handleOpenSettingsDialog
    , handleSelectServersDir
    , handleSelectWinePrefixesDir
    , handleServersDirSelected
    , handleSetAutoDownloadStars
    , handleSetUseWine
    , handleUseWineSet
    , handleWineInstallChecked
    , handleWinePrefixesDirSelected
    )

{-| Update handlers for app settings messages.

Handles settings dialog, directories, Wine/NTVDM configuration.

-}

import Model exposing (..)
import Msg exposing (Msg)
import Ports



-- =============================================================================
-- SETTINGS DIALOG
-- =============================================================================


{-| Open settings dialog.
-}
handleOpenSettingsDialog : Model -> ( Model, Cmd Msg )
handleOpenSettingsDialog model =
    ( { model | dialog = Just SettingsDialog }
    , Ports.getAppSettings ()
    )


{-| Handle app settings result.
-}
handleGotAppSettings : Model -> Result String AppSettings -> ( Model, Cmd Msg )
handleGotAppSettings model result =
    case result of
        Ok settings ->
            ( { model | appSettings = Just settings }
            , Cmd.none
            )

        Err _ ->
            ( model, Cmd.none )



-- =============================================================================
-- SERVERS DIRECTORY
-- =============================================================================


{-| Handle select servers directory request.
-}
handleSelectServersDir : Model -> ( Model, Cmd Msg )
handleSelectServersDir model =
    ( model
    , Ports.selectServersDir ()
    )


{-| Handle servers directory selected result.
-}
handleServersDirSelected : Model -> Result String AppSettings -> ( Model, Cmd Msg )
handleServersDirSelected model result =
    case result of
        Ok settings ->
            ( { model | appSettings = Just settings }
            , Cmd.none
            )

        Err _ ->
            ( model, Cmd.none )



-- =============================================================================
-- AUTO DOWNLOAD STARS
-- =============================================================================


{-| Handle set auto download stars request.
-}
handleSetAutoDownloadStars : Model -> Bool -> ( Model, Cmd Msg )
handleSetAutoDownloadStars model enabled =
    ( model, Ports.setAutoDownloadStars enabled )


{-| Handle auto download stars set result.
-}
handleAutoDownloadStarsSet : Model -> Result String AppSettings -> ( Model, Cmd Msg )
handleAutoDownloadStarsSet model result =
    case result of
        Ok settings ->
            ( { model | appSettings = Just settings }
            , Cmd.none
            )

        Err _ ->
            ( model, Cmd.none )



-- =============================================================================
-- WINE CONFIGURATION
-- =============================================================================


{-| Handle set use Wine request.
-}
handleSetUseWine : Model -> Bool -> ( Model, Cmd Msg )
handleSetUseWine model enabled =
    ( model, Ports.setUseWine enabled )


{-| Handle use Wine set result.
-}
handleUseWineSet : Model -> Result String AppSettings -> ( Model, Cmd Msg )
handleUseWineSet model result =
    case result of
        Ok settings ->
            ( { model
                | appSettings = Just settings
                , wineCheckMessage = Nothing
              }
            , Cmd.none
            )

        Err _ ->
            ( model, Cmd.none )


{-| Handle select Wine prefixes directory request.
-}
handleSelectWinePrefixesDir : Model -> ( Model, Cmd Msg )
handleSelectWinePrefixesDir model =
    ( model, Ports.selectWinePrefixesDir () )


{-| Handle Wine prefixes directory selected result.
-}
handleWinePrefixesDirSelected : Model -> Result String AppSettings -> ( Model, Cmd Msg )
handleWinePrefixesDirSelected model result =
    case result of
        Ok settings ->
            ( { model | appSettings = Just settings }
            , Cmd.none
            )

        Err _ ->
            ( model, Cmd.none )


{-| Handle check Wine install request.
-}
handleCheckWineInstall : Model -> ( Model, Cmd Msg )
handleCheckWineInstall model =
    ( { model | wineCheckInProgress = True, wineCheckMessage = Nothing }
    , Ports.checkWineInstall ()
    )


{-| Handle Wine install check result.
-}
handleWineInstallChecked : Model -> Result String { valid : Bool, message : String } -> ( Model, Cmd Msg )
handleWineInstallChecked model result =
    case result of
        Ok checkResult ->
            let
                updatedSettings =
                    model.appSettings
                        |> Maybe.map (\s -> { s | validWineInstall = checkResult.valid })
            in
            ( { model
                | appSettings = updatedSettings
                , wineCheckInProgress = False
                , wineCheckMessage = Just checkResult.message
              }
            , Cmd.none
            )

        Err errMsg ->
            ( { model
                | wineCheckInProgress = False
                , wineCheckMessage = Just ("Check failed: " ++ errMsg)
              }
            , Cmd.none
            )



-- =============================================================================
-- NTVDM CONFIGURATION (Windows)
-- =============================================================================


{-| Handle check NTVDM support request.
-}
handleCheckNtvdmSupport : Model -> ( Model, Cmd Msg )
handleCheckNtvdmSupport model =
    ( { model | ntvdmCheckInProgress = True }, Ports.checkNtvdmSupport () )


{-| Handle NTVDM check result.
-}
handleNtvdmChecked : Model -> Result String NtvdmCheckResult -> ( Model, Cmd Msg )
handleNtvdmChecked model result =
    case result of
        Ok checkResult ->
            ( { model
                | ntvdmCheckInProgress = False
                , ntvdmCheckResult = Just checkResult
              }
            , Cmd.none
            )

        Err errMsg ->
            ( { model
                | ntvdmCheckInProgress = False
                , ntvdmCheckResult = Just { available = False, is64Bit = False, message = "Check failed: " ++ errMsg, helpUrl = Nothing }
              }
            , Cmd.none
            )
