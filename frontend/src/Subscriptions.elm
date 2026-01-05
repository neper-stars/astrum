module Subscriptions exposing (subscriptions)

{-| Application subscriptions.

Subscriptions listen for external events:
- Port messages from Go backend
- Browser events

-}

import Api.Decode as Decode
import Browser.Events
import Json.Decode as D
import Model exposing (Dialog(..), Model)
import Msg exposing (Msg(..))
import Ports
import Time



-- =============================================================================
-- SUBSCRIPTIONS
-- =============================================================================


subscriptions : Model -> Sub Msg
subscriptions model =
    let
        -- Mouse subscriptions when dragging a player
        playerDragSubs =
            case model.sessionDetail of
                Just detail ->
                    case detail.dragState of
                        Just _ ->
                            [ Browser.Events.onMouseMove
                                (D.map2 MouseMoveWhileDragging
                                    (D.field "clientX" D.float)
                                    (D.field "clientY" D.float)
                                )
                            , Browser.Events.onMouseUp (D.succeed MouseUpEndDrag)
                            ]

                        Nothing ->
                            []

                Nothing ->
                    []

        -- Mouse subscriptions when dragging a server
        serverDragSubs =
            case model.serverDragState of
                Just _ ->
                    [ Browser.Events.onMouseMove
                        (D.map ServerDragMove (D.field "clientY" D.float))
                    , Browser.Events.onMouseUp (D.succeed ServerDragEnd)
                    ]

                Nothing ->
                    []

        -- Subscription for habitability button hold-to-repeat
        habButtonSubs =
            case model.dialog of
                Just (RaceBuilderDialog form) ->
                    case form.heldHabButton of
                        Just _ ->
                            -- Tick every 100ms while button is held
                            [ Time.every 100 (\_ -> HabButtonTick) ]

                        Nothing ->
                            []

                _ ->
                    []
    in
    Sub.batch
        (playerDragSubs
            ++ serverDragSubs
            ++ habButtonSubs
            ++ [ -- Server management results
                 Ports.serversReceived (decodeResult Decode.serverList GotServers)
        , Ports.serverAdded (decodeResult Decode.server ServerAdded)
        , Ports.serverUpdated (decodeResult (D.succeed ()) ServerUpdated)
        , Ports.serverRemoved (decodeResult (D.succeed ()) ServerRemoved)
        , Ports.hasDefaultServerResult (decodeResult D.bool GotHasDefaultServer)
        , Ports.defaultServerAdded (decodeResult Decode.server DefaultServerAdded)

        -- Authentication results
        , Ports.connectResult decodeConnectResult
        , Ports.disconnectResult decodeDisconnectResult
        , Ports.registerResult decodeRegisterResult
        , Ports.createUserResult decodeCreateUserResult
        , Ports.deleteUserResult decodeDeleteUserResult
        , Ports.pendingRegistrationsReceived decodePendingRegistrationsReceived
        , Ports.approveRegistrationResult decodeApproveRegistrationResult
        , Ports.rejectRegistrationResult decodeRejectRegistrationResult

        -- Session results
        , Ports.sessionsReceived decodeSessionsReceived
        , Ports.archivedSessionsReceived decodeArchivedSessionsReceived
        , Ports.sessionReceived decodeSessionReceived
        , Ports.sessionCreated (decodeResultWithServerUrl Decode.session SessionCreated)
        , Ports.sessionJoined (decodeResultWithServerUrl Decode.session SessionJoined)
        , Ports.sessionDeleted (decodeResultWithServerUrl (D.succeed ()) SessionDeleted)
        , Ports.sessionQuit (decodeResultWithServerUrl (D.succeed ()) SessionQuitResult)
        , Ports.memberPromoted (decodeResultWithServerUrl (D.succeed ()) MemberPromoted)
        , Ports.sessionArchived (decodeResultWithServerUrl (D.succeed ()) SessionArchived)

        -- User profiles & invitations
        , Ports.userProfilesReceived (decodeResultWithServerUrl Decode.userProfileList GotUserProfiles)
        , Ports.inviteResult (decodeResultWithServerUrl (D.succeed ()) InviteResult)
        , Ports.invitationsReceived decodeInvitationsReceived
        , Ports.sentInvitationsReceived decodeSentInvitationsReceived
        , Ports.invitationAccepted (decodeResultWithServerUrl Decode.session InvitationAccepted)
        , Ports.invitationDeclined (decodeResultWithServerUrl (D.succeed ()) InvitationDeclined)
        , Ports.sentInvitationCanceled (decodeResultWithServerUrl (D.succeed ()) SentInvitationCanceled)

        -- Races
        , Ports.racesReceived (decodeResultWithServerUrl Decode.raceList GotRaces)
        , Ports.raceUploaded (decodeResultWithServerUrl Decode.race RaceUploaded)
        , Ports.raceDownloaded (decodeResult (D.succeed ()) RaceDownloaded)
        , Ports.raceDeleted (decodeResultWithServerUrl (D.succeed ()) RaceDeleted)
        , Ports.sessionRaceSet (decodeResultWithServerUrl (D.succeed ()) SetupRaceResult)
        , Ports.uploadAndSetSessionRaceResult (decodeResultWithServerUrl (D.succeed ()) SetupRaceResult)
        , Ports.playerReadyResult (decodeResultWithServerUrl (D.succeed ()) PlayerReadyResult)
        , Ports.sessionPlayerRaceReceived decodeSessionPlayerRace
        , Ports.botPlayerAdded (decodeResultWithServerUrl (D.succeed ()) AddBotResult)

        -- Race Builder
        , Ports.raceBuilderValidation (decodeResult Decode.raceValidation RaceBuilderValidationReceived)
        , Ports.raceTemplateReceived (decodeResult Decode.raceConfig RaceTemplateLoaded)
        , Ports.raceBuilderSaved (decodeResult Decode.race RaceBuilderSaved)
        , Ports.raceFileConfigLoaded (decodeResult Decode.raceConfig RaceFileLoaded)

        -- Rules
        , Ports.rulesReceived decodeRulesReceived
        , Ports.rulesSet (decodeResultWithServerUrl Decode.rules RulesSet)

        -- Start Game
        , Ports.gameStarted (decodeResultWithServerUrl (D.succeed ()) GameStarted)

        -- Player Reordering
        , Ports.playersReordered (decodeResultWithServerUrl (D.succeed ()) PlayersReordered)

        -- Server Reordering
        , Ports.serversReordered (decodeResult (D.succeed ()) ServersReordered)

        -- Events from Go backend
        , Ports.sessionsUpdated SessionsUpdated
        , Ports.connectionChanged decodeConnectionChanged
        , Ports.orderConflictReceived decodeOrderConflict

        -- WebSocket notifications
        , Ports.notificationSession (decodeNotification NotificationSession)
        , Ports.notificationInvitation (decodeNotification NotificationInvitation)
        , Ports.notificationRace (decodeNotification NotificationRace)
        , Ports.notificationRuleset (decodeNotification NotificationRuleset)
        , Ports.notificationPlayerRace (decodeNotification NotificationPlayerRace)
        , Ports.notificationSessionTurn decodeSessionTurnNotification
        , Ports.notificationOrderStatus (decodeNotification NotificationOrderStatus)
        , Ports.notificationPendingRegistration decodePendingRegistrationNotification

        -- Turn files
        , Ports.turnReceived decodeTurnReceived
        , Ports.latestTurnReceived decodeLatestTurnReceived

        -- Orders status
        , Ports.ordersStatusReceived decodeOrdersStatusReceived

        -- App settings
        , Ports.appSettingsReceived (decodeResult Decode.appSettings GotAppSettings)
        , Ports.serversDirSelected (decodeResult Decode.appSettings ServersDirSelected)
        , Ports.autoDownloadStarsSet (decodeResult Decode.appSettings AutoDownloadStarsSet)
        , Ports.zoomLevelSet (decodeResult Decode.appSettings ZoomLevelSet)
        , Ports.useWineSet (decodeResult Decode.appSettings UseWineSet)
        , Ports.winePrefixesDirSelected (decodeResult Decode.appSettings WinePrefixesDirSelected)
        , Ports.wineInstallChecked (decodeResult Decode.wineCheckResult WineInstallChecked)
        , Ports.ntvdmChecked (decodeResult Decode.ntvdmCheckResult NtvdmChecked)
        , Ports.enableBrowserStarsSet (decodeResult Decode.appSettings EnableBrowserStarsSet)

        -- Map Viewer
        , Ports.mapGenerated (decodeResult D.string MapGenerated)
        , Ports.mapSaved (decodeResult (D.succeed ()) MapSaved)
        , Ports.animatedMapGenerated (decodeResult D.string AnimatedMapGenerated)
        , Ports.gifSaved (decodeResult (D.succeed ()) GifSaved)

        -- Zoom keyboard events
        , Ports.zoomKeyPressed decodeZoomKey

        -- Admin
        , Ports.resetApikeyResult (decodeResult D.string ResetApikeyResult)
        , Ports.changeApikeyResult (decodeResult D.string ChangeApikeyResult)
        , Ports.apiKeyReceived (decodeResultWithServerUrl D.string GotApiKey)

        -- Launch Stars
        , Ports.launchStarsResult (decodeResult (D.succeed ()) LaunchStarsResult)

        -- Has Stars Exe
        , Ports.hasStarsExeResult
            (decodeResult
                (D.map3 (\serverUrl sessionId hasStarsExe -> { serverUrl = serverUrl, sessionId = sessionId, hasStarsExe = hasStarsExe })
                    (D.field "serverUrl" D.string)
                    (D.field "sessionId" D.string)
                    (D.field "hasStarsExe" D.bool)
                )
                GotHasStarsExe
            )

        -- Session Backup
        , Ports.sessionBackupDownloaded (decodeResultWithServerUrl (D.succeed ()) SessionBackupDownloaded)

        -- Historic Backup
        , Ports.historicBackupDownloaded (decodeResultWithServerUrl (D.succeed ()) HistoricBackupDownloaded)

        -- UI events
        , Ports.escapePressed (\_ -> EscapePressed)
        ]
        )


