module Update.Sessions exposing
    ( Msg(..)
    , update
    )

{-| Update handlers for session-related messages.

Handles session listing, creation, joining, quitting, and archiving.

-}

import Api.Encode as Encode
import Api.Session exposing (Session)
import Dict
import Json.Encode as E
import Model exposing (..)
import Ports
import Set
import Task
import Time
import Update.Helpers exposing (updateCreateSessionForm, updateDialogError)


{-| Messages for the sessions domain.
-}
type Msg
    = GotSessions String (Result String (List Session))
    | GotFetchStartTime String Time.Posix
    | GotFetchEndTime String (Result String (List Session)) Time.Posix
    | SetSessionFilter SessionFilter
    | RefreshSessions
    | FetchArchivedSessions
    | GotArchivedSessions String (Result String (List Session))
    | GotSession String (Result String Session)
      -- Session Creation
    | OpenCreateSessionDialog
    | UpdateCreateSessionName String
    | UpdateCreateSessionPublic Bool
    | SubmitCreateSession
    | SessionCreated String (Result String Session)
      -- Session Join
    | JoinSession String
    | SessionJoined String (Result String Session)
      -- Session Delete
    | DeleteSession String
    | SessionDeleted String (Result String ())
      -- Session Quit
    | QuitSession String
    | SessionQuitResult String (Result String ())
      -- Member Promote
    | PromoteMember String String
    | MemberPromoted String (Result String ())
      -- Session Archive
    | ArchiveSession String
    | SessionArchived String (Result String ())
      -- Player Ready State
    | SetPlayerReady String Bool
    | PlayerReadyResult String (Result String ())
      -- Start Game
    | StartGame String
    | GameStarted String (Result String ())
      -- External Events
    | SessionsUpdated String
      -- Session Backup
    | DownloadSessionBackup String
    | SessionBackupDownloaded String (Result String ())
    | DownloadHistoricBackup String
    | HistoricBackupDownloaded String (Result String ())


{-| Update function for sessions messages.
-}
update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        GotSessions serverUrl result ->
            handleGotSessions model serverUrl result

        GotFetchStartTime serverUrl time ->
            handleGotFetchStartTime model serverUrl time

        GotFetchEndTime serverUrl result time ->
            handleGotFetchEndTime model serverUrl result time

        SetSessionFilter filter ->
            handleSetSessionFilter model filter

        RefreshSessions ->
            handleRefreshSessions model

        FetchArchivedSessions ->
            handleFetchArchivedSessions model

        GotArchivedSessions serverUrl result ->
            handleGotArchivedSessions model serverUrl result

        GotSession serverUrl result ->
            handleGotSession model serverUrl result

        OpenCreateSessionDialog ->
            handleOpenCreateSessionDialog model

        UpdateCreateSessionName name ->
            handleUpdateCreateSessionName model name

        UpdateCreateSessionPublic isPublic ->
            handleUpdateCreateSessionPublic model isPublic

        SubmitCreateSession ->
            handleSubmitCreateSession model

        SessionCreated serverUrl result ->
            handleSessionCreated model serverUrl result

        JoinSession sessionId ->
            handleJoinSession model sessionId

        SessionJoined serverUrl result ->
            handleSessionJoined model serverUrl result

        DeleteSession sessionId ->
            handleDeleteSession model sessionId

        SessionDeleted serverUrl result ->
            handleSessionDeleted model serverUrl result

        QuitSession sessionId ->
            handleQuitSession model sessionId

        SessionQuitResult serverUrl result ->
            handleSessionQuitResult model serverUrl result

        PromoteMember sessionId memberId ->
            handlePromoteMember model sessionId memberId

        MemberPromoted serverUrl result ->
            handleMemberPromoted model serverUrl result

        ArchiveSession sessionId ->
            handleArchiveSession model sessionId

        SessionArchived serverUrl result ->
            handleSessionArchived model serverUrl result

        SetPlayerReady sessionId ready ->
            handleSetPlayerReady model sessionId ready

        PlayerReadyResult serverUrl result ->
            handlePlayerReadyResult model serverUrl result

        StartGame sessionId ->
            handleStartGame model sessionId

        GameStarted serverUrl result ->
            handleGameStarted model serverUrl result

        SessionsUpdated serverUrl ->
            handleSessionsUpdated model serverUrl

        DownloadSessionBackup sessionId ->
            handleDownloadSessionBackup model sessionId

        SessionBackupDownloaded _ result ->
            handleSessionBackupDownloaded model result

        DownloadHistoricBackup sessionId ->
            handleDownloadHistoricBackup model sessionId

        HistoricBackupDownloaded _ result ->
            handleHistoricBackupDownloaded model result



