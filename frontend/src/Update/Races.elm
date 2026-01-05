module Update.Races exposing
    ( handleDeleteRace
    , handleDownloadRace
    , handleGotRaces
    , handleGotSessionPlayerRace
    , handleOpenRacesDialog
    , handleOpenSetupRaceDialog
    , handleRaceDeleted
    , handleRaceDownloaded
    , handleRaceUploaded
    , handleSelectRaceForSession
    , handleSetupRaceResult
    , handleSubmitSetupRace
    , handleUploadAndSetRace
    , handleUploadRace
    )

{-| Update handlers for race management messages.

Handles race upload, delete, download, and session race setup.

-}

import Api.Encode as Encode
import Api.Race exposing (Race)
import Dict
import Json.Encode as E
import Model exposing (..)
import Msg exposing (Msg)
import Ports
import Update.Helpers exposing (updateDialogError, updateSetupRaceForm)



-- =============================================================================
-- RACES DIALOG
-- =============================================================================


{-| Open races dialog.
-}
handleOpenRacesDialog : Model -> ( Model, Cmd Msg )
handleOpenRacesDialog model =
    case model.selectedServerUrl of
        Just serverUrl ->
            ( { model
                | dialog = Just (RacesDialog Nothing)
              }
            , Ports.getRaces serverUrl
            )

        Nothing ->
            ( model, Cmd.none )


{-| Handle races list result.
-}
handleGotRaces : Model -> String -> Result String (List Race) -> ( Model, Cmd Msg )
handleGotRaces model serverUrl result =
    case result of
        Ok races ->
            ( { model
                | serverData =
                    updateServerData serverUrl
                        (\sd -> { sd | races = races })
                        model.serverData
              }
            , Cmd.none
            )

        Err _ ->
            ( { model
                | serverData =
                    updateServerData serverUrl
                        (\sd -> { sd | races = [] })
                        model.serverData
              }
            , Cmd.none
            )



-- =============================================================================
-- RACE UPLOAD
-- =============================================================================


{-| Handle upload race request.
-}
handleUploadRace : Model -> ( Model, Cmd Msg )
handleUploadRace model =
    case model.selectedServerUrl of
        Just serverUrl ->
            ( model
            , Ports.uploadRace (E.object [ ( "serverUrl", E.string serverUrl ) ])
            )

        Nothing ->
            ( model, Cmd.none )


{-| Handle race uploaded result.
-}
handleRaceUploaded : Model -> String -> Result String Race -> ( Model, Cmd Msg )
handleRaceUploaded model serverUrl result =
    case result of
        Ok newRace ->
            -- Add the new race to the list
            let
                currentData =
                    getServerData serverUrl model.serverData
            in
            ( { model
                | serverData =
                    updateServerData serverUrl
                        (\sd -> { sd | races = newRace :: currentData.races })
                        model.serverData
              }
            , Cmd.none
            )

        Err err ->
            ( { model | error = Just err }
            , Cmd.none
            )



-- =============================================================================
-- RACE DOWNLOAD
-- =============================================================================


{-| Handle download race request.
-}
handleDownloadRace : Model -> String -> ( Model, Cmd Msg )
handleDownloadRace model raceId =
    case model.selectedServerUrl of
        Just serverUrl ->
            ( model
            , Ports.downloadRace
                (E.object
                    [ ( "serverUrl", E.string serverUrl )
                    , ( "raceId", E.string raceId )
                    ]
                )
            )

        Nothing ->
            ( model, Cmd.none )


{-| Handle race downloaded result.
-}
handleRaceDownloaded : Model -> Result String () -> ( Model, Cmd Msg )
handleRaceDownloaded model result =
    case result of
        Ok _ ->
            -- File download handled by JS
            ( model, Cmd.none )

        Err err ->
            ( { model | error = Just err }
            , Cmd.none
            )



-- =============================================================================
-- RACE DELETE
-- =============================================================================


{-| Handle delete race request.
-}
handleDeleteRace : Model -> String -> ( Model, Cmd Msg )
handleDeleteRace model raceId =
    case model.selectedServerUrl of
        Just serverUrl ->
            ( model
            , Ports.deleteRace
                (E.object
                    [ ( "serverUrl", E.string serverUrl )
                    , ( "raceId", E.string raceId )
                    ]
                )
            )

        Nothing ->
            ( model, Cmd.none )