{-| Decode zoom key event.

The JavaScript sends: "in" | "out" | "reset"

-}
decodeZoomKey : String -> Msg
decodeZoomKey key =
    case key of
        "in" ->
            ZoomIn

        "out" ->
            ZoomOut

        "reset" ->
            ZoomReset

        _ ->
            NoOp



-- =============================================================================
-- DECODERS
-- =============================================================================


{-| Decode a result from the Go backend.

The JavaScript bridge wraps results as:
- `{ ok: value }` for success
- `{ error: "message" }` for errors

-}
decodeResult : D.Decoder a -> (Result String a -> Msg) -> D.Value -> Msg
decodeResult valueDecoder toMsg value =
    let
        resultDecoder =
            D.oneOf
                [ D.field "ok" valueDecoder |> D.map Ok
                , D.field "error" D.string |> D.map Err
                ]
    in
    case D.decodeValue resultDecoder value of
        Ok result ->
            toMsg result

        Err err ->
            toMsg (Err (D.errorToString err))


{-| Decode a result that includes serverUrl from the Go backend.

The JavaScript bridge wraps results as:
- `{ serverUrl: "...", ok: value }` for success
- `{ serverUrl: "...", error: "message" }` for errors

-}
decodeResultWithServerUrl : D.Decoder a -> (String -> Result String a -> Msg) -> D.Value -> Msg
decodeResultWithServerUrl valueDecoder toMsg value =
    let
        decoder =
            D.map2 Tuple.pair
                (D.field "serverUrl" D.string)
                (D.oneOf
                    [ D.field "ok" valueDecoder |> D.map Ok
                    , D.field "error" D.string |> D.map Err
                    ]
                )
    in
    case D.decodeValue decoder value of
        Ok ( serverUrl, result ) ->
            toMsg serverUrl result

        Err err ->
            toMsg "" (Err (D.errorToString err))