-- =============================================================================
-- SESSION LISTING
-- =============================================================================


{-| Handle sessions result - forward to timing handler.
-}
handleGotSessions : Model -> String -> Result String (List Session) -> ( Model, Cmd Msg )
handleGotSessions model serverUrl result =
    ( model
    , Task.perform (GotFetchEndTime serverUrl result) Time.now
    )


{-| Handle fetch start time - record timestamp and fetch sessions.
-}
handleGotFetchStartTime : Model -> String -> Time.Posix -> ( Model, Cmd Msg )
handleGotFetchStartTime model serverUrl startTime =
    let
        startMs =
            Time.posixToMillis startTime
    in
    ( { model
        | serverData =
            updateServerData serverUrl
                (\sd -> { sd | fetchStartTime = Just startMs })
                model.serverData
      }
    , Ports.getSessions serverUrl
    )


{-| Handle fetch end time - process sessions and calculate timing.
-}
handleGotFetchEndTime : Model -> String -> Result String (List Session) -> Time.Posix -> ( Model, Cmd Msg )
handleGotFetchEndTime model serverUrl result endTime =
    case result of
        Ok sessions ->
            let
                -- Get current cached data
                currentData =
                    getServerData serverUrl model.serverData

                -- Calculate fetch duration if we have a start time
                endMs =
                    Time.posixToMillis endTime

                fetchResult =
                    case currentData.fetchStartTime of
                        Just startMs ->
                            Just
                                { sessionCount = List.length sessions
                                , durationMs = endMs - startMs
                                }

                        Nothing ->
                            Nothing

                -- Find sessions that have rules set but aren't in our cache
                sessionsNeedingRules =
                    sessions
                        |> List.filter
                            (\s ->
                                s.rulesIsSet
                                    && not (Dict.member s.id currentData.sessionRules)
                            )

                -- Create commands to fetch rules for each uncached session
                rulesFetchCmds =
                    sessionsNeedingRules
                        |> List.map (\s -> Ports.getRules (Encode.getRules serverUrl s.id))

                -- Get current user ID if connected
                maybeUserId =
                    case currentData.connectionState of
                        Connected info ->
                            Just info.userId

                        _ ->
                            Nothing

                -- Helper to check if user is member or manager of a session
                isUserInSession userId session =
                    List.member userId session.members || List.member userId session.managers

                -- Find started sessions that don't have cached orders status
                sessionsNeedingOrders =
                    sessions
                        |> List.filter
                            (\s ->
                                Api.Session.isStarted s
                                    && not (Dict.member s.id currentData.sessionOrdersStatus)
                            )

                -- Create commands to fetch orders status for each started session
                ordersFetchCmds =
                    sessionsNeedingOrders
                        |> List.map (\s -> Ports.getOrdersStatus (Encode.getOrdersStatus serverUrl s.id))

                -- Find started sessions where user is member/manager and turns not cached
                sessionsNeedingTurns =
                    case maybeUserId of
                        Just userId ->
                            sessions
                                |> List.filter
                                    (\s ->
                                        Api.Session.isStarted s
                                            && isUserInSession userId s
                                            && not (Dict.member s.id currentData.sessionTurns)
                                    )

                        Nothing ->
                            []

                -- Create commands to fetch latest turn for each session needing turns
                turnsFetchCmds =
                    sessionsNeedingTurns
                        |> List.map (\s -> Ports.getLatestTurn (Encode.getLatestTurn serverUrl s.id))

                -- Check if this is the selected server and session detail still exists
                isSelectedServer =
                    model.selectedServerUrl == Just serverUrl

                sessionDetailStillExists =
                    case model.sessionDetail of
                        Just detail ->
                            List.any (\s -> s.id == detail.sessionId) sessions

                        Nothing ->
                            True

                -- Close session detail only if it's the selected server and session was deleted
                ( updatedSessionDetail, baseServerData ) =
                    if not isSelectedServer then
                        -- Not selected server, just update sessions
                        ( model.sessionDetail
                        , updateServerData serverUrl
                            (\sd ->
                                { sd
                                    | sessions = sessions
                                    , fetchingSessions = False
                                    , fetchStartTime = Nothing
                                    , lastFetchResult = fetchResult
                                }
                            )
                            model.serverData
                        )

                    else if sessionDetailStillExists then
                        ( model.sessionDetail
                        , updateServerData serverUrl
                            (\sd ->
                                { sd
                                    | sessions = sessions
                                    , fetchingSessions = False
                                    , fetchStartTime = Nothing
                                    , lastFetchResult = fetchResult
                                }
                            )
                            model.serverData
                        )

                    else
                        -- Session was deleted on selected server, close detail and clear lastViewedSession
                        ( Nothing
                        , updateServerData serverUrl
                            (\sd ->
                                { sd
                                    | sessions = sessions
                                    , lastViewedSession = Nothing
                                    , fetchingSessions = False
                                    , fetchStartTime = Nothing
                                    , lastFetchResult = fetchResult
                                }
                            )
                            model.serverData
                        )
            in
            ( { model
                | serverData = baseServerData
                , sessionDetail = updatedSessionDetail
              }
            , Cmd.batch (rulesFetchCmds ++ ordersFetchCmds ++ turnsFetchCmds)
            )

        Err err ->
            -- Clear fetch state on error
            ( { model
                | error = Just err
                , serverData =
                    updateServerData serverUrl
                        (\sd ->
                            { sd
                                | fetchingSessions = False
                                , fetchStartTime = Nothing
                            }
                        )
                        model.serverData
              }
            , Cmd.none
            )