{-| Handle race deleted result.
-}
handleRaceDeleted : Model -> String -> Result String () -> ( Model, Cmd Msg )
handleRaceDeleted model serverUrl result =
    case result of
        Ok _ ->
            -- Refresh races list and clear any error
            ( { model | dialog = Just (RacesDialog Nothing) }
            , Ports.getRaces serverUrl
            )

        Err err ->
            -- Show error in the races dialog
            ( { model | dialog = Just (RacesDialog (Just err)) }
            , Cmd.none
            )



-- =============================================================================
-- SETUP RACE FOR SESSION
-- =============================================================================


{-| Open setup race dialog.
-}
handleOpenSetupRaceDialog : Model -> String -> ( Model, Cmd Msg )
handleOpenSetupRaceDialog model sessionId =
    case model.selectedServerUrl of
        Just serverUrl ->
            ( { model
                | dialog = Just (SetupRaceDialog (emptySetupRaceForm sessionId))
              }
            , Ports.getRaces serverUrl
            )

        Nothing ->
            ( model, Cmd.none )


{-| Select race for session.
-}
handleSelectRaceForSession : Model -> String -> ( Model, Cmd Msg )
handleSelectRaceForSession model raceId =
    ( updateSetupRaceForm model (\f -> { f | selectedRaceId = Just raceId })
    , Cmd.none
    )


{-| Submit setup race for session.
-}
handleSubmitSetupRace : Model -> ( Model, Cmd Msg )
handleSubmitSetupRace model =
    case model.dialog of
        Just (SetupRaceDialog form) ->
            case ( model.selectedServerUrl, form.selectedRaceId ) of
                ( Just serverUrl, Just raceId ) ->
                    ( updateSetupRaceForm model (\f -> { f | submitting = True, error = Nothing })
                    , Ports.setSessionRace
                        (E.object
                            [ ( "serverUrl", E.string serverUrl )
                            , ( "sessionId", E.string form.sessionId )
                            , ( "raceId", E.string raceId )
                            ]
                        )
                    )

                _ ->
                    ( updateDialogError model "Please select a race"
                    , Cmd.none
                    )

        _ ->
            ( model, Cmd.none )


{-| Handle setup race result.
-}
handleSetupRaceResult : Model -> String -> Result String () -> ( Model, Cmd Msg )
handleSetupRaceResult model serverUrl result =
    case result of
        Ok _ ->
            -- Close dialog and refresh session + race
            let
                -- Get sessionId from dialog before closing it
                sessionId =
                    case model.dialog of
                        Just (SetupRaceDialog form) ->
                            Just form.sessionId

                        _ ->
                            Nothing

                cmds =
                    case sessionId of
                        Just sid ->
                            Cmd.batch
                                [ Ports.getSessions serverUrl
                                , Ports.getSessionPlayerRace (Encode.getSessionPlayerRace serverUrl sid)
                                ]

                        Nothing ->
                            Ports.getSessions serverUrl
            in
            ( { model | dialog = Nothing }
            , cmds
            )

        Err err ->
            ( updateSetupRaceForm model (\f -> { f | submitting = False, error = Just err })
            , Cmd.none
            )


{-| Handle get session player race result.
-}
handleGotSessionPlayerRace : Model -> String -> String -> Result String Race -> ( Model, Cmd Msg )
handleGotSessionPlayerRace model serverUrl sessionId result =
    case result of
        Ok race ->
            ( { model
                | serverData =
                    updateServerData serverUrl
                        (\sd -> { sd | sessionPlayerRaces = Dict.insert sessionId race sd.sessionPlayerRaces })
                        model.serverData
              }
            , Cmd.none
            )

        Err _ ->
            -- Silently ignore errors - race may not be set yet
            ( model, Cmd.none )


{-| Handle upload and set race for session.
-}
handleUploadAndSetRace : Model -> ( Model, Cmd Msg )
handleUploadAndSetRace model =
    case model.dialog of
        Just (SetupRaceDialog form) ->
            case model.selectedServerUrl of
                Just serverUrl ->
                    ( model
                    , Ports.uploadAndSetSessionRace
                        (E.object
                            [ ( "serverUrl", E.string serverUrl )
                            , ( "sessionId", E.string form.sessionId )
                            ]
                        )
                    )

                Nothing ->
                    ( model, Cmd.none )

        _ ->
            ( model, Cmd.none )