{-| Decode connect result which includes the server URL.

The JavaScript sends: { serverUrl: "...", result: { ok: {...} } | { error: "..." } }

-}
decodeConnectResult : D.Value -> Msg
decodeConnectResult value =
    let
        connectInfoDecoder =
            D.map4 (\u i m s -> { username = u, userId = i, isManager = m, serialKey = s })
                (D.field "username" D.string)
                (D.field "userId" D.string)
                (D.oneOf [ D.field "isManager" D.bool, D.succeed False ])
                (D.oneOf [ D.field "serialKey" D.string, D.succeed "" ])

        decoder =
            D.map2 Tuple.pair
                (D.field "serverUrl" D.string)
                (D.oneOf
                    [ D.field "ok" connectInfoDecoder |> D.map Ok
                    , D.field "error" D.string |> D.map Err
                    ]
                )
    in
    case D.decodeValue decoder value of
        Ok ( serverUrl, result ) ->
            ConnectResult serverUrl result

        Err err ->
            -- Fallback: try without serverUrl wrapper
            case D.decodeValue (D.field "error" D.string) value of
                Ok errorMsg ->
                    ConnectResult "" (Err errorMsg)

                Err _ ->
                    ConnectResult "" (Err (D.errorToString err))


{-| Decode disconnect result.
-}
decodeDisconnectResult : D.Value -> Msg
decodeDisconnectResult value =
    let
        decoder =
            D.map2 Tuple.pair
                (D.field "serverUrl" D.string)
                (D.oneOf
                    [ D.field "ok" (D.succeed ()) |> D.map Ok
                    , D.field "error" D.string |> D.map Err
                    ]
                )
    in
    case D.decodeValue decoder value of
        Ok ( serverUrl, result ) ->
            DisconnectResult serverUrl result

        Err err ->
            DisconnectResult "" (Err (D.errorToString err))