{-| Set session filter.
-}
handleSetSessionFilter : Model -> SessionFilter -> ( Model, Cmd Msg )
handleSetSessionFilter model filter =
    ( { model | sessionFilter = filter }
    , Cmd.none
    )


{-| Handle refresh sessions request.
-}
handleRefreshSessions : Model -> ( Model, Cmd Msg )
handleRefreshSessions model =
    case model.selectedServerUrl of
        Just serverUrl ->
            ( { model
                | serverData =
                    updateServerData serverUrl
                        (\sd -> { sd | fetchingSessions = True })
                        model.serverData
              }
            , Task.perform (GotFetchStartTime serverUrl) Time.now
            )

        Nothing ->
            ( model, Cmd.none )


{-| Handle fetch archived sessions request.
-}
handleFetchArchivedSessions : Model -> ( Model, Cmd Msg )
handleFetchArchivedSessions model =
    case model.selectedServerUrl of
        Just serverUrl ->
            ( model
            , Ports.getSessionsIncludeArchived serverUrl
            )

        Nothing ->
            ( model, Cmd.none )


{-| Handle archived sessions result.
-}
handleGotArchivedSessions : Model -> String -> Result String (List Session) -> ( Model, Cmd Msg )
handleGotArchivedSessions model serverUrl result =
    case result of
        Ok archivedSessions ->
            -- Merge archived sessions with existing sessions (replace duplicates)
            let
                currentData =
                    getServerData serverUrl model.serverData

                existingIds =
                    List.map .id currentData.sessions
                        |> Set.fromList

                -- Add only new archived sessions that aren't already in the list
                newArchivedSessions =
                    List.filter (\s -> not (Set.member s.id existingIds)) archivedSessions

                mergedSessions =
                    -- Update existing sessions with archived data + add new ones
                    List.map
                        (\existing ->
                            List.filter (\s -> s.id == existing.id) archivedSessions
                                |> List.head
                                |> Maybe.withDefault existing
                        )
                        currentData.sessions
                        ++ newArchivedSessions
            in
            ( { model
                | serverData =
                    updateServerData serverUrl
                        (\sd ->
                            { sd
                                | sessions = mergedSessions
                                , archivedSessionsFetched = True
                            }
                        )
                        model.serverData
              }
            , Cmd.none
            )

        Err err ->
            ( { model | error = Just err }
            , Cmd.none
            )


