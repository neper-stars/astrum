module Update.TurnFiles exposing
    ( handleGotHasStarsExe
    , handleGotLatestTurn
    , handleGotOrdersStatus
    , handleGotTurnFiles
    , handleLaunchStars
    , handleLaunchStarsResult
    , handleOpenGameDir
    , handleOpenTurnFilesDialog
    )

{-| Update handlers for turn files and game execution messages.

Handles turn file dialog, orders status, and Stars! launch.

-}

import Api.Encode as Encode
import Api.OrdersStatus exposing (OrdersStatus)
import Api.TurnFiles exposing (TurnFiles)
import Dict
import Model exposing (..)
import Msg exposing (Msg)
import Ports
import Update.Helpers exposing (storeSessionTurn)



-- =============================================================================
-- TURN FILES DIALOG
-- =============================================================================


{-| Open turn files dialog.
-}
handleOpenTurnFilesDialog : Model -> String -> Int -> Bool -> ( Model, Cmd Msg )
handleOpenTurnFilesDialog model sessionId year isLatestYear =
    case model.selectedServerUrl of
        Just serverUrl ->
            let
                serverData =
                    getServerData serverUrl model.serverData

                -- Get race name from cached data
                raceName =
                    Dict.get sessionId serverData.sessionPlayerRaces
                        |> Maybe.map .nameSingular
                        |> Maybe.withDefault "Player"

                -- Get current user ID from connection state
                currentUserId =
                    case serverData.connectionState of
                        Connected info ->
                            Just info.userId

                        _ ->
                            Nothing

                -- Get player number from session data
                playerNumber =
                    case List.filter (\s -> s.id == sessionId) serverData.sessions |> List.head of
                        Just session ->
                            case currentUserId of
                                Just userId ->
                                    session.players
                                        |> List.indexedMap Tuple.pair
                                        |> List.filter (\( _, p ) -> p.userProfileId == userId)
                                        |> List.head
                                        |> Maybe.map (\( idx, _ ) -> idx + 1)
                                        |> Maybe.withDefault 1

                                Nothing ->
                                    1

                        Nothing ->
                            1

                -- Check if we have cached turn files
                cachedTurnFiles =
                    Dict.get sessionId serverData.sessionTurns
                        |> Maybe.andThen (Dict.get year)

                -- Check if we have cached orders status for this year
                cachedOrdersStatus =
                    Dict.get sessionId serverData.sessionOrdersStatus
                        |> Maybe.andThen (Dict.get year)

                form =
                    case cachedTurnFiles of
                        Just turnFiles ->
                            -- Use cached data - no loading needed
                            { sessionId = sessionId
                            , year = year
                            , raceName = raceName
                            , playerNumber = playerNumber
                            , turnFiles = Just turnFiles
                            , ordersStatus = cachedOrdersStatus
                            , isLatestYear = isLatestYear
                            , error = Nothing
                            , loading = False
                            }

                        Nothing ->
                            -- Need to fetch
                            let
                                emptyForm =
                                    emptyTurnFilesForm sessionId year raceName playerNumber isLatestYear
                            in
                            { emptyForm | ordersStatus = cachedOrdersStatus }

                -- Fetch turn files if not cached
                -- Only save to game dir for the latest year
                turnCmd =
                    case cachedTurnFiles of
                        Just _ ->
                            Cmd.none

                        Nothing ->
                            Ports.getTurn (Encode.getTurn serverUrl sessionId year isLatestYear)

                -- Fetch orders status if latest year and not cached
                ordersCmd =
                    if isLatestYear && cachedOrdersStatus == Nothing then
                        Ports.getOrdersStatus (Encode.getOrdersStatus serverUrl sessionId)

                    else
                        Cmd.none
            in
            ( { model | dialog = Just (TurnFilesDialog form) }
            , Cmd.batch [ turnCmd, ordersCmd ]
            )

        Nothing ->
            ( model, Cmd.none )



-- =============================================================================
-- TURN FILES RESULTS
-- =============================================================================


{-| Handle turn files result.
-}
handleGotTurnFiles : Model -> String -> Result String TurnFiles -> ( Model, Cmd Msg )
handleGotTurnFiles model serverUrl result =
    -- Always store in cache for the correct server
    let
        cachedModel =
            case result of
                Ok turnFiles ->
                    storeSessionTurn serverUrl turnFiles.sessionId (Just turnFiles) model

                Err _ ->
                    model

        -- Update dialog only if it's open and we're on the selected server
        isSelectedServer =
            model.selectedServerUrl == Just serverUrl
    in
    case ( model.dialog, isSelectedServer ) of
        ( Just (TurnFilesDialog form), True ) ->
            case result of
                Ok turnFiles ->
                    ( { cachedModel
                        | dialog =
                            Just
                                (TurnFilesDialog
                                    { form
                                        | turnFiles = Just turnFiles
                                        , loading = False
                                        , error = Nothing
                                    }
                                )
                      }
                    , Cmd.none
                    )

                Err err ->
                    ( { cachedModel
                        | dialog =
                            Just
                                (TurnFilesDialog
                                    { form
                                        | loading = False
                                        , error = Just err
                                    }
                                )
                      }
                    , Cmd.none
                    )

        _ ->
            ( cachedModel, Cmd.none )