{-| Decode register result.
-}
decodeRegisterResult : D.Value -> Msg
decodeRegisterResult value =
    let
        registrationResultDecoder =
            D.map3 (\userId nickname pending -> { userId = userId, nickname = nickname, pending = pending })
                (D.field "userId" D.string)
                (D.field "nickname" D.string)
                (D.field "pending" D.bool)

        decoder =
            D.map2 Tuple.pair
                (D.field "serverUrl" D.string)
                (D.oneOf
                    [ D.field "ok" registrationResultDecoder |> D.map Ok
                    , D.field "error" D.string |> D.map Err
                    ]
                )
    in
    case D.decodeValue decoder value of
        Ok ( serverUrl, result ) ->
            RegisterResult serverUrl result

        Err err ->
            RegisterResult "" (Err (D.errorToString err))


{-| Decode create user result (admin).
-}
decodeCreateUserResult : D.Value -> Msg
decodeCreateUserResult value =
    let
        userDecoder =
            D.map3 (\id nickname email -> { id = id, nickname = nickname, email = email })
                (D.field "id" D.string)
                (D.field "nickname" D.string)
                (D.field "email" D.string)

        decoder =
            D.map2 Tuple.pair
                (D.field "serverUrl" D.string)
                (D.oneOf
                    [ D.field "ok" userDecoder |> D.map Ok
                    , D.field "error" D.string |> D.map Err
                    ]
                )
    in
    case D.decodeValue decoder value of
        Ok ( serverUrl, result ) ->
            CreateUserResult serverUrl result

        Err err ->
            CreateUserResult "" (Err (D.errorToString err))


{-| Decode delete user result (admin).
-}
decodeDeleteUserResult : D.Value -> Msg
decodeDeleteUserResult value =
    let
        decoder =
            D.map2 Tuple.pair
                (D.field "serverUrl" D.string)
                (D.oneOf
                    [ D.field "ok" (D.succeed ()) |> D.map Ok
                    , D.field "error" D.string |> D.map Err
                    ]
                )
    in
    case D.decodeValue decoder value of
        Ok ( serverUrl, result ) ->
            DeleteUserResult serverUrl result

        Err err ->
            DeleteUserResult "" (Err (D.errorToString err))