{-| Handle single session result.
-}
handleGotSession : Model -> String -> Result String Session -> ( Model, Cmd Msg )
handleGotSession model serverUrl result =
    case result of
        Ok session ->
            -- Upsert the session in the sessions list (add if not found, update if exists)
            let
                currentData =
                    getServerData serverUrl model.serverData

                sessionExists =
                    List.any (\s -> s.id == session.id) currentData.sessions

                updatedSessions =
                    if sessionExists then
                        List.map
                            (\s ->
                                if s.id == session.id then
                                    session

                                else
                                    s
                            )
                            currentData.sessions

                    else
                        session :: currentData.sessions

                -- Check if we should open session detail (from ViewInvitedSession)
                -- Only open if this is for the selected server
                shouldOpenDetail =
                    model.pendingViewSessionId
                        == Just session.id
                        && model.selectedServerUrl
                        == Just serverUrl

                updatedModel =
                    { model
                        | serverData =
                            updateServerData serverUrl
                                (\sd -> { sd | sessions = updatedSessions })
                                model.serverData
                        , pendingViewSessionId =
                            if shouldOpenDetail then
                                Nothing

                            else
                                model.pendingViewSessionId
                    }
            in
            if shouldOpenDetail then
                ( { updatedModel
                    | sessionDetail =
                        Just
                            { sessionId = session.id
                            , showInviteDialog = False
                            , dragState = Nothing
                            , playersExpanded = not (Api.Session.isStarted session)
                            }
                  }
                , Cmd.none
                )

            else
                ( updatedModel, Cmd.none )

        Err _ ->
            ( { model | pendingViewSessionId = Nothing }, Cmd.none )



-- =============================================================================
-- SESSION CREATION
-- =============================================================================


{-| Open create session dialog.
-}
handleOpenCreateSessionDialog : Model -> ( Model, Cmd Msg )
handleOpenCreateSessionDialog model =
    ( { model
        | dialog =
            Just
                (CreateSessionDialog
                    { name = ""
                    , isPublic = True
                    , error = Nothing
                    , submitting = False
                    }
                )
      }
    , Cmd.none
    )


{-| Update create session form name field.
-}
handleUpdateCreateSessionName : Model -> String -> ( Model, Cmd Msg )
handleUpdateCreateSessionName model name =
    ( updateCreateSessionForm model (\form -> { form | name = name })
    , Cmd.none
    )


{-| Update create session form public/private field.
-}
handleUpdateCreateSessionPublic : Model -> Bool -> ( Model, Cmd Msg )
handleUpdateCreateSessionPublic model isPublic =
    ( updateCreateSessionForm model (\form -> { form | isPublic = isPublic })
    , Cmd.none
    )