{-| Handle latest turn result.
-}
handleGotLatestTurn : Model -> String -> Result String TurnFiles -> ( Model, Cmd Msg )
handleGotLatestTurn model serverUrl result =
    -- Store the latest turn files in the cache for the correct server
    case result of
        Ok turnFiles ->
            ( storeSessionTurn serverUrl turnFiles.sessionId (Just turnFiles) model
            , Cmd.none
            )

        Err _ ->
            -- Silently ignore errors - turn might not be available yet
            ( model, Cmd.none )



-- =============================================================================
-- ORDERS STATUS
-- =============================================================================


{-| Handle orders status result.
-}
handleGotOrdersStatus : Model -> String -> Result String OrdersStatus -> ( Model, Cmd Msg )
handleGotOrdersStatus model serverUrl result =
    case result of
        Ok ordersStatus ->
            let
                -- Update cache for the correct server (nested Dict: sessionId -> year -> OrdersStatus)
                updatedModel =
                    { model
                        | serverData =
                            updateServerData serverUrl
                                (\sd ->
                                    let
                                        existingYears =
                                            Dict.get ordersStatus.sessionId sd.sessionOrdersStatus
                                                |> Maybe.withDefault Dict.empty

                                        updatedYears =
                                            Dict.insert ordersStatus.pendingYear ordersStatus existingYears
                                    in
                                    { sd
                                        | sessionOrdersStatus =
                                            Dict.insert ordersStatus.sessionId updatedYears sd.sessionOrdersStatus
                                    }
                                )
                                model.serverData
                    }

                -- Also update the dialog if it's open for this session/year on selected server
                isSelectedServer =
                    model.selectedServerUrl == Just serverUrl

                finalModel =
                    case ( model.dialog, isSelectedServer ) of
                        ( Just (TurnFilesDialog form), True ) ->
                            if form.sessionId == ordersStatus.sessionId && form.year == ordersStatus.pendingYear then
                                { updatedModel
                                    | dialog =
                                        Just
                                            (TurnFilesDialog
                                                { form | ordersStatus = Just ordersStatus }
                                            )
                                }

                            else
                                updatedModel

                        _ ->
                            updatedModel
            in
            ( finalModel, Cmd.none )

        Err _ ->
            -- Silently ignore errors - orders might not be available yet
            ( model, Cmd.none )



-- =============================================================================
-- GAME DIRECTORY AND LAUNCH
-- =============================================================================


{-| Open game directory.
-}
handleOpenGameDir : Model -> String -> ( Model, Cmd Msg )
handleOpenGameDir model sessionId =
    case model.selectedServerUrl of
        Just serverUrl ->
            ( model
            , Ports.openGameDir (Encode.openGameDir serverUrl sessionId)
            )

        Nothing ->
            ( model, Cmd.none )


{-| Launch Stars! game.
-}
handleLaunchStars : Model -> String -> ( Model, Cmd Msg )
handleLaunchStars model sessionId =
    case model.selectedServerUrl of
        Just serverUrl ->
            ( model
            , Ports.launchStars (Encode.launchStars serverUrl sessionId)
            )

        Nothing ->
            ( model, Cmd.none )


{-| Handle launch Stars! result.
-}
handleLaunchStarsResult : Model -> Result String () -> ( Model, Cmd Msg )
handleLaunchStarsResult model result =
    case result of
        Ok () ->
            -- Successfully launched, nothing to update
            ( model, Cmd.none )

        Err errMsg ->
            -- Show error to user
            ( { model | error = Just errMsg }, Cmd.none )


{-| Handle has Stars exe check result.
-}
handleGotHasStarsExe : Model -> Result String { serverUrl : String, sessionId : String, hasStarsExe : Bool } -> ( Model, Cmd Msg )
handleGotHasStarsExe model result =
    case result of
        Ok { serverUrl, sessionId, hasStarsExe } ->
            ( { model
                | serverData =
                    updateServerData serverUrl
                        (\data ->
                            { data
                                | sessionHasStarsExe =
                                    Dict.insert sessionId hasStarsExe data.sessionHasStarsExe
                            }
                        )
                        model.serverData
              }
            , Cmd.none
            )

        Err _ ->
            -- Ignore errors, button will remain disabled
            ( model, Cmd.none )
