module Update exposing (update)

{-| Application update logic.

This module handles all state transitions in response to messages.

-}

import Api.Encode as Encode
import Api.Rules exposing (Rules)
import Api.Server exposing (Server)
import Api.Session exposing (Session)
import Api.TurnFiles exposing (TurnFiles)
import Api.UserProfile exposing (UserProfile)
import Dict
import Json.Encode as E
import Set
import Model exposing (..)
import Msg exposing (Msg(..))
import Ports
import Process
import Task
import Time



-- =============================================================================
-- UPDATE
-- =============================================================================


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        NoOp ->
            ( model, Cmd.none )

        -- =====================================================================
        -- Server Messages
        -- =====================================================================
        GotServers result ->
            case result of
                Ok servers ->
                    ( { model
                        | servers = servers
                        , loading = False
                        , error = Nothing
                      }
                    , Ports.getAppSettings ()
                    )

                Err err ->
                    ( { model
                        | loading = False
                        , error = Just err
                      }
                    , Cmd.none
                    )

        SelectServer serverUrl ->
            let
                -- Save current session detail to previous server's lastViewedSession
                serverDataWithSavedView =
                    case ( model.selectedServerUrl, model.sessionDetail ) of
                        ( Just prevServerUrl, Just detail ) ->
                            updateServerData prevServerUrl
                                (\sd -> { sd | lastViewedSession = Just detail.sessionId })
                                model.serverData

                        ( Just prevServerUrl, Nothing ) ->
                            -- Clear lastViewedSession if we're on session list
                            updateServerData prevServerUrl
                                (\sd -> { sd | lastViewedSession = Nothing })
                                model.serverData

                        _ ->
                            model.serverData

                -- Get the new server's data to check for lastViewedSession
                newServerData =
                    getServerData serverUrl serverDataWithSavedView

                -- Try to restore session detail if lastViewedSession exists and session is still valid
                ( restoredSessionDetail, restoredSelectedSessionId ) =
                    case newServerData.lastViewedSession of
                        Just sessionId ->
                            -- Check if session still exists
                            case List.filter (\s -> s.id == sessionId) newServerData.sessions |> List.head of
                                Just session ->
                                    ( Just
                                        { sessionId = sessionId
                                        , showInviteDialog = False
                                        , dragState = Nothing
                                        , playersExpanded = not session.started
                                        }
                                    , Just sessionId
                                    )

                                Nothing ->
                                    -- Session was deleted, clear the lastViewedSession
                                    ( Nothing, Nothing )

                        Nothing ->
                            ( Nothing, Nothing )

                -- If session was deleted, update serverData to clear lastViewedSession
                finalServerData =
                    case ( newServerData.lastViewedSession, restoredSessionDetail ) of
                        ( Just _, Nothing ) ->
                            -- Session was deleted, clear it
                            updateServerData serverUrl
                                (\sd -> { sd | lastViewedSession = Nothing })
                                serverDataWithSavedView

                        _ ->
                            serverDataWithSavedView

                newModel =
                    { model
                        | selectedServerUrl = Just serverUrl
                        , contextMenu = Nothing
                        , selectedSessionId = restoredSelectedSessionId
                        , sessionDetail = restoredSessionDetail
                        , serverData = finalServerData
                    }

                maybeServer =
                    getServerByUrl serverUrl model.servers
            in
            if isConnected serverUrl model.serverData then
                -- Already connected, just switch view (data is kept up-to-date via notifications)
                ( newModel
                , Cmd.none
                )

            else
                -- Not connected, check if we have saved credentials
                case maybeServer of
                    Just server ->
                        if server.hasCredentials then
                            -- Try auto-connect with saved credentials
                            ( { newModel
                                | serverData =
                                    updateServerData serverUrl
                                        (\sd -> { sd | connectionState = Connecting })
                                        newModel.serverData
                              }
                            , Ports.autoConnect serverUrl
                            )

                        else
                            -- No credentials, show connect dialog
                            ( { newModel
                                | dialog = Just (ConnectDialog serverUrl emptyConnectForm)
                              }
                            , Cmd.none
                            )

                    Nothing ->
                        -- Server not found, show connect dialog anyway
                        ( { newModel
                            | dialog = Just (ConnectDialog serverUrl emptyConnectForm)
                          }
                        , Cmd.none
                        )

        ServerAdded result ->
            case result of
                Ok _ ->
                    ( { model | dialog = Nothing }
                    , Ports.getServers ()
                    )

                Err err ->
                    ( updateDialogError model err
                    , Cmd.none
                    )

        ServerUpdated result ->
            case result of
                Ok _ ->
                    ( { model | dialog = Nothing }
                    , Ports.getServers ()
                    )

                Err err ->
                    ( updateDialogError model err
                    , Cmd.none
                    )

        ServerRemoved result ->
            case result of
                Ok _ ->
                    ( { model
                        | dialog = Nothing
                        , selectedServerUrl = Nothing
                      }
                    , Ports.getServers ()
                    )

                Err err ->
                    ( { model | error = Just err }
                    , Cmd.none
                    )

        -- =====================================================================
        -- Server Dialog Messages
        -- =====================================================================
        OpenAddServerDialog ->
            ( { model | dialog = Just (AddServerDialog emptyServerForm) }
            , Cmd.none
            )

        OpenEditServerDialog serverUrl ->
            case getServerByUrl serverUrl model.servers of
                Just server ->
                    ( { model
                        | dialog =
                            Just
                                (EditServerDialog serverUrl
                                    { name = server.name
                                    , url = server.url
                                    , originalName = Just server.name
                                    , error = Nothing
                                    , submitting = False
                                    }
                                )
                        , contextMenu = Nothing
                      }
                    , Cmd.none
                    )

                Nothing ->
                    ( model, Cmd.none )

        OpenRemoveServerDialog serverUrl serverName ->
            ( { model
                | dialog = Just (RemoveServerDialog serverUrl serverName)
                , contextMenu = Nothing
              }
            , Cmd.none
            )

        CloseDialog ->
            ( { model | dialog = Nothing }
            , Cmd.none
            )

        UpdateServerFormName name ->
            ( updateServerForm model (\form -> { form | name = name })
            , Cmd.none
            )

        UpdateServerFormUrl url ->
            ( updateServerForm model (\form -> { form | url = url })
            , Cmd.none
            )

        SubmitAddServer ->
            case model.dialog of
                Just (AddServerDialog form) ->
                    if String.isEmpty form.name || String.isEmpty form.url then
                        ( updateDialogError model "Name and URL are required"
                        , Cmd.none
                        )

                    else
                        ( updateServerForm model (\f -> { f | submitting = True, error = Nothing })
                        , Ports.addServer (Encode.addServer form.name form.url)
                        )

                _ ->
                    ( model, Cmd.none )

        SubmitEditServer oldUrl ->
            case model.dialog of
                Just (EditServerDialog _ form) ->
                    if String.isEmpty form.name || String.isEmpty form.url then
                        ( updateDialogError model "Name and URL are required"
                        , Cmd.none
                        )

                    else
                        ( updateServerForm model (\f -> { f | submitting = True, error = Nothing })
                        , Ports.updateServer (Encode.updateServer oldUrl form.name form.url)
                        )

                _ ->
                    ( model, Cmd.none )

        ConfirmRemoveServer serverUrl ->
            ( { model | dialog = Nothing }
            , Ports.removeServer serverUrl
            )

        -- =====================================================================
        -- Context Menu Messages
        -- =====================================================================
        ShowContextMenu serverUrl x y ->
            ( { model
                | contextMenu = Just { serverUrl = serverUrl, x = x, y = y }
              }
            , Cmd.none
            )

        HideContextMenu ->
            ( { model | contextMenu = Nothing }
            , Cmd.none
            )

        -- =====================================================================
        -- Connection Messages
        -- =====================================================================
        OpenConnectDialog serverUrl ->
            let
                -- Pre-fill username if server has saved credentials
                form =
                    case getServerByUrl serverUrl model.servers of
                        Just server ->
                            { emptyConnectForm
                                | username = Maybe.withDefault "" server.defaultUsername
                            }

                        Nothing ->
                            emptyConnectForm
            in
            ( { model
                | dialog = Just (ConnectDialog serverUrl form)
                , contextMenu = Nothing
              }
            , Cmd.none
            )

        OpenRegisterDialog serverUrl ->
            ( { model
                | dialog = Just (RegisterDialog serverUrl emptyRegisterForm)
                , contextMenu = Nothing
              }
            , Cmd.none
            )

        SwitchToRegister ->
            case model.dialog of
                Just (ConnectDialog serverUrl _) ->
                    ( { model | dialog = Just (RegisterDialog serverUrl emptyRegisterForm) }
                    , Cmd.none
                    )

                _ ->
                    ( model, Cmd.none )

        SwitchToConnect ->
            case model.dialog of
                Just (RegisterDialog serverUrl _) ->
                    ( { model | dialog = Just (ConnectDialog serverUrl emptyConnectForm) }
                    , Cmd.none
                    )

                _ ->
                    ( model, Cmd.none )

        UpdateConnectUsername username ->
            ( updateConnectForm model (\form -> { form | username = username })
            , Cmd.none
            )

        UpdateConnectPassword password ->
            ( updateConnectForm model (\form -> { form | password = password })
            , Cmd.none
            )

        UpdateRegisterNickname nickname ->
            ( updateRegisterForm model (\form -> { form | nickname = nickname })
            , Cmd.none
            )

        UpdateRegisterEmail email ->
            ( updateRegisterForm model (\form -> { form | email = email })
            , Cmd.none
            )

        UpdateRegisterMessage message ->
            ( updateRegisterForm model (\form -> { form | message = message })
            , Cmd.none
            )

        SubmitConnect serverUrl ->
            case model.dialog of
                Just (ConnectDialog _ form) ->
                    if String.isEmpty form.username || String.isEmpty form.password then
                        ( updateDialogError model "Username and password are required"
                        , Cmd.none
                        )

                    else
                        ( updateConnectForm
                            (setConnectionState serverUrl Connecting model)
                            (\f -> { f | submitting = True, error = Nothing })
                        , Ports.connect (Encode.connect serverUrl form.username form.password)
                        )

                _ ->
                    ( model, Cmd.none )

        SubmitRegister serverUrl ->
            case model.dialog of
                Just (RegisterDialog _ form) ->
                    if String.isEmpty form.nickname || String.isEmpty form.email then
                        ( updateDialogError model "Nickname and email are required"
                        , Cmd.none
                        )

                    else
                        ( updateRegisterForm model (\f -> { f | submitting = True, error = Nothing })
                        , Ports.register (Encode.register serverUrl form.nickname form.email form.message)
                        )

                _ ->
                    ( model, Cmd.none )

        ConnectResult serverUrl result ->
            case result of
                Ok info ->
                    let
                        -- Base commands for all users
                        baseCmds =
                            [ Ports.getSessions serverUrl
                            , Ports.getInvitations serverUrl
                            , Ports.getSentInvitations serverUrl
                            , Ports.getUserProfiles serverUrl
                            ]

                        -- Add pending registrations fetch for managers
                        allCmds =
                            if info.isManager then
                                baseCmds ++ [ Ports.getPendingRegistrations serverUrl ]

                            else
                                baseCmds
                    in
                    ( { model | dialog = Nothing }
                        |> setConnectionState serverUrl (Connected { username = info.username, userId = info.userId, isManager = info.isManager, serialKey = info.serialKey })
                    , Cmd.batch allCmds
                    )

                Err err ->
                    let
                        modelWithError =
                            setConnectionState serverUrl (ConnectionError err) model
                    in
                    case model.dialog of
                        Just (ConnectDialog _ _) ->
                            -- Dialog is open, update it with error
                            ( updateConnectForm modelWithError
                                (\f -> { f | submitting = False, error = Just err })
                            , Cmd.none
                            )

                        Nothing ->
                            -- No dialog (auto-connect failed), show connect dialog with error
                            let
                                -- Pre-fill username if server has saved credentials
                                form =
                                    case getServerByUrl serverUrl model.servers of
                                        Just server ->
                                            { emptyConnectForm
                                                | username = Maybe.withDefault "" server.defaultUsername
                                                , error = Just err
                                            }

                                        Nothing ->
                                            { emptyConnectForm | error = Just err }
                            in
                            ( { modelWithError
                                | dialog = Just (ConnectDialog serverUrl form)
                              }
                            , Cmd.none
                            )

                        _ ->
                            -- Some other dialog is open, just update connection state
                            ( modelWithError, Cmd.none )

        RegisterResult serverUrl result ->
            case result of
                Ok _ ->
                    -- Registration submitted, user is pending approval
                    ( updateRegisterForm model (\f -> { f | submitting = False, success = True })
                    , Cmd.none
                    )

                Err err ->
                    ( updateRegisterForm model (\f -> { f | submitting = False, error = Just err })
                    , Cmd.none
                    )

        Disconnect serverUrl ->
            ( { model
                | showUserMenu = False
                , contextMenu = Nothing
              }
            , Ports.disconnect serverUrl
            )

        DisconnectResult serverUrl result ->
            case result of
                Ok _ ->
                    ( { model
                        | selectedSessionId = Nothing
                        , sessionDetail = Nothing
                        , showUserMenu = False
                        , serverData =
                            updateServerData serverUrl
                                (\_ -> emptyServerData)
                                model.serverData
                      }
                    , Cmd.none
                    )

                Err err ->
                    ( { model | error = Just err }
                    , Cmd.none
                    )

        -- =====================================================================
        -- Session Messages
        -- =====================================================================
        GotSessions serverUrl result ->
            -- Forward to GotFetchEndTime to handle timing calculation
            ( model
            , Task.perform (GotFetchEndTime serverUrl result) Time.now
            )

        GotFetchStartTime serverUrl startTime ->
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

        GotFetchEndTime serverUrl result endTime ->
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
                                        s.started
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
                                                s.started
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

        SelectSession sessionId ->
            ( { model | selectedSessionId = Just sessionId }
            , case model.selectedServerUrl of
                Just serverUrl ->
                    Ports.getSession (Encode.getSession serverUrl sessionId)

                Nothing ->
                    Cmd.none
            )

        SetSessionFilter filter ->
            ( { model | sessionFilter = filter }
            , Cmd.none
            )

        RefreshSessions ->
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

        GotSession serverUrl result ->
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
                                    , playersExpanded = not session.started
                                    }
                          }
                        , Cmd.none
                        )

                    else
                        ( updatedModel, Cmd.none )

                Err _ ->
                    ( { model | pendingViewSessionId = Nothing }, Cmd.none )

        -- =====================================================================
        -- Session Creation Messages
        -- =====================================================================
        OpenCreateSessionDialog ->
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

        UpdateCreateSessionName name ->
            ( updateCreateSessionForm model (\form -> { form | name = name })
            , Cmd.none
            )

        UpdateCreateSessionPublic isPublic ->
            ( updateCreateSessionForm model (\form -> { form | isPublic = isPublic })
            , Cmd.none
            )

        SubmitCreateSession ->
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

        SessionCreated serverUrl result ->
            case result of
                Ok _ ->
                    ( { model | dialog = Nothing }
                    , Ports.getSessions serverUrl
                    )

                Err err ->
                    ( updateDialogError model err
                    , Cmd.none
                    )

        -- =====================================================================
        -- Session Join Messages
        -- =====================================================================
        JoinSession sessionId ->
            ( model
            , case model.selectedServerUrl of
                Just serverUrl ->
                    Ports.joinSession (Encode.joinSession serverUrl sessionId)

                Nothing ->
                    Cmd.none
            )

        SessionJoined serverUrl result ->
            case result of
                Ok _ ->
                    ( model
                    , Ports.getSessions serverUrl
                    )

                Err err ->
                    ( { model | error = Just err }
                    , Cmd.none
                    )

        -- =====================================================================
        -- Session Delete Messages
        -- =====================================================================
        DeleteSession sessionId ->
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

        SessionDeleted serverUrl result ->
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

        -- =====================================================================
        -- Session Quit Messages
        -- =====================================================================
        QuitSession sessionId ->
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

        SessionQuitResult serverUrl result ->
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

        -- =====================================================================
        -- Member Promote Messages
        -- =====================================================================
        PromoteMember sessionId memberId ->
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

        MemberPromoted serverUrl result ->
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

        -- =====================================================================
        -- Session Detail & Invitation Messages
        -- =====================================================================
        ViewSessionDetail sessionId ->
            -- Store the sessionId and fetch latest turn if session is started
            let
                serverData =
                    getCurrentServerData model

                maybeSession =
                    List.filter (\s -> s.id == sessionId) serverData.sessions
                        |> List.head

                -- Fetch latest turn and check for stars.exe if session is started
                -- Also always fetch session player race for current user
                cmds =
                    case ( maybeSession, model.selectedServerUrl ) of
                        ( Just session, Just serverUrl ) ->
                            let
                                baseCmds =
                                    -- Always try to fetch the current user's race for this session
                                    [ Ports.getSessionPlayerRace (Encode.getSessionPlayerRace serverUrl sessionId) ]

                                turnCmds =
                                    if session.started then
                                        [ Ports.getLatestTurn (Encode.getLatestTurn serverUrl sessionId)
                                        , Ports.checkHasStarsExe (Encode.checkHasStarsExe serverUrl sessionId)
                                        ]

                                    else
                                        []
                            in
                            baseCmds ++ turnCmds

                        _ ->
                            []

                -- Save lastViewedSession for the current server
                updatedServerData =
                    case model.selectedServerUrl of
                        Just serverUrl ->
                            updateServerData serverUrl
                                (\sd -> { sd | lastViewedSession = Just sessionId })
                                model.serverData

                        Nothing ->
                            model.serverData

                -- Players section is collapsed by default when session is started
                isStarted =
                    maybeSession |> Maybe.map .started |> Maybe.withDefault False
            in
            ( { model
                | sessionDetail =
                    Just
                        { sessionId = sessionId
                        , showInviteDialog = False
                        , dragState = Nothing
                        , playersExpanded = not isStarted
                        }
                , serverData = updatedServerData
              }
            , Cmd.batch cmds
            )

        CloseSessionDetail ->
            -- Clear lastViewedSession when closing session detail
            let
                updatedServerData =
                    case model.selectedServerUrl of
                        Just serverUrl ->
                            updateServerData serverUrl
                                (\sd -> { sd | lastViewedSession = Nothing })
                                model.serverData

                        Nothing ->
                            model.serverData
            in
            ( { model | sessionDetail = Nothing, serverData = updatedServerData }
            , Cmd.none
            )

        TogglePlayersExpanded ->
            case model.sessionDetail of
                Just detail ->
                    ( { model | sessionDetail = Just { detail | playersExpanded = not detail.playersExpanded } }
                    , Cmd.none
                    )

                Nothing ->
                    ( model, Cmd.none )

        LoadUserProfiles ->
            ( model
            , case model.selectedServerUrl of
                Just serverUrl ->
                    Ports.getUserProfiles serverUrl

                Nothing ->
                    Cmd.none
            )

        GotUserProfiles serverUrl result ->
            case result of
                Ok profiles ->
                    let
                        updatedModel =
                            { model
                                | serverData =
                                    updateServerData serverUrl
                                        (\sd -> { sd | userProfiles = profiles })
                                        model.serverData
                            }

                        -- Also update the UsersListDialog if it's open
                        finalModel =
                            case model.dialog of
                                Just (UsersListDialog state) ->
                                    { updatedModel | dialog = Just (UsersListDialog { state | users = profiles }) }

                                _ ->
                                    updatedModel
                    in
                    ( finalModel, Cmd.none )

                Err _ ->
                    ( model, Cmd.none )

        OpenInviteDialog ->
            case model.sessionDetail of
                Just detail ->
                    ( { model
                        | dialog = Just (InviteUserDialog (emptyInviteForm detail.sessionId))
                      }
                    , case model.selectedServerUrl of
                        Just serverUrl ->
                            Ports.getUserProfiles serverUrl

                        Nothing ->
                            Cmd.none
                    )

                Nothing ->
                    ( model, Cmd.none )

        CloseInviteDialog ->
            ( { model | dialog = Nothing }
            , Cmd.none
            )

        SelectUserToInvite userId ->
            ( updateInviteForm model (\f -> { f | selectedUserId = Just userId })
            , Cmd.none
            )

        SubmitInvite ->
            case model.dialog of
                Just (InviteUserDialog form) ->
                    case ( model.selectedServerUrl, form.selectedUserId ) of
                        ( Just serverUrl, Just userId ) ->
                            ( updateInviteForm model (\f -> { f | submitting = True, error = Nothing })
                            , Ports.inviteUser
                                (E.object
                                    [ ( "serverUrl", E.string serverUrl )
                                    , ( "sessionId", E.string form.sessionId )
                                    , ( "userProfileId", E.string userId )
                                    ]
                                )
                            )

                        _ ->
                            ( model, Cmd.none )

                _ ->
                    ( model, Cmd.none )

        InviteResult serverUrl result ->
            case result of
                Ok _ ->
                    ( { model | dialog = Nothing }
                    , -- Refresh sent invitations after successful invite
                      Ports.getSentInvitations serverUrl
                    )

                Err err ->
                    ( updateInviteForm model (\f -> { f | submitting = False, error = Just err })
                    , Cmd.none
                    )

        -- =====================================================================
        -- Invitations List Messages
        -- =====================================================================
        OpenInvitationsDialog ->
            case model.selectedServerUrl of
                Just serverUrl ->
                    ( { model
                        | dialog = Just InvitationsDialog
                        , showUserMenu = False
                      }
                    , Cmd.batch
                        [ Ports.getInvitations serverUrl
                        , Ports.getSentInvitations serverUrl
                        ]
                    )

                Nothing ->
                    ( model, Cmd.none )

        ViewInvitedSession sessionId ->
            -- Close dialog, fetch session, and set pending view
            case model.selectedServerUrl of
                Just serverUrl ->
                    ( { model
                        | dialog = Nothing
                        , pendingViewSessionId = Just sessionId
                      }
                    , Ports.getSession (Encode.getSession serverUrl sessionId)
                    )

                Nothing ->
                    ( model, Cmd.none )

        GotInvitations serverUrl result ->
            case result of
                Ok invitations ->
                    -- Store invitations and fetch session details for each
                    -- so invited sessions appear in the session list
                    let
                        fetchSessionCmds =
                            invitations
                                |> List.map (\inv -> Ports.getSession (Encode.getSession serverUrl inv.sessionId))
                                |> Cmd.batch
                    in
                    ( { model
                        | serverData =
                            updateServerData serverUrl
                                (\sd -> { sd | invitations = invitations })
                                model.serverData
                      }
                    , fetchSessionCmds
                    )

                Err _ ->
                    ( { model
                        | serverData =
                            updateServerData serverUrl
                                (\sd -> { sd | invitations = [] })
                                model.serverData
                      }
                    , Cmd.none
                    )

        GotSentInvitations serverUrl result ->
            case result of
                Ok invitations ->
                    ( { model
                        | serverData =
                            updateServerData serverUrl
                                (\sd -> { sd | sentInvitations = invitations })
                                model.serverData
                      }
                    , Cmd.none
                    )

                Err _ ->
                    ( { model
                        | serverData =
                            updateServerData serverUrl
                                (\sd -> { sd | sentInvitations = [] })
                                model.serverData
                      }
                    , Cmd.none
                    )

        AcceptInvitation invitationId ->
            case model.selectedServerUrl of
                Just serverUrl ->
                    ( model
                    , Ports.acceptInvitation (Encode.acceptInvitation serverUrl invitationId)
                    )

                Nothing ->
                    ( model, Cmd.none )

        InvitationAccepted serverUrl result ->
            case result of
                Ok _ ->
                    -- Close dialog and refresh sessions
                    ( { model
                        | dialog = Nothing
                        , serverData =
                            updateServerData serverUrl
                                (\sd -> { sd | invitations = [] })
                                model.serverData
                      }
                    , Ports.getSessions serverUrl
                    )

                Err _ ->
                    ( model, Cmd.none )

        DeclineInvitation invitationId ->
            case model.selectedServerUrl of
                Just serverUrl ->
                    ( model
                    , Ports.declineInvitation (Encode.declineInvitation serverUrl invitationId)
                    )

                Nothing ->
                    ( model, Cmd.none )

        InvitationDeclined serverUrl result ->
            case result of
                Ok _ ->
                    -- Refresh invitations list
                    ( model, Ports.getInvitations serverUrl )

                Err _ ->
                    ( model, Cmd.none )

        CancelSentInvitation invitationId ->
            case model.selectedServerUrl of
                Just serverUrl ->
                    ( model
                    , Ports.cancelSentInvitation (Encode.cancelSentInvitation serverUrl invitationId)
                    )

                Nothing ->
                    ( model, Cmd.none )

        SentInvitationCanceled serverUrl result ->
            case result of
                Ok _ ->
                    -- Refresh sent invitations list
                    ( model, Ports.getSentInvitations serverUrl )

                Err _ ->
                    ( model, Cmd.none )

        -- =====================================================================
        -- Races Messages
        -- =====================================================================
        OpenRacesDialog ->
            case model.selectedServerUrl of
                Just serverUrl ->
                    ( { model
                        | dialog = Just (RacesDialog Nothing)
                        , showUserMenu = False
                      }
                    , Ports.getRaces serverUrl
                    )

                Nothing ->
                    ( model, Cmd.none )

        GotRaces serverUrl result ->
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

        UploadRace ->
            case model.selectedServerUrl of
                Just serverUrl ->
                    ( model
                    , Ports.uploadRace (E.object [ ( "serverUrl", E.string serverUrl ) ])
                    )

                Nothing ->
                    ( model, Cmd.none )

        RaceUploaded serverUrl result ->
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

        DownloadRace raceId ->
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

        RaceDownloaded result ->
            case result of
                Ok _ ->
                    -- File download handled by JS
                    ( model, Cmd.none )

                Err err ->
                    ( { model | error = Just err }
                    , Cmd.none
                    )

        DeleteRace raceId ->
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

        RaceDeleted serverUrl result ->
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

        -- =====================================================================
        -- Setup Race Messages (for session)
        -- =====================================================================
        OpenSetupRaceDialog sessionId ->
            case model.selectedServerUrl of
                Just serverUrl ->
                    ( { model
                        | dialog = Just (SetupRaceDialog (emptySetupRaceForm sessionId))
                      }
                    , Ports.getRaces serverUrl
                    )

                Nothing ->
                    ( model, Cmd.none )

        SelectRaceForSession raceId ->
            ( updateSetupRaceForm model (\f -> { f | selectedRaceId = Just raceId })
            , Cmd.none
            )

        SubmitSetupRace ->
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

        SetupRaceResult serverUrl result ->
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

        GotSessionPlayerRace serverUrl sessionId result ->
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

        UploadAndSetRace ->
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

        -- =====================================================================
        -- Race Builder Messages
        -- =====================================================================
        OpenRaceBuilder origin ->
            case model.selectedServerUrl of
                Just serverUrl ->
                    let
                        form =
                            emptyRaceBuilderForm origin
                    in
                    ( { model | dialog = Just (RaceBuilderDialog form) }
                      -- Load Humanoid template as default
                    , Ports.getRaceTemplate (Encode.getRaceTemplate serverUrl "humanoid")
                    )

                Nothing ->
                    ( model, Cmd.none )

        SelectRaceBuilderTab tab ->
            ( updateRaceBuilderForm model (\f -> { f | activeTab = tab })
            , Cmd.none
            )

        LoadRaceTemplate templateName ->
            case model.selectedServerUrl of
                Just serverUrl ->
                    ( updateRaceBuilderForm model (\f -> { f | selectedTemplate = templateName })
                    , Ports.getRaceTemplate (Encode.getRaceTemplate serverUrl templateName)
                    )

                Nothing ->
                    ( model, Cmd.none )

        RaceTemplateLoaded result ->
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
                    -- Reset to custom on error
                    ( updateRaceBuilderForm model (\f -> { f | error = Just err, selectedTemplate = "custom" })
                    , Cmd.none
                    )

        SelectCustomTemplate ->
            ( updateRaceBuilderForm model (\f -> { f | selectedTemplate = "custom" })
            , Cmd.none
            )

        -- Identity tab field updates
        UpdateRaceBuilderSingularName name ->
            updateRaceConfigAndValidate model (\c -> { c | singularName = name })

        UpdateRaceBuilderPluralName name ->
            updateRaceConfigAndValidate model (\c -> { c | pluralName = name })

        UpdateRaceBuilderPassword password ->
            updateRaceConfigAndValidate model (\c -> { c | password = password })

        UpdateRaceBuilderIcon icon ->
            updateRaceConfigAndValidate model (\c -> { c | icon = icon })

        UpdateRaceBuilderLeftoverPoints option ->
            updateRaceConfigAndValidate model (\c -> { c | leftoverPointsOn = option })

        -- PRT tab
        UpdateRaceBuilderPRT prt ->
            updateRaceConfigAndValidate model (\c -> { c | prt = prt })

        -- LRT tab
        ToggleRaceBuilderLRT lrtIndex ->
            updateRaceConfigAndValidate model
                (\c ->
                    if List.member lrtIndex c.lrt then
                        { c | lrt = List.filter (\i -> i /= lrtIndex) c.lrt }

                    else
                        { c | lrt = lrtIndex :: c.lrt }
                )

        -- Habitability tab
        UpdateRaceBuilderGravityCenter val ->
            updateRaceConfigAndValidate model (\c -> { c | gravityCenter = val })

        UpdateRaceBuilderGravityWidth val ->
            updateRaceConfigAndValidate model (\c -> { c | gravityWidth = val })

        UpdateRaceBuilderGravityImmune val ->
            updateRaceConfigAndValidate model (\c -> { c | gravityImmune = val })

        UpdateRaceBuilderGravityMinMax minVal maxVal ->
            let
                newCenter =
                    (minVal + maxVal) // 2

                newWidth =
                    (maxVal - minVal) // 2
            in
            updateRaceConfigAndValidate model (\c -> { c | gravityCenter = newCenter, gravityWidth = newWidth })

        UpdateRaceBuilderTemperatureCenter val ->
            updateRaceConfigAndValidate model (\c -> { c | temperatureCenter = val })

        UpdateRaceBuilderTemperatureWidth val ->
            updateRaceConfigAndValidate model (\c -> { c | temperatureWidth = val })

        UpdateRaceBuilderTemperatureImmune val ->
            updateRaceConfigAndValidate model (\c -> { c | temperatureImmune = val })

        UpdateRaceBuilderTemperatureMinMax minVal maxVal ->
            let
                newCenter =
                    (minVal + maxVal) // 2

                newWidth =
                    (maxVal - minVal) // 2
            in
            updateRaceConfigAndValidate model (\c -> { c | temperatureCenter = newCenter, temperatureWidth = newWidth })

        UpdateRaceBuilderRadiationCenter val ->
            updateRaceConfigAndValidate model (\c -> { c | radiationCenter = val })

        UpdateRaceBuilderRadiationWidth val ->
            updateRaceConfigAndValidate model (\c -> { c | radiationWidth = val })

        UpdateRaceBuilderRadiationImmune val ->
            updateRaceConfigAndValidate model (\c -> { c | radiationImmune = val })

        UpdateRaceBuilderRadiationMinMax minVal maxVal ->
            let
                newCenter =
                    (minVal + maxVal) // 2

                newWidth =
                    (maxVal - minVal) // 2
            in
            updateRaceConfigAndValidate model (\c -> { c | radiationCenter = newCenter, radiationWidth = newWidth })

        UpdateRaceBuilderGrowthRate val ->
            updateRaceConfigAndValidate model (\c -> { c | growthRate = val })

        -- Habitability button hold-to-repeat
        HabButtonPressed btn ->
            case model.dialog of
                Just (RaceBuilderDialog form) ->
                    let
                        -- Set the held button and perform action immediately
                        newForm =
                            { form | heldHabButton = Just btn }

                        modelWithHeld =
                            { model | dialog = Just (RaceBuilderDialog newForm) }
                    in
                    -- Perform the action once
                    performHabButtonAction modelWithHeld btn

                _ ->
                    ( model, Cmd.none )

        HabButtonReleased ->
            case model.dialog of
                Just (RaceBuilderDialog form) ->
                    let
                        newForm =
                            { form | heldHabButton = Nothing }
                    in
                    ( { model | dialog = Just (RaceBuilderDialog newForm) }, Cmd.none )

                _ ->
                    ( model, Cmd.none )

        HabButtonTick ->
            case model.dialog of
                Just (RaceBuilderDialog form) ->
                    case form.heldHabButton of
                        Just btn ->
                            performHabButtonAction model btn

                        Nothing ->
                            ( model, Cmd.none )

                _ ->
                    ( model, Cmd.none )

        -- Economy tab
        UpdateRaceBuilderColonistsPerResource val ->
            updateRaceConfigAndValidate model (\c -> { c | colonistsPerResource = val })

        UpdateRaceBuilderFactoryOutput val ->
            updateRaceConfigAndValidate model (\c -> { c | factoryOutput = val })

        UpdateRaceBuilderFactoryCost val ->
            updateRaceConfigAndValidate model (\c -> { c | factoryCost = val })

        UpdateRaceBuilderFactoryCount val ->
            updateRaceConfigAndValidate model (\c -> { c | factoryCount = val })

        UpdateRaceBuilderFactoriesUseLessGerm val ->
            updateRaceConfigAndValidate model (\c -> { c | factoriesUseLessGerm = val })

        UpdateRaceBuilderMineOutput val ->
            updateRaceConfigAndValidate model (\c -> { c | mineOutput = val })

        UpdateRaceBuilderMineCost val ->
            updateRaceConfigAndValidate model (\c -> { c | mineCost = val })

        UpdateRaceBuilderMineCount val ->
            updateRaceConfigAndValidate model (\c -> { c | mineCount = val })

        -- Research tab
        UpdateRaceBuilderResearchEnergy val ->
            updateRaceConfigAndValidate model (\c -> { c | researchEnergy = val })

        UpdateRaceBuilderResearchWeapons val ->
            updateRaceConfigAndValidate model (\c -> { c | researchWeapons = val })

        UpdateRaceBuilderResearchPropulsion val ->
            updateRaceConfigAndValidate model (\c -> { c | researchPropulsion = val })

        UpdateRaceBuilderResearchConstruction val ->
            updateRaceConfigAndValidate model (\c -> { c | researchConstruction = val })

        UpdateRaceBuilderResearchElectronics val ->
            updateRaceConfigAndValidate model (\c -> { c | researchElectronics = val })

        UpdateRaceBuilderResearchBiotech val ->
            updateRaceConfigAndValidate model (\c -> { c | researchBiotech = val })

        UpdateRaceBuilderTechsStartHigh val ->
            updateRaceConfigAndValidate model (\c -> { c | techsStartHigh = val })

        -- Validation response
        RaceBuilderValidationReceived result ->
            case result of
                Ok validation ->
                    ( updateRaceBuilderForm model (\f -> { f | validation = validation })
                    , Cmd.none
                    )

                Err err ->
                    ( updateRaceBuilderForm model (\f -> { f | error = Just err })
                    , Cmd.none
                    )

        -- Save race
        SubmitRaceBuilder ->
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

        RaceBuilderSaved result ->
            case result of
                Ok _ ->
                    -- Close dialog, refresh races, and potentially refresh session
                    case ( model.dialog, model.selectedServerUrl ) of
                        ( Just (RaceBuilderDialog form), Just serverUrl ) ->
                            let
                                baseCmds =
                                    [ Ports.getRaces serverUrl ]

                                -- If we came from setup race dialog, also refresh session and player race
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

        ViewRaceInBuilder raceId raceName ->
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

        RaceFileLoaded result ->
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

        CreateRaceFromExisting ->
            ( updateRaceBuilderForm model (\f -> { f | mode = EditMode })
            , Cmd.none
            )

        -- =====================================================================
        -- Player Ready State Messages
        -- =====================================================================
        SetPlayerReady sessionId ready ->
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

        PlayerReadyResult serverUrl result ->
            case result of
                Ok _ ->
                    -- Refresh the current session detail to get updated ready state
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

        -- =====================================================================
        -- Start Game Messages
        -- =====================================================================
        StartGame sessionId ->
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

        GameStarted serverUrl result ->
            case result of
                Ok _ ->
                    -- Refresh the current session detail to get updated started state
                    case model.sessionDetail of
                        Just detail ->
                            ( { model | startingSessionId = Nothing }
                            , Ports.getSession (Encode.getSession serverUrl detail.sessionId)
                            )

                        Nothing ->
                            ( { model | startingSessionId = Nothing }, Cmd.none )

                Err err ->
                    ( { model | error = Just err, startingSessionId = Nothing }
                    , Cmd.none
                    )

        -- =====================================================================
        -- Player Reordering Messages (mouse-based drag and drop)
        -- =====================================================================
        MouseDownOnPlayer playerId playerName mouseX mouseY ->
            case model.sessionDetail of
                Just detail ->
                    ( { model
                        | sessionDetail =
                            Just
                                { detail
                                    | dragState =
                                        Just
                                            { draggedPlayerId = playerId
                                            , draggedPlayerName = playerName
                                            , dragOverPlayerId = Nothing
                                            , mouseX = mouseX
                                            , mouseY = mouseY
                                            }
                                }
                      }
                    , Ports.clearSelection ()
                    )

                Nothing ->
                    ( model, Cmd.none )

        MouseMoveWhileDragging mouseX mouseY ->
            case model.sessionDetail of
                Just detail ->
                    case detail.dragState of
                        Just dragState ->
                            ( { model
                                | sessionDetail =
                                    Just
                                        { detail
                                            | dragState =
                                                Just { dragState | mouseX = mouseX, mouseY = mouseY }
                                        }
                              }
                            , Cmd.none
                            )

                        Nothing ->
                            ( model, Cmd.none )

                Nothing ->
                    ( model, Cmd.none )

        MouseEnterPlayer playerId ->
            case model.sessionDetail of
                Just detail ->
                    case detail.dragState of
                        Just dragState ->
                            if dragState.draggedPlayerId /= playerId then
                                ( { model
                                    | sessionDetail =
                                        Just
                                            { detail
                                                | dragState =
                                                    Just { dragState | dragOverPlayerId = Just playerId }
                                            }
                                  }
                                , Cmd.none
                                )

                            else
                                ( model, Cmd.none )

                        Nothing ->
                            ( model, Cmd.none )

                Nothing ->
                    ( model, Cmd.none )

        MouseLeavePlayer ->
            case model.sessionDetail of
                Just detail ->
                    case detail.dragState of
                        Just dragState ->
                            ( { model
                                | sessionDetail =
                                    Just
                                        { detail
                                            | dragState =
                                                Just { dragState | dragOverPlayerId = Nothing }
                                        }
                              }
                            , Cmd.none
                            )

                        Nothing ->
                            ( model, Cmd.none )

                Nothing ->
                    ( model, Cmd.none )

        MouseUpEndDrag ->
            case ( model.selectedServerUrl, model.sessionDetail ) of
                ( Just serverUrl, Just detail ) ->
                    case detail.dragState of
                        Just dragState ->
                            case dragState.dragOverPlayerId of
                                Just targetPlayerId ->
                                    let
                                        currentData =
                                            getServerData serverUrl model.serverData

                                        maybeSession =
                                            getSessionById detail.sessionId currentData.sessions
                                    in
                                    case maybeSession of
                                        Just session ->
                                            let
                                                draggedIndex =
                                                    session.players
                                                        |> List.indexedMap Tuple.pair
                                                        |> List.filter (\( _, p ) -> p.userProfileId == dragState.draggedPlayerId)
                                                        |> List.head
                                                        |> Maybe.map Tuple.first

                                                targetIndex =
                                                    session.players
                                                        |> List.indexedMap Tuple.pair
                                                        |> List.filter (\( _, p ) -> p.userProfileId == targetPlayerId)
                                                        |> List.head
                                                        |> Maybe.map Tuple.first
                                            in
                                            case ( draggedIndex, targetIndex ) of
                                                ( Just fromIdx, Just toIdx ) ->
                                                    if fromIdx /= toIdx then
                                                        let
                                                            reorderedPlayers =
                                                                moveItem fromIdx toIdx session.players

                                                            playerOrders =
                                                                reorderedPlayers
                                                                    |> List.indexedMap
                                                                        (\idx p ->
                                                                            E.object
                                                                                [ ( "userProfileId", E.string p.userProfileId )
                                                                                , ( "playerOrder", E.int idx )
                                                                                ]
                                                                        )
                                                        in
                                                        ( { model
                                                            | sessionDetail =
                                                                Just { detail | dragState = Nothing }
                                                          }
                                                        , Ports.reorderPlayers
                                                            (E.object
                                                                [ ( "serverUrl", E.string serverUrl )
                                                                , ( "sessionId", E.string detail.sessionId )
                                                                , ( "playerOrders", E.list identity playerOrders )
                                                                ]
                                                            )
                                                        )

                                                    else
                                                        ( { model | sessionDetail = Just { detail | dragState = Nothing } }
                                                        , Cmd.none
                                                        )

                                                _ ->
                                                    ( { model | sessionDetail = Just { detail | dragState = Nothing } }
                                                    , Cmd.none
                                                    )

                                        Nothing ->
                                            ( { model | sessionDetail = Just { detail | dragState = Nothing } }
                                            , Cmd.none
                                            )

                                Nothing ->
                                    ( { model | sessionDetail = Just { detail | dragState = Nothing } }
                                    , Cmd.none
                                    )

                        Nothing ->
                            ( model, Cmd.none )

                _ ->
                    ( model, Cmd.none )

        PlayersReordered serverUrl result ->
            case result of
                Ok _ ->
                    -- Refresh the session to get updated player order
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

        -- =====================================================================
        -- Server Reordering Messages (drag and drop in server bar)
        -- =====================================================================
        ServerDragStart serverUrl mouseY ->
            ( { model
                | serverDragState =
                    Just
                        { draggedServerUrl = serverUrl
                        , dragOverServerUrl = Nothing
                        , mouseY = mouseY
                        }
              }
            , Ports.clearSelection ()
            )

        ServerDragMove mouseY ->
            case model.serverDragState of
                Just dragState ->
                    ( { model
                        | serverDragState =
                            Just { dragState | mouseY = mouseY }
                      }
                    , Cmd.none
                    )

                Nothing ->
                    ( model, Cmd.none )

        ServerDragEnter serverUrl ->
            case model.serverDragState of
                Just dragState ->
                    if dragState.draggedServerUrl /= serverUrl then
                        ( { model
                            | serverDragState =
                                Just { dragState | dragOverServerUrl = Just serverUrl }
                          }
                        , Cmd.none
                        )

                    else
                        ( model, Cmd.none )

                Nothing ->
                    ( model, Cmd.none )

        ServerDragLeave ->
            case model.serverDragState of
                Just dragState ->
                    ( { model
                        | serverDragState =
                            Just { dragState | dragOverServerUrl = Nothing }
                      }
                    , Cmd.none
                    )

                Nothing ->
                    ( model, Cmd.none )

        ServerDragEnd ->
            case model.serverDragState of
                Just dragState ->
                    case dragState.dragOverServerUrl of
                        Just targetUrl ->
                            let
                                draggedIndex =
                                    model.servers
                                        |> List.indexedMap Tuple.pair
                                        |> List.filter (\( _, s ) -> s.url == dragState.draggedServerUrl)
                                        |> List.head
                                        |> Maybe.map Tuple.first

                                targetIndex =
                                    model.servers
                                        |> List.indexedMap Tuple.pair
                                        |> List.filter (\( _, s ) -> s.url == targetUrl)
                                        |> List.head
                                        |> Maybe.map Tuple.first
                            in
                            case ( draggedIndex, targetIndex ) of
                                ( Just fromIdx, Just toIdx ) ->
                                    if fromIdx /= toIdx then
                                        let
                                            reorderedServers =
                                                moveItem fromIdx toIdx model.servers

                                            serverOrders =
                                                reorderedServers
                                                    |> List.indexedMap
                                                        (\idx s ->
                                                            E.object
                                                                [ ( "url", E.string s.url )
                                                                , ( "order", E.int idx )
                                                                ]
                                                        )
                                        in
                                        ( { model
                                            | serverDragState = Nothing
                                            , servers = reorderedServers
                                          }
                                        , Ports.reorderServers
                                            (E.object
                                                [ ( "serverOrders", E.list identity serverOrders )
                                                ]
                                            )
                                        )

                                    else
                                        ( { model | serverDragState = Nothing }, Cmd.none )

                                _ ->
                                    ( { model | serverDragState = Nothing }, Cmd.none )

                        Nothing ->
                            ( { model | serverDragState = Nothing }, Cmd.none )

                Nothing ->
                    ( model, Cmd.none )

        ServersReordered result ->
            case result of
                Ok _ ->
                    -- Order already updated optimistically in ServerDragEnd
                    ( model, Cmd.none )

                Err err ->
                    -- On error, refresh servers to get correct order
                    ( { model | error = Just err }
                    , Ports.getServers ()
                    )

        -- =====================================================================
        -- Rules Messages
        -- =====================================================================
        OpenRulesDialog sessionId rulesIsSet ->
            case model.selectedServerUrl of
                Just serverUrl ->
                    let
                        -- Determine if user is a manager of this session
                        currentData =
                            getServerData serverUrl model.serverData

                        currentUserId =
                            case currentData.connectionState of
                                Connected info ->
                                    Just info.userId

                                _ ->
                                    Nothing

                        isManager =
                            case ( currentUserId, getSessionById sessionId currentData.sessions ) of
                                ( Just userId, Just session ) ->
                                    List.member userId session.managers

                                _ ->
                                    False

                        -- Check if we have cached rules for this session
                        cachedRules =
                            Dict.get sessionId currentData.sessionRules

                        -- If rules are set, use cache or fetch; otherwise use defaults
                        ( initialForm, cmd ) =
                            case ( rulesIsSet, cachedRules ) of
                                ( True, Just rules ) ->
                                    -- Rules set and cached - use immediately, no loading
                                    ( { sessionId = sessionId
                                      , rules = rules
                                      , isManager = isManager
                                      , error = Nothing
                                      , submitting = False
                                      , loading = False
                                      }
                                    , Cmd.none
                                    )

                                ( True, Nothing ) ->
                                    -- Rules set but not cached - fetch them
                                    ( { sessionId = sessionId
                                      , rules = Api.Rules.defaultRules
                                      , isManager = isManager
                                      , error = Nothing
                                      , submitting = False
                                      , loading = True
                                      }
                                    , Ports.getRules (Encode.getRules serverUrl sessionId)
                                    )

                                ( False, _ ) ->
                                    -- Rules not set - use defaults immediately, no fetch needed
                                    ( { sessionId = sessionId
                                      , rules = Api.Rules.defaultRules
                                      , isManager = isManager
                                      , error = Nothing
                                      , submitting = False
                                      , loading = False
                                      }
                                    , Cmd.none
                                    )
                    in
                    ( { model | dialog = Just (RulesDialog initialForm) }
                    , cmd
                    )

                Nothing ->
                    ( model, Cmd.none )

        GotRules serverUrl sessionId result ->
            case result of
                Ok rules ->
                    -- Update the form and also cache the rules
                    ( { model
                        | dialog =
                            case model.dialog of
                                Just (RulesDialog form) ->
                                    Just (RulesDialog { form | rules = rules, loading = False })

                                other ->
                                    other
                        , serverData =
                            updateServerData serverUrl
                                (\sd ->
                                    { sd
                                        | sessionRules =
                                            Dict.insert sessionId rules sd.sessionRules
                                    }
                                )
                                model.serverData
                      }
                    , Cmd.none
                    )

                Err err ->
                    ( updateRulesForm model (\f -> { f | error = Just err, loading = False })
                    , Cmd.none
                    )

        UpdateRulesUniverseSize val ->
            ( updateRules model (\r -> { r | universeSize = val })
            , Cmd.none
            )

        UpdateRulesDensity val ->
            ( updateRules model (\r -> { r | density = val })
            , Cmd.none
            )

        UpdateRulesStartingDistance val ->
            ( updateRules model (\r -> { r | startingDistance = val })
            , Cmd.none
            )

        UpdateRulesRandomSeed val ->
            ( updateRules model (\r -> { r | randomSeed = String.toInt val })
            , Cmd.none
            )

        UpdateRulesMaximumMinerals val ->
            ( updateRules model (\r -> { r | maximumMinerals = val })
            , Cmd.none
            )

        UpdateRulesSlowerTechAdvances val ->
            ( updateRules model (\r -> { r | slowerTechAdvances = val })
            , Cmd.none
            )

        UpdateRulesAcceleratedBbsPlay val ->
            ( updateRules model (\r -> { r | acceleratedBbsPlay = val })
            , Cmd.none
            )

        UpdateRulesNoRandomEvents val ->
            ( updateRules model (\r -> { r | noRandomEvents = val })
            , Cmd.none
            )

        UpdateRulesComputerPlayersFormAlliances val ->
            ( updateRules model (\r -> { r | computerPlayersFormAlliances = val })
            , Cmd.none
            )

        UpdateRulesPublicPlayerScores val ->
            ( updateRules model (\r -> { r | publicPlayerScores = val })
            , Cmd.none
            )

        UpdateRulesGalaxyClumping val ->
            ( updateRules model (\r -> { r | galaxyClumping = val })
            , Cmd.none
            )

        UpdateRulesVcOwnsPercentOfPlanets val ->
            ( updateRules model (\r -> { r | vcOwnsPercentOfPlanets = val })
            , Cmd.none
            )

        UpdateRulesVcOwnsPercentOfPlanetsValue val ->
            ( updateRules model (\r -> { r | vcOwnsPercentOfPlanetsValue = Maybe.withDefault r.vcOwnsPercentOfPlanetsValue (String.toInt val) })
            , Cmd.none
            )

        UpdateRulesVcAttainTechInFields val ->
            ( updateRules model (\r -> { r | vcAttainTechInFields = val })
            , Cmd.none
            )

        UpdateRulesVcAttainTechInFieldsTechValue val ->
            ( updateRules model (\r -> { r | vcAttainTechInFieldsTechValue = Maybe.withDefault r.vcAttainTechInFieldsTechValue (String.toInt val) })
            , Cmd.none
            )

        UpdateRulesVcAttainTechInFieldsFieldsValue val ->
            ( updateRules model (\r -> { r | vcAttainTechInFieldsFieldsValue = Maybe.withDefault r.vcAttainTechInFieldsFieldsValue (String.toInt val) })
            , Cmd.none
            )

        UpdateRulesVcExceedScoreOf val ->
            ( updateRules model (\r -> { r | vcExceedScoreOf = val })
            , Cmd.none
            )

        UpdateRulesVcExceedScoreOfValue val ->
            ( updateRules model (\r -> { r | vcExceedScoreOfValue = Maybe.withDefault r.vcExceedScoreOfValue (String.toInt val) })
            , Cmd.none
            )

        UpdateRulesVcExceedNextPlayerScoreBy val ->
            ( updateRules model (\r -> { r | vcExceedNextPlayerScoreBy = val })
            , Cmd.none
            )

        UpdateRulesVcExceedNextPlayerScoreByValue val ->
            ( updateRules model (\r -> { r | vcExceedNextPlayerScoreByValue = Maybe.withDefault r.vcExceedNextPlayerScoreByValue (String.toInt val) })
            , Cmd.none
            )

        UpdateRulesVcHasProductionCapacityOf val ->
            ( updateRules model (\r -> { r | vcHasProductionCapacityOf = val })
            , Cmd.none
            )

        UpdateRulesVcHasProductionCapacityOfValue val ->
            ( updateRules model (\r -> { r | vcHasProductionCapacityOfValue = Maybe.withDefault r.vcHasProductionCapacityOfValue (String.toInt val) })
            , Cmd.none
            )

        UpdateRulesVcOwnsCapitalShips val ->
            ( updateRules model (\r -> { r | vcOwnsCapitalShips = val })
            , Cmd.none
            )

        UpdateRulesVcOwnsCapitalShipsValue val ->
            ( updateRules model (\r -> { r | vcOwnsCapitalShipsValue = Maybe.withDefault r.vcOwnsCapitalShipsValue (String.toInt val) })
            , Cmd.none
            )

        UpdateRulesVcHaveHighestScoreAfterYears val ->
            ( updateRules model (\r -> { r | vcHaveHighestScoreAfterYears = val })
            , Cmd.none
            )

        UpdateRulesVcHaveHighestScoreAfterYearsValue val ->
            ( updateRules model (\r -> { r | vcHaveHighestScoreAfterYearsValue = Maybe.withDefault r.vcHaveHighestScoreAfterYearsValue (String.toInt val) })
            , Cmd.none
            )

        UpdateRulesVcWinnerMustMeet val ->
            ( updateRules model (\r -> { r | vcWinnerMustMeet = Maybe.withDefault r.vcWinnerMustMeet (String.toInt val) })
            , Cmd.none
            )

        UpdateRulesVcMinYearsBeforeWinner val ->
            ( updateRules model (\r -> { r | vcMinYearsBeforeWinner = Maybe.withDefault r.vcMinYearsBeforeWinner (String.toInt val) })
            , Cmd.none
            )

        SubmitRules ->
            case model.dialog of
                Just (RulesDialog form) ->
                    case model.selectedServerUrl of
                        Just serverUrl ->
                            ( updateRulesForm model (\f -> { f | submitting = True, error = Nothing })
                            , Ports.setRules (Encode.setRules serverUrl form.sessionId form.rules)
                            )

                        Nothing ->
                            ( model, Cmd.none )

                _ ->
                    ( model, Cmd.none )

        RulesSet serverUrl result ->
            case ( result, model.dialog ) of
                ( Ok rules, Just (RulesDialog form) ) ->
                    -- Store rules in cache and close dialog
                    ( { model
                        | dialog = Nothing
                        , serverData =
                            updateServerData serverUrl
                                (\sd ->
                                    { sd
                                        | sessionRules =
                                            Dict.insert form.sessionId rules sd.sessionRules
                                    }
                                )
                                model.serverData
                      }
                    , -- Refresh session to update rulesIsSet flag
                      Ports.getSession (Encode.getSession serverUrl form.sessionId)
                    )

                ( Ok _, _ ) ->
                    ( { model | dialog = Nothing }
                    , Cmd.none
                    )

                ( Err err, _ ) ->
                    ( updateRulesForm model (\f -> { f | submitting = False, error = Just err })
                    , Cmd.none
                    )

        FetchSessionRules sessionId ->
            case model.selectedServerUrl of
                Just serverUrl ->
                    ( model
                    , Ports.getRules (Encode.getRules serverUrl sessionId)
                    )

                Nothing ->
                    ( model, Cmd.none )

        GotSessionRules serverUrl sessionId result ->
            case result of
                Ok rules ->
                    let
                        -- Cache the rules
                        modelWithCachedRules =
                            { model
                                | serverData =
                                    updateServerData serverUrl
                                        (\sd ->
                                            { sd
                                                | sessionRules =
                                                    Dict.insert sessionId rules sd.sessionRules
                                            }
                                        )
                                        model.serverData
                            }
                    in
                    -- Also update the dialog if it's open for this session
                    case model.dialog of
                        Just (RulesDialog form) ->
                            if form.sessionId == sessionId then
                                ( { modelWithCachedRules
                                    | dialog =
                                        Just (RulesDialog { form | rules = rules, loading = False })
                                  }
                                , Cmd.none
                                )

                            else
                                ( modelWithCachedRules, Cmd.none )

                        _ ->
                            ( modelWithCachedRules, Cmd.none )

                Err _ ->
                    -- Silently ignore errors - rules may not be set
                    ( model, Cmd.none )

        -- =====================================================================
        -- External Events
        -- =====================================================================
        SessionsUpdated serverUrl ->
            -- Only refresh if this is the selected server
            if model.selectedServerUrl == Just serverUrl then
                ( model
                , Ports.getSessions serverUrl
                )

            else
                ( model, Cmd.none )

        ConnectionChanged serverUrl isConnected_ ->
            let
                currentState =
                    getConnectionState serverUrl model.serverData

                newState =
                    if isConnected_ then
                        -- We don't have user info here, keep existing if connected
                        case currentState of
                            Connected info ->
                                Connected info

                            _ ->
                                Connecting

                    else
                        Disconnected
            in
            ( setConnectionState serverUrl newState model
            , Cmd.none
            )

        OrderConflictReceived serverUrl sessionId year ->
            -- Record order conflict in server data
            let
                updateConflicts : ServerData -> ServerData
                updateConflicts data =
                    let
                        sessionConflicts =
                            Dict.get sessionId data.orderConflicts
                                |> Maybe.withDefault Set.empty
                                |> Set.insert year
                    in
                    { data | orderConflicts = Dict.insert sessionId sessionConflicts data.orderConflicts }
            in
            ( { model
                | serverData =
                    updateServerData serverUrl
                        updateConflicts
                        model.serverData
              }
            , Cmd.none
            )

        -- =====================================================================
        -- WebSocket Notifications
        -- =====================================================================
        NotificationSession serverUrl sessionId action ->
            -- Refresh session data when notified (for any server, not just selected)
            let
                isSelectedServer =
                    model.selectedServerUrl == Just serverUrl
            in
            case action of
                "deleted" ->
                    -- Close detail view if we're viewing the deleted session on selected server
                    let
                        closeDetail =
                            isSelectedServer
                                && (case model.sessionDetail of
                                        Just detail ->
                                            detail.sessionId == sessionId

                                        Nothing ->
                                            False
                                   )

                        -- Also clear lastViewedSession if it was the deleted session
                        updatedServerData =
                            updateServerData serverUrl
                                (\sd ->
                                    if sd.lastViewedSession == Just sessionId then
                                        { sd | lastViewedSession = Nothing }

                                    else
                                        sd
                                )
                                model.serverData
                    in
                    ( if closeDetail then
                        { model | sessionDetail = Nothing, serverData = updatedServerData }

                      else
                        { model | serverData = updatedServerData }
                    , Ports.getSessions serverUrl
                    )

                _ ->
                    -- For created/updated, refetch sessions for this server
                    ( model
                    , Cmd.batch
                        [ Ports.getSessions serverUrl
                        , -- Also refresh the specific session if viewing it on selected server
                          if isSelectedServer then
                            case model.sessionDetail of
                                Just detail ->
                                    if detail.sessionId == sessionId then
                                        Ports.getSession (Encode.getSession serverUrl sessionId)

                                    else
                                        Cmd.none

                                Nothing ->
                                    Cmd.none

                          else
                            Cmd.none
                        ]
                    )

        NotificationInvitation serverUrl invitationId action ->
            case action of
                "deleted" ->
                    -- Remove the invitation from both received and sent lists
                    -- Also refresh sessions since pendingInvitation flag may have changed
                    ( { model
                        | serverData =
                            updateServerData serverUrl
                                (\sd ->
                                    { sd
                                        | invitations =
                                            List.filter (\inv -> inv.id /= invitationId) sd.invitations
                                        , sentInvitations =
                                            List.filter (\inv -> inv.id /= invitationId) sd.sentInvitations
                                    }
                                )
                                model.serverData
                      }
                    , Ports.getSessions serverUrl
                    )

                _ ->
                    -- For created/updated, refresh invitations from server
                    ( model
                    , Cmd.batch
                        [ Ports.getInvitations serverUrl
                        , Ports.getSentInvitations serverUrl
                        ]
                    )

        NotificationRace serverUrl _ _ ->
            -- Refresh races when notified (for any server, not just selected)
            ( model
            , Ports.getRaces serverUrl
            )

        NotificationRuleset serverUrl sessionId _ ->
            -- Refresh rules for the session when notified (for any server, not just selected)
            let
                isSelectedServer =
                    model.selectedServerUrl == Just serverUrl
            in
            ( { model
                | serverData =
                    -- Remove cached rules so they get refetched
                    updateServerData serverUrl
                        (\sd ->
                            { sd
                                | sessionRules =
                                    Dict.remove sessionId sd.sessionRules
                            }
                        )
                        model.serverData
              }
            , -- Refetch if dialog is open for this session on selected server
              if isSelectedServer then
                case model.dialog of
                    Just (RulesDialog form) ->
                        if form.sessionId == sessionId then
                            Ports.getRules (Encode.getRules serverUrl sessionId)

                        else
                            Cmd.none

                    _ ->
                        Cmd.none

              else
                Cmd.none
            )

        NotificationPlayerRace serverUrl _ _ ->
            -- Refresh session data (player races are part of session) for any server
            let
                isSelectedServer =
                    model.selectedServerUrl == Just serverUrl
            in
            ( model
            , Cmd.batch
                [ -- Always refresh sessions list to update player counts
                  Ports.getSessions serverUrl
                , -- Also refresh the specific session if viewing it on selected server
                  if isSelectedServer then
                    case model.sessionDetail of
                        Just detail ->
                            Ports.getSession (Encode.getSession serverUrl detail.sessionId)

                        Nothing ->
                            Cmd.none

                  else
                    Cmd.none
                ]
            )

        -- =====================================================================
        -- Turn Files Messages
        -- =====================================================================
        NotificationSessionTurn serverUrl sessionId action maybeYear ->
            -- Handle turn notifications for any server, not just selected
            -- Always save to game dir since each server has its own game directory
            case ( action, maybeYear ) of
                ( "deleted", Just year ) ->
                    -- Remove the turn from cache
                    ( removeSessionTurn serverUrl sessionId year model
                    , Cmd.none
                    )

                ( _, Just year ) ->
                    -- For created/updated/ready, fetch the turn files and refresh orders status
                    -- Old years' orders status remain valid in the cache
                    ( model
                    , Cmd.batch
                        [ Ports.getTurn (Encode.getTurn serverUrl sessionId year True)
                        , Ports.getSession (Encode.getSession serverUrl sessionId)
                        , Ports.getOrdersStatus (Encode.getOrdersStatus serverUrl sessionId)
                        ]
                    )

                ( "ready", Nothing ) ->
                    -- Turn ready without year - fetch latest turn and refresh orders status
                    ( model
                    , Cmd.batch
                        [ Ports.getLatestTurn (Encode.getLatestTurn serverUrl sessionId)
                        , Ports.getSession (Encode.getSession serverUrl sessionId)
                        , Ports.getOrdersStatus (Encode.getOrdersStatus serverUrl sessionId)
                        ]
                    )

                _ ->
                    ( model, Cmd.none )

        NotificationOrderStatus serverUrl sessionId action ->
            -- Handle order status notification for any server, not just selected
            if action == "updated" then
                ( model
                , Ports.getOrdersStatus (Encode.getOrdersStatus serverUrl sessionId)
                )

            else
                ( model, Cmd.none )

        NotificationPendingRegistration serverUrl _ _ ->
            -- Refetch pending registrations when notified (created/approved/rejected)
            -- This keeps the count and dialog in sync with the server
            ( model
            , Ports.getPendingRegistrations serverUrl
            )

        OpenTurnFilesDialog sessionId year isLatestYear ->
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

        GotTurnFiles serverUrl result ->
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

        GotLatestTurn serverUrl result ->
            -- Store the latest turn files in the cache for the correct server
            case result of
                Ok turnFiles ->
                    ( storeSessionTurn serverUrl turnFiles.sessionId (Just turnFiles) model
                    , Cmd.none
                    )

                Err _ ->
                    -- Silently ignore errors - turn might not be available yet
                    ( model, Cmd.none )

        -- =====================================================================
        -- Orders Status Messages
        -- =====================================================================
        GotOrdersStatus serverUrl result ->
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

        OpenGameDir sessionId ->
            case model.selectedServerUrl of
                Just serverUrl ->
                    ( model
                    , Ports.openGameDir (Encode.openGameDir serverUrl sessionId)
                    )

                Nothing ->
                    ( model, Cmd.none )

        LaunchStars sessionId ->
            case model.selectedServerUrl of
                Just serverUrl ->
                    ( model
                    , Ports.launchStars (Encode.launchStars serverUrl sessionId)
                    )

                Nothing ->
                    ( model, Cmd.none )

        LaunchStarsResult result ->
            case result of
                Ok () ->
                    -- Successfully launched, nothing to update
                    ( model, Cmd.none )

                Err errMsg ->
                    -- Show error to user
                    ( { model | error = Just errMsg }, Cmd.none )

        CheckHasStarsExe sessionId ->
            case model.selectedServerUrl of
                Just serverUrl ->
                    ( model
                    , Ports.checkHasStarsExe (Encode.checkHasStarsExe serverUrl sessionId)
                    )

                Nothing ->
                    ( model, Cmd.none )

        GotHasStarsExe result ->
            case result of
                Ok { serverUrl, sessionId, hasStarsExe } ->
                    ( { model
                        | serverData =
                            Model.updateServerData serverUrl
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

        -- =====================================================================
        -- Session Backup Messages (manager only)
        -- =====================================================================
        DownloadSessionBackup sessionId ->
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

        SessionBackupDownloaded _ result ->
            case result of
                Ok () ->
                    -- Successfully downloaded, nothing else to do
                    ( model, Cmd.none )

                Err err ->
                    ( { model | error = Just err }, Cmd.none )

        -- =====================================================================
        -- Historic Backup Messages
        -- =====================================================================
        DownloadHistoricBackup sessionId ->
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

        HistoricBackupDownloaded _ result ->
            case result of
                Ok () ->
                    -- Successfully downloaded, nothing else to do
                    ( model, Cmd.none )

                Err err ->
                    ( { model | error = Just err }, Cmd.none )

        -- =====================================================================
        -- App Settings Messages
        -- =====================================================================
        OpenSettingsDialog ->
            ( { model | dialog = Just SettingsDialog }
            , Ports.getAppSettings ()
            )

        SelectServersDir ->
            ( model
            , Ports.selectServersDir ()
            )

        GotAppSettings result ->
            case result of
                Ok settings ->
                    ( { model
                        | appSettings =
                            Just
                                { serversDir = settings.serversDir
                                , autoDownloadStars = settings.autoDownloadStars
                                , zoomLevel = settings.zoomLevel
                                , useWine = settings.useWine
                                , winePrefixesDir = settings.winePrefixesDir
                                , validWineInstall = settings.validWineInstall
                                }
                      }
                    , Cmd.none
                    )

                Err _ ->
                    ( model, Cmd.none )

        ServersDirSelected result ->
            case result of
                Ok settings ->
                    ( { model
                        | appSettings =
                            Just
                                { serversDir = settings.serversDir
                                , autoDownloadStars = settings.autoDownloadStars
                                , zoomLevel = settings.zoomLevel
                                , useWine = settings.useWine
                                , winePrefixesDir = settings.winePrefixesDir
                                , validWineInstall = settings.validWineInstall
                                }
                      }
                    , Cmd.none
                    )

                Err _ ->
                    ( model, Cmd.none )

        SetAutoDownloadStars enabled ->
            ( model, Ports.setAutoDownloadStars enabled )

        AutoDownloadStarsSet result ->
            case result of
                Ok settings ->
                    ( { model
                        | appSettings =
                            Just
                                { serversDir = settings.serversDir
                                , autoDownloadStars = settings.autoDownloadStars
                                , zoomLevel = settings.zoomLevel
                                , useWine = settings.useWine
                                , winePrefixesDir = settings.winePrefixesDir
                                , validWineInstall = settings.validWineInstall
                                }
                      }
                    , Cmd.none
                    )

                Err _ ->
                    ( model, Cmd.none )

        SetUseWine enabled ->
            ( model, Ports.setUseWine enabled )

        UseWineSet result ->
            case result of
                Ok settings ->
                    ( { model
                        | appSettings =
                            Just
                                { serversDir = settings.serversDir
                                , autoDownloadStars = settings.autoDownloadStars
                                , zoomLevel = settings.zoomLevel
                                , useWine = settings.useWine
                                , winePrefixesDir = settings.winePrefixesDir
                                , validWineInstall = settings.validWineInstall
                                }
                        -- Clear wine check message when settings change
                        , wineCheckMessage = Nothing
                      }
                    , Cmd.none
                    )

                Err _ ->
                    ( model, Cmd.none )

        SelectWinePrefixesDir ->
            ( model, Ports.selectWinePrefixesDir () )

        WinePrefixesDirSelected result ->
            case result of
                Ok settings ->
                    ( { model
                        | appSettings =
                            Just
                                { serversDir = settings.serversDir
                                , autoDownloadStars = settings.autoDownloadStars
                                , zoomLevel = settings.zoomLevel
                                , useWine = settings.useWine
                                , winePrefixesDir = settings.winePrefixesDir
                                , validWineInstall = settings.validWineInstall
                                }
                      }
                    , Cmd.none
                    )

                Err _ ->
                    ( model, Cmd.none )

        CheckWineInstall ->
            ( { model | wineCheckInProgress = True, wineCheckMessage = Nothing }
            , Ports.checkWineInstall ()
            )

        WineInstallChecked result ->
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

        CheckNtvdmSupport ->
            ( { model | ntvdmCheckInProgress = True }, Ports.checkNtvdmSupport () )

        NtvdmChecked result ->
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

        -- =====================================================================
        -- Map Viewer Messages
        -- =====================================================================
        OpenMapViewer sessionId year raceName playerNumber ->
            ( { model | dialog = Just (MapViewerDialog (emptyMapViewerForm sessionId year raceName playerNumber)) }
            , Cmd.none
            )

        UpdateMapWidth widthStr ->
            case String.toInt widthStr of
                Just width ->
                    ( updateMapOptions model (\opts -> { opts | width = clamp 400 4096 width })
                    , Cmd.none
                    )

                Nothing ->
                    ( model, Cmd.none )

        UpdateMapHeight heightStr ->
            case String.toInt heightStr of
                Just height ->
                    ( updateMapOptions model (\opts -> { opts | height = clamp 300 4096 height })
                    , Cmd.none
                    )

                Nothing ->
                    ( model, Cmd.none )

        SelectMapPreset preset ->
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

        ToggleShowNames ->
            ( updateMapOptions model (\opts -> { opts | showNames = not opts.showNames })
            , Cmd.none
            )

        ToggleShowFleets ->
            ( updateMapOptions model (\opts -> { opts | showFleets = not opts.showFleets })
            , Cmd.none
            )

        UpdateShowFleetPaths yearsStr ->
            case String.toInt yearsStr of
                Just years ->
                    ( updateMapOptions model (\opts -> { opts | showFleetPaths = clamp 0 10 years })
                    , Cmd.none
                    )

                Nothing ->
                    ( model, Cmd.none )

        ToggleShowMines ->
            ( updateMapOptions model (\opts -> { opts | showMines = not opts.showMines })
            , Cmd.none
            )

        ToggleShowWormholes ->
            ( updateMapOptions model (\opts -> { opts | showWormholes = not opts.showWormholes })
            , Cmd.none
            )

        ToggleShowLegend ->
            ( updateMapOptions model (\opts -> { opts | showLegend = not opts.showLegend })
            , Cmd.none
            )

        ToggleShowScannerCoverage ->
            ( updateMapOptions model (\opts -> { opts | showScannerCoverage = not opts.showScannerCoverage })
            , Cmd.none
            )

        GenerateMap ->
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

        MapGenerated result ->
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

        SaveMap ->
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

        MapSaved result ->
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

        ToggleMapFullscreen ->
            ( model, Ports.requestFullscreen "map-viewer-frame" )

        SelectMapFormat formatStr ->
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

        UpdateGifDelay delayStr ->
            case String.toInt delayStr of
                Just delay ->
                    ( updateMapOptions model (\opts -> { opts | gifDelay = clamp 100 2000 delay })
                    , Cmd.none
                    )

                Nothing ->
                    ( model, Cmd.none )

        GenerateAnimatedMap ->
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

        AnimatedMapGenerated result ->
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

        SaveGif ->
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

        GifSaved result ->
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

        -- =====================================================================
        -- Admin/Manager Messages
        -- =====================================================================
        OpenUsersListDialog ->
            case model.selectedServerUrl of
                Just serverUrl ->
                    let
                        serverData =
                            getServerData serverUrl model.serverData

                        currentUserId =
                            case serverData.connectionState of
                                Connected info ->
                                    info.userId

                                _ ->
                                    ""
                    in
                    ( { model | dialog = Just (UsersListDialog (emptyUsersListState currentUserId serverData.userProfiles)) }
                    , Cmd.batch
                        [ Ports.getUserProfiles serverUrl
                        , Ports.getPendingRegistrations serverUrl
                        ]
                    )

                Nothing ->
                    ( model, Cmd.none )

        UpdateUsersListFilter query ->
            case model.dialog of
                Just (UsersListDialog state) ->
                    ( { model | dialog = Just (UsersListDialog { state | filterQuery = query }) }
                    , Cmd.none
                    )

                _ ->
                    ( model, Cmd.none )

        OpenCreateUserDialog ->
            ( { model | dialog = Just (CreateUserDialog emptyCreateUserForm) }
            , Cmd.none
            )

        UpdateCreateUserNickname nickname ->
            case model.dialog of
                Just (CreateUserDialog form) ->
                    ( { model | dialog = Just (CreateUserDialog { form | nickname = nickname }) }
                    , Cmd.none
                    )

                _ ->
                    ( model, Cmd.none )

        UpdateCreateUserEmail email ->
            case model.dialog of
                Just (CreateUserDialog form) ->
                    ( { model | dialog = Just (CreateUserDialog { form | email = email }) }
                    , Cmd.none
                    )

                _ ->
                    ( model, Cmd.none )

        SubmitCreateUser ->
            case ( model.dialog, model.selectedServerUrl ) of
                ( Just (CreateUserDialog form), Just serverUrl ) ->
                    if String.isEmpty form.nickname || String.isEmpty form.email then
                        ( { model | dialog = Just (CreateUserDialog { form | error = Just "Nickname and email are required" }) }
                        , Cmd.none
                        )

                    else
                        ( { model | dialog = Just (CreateUserDialog { form | submitting = True, error = Nothing }) }
                        , Ports.createUser (Encode.createUser serverUrl form.nickname form.email)
                        )

                _ ->
                    ( model, Cmd.none )

        CreateUserResult serverUrl result ->
            case model.dialog of
                Just (CreateUserDialog form) ->
                    case result of
                        Ok user ->
                            let
                                createdProfile : Api.UserProfile.UserProfile
                                createdProfile =
                                    { id = user.id
                                    , nickname = user.nickname
                                    , email = user.email
                                    , isActive = False
                                    , isManager = False
                                    , message = Nothing
                                    }
                            in
                            ( { model
                                | dialog =
                                    Just
                                        (CreateUserDialog
                                            { form
                                                | submitting = False
                                                , createdUser = Just createdProfile
                                            }
                                        )
                              }
                            , Ports.getUserProfiles serverUrl
                            )

                        Err err ->
                            ( { model | dialog = Just (CreateUserDialog { form | submitting = False, error = Just err }) }
                            , Cmd.none
                            )

                _ ->
                    ( model, Cmd.none )

        ConfirmDeleteUser userId nickname ->
            case model.dialog of
                Just (UsersListDialog state) ->
                    ( { model | dialog = Just (UsersListDialog { state | deleteState = ConfirmingDelete userId nickname }) }
                    , Cmd.none
                    )

                _ ->
                    ( model, Cmd.none )

        CancelDeleteUser ->
            case model.dialog of
                Just (UsersListDialog state) ->
                    ( { model | dialog = Just (UsersListDialog { state | deleteState = NoDelete }) }
                    , Cmd.none
                    )

                _ ->
                    ( model, Cmd.none )

        SubmitDeleteUser userId ->
            case ( model.selectedServerUrl, model.dialog ) of
                ( Just serverUrl, Just (UsersListDialog state) ) ->
                    let
                        nickname =
                            state.users
                                |> List.filter (\u -> u.id == userId)
                                |> List.head
                                |> Maybe.map .nickname
                                |> Maybe.withDefault userId
                    in
                    ( { model | dialog = Just (UsersListDialog { state | deleteState = DeletingUser userId nickname }) }
                    , Ports.deleteUser (Encode.deleteUser serverUrl userId)
                    )

                _ ->
                    ( model, Cmd.none )

        DeleteUserResult serverUrl result ->
            case model.dialog of
                Just (UsersListDialog state) ->
                    case result of
                        Ok () ->
                            -- Remove the deleted user from the list and reset delete state
                            let
                                deletedUserId =
                                    case state.deleteState of
                                        DeletingUser uid _ ->
                                            uid

                                        _ ->
                                            ""

                                updatedUsers =
                                    List.filter (\u -> u.id /= deletedUserId) state.users
                            in
                            ( { model | dialog = Just (UsersListDialog { state | users = updatedUsers, deleteState = NoDelete }) }
                            , Ports.getUserProfiles serverUrl
                            )

                        Err err ->
                            let
                                nickname =
                                    case state.deleteState of
                                        DeletingUser _ n ->
                                            n

                                        _ ->
                                            "User"
                            in
                            ( { model | dialog = Just (UsersListDialog { state | deleteState = DeleteError nickname err }) }
                            , Cmd.none
                            )

                _ ->
                    ( model, Cmd.none )

        ConfirmResetApikey userId ->
            case model.dialog of
                Just (UsersListDialog state) ->
                    let
                        nickname =
                            state.users
                                |> List.filter (\u -> u.id == userId)
                                |> List.head
                                |> Maybe.map .nickname
                                |> Maybe.withDefault userId
                    in
                    ( { model | dialog = Just (UsersListDialog { state | resetState = ConfirmingReset userId nickname }) }
                    , Cmd.none
                    )

                _ ->
                    ( model, Cmd.none )

        CancelResetApikey ->
            case model.dialog of
                Just (UsersListDialog state) ->
                    ( { model | dialog = Just (UsersListDialog { state | resetState = NoReset }) }
                    , Cmd.none
                    )

                _ ->
                    ( model, Cmd.none )

        SubmitResetApikey userId ->
            case ( model.dialog, model.selectedServerUrl ) of
                ( Just (UsersListDialog state), Just serverUrl ) ->
                    let
                        nickname =
                            state.users
                                |> List.filter (\u -> u.id == userId)
                                |> List.head
                                |> Maybe.map .nickname
                                |> Maybe.withDefault userId
                    in
                    ( { model | dialog = Just (UsersListDialog { state | resetState = ResettingApikey userId nickname }) }
                    , Ports.resetUserApikey
                        (E.object
                            [ ( "serverUrl", E.string serverUrl )
                            , ( "userId", E.string userId )
                            ]
                        )
                    )

                _ ->
                    ( model, Cmd.none )

        ResetApikeyResult result ->
            case model.dialog of
                Just (UsersListDialog state) ->
                    case result of
                        Ok newApikey ->
                            let
                                nickname =
                                    case state.resetState of
                                        ResettingApikey _ n ->
                                            n

                                        ConfirmingReset _ n ->
                                            n

                                        _ ->
                                            "User"
                            in
                            ( { model | dialog = Just (UsersListDialog { state | resetState = ResetComplete nickname newApikey }) }
                            , Cmd.none
                            )

                        Err err ->
                            ( { model | error = Just err, dialog = Just (UsersListDialog { state | resetState = NoReset }) }
                            , Cmd.none
                            )

                _ ->
                    ( model, Cmd.none )

        -- =====================================================================
        -- Pending Registration Messages
        -- =====================================================================
        SwitchUsersListPane ->
            case model.dialog of
                Just (UsersListDialog state) ->
                    let
                        newPane =
                            case state.activePane of
                                UsersPane ->
                                    PendingPane

                                PendingPane ->
                                    UsersPane

                        cmd =
                            case ( newPane, model.selectedServerUrl ) of
                                ( PendingPane, Just serverUrl ) ->
                                    Ports.getPendingRegistrations serverUrl

                                _ ->
                                    Cmd.none
                    in
                    ( { model | dialog = Just (UsersListDialog { state | activePane = newPane }) }
                    , cmd
                    )

                _ ->
                    ( model, Cmd.none )

        GotPendingRegistrations serverUrl result ->
            case result of
                Ok pendingList ->
                    let
                        pendingProfiles =
                            List.map
                                (\p ->
                                    { id = p.id
                                    , nickname = p.nickname
                                    , email = p.email
                                    , isActive = False
                                    , isManager = False
                                    , message = p.message
                                    }
                                )
                                pendingList

                        -- Always update the count in ServerData
                        updatedServerData =
                            updateServerData serverUrl
                                (\sd -> { sd | pendingRegistrationsCount = List.length pendingList })
                                model.serverData

                        -- Update dialog if open
                        updatedDialog =
                            case model.dialog of
                                Just (UsersListDialog state) ->
                                    Just (UsersListDialog { state | pendingUsers = pendingProfiles })

                                other ->
                                    other
                    in
                    ( { model | serverData = updatedServerData, dialog = updatedDialog }
                    , Cmd.none
                    )

                Err _ ->
                    ( model, Cmd.none )

        ViewRegistrationMessage userId nickname message ->
            case model.dialog of
                Just (UsersListDialog state) ->
                    ( { model | dialog = Just (UsersListDialog { state | pendingActionState = ViewingMessage userId nickname message }) }
                    , Cmd.none
                    )

                _ ->
                    ( model, Cmd.none )

        CloseRegistrationMessage ->
            case model.dialog of
                Just (UsersListDialog state) ->
                    ( { model | dialog = Just (UsersListDialog { state | pendingActionState = NoPendingAction }) }
                    , Cmd.none
                    )

                _ ->
                    ( model, Cmd.none )

        ConfirmApproveRegistration userId nickname ->
            case model.dialog of
                Just (UsersListDialog state) ->
                    ( { model | dialog = Just (UsersListDialog { state | pendingActionState = ConfirmingApprove userId nickname }) }
                    , Cmd.none
                    )

                _ ->
                    ( model, Cmd.none )

        CancelApproveRegistration ->
            case model.dialog of
                Just (UsersListDialog state) ->
                    ( { model | dialog = Just (UsersListDialog { state | pendingActionState = NoPendingAction }) }
                    , Cmd.none
                    )

                _ ->
                    ( model, Cmd.none )

        SubmitApproveRegistration userId ->
            case ( model.selectedServerUrl, model.dialog ) of
                ( Just serverUrl, Just (UsersListDialog state) ) ->
                    let
                        nickname =
                            state.pendingUsers
                                |> List.filter (\u -> u.id == userId)
                                |> List.head
                                |> Maybe.map .nickname
                                |> Maybe.withDefault userId
                    in
                    ( { model | dialog = Just (UsersListDialog { state | pendingActionState = ApprovingUser userId nickname }) }
                    , Ports.approveRegistration (Encode.approveRegistration serverUrl userId)
                    )

                _ ->
                    ( model, Cmd.none )

        ApproveRegistrationResult serverUrl result ->
            case model.dialog of
                Just (UsersListDialog state) ->
                    case result of
                        Ok apikey ->
                            let
                                nickname =
                                    case state.pendingActionState of
                                        ApprovingUser _ n ->
                                            n

                                        _ ->
                                            "User"

                                approvedUserId =
                                    case state.pendingActionState of
                                        ApprovingUser uid _ ->
                                            uid

                                        _ ->
                                            ""

                                updatedPending =
                                    List.filter (\u -> u.id /= approvedUserId) state.pendingUsers
                            in
                            -- Note: pendingRegistrationsCount is updated via notification
                            ( { model | dialog = Just (UsersListDialog { state | pendingUsers = updatedPending, pendingActionState = ApproveComplete nickname apikey }) }
                            , Ports.getUserProfiles serverUrl
                            )

                        Err err ->
                            let
                                nickname =
                                    case state.pendingActionState of
                                        ApprovingUser _ n ->
                                            n

                                        _ ->
                                            "User"
                            in
                            ( { model | dialog = Just (UsersListDialog { state | pendingActionState = ApproveError nickname err }) }
                            , Cmd.none
                            )

                _ ->
                    ( model, Cmd.none )

        ConfirmRejectRegistration userId nickname ->
            case model.dialog of
                Just (UsersListDialog state) ->
                    ( { model | dialog = Just (UsersListDialog { state | pendingActionState = ConfirmingReject userId nickname }) }
                    , Cmd.none
                    )

                _ ->
                    ( model, Cmd.none )

        CancelRejectRegistration ->
            case model.dialog of
                Just (UsersListDialog state) ->
                    ( { model | dialog = Just (UsersListDialog { state | pendingActionState = NoPendingAction }) }
                    , Cmd.none
                    )

                _ ->
                    ( model, Cmd.none )

        SubmitRejectRegistration userId ->
            case ( model.selectedServerUrl, model.dialog ) of
                ( Just serverUrl, Just (UsersListDialog state) ) ->
                    let
                        nickname =
                            state.pendingUsers
                                |> List.filter (\u -> u.id == userId)
                                |> List.head
                                |> Maybe.map .nickname
                                |> Maybe.withDefault userId
                    in
                    ( { model | dialog = Just (UsersListDialog { state | pendingActionState = RejectingUser userId nickname }) }
                    , Ports.rejectRegistration (Encode.rejectRegistration serverUrl userId)
                    )

                _ ->
                    ( model, Cmd.none )

        RejectRegistrationResult _ result ->
            case model.dialog of
                Just (UsersListDialog state) ->
                    case result of
                        Ok () ->
                            let
                                rejectedUserId =
                                    case state.pendingActionState of
                                        RejectingUser uid _ ->
                                            uid

                                        _ ->
                                            ""

                                updatedPending =
                                    List.filter (\u -> u.id /= rejectedUserId) state.pendingUsers
                            in
                            -- Note: pendingRegistrationsCount is updated via notification
                            ( { model | dialog = Just (UsersListDialog { state | pendingUsers = updatedPending, pendingActionState = NoPendingAction }) }
                            , Cmd.none
                            )

                        Err err ->
                            let
                                nickname =
                                    case state.pendingActionState of
                                        RejectingUser _ n ->
                                            n

                                        _ ->
                                            "User"
                            in
                            ( { model | dialog = Just (UsersListDialog { state | pendingActionState = RejectError nickname err }) }
                            , Cmd.none
                            )

                _ ->
                    ( model, Cmd.none )

        -- =====================================================================
        -- Change Own API Key Messages
        -- =====================================================================
        OpenChangeApikeyDialog ->
            ( { model | dialog = Just (ChangeApikeyDialog ConfirmingChange), showUserMenu = False }
            , Cmd.none
            )

        CancelChangeApikey ->
            ( { model | dialog = Nothing }
            , Cmd.none
            )

        SubmitChangeApikey ->
            case model.selectedServerUrl of
                Just serverUrl ->
                    ( { model | dialog = Just (ChangeApikeyDialog ChangingApikey) }
                    , Ports.changeMyApikey serverUrl
                    )

                Nothing ->
                    ( model, Cmd.none )

        ChangeApikeyResult result ->
            case model.dialog of
                Just (ChangeApikeyDialog _) ->
                    case result of
                        Ok newApikey ->
                            ( { model | dialog = Just (ChangeApikeyDialog (ChangeComplete newApikey)) }
                            , Cmd.none
                            )

                        Err err ->
                            ( { model | error = Just err, dialog = Nothing }
                            , Cmd.none
                            )

                _ ->
                    ( model, Cmd.none )

        -- =====================================================================
        -- User Menu Messages
        -- =====================================================================
        ToggleUserMenu ->
            ( { model | showUserMenu = not model.showUserMenu }
            , Cmd.none
            )

        HideUserMenu ->
            ( { model | showUserMenu = False }
            , Cmd.none
            )

        CopyApiKey serverUrl ->
            ( model
            , Ports.getApiKey serverUrl
            )

        GotApiKey _ result ->
            case result of
                Ok apiKey ->
                    ( { model | toast = Just "API key copied to clipboard" }
                    , Cmd.batch
                        [ Ports.copyToClipboard apiKey
                        , Process.sleep 3000
                            |> Task.perform (\_ -> HideToast)
                        ]
                    )

                Err err ->
                    ( { model | error = Just err }
                    , Cmd.none
                    )

        CopyToClipboard text ->
            ( model
            , Ports.copyToClipboard text
            )

        ShowToast message ->
            ( { model | toast = Just message }
            , Process.sleep 3000
                |> Task.perform (\_ -> HideToast)
            )

        HideToast ->
            ( { model | toast = Nothing }
            , Cmd.none
            )

        -- =====================================================================
        -- Global UI Messages
        -- =====================================================================
        ClearError ->
            ( { model | error = Nothing }
            , Cmd.none
            )

        EscapePressed ->
            ( { model
                | dialog = Nothing
                , contextMenu = Nothing
                , showUserMenu = False
              }
            , Cmd.none
            )

        -- =====================================================================
        -- Zoom Messages
        -- =====================================================================
        ZoomIn ->
            let
                currentLevel =
                    model.appSettings
                        |> Maybe.map .zoomLevel
                        |> Maybe.withDefault 100

                newLevel =
                    min 200 (currentLevel + 10)
            in
            ( model
            , Ports.setZoomLevel newLevel
            )

        ZoomOut ->
            let
                currentLevel =
                    model.appSettings
                        |> Maybe.map .zoomLevel
                        |> Maybe.withDefault 100

                newLevel =
                    max 50 (currentLevel - 10)
            in
            ( model
            , Ports.setZoomLevel newLevel
            )

        ZoomReset ->
            ( model
            , Ports.setZoomLevel 100
            )

        ZoomLevelSet result ->
            case result of
                Ok settings ->
                    ( { model
                        | appSettings =
                            Just
                                { serversDir = settings.serversDir
                                , autoDownloadStars = settings.autoDownloadStars
                                , zoomLevel = settings.zoomLevel
                                , useWine = settings.useWine
                                , winePrefixesDir = settings.winePrefixesDir
                                , validWineInstall = settings.validWineInstall
                                }
                      }
                    , Cmd.none
                    )

                Err _ ->
                    ( model, Cmd.none )



-- =============================================================================
-- HELPERS
-- =============================================================================


{-| Update a server form in the current dialog.
-}
updateServerForm : Model -> (ServerForm -> ServerForm) -> Model
updateServerForm model updater =
    case model.dialog of
        Just (AddServerDialog form) ->
            { model | dialog = Just (AddServerDialog (updater form)) }

        Just (EditServerDialog url form) ->
            { model | dialog = Just (EditServerDialog url (updater form)) }

        _ ->
            model


{-| Update the connect form in the current dialog.
-}
updateConnectForm : Model -> (ConnectForm -> ConnectForm) -> Model
updateConnectForm model updater =
    case model.dialog of
        Just (ConnectDialog url form) ->
            { model | dialog = Just (ConnectDialog url (updater form)) }

        _ ->
            model


{-| Update the register form in the current dialog.
-}
updateRegisterForm : Model -> (RegisterForm -> RegisterForm) -> Model
updateRegisterForm model updater =
    case model.dialog of
        Just (RegisterDialog url form) ->
            { model | dialog = Just (RegisterDialog url (updater form)) }

        _ ->
            model


{-| Update the create session form in the current dialog.
-}
updateCreateSessionForm : Model -> (Model.CreateSessionForm -> Model.CreateSessionForm) -> Model
updateCreateSessionForm model updater =
    case model.dialog of
        Just (CreateSessionDialog form) ->
            { model | dialog = Just (CreateSessionDialog (updater form)) }

        _ ->
            model


{-| Set error on the current dialog form.
-}
updateDialogError : Model -> String -> Model
updateDialogError model err =
    case model.dialog of
        Just (AddServerDialog form) ->
            { model | dialog = Just (AddServerDialog { form | error = Just err, submitting = False }) }

        Just (EditServerDialog url form) ->
            { model | dialog = Just (EditServerDialog url { form | error = Just err, submitting = False }) }

        Just (ConnectDialog url form) ->
            { model | dialog = Just (ConnectDialog url { form | error = Just err, submitting = False }) }

        Just (RegisterDialog url form) ->
            { model | dialog = Just (RegisterDialog url { form | error = Just err, submitting = False }) }

        Just (CreateSessionDialog form) ->
            { model | dialog = Just (CreateSessionDialog { form | error = Just err, submitting = False }) }

        Just (InviteUserDialog form) ->
            { model | dialog = Just (InviteUserDialog { form | error = Just err, submitting = False }) }

        Just (SetupRaceDialog form) ->
            { model | dialog = Just (SetupRaceDialog { form | error = Just err, submitting = False }) }

        Just (RulesDialog form) ->
            { model | dialog = Just (RulesDialog { form | error = Just err, submitting = False }) }

        _ ->
            model


{-| Update invite form helper.
-}
updateInviteForm : Model -> (InviteForm -> InviteForm) -> Model
updateInviteForm model updater =
    case model.dialog of
        Just (InviteUserDialog form) ->
            { model | dialog = Just (InviteUserDialog (updater form)) }

        _ ->
            model


{-| Update setup race form helper.
-}
updateSetupRaceForm : Model -> (SetupRaceForm -> SetupRaceForm) -> Model
updateSetupRaceForm model updater =
    case model.dialog of
        Just (SetupRaceDialog form) ->
            { model | dialog = Just (SetupRaceDialog (updater form)) }

        _ ->
            model


{-| Set connection state for a server in the serverData dict.
-}
setConnectionState : String -> ConnectionState -> Model -> Model
setConnectionState serverUrl state model =
    { model
        | serverData =
            updateServerData serverUrl
                (\sd -> { sd | connectionState = state })
                model.serverData
    }


{-| Update rules form helper.
-}
updateRulesForm : Model -> (RulesForm -> RulesForm) -> Model
updateRulesForm model updater =
    case model.dialog of
        Just (RulesDialog form) ->
            { model | dialog = Just (RulesDialog (updater form)) }

        _ ->
            model


{-| Update rules within the rules form.
-}
updateRules : Model -> (Rules -> Rules) -> Model
updateRules model rulesUpdater =
    updateRulesForm model
        (\form -> { form | rules = rulesUpdater form.rules })


{-| Update map viewer form helper.
-}
updateMapViewerForm : Model -> (MapViewerForm -> MapViewerForm) -> Model
updateMapViewerForm model updater =
    case model.dialog of
        Just (MapViewerDialog form) ->
            { model | dialog = Just (MapViewerDialog (updater form)) }

        _ ->
            model


{-| Update map options within the map viewer form.
-}
updateMapOptions : Model -> (MapOptions -> MapOptions) -> Model
updateMapOptions model optionsUpdater =
    updateMapViewerForm model
        (\form -> { form | options = optionsUpdater form.options })


{-| Clear generated map content when format changes.
-}
clearMapContent : Model -> Model
clearMapContent model =
    updateMapViewerForm model
        (\form -> { form | generatedSvg = Nothing, generatedGif = Nothing, error = Nothing })


{-| Move an item in a list from one index to another.
-}
moveItem : Int -> Int -> List a -> List a
moveItem fromIndex toIndex list =
    let
        item =
            List.drop fromIndex list |> List.head
    in
    case item of
        Just movedItem ->
            list
                |> List.indexedMap Tuple.pair
                |> List.filter (\( i, _ ) -> i /= fromIndex)
                |> List.map Tuple.second
                |> insertAt toIndex movedItem

        Nothing ->
            list


{-| Insert an item at a specific index in a list.
-}
insertAt : Int -> a -> List a -> List a
insertAt index item list =
    List.take index list ++ [ item ] ++ List.drop index list


{-| Store turn files for a session/year, or remove a year's turn.
-}
storeSessionTurn : String -> String -> Maybe TurnFiles -> Model -> Model
storeSessionTurn serverUrl sessionId maybeTurnFiles model =
    { model
        | serverData =
            updateServerData serverUrl
                (\sd ->
                    let
                        currentTurns =
                            Dict.get sessionId sd.sessionTurns
                                |> Maybe.withDefault Dict.empty

                        newTurns =
                            case maybeTurnFiles of
                                Just turnFiles ->
                                    Dict.insert turnFiles.year turnFiles currentTurns

                                Nothing ->
                                    currentTurns
                    in
                    { sd | sessionTurns = Dict.insert sessionId newTurns sd.sessionTurns }
                )
                model.serverData
    }


{-| Remove a turn year from the session turns.
-}
removeSessionTurn : String -> String -> Int -> Model -> Model
removeSessionTurn serverUrl sessionId year model =
    { model
        | serverData =
            updateServerData serverUrl
                (\sd ->
                    let
                        currentTurns =
                            Dict.get sessionId sd.sessionTurns
                                |> Maybe.withDefault Dict.empty

                        newTurns =
                            Dict.remove year currentTurns
                    in
                    { sd | sessionTurns = Dict.insert sessionId newTurns sd.sessionTurns }
                )
                model.serverData
    }


{-| Update race builder form helper.
-}
updateRaceBuilderForm : Model -> (RaceBuilderForm -> RaceBuilderForm) -> Model
updateRaceBuilderForm model updater =
    case model.dialog of
        Just (RaceBuilderDialog form) ->
            { model | dialog = Just (RaceBuilderDialog (updater form)) }

        _ ->
            model


{-| Update race config and trigger validation.
    Also resets selectedTemplate to "custom" since user is customizing values.
-}
updateRaceConfigAndValidate : Model -> (RaceConfig -> RaceConfig) -> ( Model, Cmd Msg )
updateRaceConfigAndValidate model configUpdater =
    case ( model.dialog, model.selectedServerUrl ) of
        ( Just (RaceBuilderDialog form), Just serverUrl ) ->
            let
                newConfig =
                    configUpdater form.config

                newForm =
                    { form | config = newConfig, selectedTemplate = "custom" }
            in
            ( { model | dialog = Just (RaceBuilderDialog newForm) }
            , Ports.validateRaceConfig (Encode.validateRaceConfig serverUrl newConfig)
            )

        _ ->
            ( model, Cmd.none )


{-| Perform the action for a habitability button.
    Used both for initial press and repeated ticks while held.

    Center is constrained based on width so that range edges don't exceed scale limits:
    - center - width >= 0 (left edge can't go below 0)
    - center + width <= 100 (right edge can't go above 100)
    This means: width <= center <= 100 - width

    When expanding, the center is also adjusted to keep the range within bounds.

-}
performHabButtonAction : Model -> HabButton -> ( Model, Cmd Msg )
performHabButtonAction model btn =
    let
        -- Min/max constraints for width
        minWidth =
            10

        maxWidth =
            50

        -- Helper to adjust width (expand/shrink)
        adjustWidth current delta =
            clamp minWidth maxWidth (current + delta)

        -- Helper to clamp center based on width
        -- Center must satisfy: width <= center <= 100 - width
        clampCenter center width =
            clamp width (100 - width) center

        -- Helper to adjust center (move left/right)
        adjustCenter center width delta =
            clampCenter (center + delta) width
    in
    case btn of
        -- Gravity buttons
        GravityExpandBtn ->
            updateRaceConfigAndValidate model
                (\c ->
                    let
                        newWidth =
                            adjustWidth c.gravityWidth 1

                        newCenter =
                            clampCenter c.gravityCenter newWidth
                    in
                    { c | gravityWidth = newWidth, gravityCenter = newCenter }
                )

        GravityShrinkBtn ->
            updateRaceConfigAndValidate model
                (\c -> { c | gravityWidth = adjustWidth c.gravityWidth -1 })

        GravityLeftBtn ->
            updateRaceConfigAndValidate model
                (\c -> { c | gravityCenter = adjustCenter c.gravityCenter c.gravityWidth -1 })

        GravityRightBtn ->
            updateRaceConfigAndValidate model
                (\c -> { c | gravityCenter = adjustCenter c.gravityCenter c.gravityWidth 1 })

        -- Temperature buttons
        TemperatureExpandBtn ->
            updateRaceConfigAndValidate model
                (\c ->
                    let
                        newWidth =
                            adjustWidth c.temperatureWidth 1

                        newCenter =
                            clampCenter c.temperatureCenter newWidth
                    in
                    { c | temperatureWidth = newWidth, temperatureCenter = newCenter }
                )

        TemperatureShrinkBtn ->
            updateRaceConfigAndValidate model
                (\c -> { c | temperatureWidth = adjustWidth c.temperatureWidth -1 })

        TemperatureLeftBtn ->
            updateRaceConfigAndValidate model
                (\c -> { c | temperatureCenter = adjustCenter c.temperatureCenter c.temperatureWidth -1 })

        TemperatureRightBtn ->
            updateRaceConfigAndValidate model
                (\c -> { c | temperatureCenter = adjustCenter c.temperatureCenter c.temperatureWidth 1 })

        -- Radiation buttons
        RadiationExpandBtn ->
            updateRaceConfigAndValidate model
                (\c ->
                    let
                        newWidth =
                            adjustWidth c.radiationWidth 1

                        newCenter =
                            clampCenter c.radiationCenter newWidth
                    in
                    { c | radiationWidth = newWidth, radiationCenter = newCenter }
                )

        RadiationShrinkBtn ->
            updateRaceConfigAndValidate model
                (\c -> { c | radiationWidth = adjustWidth c.radiationWidth -1 })

        RadiationLeftBtn ->
            updateRaceConfigAndValidate model
                (\c -> { c | radiationCenter = adjustCenter c.radiationCenter c.radiationWidth -1 })

        RadiationRightBtn ->
            updateRaceConfigAndValidate model
                (\c -> { c | radiationCenter = adjustCenter c.radiationCenter c.radiationWidth 1 })