{-| Submit create session form.
-}
handleSubmitCreateSession : Model -> ( Model, Cmd Msg )
handleSubmitCreateSession model =
    case ( model.dialog, model.selectedServerUrl ) of
        ( Just (CreateSessionDialog form), Just serverUrl ) ->
            if String.isEmpty form.name then
                ( updateDialogError model "Session name is required"
                , Cmd.none
                )

            else
                ( updateCreateSessionForm model (\f -> { f | submitting = True, error = Nothing })
                , Ports.createSession (Encode.createSession serverUrl form.name form.isPublic)
                )

        _ ->
            ( model, Cmd.none )


{-| Handle session created result.
-}
handleSessionCreated : Model -> String -> Result String Session -> ( Model, Cmd Msg )
handleSessionCreated model serverUrl result =
    case result of
        Ok _ ->
            ( { model | dialog = Nothing }
            , Ports.getSessions serverUrl
            )

        Err err ->
            ( updateDialogError model err
            , Cmd.none
            )



-- =============================================================================
-- SESSION JOIN
-- =============================================================================


{-| Handle join session request.
-}
handleJoinSession : Model -> String -> ( Model, Cmd Msg )
handleJoinSession model sessionId =
    ( model
    , case model.selectedServerUrl of
        Just serverUrl ->
            Ports.joinSession (Encode.joinSession serverUrl sessionId)

        Nothing ->
            Cmd.none
    )


{-| Handle session joined result.
-}
handleSessionJoined : Model -> String -> Result String Session -> ( Model, Cmd Msg )
handleSessionJoined model serverUrl result =
    case result of
        Ok _ ->
            ( model
            , Ports.getSessions serverUrl
            )

        Err err ->
            ( { model | error = Just err }
            , Cmd.none
            )



-- =============================================================================
-- SESSION DELETE
-- =============================================================================


{-| Handle delete session request.
-}
handleDeleteSession : Model -> String -> ( Model, Cmd Msg )
handleDeleteSession model sessionId =
    case model.selectedServerUrl of
        Just serverUrl ->
            ( model
            , Ports.deleteSession
                (E.object
                    [ ( "serverUrl", E.string serverUrl )
                    , ( "sessionId", E.string sessionId )
                    ]
                )
            )

        Nothing ->
            ( model, Cmd.none )


{-| Handle session deleted result.
-}
handleSessionDeleted : Model -> String -> Result String () -> ( Model, Cmd Msg )
handleSessionDeleted model serverUrl result =
    case result of
        Ok _ ->
            -- Close the detail view, clean up local data, and refresh sessions list
            let
                -- Get the sessionId from the detail view before clearing it
                maybeSessionId =
                    model.sessionDetail |> Maybe.map .sessionId

                -- Clean up local data for the deleted session
                cleanedServerData =
                    case maybeSessionId of
                        Just sessionId ->
                            updateServerData serverUrl
                                (\sd ->
                                    { sd
                                        | sessionRules = Dict.remove sessionId sd.sessionRules
                                        , sessionTurns = Dict.remove sessionId sd.sessionTurns
                                    }
                                )
                                model.serverData

                        Nothing ->
                            model.serverData
            in
            ( { model
                | sessionDetail = Nothing
                , serverData = cleanedServerData
              }
            , Ports.getSessions serverUrl
            )

        Err err ->
            ( { model | error = Just err }
            , Cmd.none
            )



-- =============================================================================
-- SESSION QUIT
-- =============================================================================


{-| Handle quit session request.
-}
handleQuitSession : Model -> String -> ( Model, Cmd Msg )
handleQuitSession model sessionId =
    case model.selectedServerUrl of
        Just serverUrl ->
            ( model
            , Ports.quitSession
                (E.object
                    [ ( "serverUrl", E.string serverUrl )
                    , ( "sessionId", E.string sessionId )
                    ]
                )
            )

        Nothing ->
            ( model, Cmd.none )