{-| Decode pending registrations received result (admin).
-}
decodePendingRegistrationsReceived : D.Value -> Msg
decodePendingRegistrationsReceived value =
    let
        userDecoder =
            D.map4 (\id nickname email message -> { id = id, nickname = nickname, email = email, message = message })
                (D.field "id" D.string)
                (D.field "nickname" D.string)
                (D.field "email" D.string)
                (D.maybe (D.field "message" D.string))

        decoder =
            D.map2 Tuple.pair
                (D.field "serverUrl" D.string)
                (D.oneOf
                    [ D.field "ok" (D.list userDecoder) |> D.map Ok
                    , D.field "error" D.string |> D.map Err
                    ]
                )
    in
    case D.decodeValue decoder value of
        Ok ( serverUrl, result ) ->
            GotPendingRegistrations serverUrl result

        Err err ->
            GotPendingRegistrations "" (Err (D.errorToString err))


{-| Decode approve registration result (admin).
-}
decodeApproveRegistrationResult : D.Value -> Msg
decodeApproveRegistrationResult value =
    let
        decoder =
            D.map2 Tuple.pair
                (D.field "serverUrl" D.string)
                (D.oneOf
                    [ D.field "ok" D.string |> D.map Ok
                    , D.field "error" D.string |> D.map Err
                    ]
                )
    in
    case D.decodeValue decoder value of
        Ok ( serverUrl, result ) ->
            ApproveRegistrationResult serverUrl result

        Err err ->
            ApproveRegistrationResult "" (Err (D.errorToString err))


{-| Decode reject registration result (admin).
-}
decodeRejectRegistrationResult : D.Value -> Msg
decodeRejectRegistrationResult value =
    let
        decoder =
            D.map2 Tuple.pair
                (D.field "serverUrl" D.string)
                (D.oneOf
                    [ D.field "ok" (D.succeed ()) |> D.map Ok
                    , D.field "error" D.string |> D.map Err
                    ]
                )
    in
    case D.decodeValue decoder value of
        Ok ( serverUrl, result ) ->
            RejectRegistrationResult serverUrl result

        Err err ->
            RejectRegistrationResult "" (Err (D.errorToString err))


{-| Decode sessions received result.

The JavaScript sends: { serverUrl: "...", ok: [...] } | { serverUrl: "...", error: "..." }

This allows us to update the correct server's sessions.

-}
decodeSessionsReceived : D.Value -> Msg
decodeSessionsReceived value =
    let
        decoder =
            D.map2 Tuple.pair
                (D.field "serverUrl" D.string)
                (D.oneOf
                    [ D.field "ok" Decode.sessionList |> D.map Ok
                    , D.field "error" D.string |> D.map Err
                    ]
                )
    in
    case D.decodeValue decoder value of
        Ok ( serverUrl, result ) ->
            GotSessions serverUrl result

        Err err ->
            GotSessions "" (Err ("Failed to decode sessions response: " ++ D.errorToString err))


{-| Decode archived sessions received result.

The JavaScript sends: { serverUrl: "...", ok: [...] } | { serverUrl: "...", error: "..." }

-}
decodeArchivedSessionsReceived : D.Value -> Msg
decodeArchivedSessionsReceived value =
    let
        decoder =
            D.map2 Tuple.pair
                (D.field "serverUrl" D.string)
                (D.oneOf
                    [ D.field "ok" Decode.sessionList |> D.map Ok
                    , D.field "error" D.string |> D.map Err
                    ]
                )
    in
    case D.decodeValue decoder value of
        Ok ( serverUrl, result ) ->
            GotArchivedSessions serverUrl result

        Err err ->
            GotArchivedSessions "" (Err ("Failed to decode archived sessions response: " ++ D.errorToString err))


{-| Decode single session received result.

The JavaScript sends: { serverUrl: "...", ok: {...} } | { serverUrl: "...", error: "..." }

This allows us to update the correct server's session.

-}
decodeSessionReceived : D.Value -> Msg
decodeSessionReceived value =
    let
        decoder =
            D.map2 Tuple.pair
                (D.field "serverUrl" D.string)
                (D.oneOf
                    [ D.field "ok" Decode.session |> D.map Ok
                    , D.field "error" D.string |> D.map Err
                    ]
                )
    in
    case D.decodeValue decoder value of
        Ok ( serverUrl, result ) ->
            GotSession serverUrl result

        Err err ->
            GotSession "" (Err ("Failed to decode session response: " ++ D.errorToString err))