{-| Handle session quit result.
-}
handleSessionQuitResult : Model -> String -> Result String () -> ( Model, Cmd Msg )
handleSessionQuitResult model serverUrl result =
    case result of
        Ok _ ->
            -- Close the detail view, clean up local data, and refresh sessions list
            let
                -- Get the sessionId from the detail view before clearing it
                maybeSessionId =
                    model.sessionDetail |> Maybe.map .sessionId

                -- Clean up local data for the quit session
                cleanedServerData =
                    case maybeSessionId of
                        Just sessionId ->
                            updateServerData serverUrl
                                (\sd ->
                                    { sd
                                        | sessionRules = Dict.remove sessionId sd.sessionRules
                                        , sessionTurns = Dict.remove sessionId sd.sessionTurns
                                    }
                                )
                                model.serverData

                        Nothing ->
                            model.serverData
            in
            ( { model
                | sessionDetail = Nothing
                , serverData = cleanedServerData
              }
            , Ports.getSessions serverUrl
            )

        Err err ->
            ( { model | error = Just err }
            , Cmd.none
            )



-- =============================================================================
-- MEMBER PROMOTE
-- =============================================================================


{-| Handle promote member request.
-}
handlePromoteMember : Model -> String -> String -> ( Model, Cmd Msg )
handlePromoteMember model sessionId memberId =
    case model.selectedServerUrl of
        Just serverUrl ->
            ( model
            , Ports.promoteMember
                (E.object
                    [ ( "serverUrl", E.string serverUrl )
                    , ( "sessionId", E.string sessionId )
                    , ( "memberId", E.string memberId )
                    ]
                )
            )

        Nothing ->
            ( model, Cmd.none )


{-| Handle member promoted result.
-}
handleMemberPromoted : Model -> String -> Result String () -> ( Model, Cmd Msg )
handleMemberPromoted model serverUrl result =
    case result of
        Ok _ ->
            -- Refresh the session detail to show updated managers/members
            case model.sessionDetail of
                Just detail ->
                    ( model
                    , Ports.getSession (Encode.getSession serverUrl detail.sessionId)
                    )

                Nothing ->
                    ( model, Cmd.none )

        Err err ->
            ( { model | error = Just err }
            , Cmd.none
            )



-- =============================================================================
-- SESSION ARCHIVE
-- =============================================================================


{-| Handle archive session request.
-}
handleArchiveSession : Model -> String -> ( Model, Cmd Msg )
handleArchiveSession model sessionId =
    case model.selectedServerUrl of
        Just serverUrl ->
            ( model
            , Ports.archiveSession
                (E.object
                    [ ( "serverUrl", E.string serverUrl )
                    , ( "sessionId", E.string sessionId )
                    ]
                )
            )

        Nothing ->
            ( model, Cmd.none )


{-| Handle session archived result.
-}
handleSessionArchived : Model -> String -> Result String () -> ( Model, Cmd Msg )
handleSessionArchived model serverUrl result =
    case result of
        Ok _ ->
            -- Refresh sessions to update the state
            ( model
            , Ports.getSessions serverUrl
            )

        Err err ->
            ( { model | error = Just err }
            , Cmd.none
            )



-- =============================================================================
-- SESSIONS UPDATED (from polling/notification)
-- =============================================================================


{-| Handle sessions updated notification.
-}
handleSessionsUpdated : Model -> String -> ( Model, Cmd Msg )
handleSessionsUpdated model serverUrl =
    ( model
    , Ports.getSessions serverUrl
    )



-- =============================================================================
-- START GAME
-- =============================================================================


{-| Handle start game request.
-}
handleStartGame : Model -> String -> ( Model, Cmd Msg )
handleStartGame model sessionId =
    case model.selectedServerUrl of
        Just serverUrl ->
            ( { model | startingSessionId = Just sessionId }
            , Ports.startGame
                (E.object
                    [ ( "serverUrl", E.string serverUrl )
                    , ( "sessionId", E.string sessionId )
                    ]
                )
            )

        Nothing ->
            ( model, Cmd.none )


{-| Handle game started result.
-}
handleGameStarted : Model -> String -> Result String () -> ( Model, Cmd Msg )
handleGameStarted model serverUrl result =
    case result of
        Ok _ ->
            -- Refresh sessions to update the state
            case model.sessionDetail of
                Just detail ->
                    ( { model | startingSessionId = Nothing }
                    , Cmd.batch
                        [ Ports.getSessions serverUrl
                        , Ports.getSession (Encode.getSession serverUrl detail.sessionId)

                        -- Also fetch player control status (managers will see AI control UI)
                        , Ports.getPlayerControl
                            (E.object
                                [ ( "serverUrl", E.string serverUrl )
                                , ( "sessionId", E.string detail.sessionId )
                                ]
                            )
                        ]
                    )

                Nothing ->
                    ( { model | startingSessionId = Nothing }
                    , Ports.getSessions serverUrl
                    )

        Err err ->
            ( { model | startingSessionId = Nothing, error = Just err }
            , Cmd.none
            )



-- =============================================================================
-- PLAYER READY STATE
-- =============================================================================


{-| Handle set player ready request.
-}
handleSetPlayerReady : Model -> String -> Bool -> ( Model, Cmd Msg )
handleSetPlayerReady model sessionId ready =
    case model.selectedServerUrl of
        Just serverUrl ->
            ( model
            , Ports.setPlayerReady
                (E.object
                    [ ( "serverUrl", E.string serverUrl )
                    , ( "sessionId", E.string sessionId )
                    , ( "ready", E.bool ready )
                    ]
                )
            )

        Nothing ->
            ( model, Cmd.none )


{-| Handle player ready result.
-}
handlePlayerReadyResult : Model -> String -> Result String () -> ( Model, Cmd Msg )
handlePlayerReadyResult model serverUrl result =
    case result of
        Ok _ ->
            -- Refresh the session to update the player state
            case model.sessionDetail of
                Just detail ->
                    ( model
                    , Ports.getSession (Encode.getSession serverUrl detail.sessionId)
                    )

                Nothing ->
                    ( model, Cmd.none )

        Err err ->
            ( { model | error = Just err }
            , Cmd.none
            )



-- =============================================================================
-- SESSION BACKUP
-- =============================================================================


{-| Handle download session backup request.
-}
handleDownloadSessionBackup : Model -> String -> ( Model, Cmd Msg )
handleDownloadSessionBackup model sessionId =
    case model.selectedServerUrl of
        Just serverUrl ->
            ( model
            , Ports.downloadSessionBackup
                (E.object
                    [ ( "serverUrl", E.string serverUrl )
                    , ( "sessionId", E.string sessionId )
                    ]
                )
            )

        Nothing ->
            ( model, Cmd.none )


{-| Handle session backup downloaded result.
-}
handleSessionBackupDownloaded : Model -> Result String () -> ( Model, Cmd Msg )
handleSessionBackupDownloaded model result =
    case result of
        Ok _ ->
            ( model, Cmd.none )

        Err err ->
            ( { model | error = Just err }
            , Cmd.none
            )


{-| Handle download historic backup request.
-}
handleDownloadHistoricBackup : Model -> String -> ( Model, Cmd Msg )
handleDownloadHistoricBackup model sessionId =
    case model.selectedServerUrl of
        Just serverUrl ->
            ( model
            , Ports.downloadHistoricBackup
                (E.object
                    [ ( "serverUrl", E.string serverUrl )
                    , ( "sessionId", E.string sessionId )
                    ]
                )
            )

        Nothing ->
            ( model, Cmd.none )


{-| Handle historic backup downloaded result.
-}
handleHistoricBackupDownloaded : Model -> Result String () -> ( Model, Cmd Msg )
handleHistoricBackupDownloaded model result =
    case result of
        Ok _ ->
            ( model, Cmd.none )

        Err err ->
            ( { model | error = Just err }
            , Cmd.none
            )