{-| Decode rules received result.

The JavaScript sends: { serverUrl: "...", sessionId: "...", ok: {...} } | { serverUrl: "...", sessionId: "...", error: "..." }

This allows us to cache rules by serverUrl and sessionId.

-}
decodeRulesReceived : D.Value -> Msg
decodeRulesReceived value =
    let
        decoder =
            D.map3 (\serverUrl sessionId result -> ( serverUrl, sessionId, result ))
                (D.field "serverUrl" D.string)
                (D.field "sessionId" D.string)
                (D.oneOf
                    [ D.field "ok" Decode.rules |> D.map Ok
                    , D.field "error" D.string |> D.map Err
                    ]
                )
    in
    case D.decodeValue decoder value of
        Ok ( serverUrl, sessionId, result ) ->
            GotRules serverUrl sessionId result

        Err err ->
            GotRules "" "" (Err (D.errorToString err))


{-| Decode invitations received result.

The JavaScript sends: { serverUrl: "...", ok: [...] } | { serverUrl: "...", error: "..." }

-}
decodeInvitationsReceived : D.Value -> Msg
decodeInvitationsReceived value =
    let
        decoder =
            D.map2 Tuple.pair
                (D.field "serverUrl" D.string)
                (D.oneOf
                    [ D.field "ok" Decode.invitationList |> D.map Ok
                    , D.field "error" D.string |> D.map Err
                    ]
                )
    in
    case D.decodeValue decoder value of
        Ok ( serverUrl, result ) ->
            GotInvitations serverUrl result

        Err err ->
            GotInvitations "" (Err ("Failed to decode invitations response: " ++ D.errorToString err))


{-| Decode sent invitations received result.

The JavaScript sends: { serverUrl: "...", ok: [...] } | { serverUrl: "...", error: "..." }

-}
decodeSentInvitationsReceived : D.Value -> Msg
decodeSentInvitationsReceived value =
    let
        decoder =
            D.map2 Tuple.pair
                (D.field "serverUrl" D.string)
                (D.oneOf
                    [ D.field "ok" Decode.invitationList |> D.map Ok
                    , D.field "error" D.string |> D.map Err
                    ]
                )
    in
    case D.decodeValue decoder value of
        Ok ( serverUrl, result ) ->
            GotSentInvitations serverUrl result

        Err err ->
            GotSentInvitations "" (Err ("Failed to decode sent invitations response: " ++ D.errorToString err))


{-| Decode connection changed event.

The JavaScript sends: { serverUrl: "...", connected: true/false }

-}
decodeConnectionChanged : D.Value -> Msg
decodeConnectionChanged value =
    let
        decoder =
            D.map2 ConnectionChanged
                (D.field "serverUrl" D.string)
                (D.field "connected" D.bool)
    in
    case D.decodeValue decoder value of
        Ok msg ->
            msg

        Err _ ->
            NoOp


{-| Decode order conflict event.

The JavaScript sends: { serverUrl: "...", sessionId: "...", year: Int }

-}
decodeOrderConflict : D.Value -> Msg
decodeOrderConflict value =
    let
        decoder =
            D.map3 OrderConflictReceived
                (D.field "serverUrl" D.string)
                (D.field "sessionId" D.string)
                (D.field "year" D.int)
    in
    case D.decodeValue decoder value of
        Ok msg ->
            msg

        Err _ ->
            NoOp


{-| Decode WebSocket notification event.

The JavaScript sends: { serverUrl: "...", id: "...", action: "..." }

-}
decodeNotification : (String -> String -> String -> Msg) -> D.Value -> Msg
decodeNotification toMsg value =
    let
        decoder =
            D.map3 toMsg
                (D.field "serverUrl" D.string)
                (D.field "id" D.string)
                (D.field "action" D.string)
    in
    case D.decodeValue decoder value of
        Ok msg ->
            msg

        Err _ ->
            NoOp


{-| Decode session turn notification event.

The JavaScript sends: { serverUrl: "...", sessionId: "...", action: "...", year: number|null }

-}
decodeSessionTurnNotification : D.Value -> Msg
decodeSessionTurnNotification value =
    let
        decoder =
            D.map4 NotificationSessionTurn
                (D.field "serverUrl" D.string)
                (D.field "sessionId" D.string)
                (D.field "action" D.string)
                (D.field "year" (D.nullable D.int))
    in
    case D.decodeValue decoder value of
        Ok msg ->
            msg

        Err _ ->
            NoOp


{-| Decode pending registration notification event.

The JavaScript sends: { serverUrl: "...", id: "...", action: "...", userProfileId: string|null, nickname: string|null }

-}
decodePendingRegistrationNotification : D.Value -> Msg
decodePendingRegistrationNotification value =
    let
        decoder =
            D.map5 NotificationPendingRegistration
                (D.field "serverUrl" D.string)
                (D.field "id" D.string)
                (D.field "action" D.string)
                (D.field "userProfileId" (D.nullable D.string))
                (D.field "nickname" (D.nullable D.string))
    in
    case D.decodeValue decoder value of
        Ok msg ->
            msg

        Err _ ->
            NoOp


{-| Decode turn files received result.

The JavaScript sends: { serverUrl: "...", ok: {...} } | { serverUrl: "...", error: "..." }

-}
decodeTurnReceived : D.Value -> Msg
decodeTurnReceived value =
    let
        decoder =
            D.map2 Tuple.pair
                (D.field "serverUrl" D.string)
                (D.oneOf
                    [ D.field "ok" Decode.turnFiles |> D.map Ok
                    , D.field "error" D.string |> D.map Err
                    ]
                )
    in
    case D.decodeValue decoder value of
        Ok ( serverUrl, result ) ->
            GotTurnFiles serverUrl result

        Err err ->
            GotTurnFiles "" (Err ("Failed to decode turn files response: " ++ D.errorToString err))


{-| Decode latest turn received result.

The JavaScript sends: { serverUrl: "...", ok: {...} } | { serverUrl: "...", error: "..." }

-}
decodeLatestTurnReceived : D.Value -> Msg
decodeLatestTurnReceived value =
    let
        decoder =
            D.map2 Tuple.pair
                (D.field "serverUrl" D.string)
                (D.oneOf
                    [ D.field "ok" Decode.turnFiles |> D.map Ok
                    , D.field "error" D.string |> D.map Err
                    ]
                )
    in
    case D.decodeValue decoder value of
        Ok ( serverUrl, result ) ->
            GotLatestTurn serverUrl result

        Err err ->
            GotLatestTurn "" (Err ("Failed to decode latest turn response: " ++ D.errorToString err))


{-| Decode orders status received result.

The JavaScript sends: { serverUrl: "...", ok: {...} } | { serverUrl: "...", error: "..." }

-}
decodeOrdersStatusReceived : D.Value -> Msg
decodeOrdersStatusReceived value =
    let
        decoder =
            D.map2 Tuple.pair
                (D.field "serverUrl" D.string)
                (D.oneOf
                    [ D.field "ok" Decode.ordersStatus |> D.map Ok
                    , D.field "error" D.string |> D.map Err
                    ]
                )
    in
    case D.decodeValue decoder value of
        Ok ( serverUrl, result ) ->
            GotOrdersStatus serverUrl result

        Err err ->
            GotOrdersStatus "" (Err ("Failed to decode orders status response: " ++ D.errorToString err))


{-| Decode session player race received result.

The JavaScript sends: { serverUrl: "...", sessionId: "...", ok: {...} } | { serverUrl: "...", sessionId: "...", error: "..." }

This allows us to store the current user's race for a session.

-}
decodeSessionPlayerRace : D.Value -> Msg
decodeSessionPlayerRace value =
    let
        decoder =
            D.map3 (\serverUrl sessionId result -> ( serverUrl, sessionId, result ))
                (D.field "serverUrl" D.string)
                (D.field "sessionId" D.string)
                (D.oneOf
                    [ D.field "ok" Decode.race |> D.map Ok
                    , D.field "error" D.string |> D.map Err
                    ]
                )
    in
    case D.decodeValue decoder value of
        Ok ( serverUrl, sessionId, result ) ->
            GotSessionPlayerRace serverUrl sessionId result

        Err err ->
            GotSessionPlayerRace "" "" (Err (D.errorToString err))
