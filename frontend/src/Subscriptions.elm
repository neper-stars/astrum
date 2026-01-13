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
import Update.Auth
import Update.DragDrop
import Update.MapViewer
import Update.Notifications
import Update.RaceBuilder
import Update.Races
import Update.Rules
import Update.Server
import Update.Settings
import Update.TurnFiles
import Update.SessionDetail
import Update.Sessions
import Update.UI
import Update.Admin



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
                                (D.map2 (\x y -> DragDropMsg (Update.DragDrop.MouseMoveWhileDragging x y))
                                    (D.field "clientX" D.float)
                                    (D.field "clientY" D.float)
                                )
                            , Browser.Events.onMouseUp (D.succeed (DragDropMsg Update.DragDrop.MouseUpEndDrag))
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
                        (D.map (\y -> DragDropMsg (Update.DragDrop.ServerDragMove y)) (D.field "clientY" D.float))
                    , Browser.Events.onMouseUp (D.succeed (DragDropMsg Update.DragDrop.ServerDragEnd))
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
                            [ Time.every 100 (\_ -> RaceBuilderMsg Update.RaceBuilder.HabButtonTick) ]

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
                 Ports.serversReceived (decodeResult Decode.serverList (ServerMsg << Update.Server.GotServers))
        , Ports.serverAdded (decodeResult Decode.server (ServerMsg << Update.Server.ServerAdded))
        , Ports.serverUpdated (decodeResult (D.succeed ()) (ServerMsg << Update.Server.ServerUpdated))
        , Ports.serverRemoved (decodeResult (D.succeed ()) (ServerMsg << Update.Server.ServerRemoved))
        , Ports.hasDefaultServerResult (decodeResult D.bool (ServerMsg << Update.Server.GotHasDefaultServer))
        , Ports.defaultServerAdded (decodeResult Decode.server (ServerMsg << Update.Server.DefaultServerAdded))

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
        , Ports.sessionCreated (decodeResultWithServerUrl Decode.session (\url result -> SessionsMsg (Update.Sessions.SessionCreated url result)))
        , Ports.sessionJoined (decodeResultWithServerUrl Decode.session (\url result -> SessionsMsg (Update.Sessions.SessionJoined url result)))
        , Ports.sessionDeleted (decodeResultWithServerUrl (D.succeed ()) (\url result -> SessionsMsg (Update.Sessions.SessionDeleted url result)))
        , Ports.sessionQuit (decodeResultWithServerUrl (D.succeed ()) (\url result -> SessionsMsg (Update.Sessions.SessionQuitResult url result)))
        , Ports.memberPromoted (decodeResultWithServerUrl (D.succeed ()) (\url result -> SessionsMsg (Update.Sessions.MemberPromoted url result)))
        , Ports.sessionArchived (decodeResultWithServerUrl (D.succeed ()) (\url result -> SessionsMsg (Update.Sessions.SessionArchived url result)))

        -- User profiles & invitations
        , Ports.userProfilesReceived (decodeResultWithServerUrl Decode.userProfileList (\url result -> SessionDetailMsg (Update.SessionDetail.GotUserProfiles url result)))
        , Ports.inviteResult (decodeResultWithServerUrl (D.succeed ()) (\url result -> SessionDetailMsg (Update.SessionDetail.InviteResult url result)))
        , Ports.invitationsReceived decodeInvitationsReceived
        , Ports.sentInvitationsReceived decodeSentInvitationsReceived
        , Ports.invitationAccepted (decodeResultWithServerUrl Decode.session (\url result -> SessionDetailMsg (Update.SessionDetail.InvitationAccepted url result)))
        , Ports.invitationDeclined (decodeResultWithServerUrl (D.succeed ()) (\url result -> SessionDetailMsg (Update.SessionDetail.InvitationDeclined url result)))
        , Ports.sentInvitationCanceled (decodeResultWithServerUrl (D.succeed ()) (\url result -> SessionDetailMsg (Update.SessionDetail.SentInvitationCanceled url result)))

        -- Races
        , Ports.racesReceived (decodeResultWithServerUrl Decode.raceList (\url result -> RacesMsg (Update.Races.GotRaces url result)))
        , Ports.raceUploaded (decodeResultWithServerUrl Decode.race (\url result -> RacesMsg (Update.Races.RaceUploaded url result)))
        , Ports.raceDownloaded (decodeResult (D.succeed ()) (RacesMsg << Update.Races.RaceDownloaded))
        , Ports.raceDeleted (decodeResultWithServerUrl (D.succeed ()) (\url result -> RacesMsg (Update.Races.RaceDeleted url result)))
        , Ports.sessionRaceSet (decodeResultWithServerUrl (D.succeed ()) (\url result -> RacesMsg (Update.Races.SetupRaceResult url result)))
        , Ports.uploadAndSetSessionRaceResult (decodeResultWithServerUrl (D.succeed ()) (\url result -> RacesMsg (Update.Races.SetupRaceResult url result)))
        , Ports.playerReadyResult (decodeResultWithServerUrl (D.succeed ()) (\url result -> SessionsMsg (Update.Sessions.PlayerReadyResult url result)))
        , Ports.sessionPlayerRaceReceived decodeSessionPlayerRace
        , Ports.botPlayerAdded (decodeResultWithServerUrl (D.succeed ()) (\url result -> AdminMsg (Update.Admin.AddBotResult url result)))
        , Ports.botPlayerRemoved (decodeResultWithServerUrl (D.succeed ()) (\url result -> AdminMsg (Update.Admin.RemoveBotResult url result)))

        -- AI Control
        , Ports.switchToAIResult (decodeResultWithServerUrl (D.succeed ()) (\url result -> AdminMsg (Update.Admin.SwitchToAIResult url result)))
        , Ports.switchToHumanResult (decodeResultWithServerUrl (D.succeed ()) (\url result -> AdminMsg (Update.Admin.SwitchToHumanResult url result)))
        , Ports.playerControlReceived decodePlayerControlResult

        -- Race Builder
        , Ports.raceBuilderValidation (decodeResult Decode.raceValidation (RaceBuilderMsg << Update.RaceBuilder.RaceBuilderValidationReceived))
        , Ports.raceTemplateReceived (decodeResult Decode.raceConfig (RaceBuilderMsg << Update.RaceBuilder.RaceTemplateLoaded))
        , Ports.raceBuilderSaved (decodeResult Decode.race (RaceBuilderMsg << Update.RaceBuilder.RaceBuilderSaved))
        , Ports.raceFileConfigLoaded (decodeResult Decode.raceConfig (RaceBuilderMsg << Update.RaceBuilder.RaceFileLoaded))

        -- Rules
        , Ports.rulesReceived decodeRulesReceived
        , Ports.rulesSet (decodeResultWithServerUrl Decode.rules (\url result -> RulesMsg (Update.Rules.RulesSet url result)))

        -- Start Game
        , Ports.gameStarted (decodeResultWithServerUrl (D.succeed ()) (\url result -> SessionsMsg (Update.Sessions.GameStarted url result)))

        -- Player Reordering
        , Ports.playersReordered (decodeResultWithServerUrl (D.succeed ()) (\url result -> DragDropMsg (Update.DragDrop.PlayersReordered url result)))

        -- Server Reordering
        , Ports.serversReordered (decodeResult (D.succeed ()) (DragDropMsg << Update.DragDrop.ServersReordered))

        -- Events from Go backend
        , Ports.sessionsUpdated (SessionsMsg << Update.Sessions.SessionsUpdated)
        , Ports.connectionChanged decodeConnectionChanged
        , Ports.orderConflictReceived decodeOrderConflict

        -- WebSocket notifications
        , Ports.notificationSession (decodeNotification Update.Notifications.NotificationSession)
        , Ports.notificationInvitation (decodeNotification Update.Notifications.NotificationInvitation)
        , Ports.notificationRace (decodeNotification Update.Notifications.NotificationRace)
        , Ports.notificationRuleset (decodeNotification Update.Notifications.NotificationRuleset)
        , Ports.notificationPlayerRace (decodeNotification Update.Notifications.NotificationPlayerRace)
        , Ports.notificationSessionTurn decodeSessionTurnNotification
        , Ports.notificationOrderStatus (decodeNotification Update.Notifications.NotificationOrderStatus)
        , Ports.notificationPendingRegistration decodePendingRegistrationNotification

        -- Turn files
        , Ports.turnReceived decodeTurnReceived
        , Ports.latestTurnReceived decodeLatestTurnReceived

        -- Orders status
        , Ports.ordersStatusReceived decodeOrdersStatusReceived

        -- App settings
        , Ports.appSettingsReceived (decodeResult Decode.appSettings (SettingsMsg << Update.Settings.GotAppSettings))
        , Ports.serversDirSelected (decodeResult Decode.appSettings (SettingsMsg << Update.Settings.ServersDirSelected))
        , Ports.autoDownloadStarsSet (decodeResult Decode.appSettings (SettingsMsg << Update.Settings.AutoDownloadStarsSet))
        , Ports.zoomLevelSet (decodeResult Decode.appSettings (UIMsg << Update.UI.ZoomLevelSet))
        , Ports.useWineSet (decodeResult Decode.appSettings (SettingsMsg << Update.Settings.UseWineSet))
        , Ports.winePrefixesDirSelected (decodeResult Decode.appSettings (SettingsMsg << Update.Settings.WinePrefixesDirSelected))
        , Ports.wineInstallChecked (decodeResult Decode.wineCheckResult (SettingsMsg << Update.Settings.WineInstallChecked))
        , Ports.ntvdmChecked (decodeResult Decode.ntvdmCheckResult (SettingsMsg << Update.Settings.NtvdmChecked))
        , Ports.enableBrowserStarsSet (decodeResult Decode.appSettings (UIMsg << Update.UI.EnableBrowserStarsSet))

        -- Map Viewer
        , Ports.mapGenerated (decodeResult D.string (MapViewerMsg << Update.MapViewer.MapGenerated))
        , Ports.mapSaved (decodeResult (D.succeed ()) (MapViewerMsg << Update.MapViewer.MapSaved))
        , Ports.animatedMapGenerated (decodeResult D.string (MapViewerMsg << Update.MapViewer.AnimatedMapGenerated))
        , Ports.gifSaved (decodeResult (D.succeed ()) (MapViewerMsg << Update.MapViewer.GifSaved))

        -- Zoom keyboard events
        , Ports.zoomKeyPressed decodeZoomKey

        -- Admin
        , Ports.resetApikeyResult (decodeResult D.string (AdminMsg << Update.Admin.ResetApikeyResult))
        , Ports.changeApikeyResult (decodeResult D.string (AdminMsg << Update.Admin.ChangeApikeyResult))
        , Ports.apiKeyReceived (decodeResultWithServerUrl D.string (\url result -> AdminMsg (Update.Admin.GotApiKey url result)))

        -- Launch Stars
        , Ports.launchStarsResult (decodeResult (D.succeed ()) (TurnFilesMsg << Update.TurnFiles.LaunchStarsResult))

        -- Has Stars Exe
        , Ports.hasStarsExeResult
            (decodeResult
                (D.map3 (\serverUrl sessionId hasStarsExe -> { serverUrl = serverUrl, sessionId = sessionId, hasStarsExe = hasStarsExe })
                    (D.field "serverUrl" D.string)
                    (D.field "sessionId" D.string)
                    (D.field "hasStarsExe" D.bool)
                )
                (TurnFilesMsg << Update.TurnFiles.GotHasStarsExe)
            )

        -- Session Backup
        , Ports.sessionBackupDownloaded (decodeResultWithServerUrl (D.succeed ()) (\url result -> SessionsMsg (Update.Sessions.SessionBackupDownloaded url result)))

        -- Historic Backup
        , Ports.historicBackupDownloaded (decodeResultWithServerUrl (D.succeed ()) (\url result -> SessionsMsg (Update.Sessions.HistoricBackupDownloaded url result)))

        -- UI events
        , Ports.escapePressed (\_ -> UIMsg Update.UI.EscapePressed)
        ]
        )


{-| Decode zoom key event.

The JavaScript sends: "in" | "out" | "reset"

-}
decodeZoomKey : String -> Msg
decodeZoomKey key =
    case key of
        "in" ->
            UIMsg Update.UI.ZoomIn

        "out" ->
            UIMsg Update.UI.ZoomOut

        "reset" ->
            UIMsg Update.UI.ZoomReset

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
            AuthMsg (Update.Auth.ConnectResult serverUrl result)

        Err err ->
            -- Fallback: try without serverUrl wrapper
            case D.decodeValue (D.field "error" D.string) value of
                Ok errorMsg ->
                    AuthMsg (Update.Auth.ConnectResult "" (Err errorMsg))

                Err _ ->
                    AuthMsg (Update.Auth.ConnectResult "" (Err (D.errorToString err)))


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
            AuthMsg (Update.Auth.DisconnectResult serverUrl result)

        Err err ->
            AuthMsg (Update.Auth.DisconnectResult "" (Err (D.errorToString err)))


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
            AuthMsg (Update.Auth.RegisterResult serverUrl result)

        Err err ->
            AuthMsg (Update.Auth.RegisterResult "" (Err (D.errorToString err)))


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
            AdminMsg (Update.Admin.CreateUserResult serverUrl result)

        Err err ->
            AdminMsg (Update.Admin.CreateUserResult "" (Err (D.errorToString err)))


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
            AdminMsg (Update.Admin.DeleteUserResult serverUrl result)

        Err err ->
            AdminMsg (Update.Admin.DeleteUserResult "" (Err (D.errorToString err)))


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
            AdminMsg (Update.Admin.GotPendingRegistrations serverUrl result)

        Err err ->
            AdminMsg (Update.Admin.GotPendingRegistrations "" (Err (D.errorToString err)))


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
            AdminMsg (Update.Admin.ApproveRegistrationResult serverUrl result)

        Err err ->
            AdminMsg (Update.Admin.ApproveRegistrationResult "" (Err (D.errorToString err)))


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
            AdminMsg (Update.Admin.RejectRegistrationResult serverUrl result)

        Err err ->
            AdminMsg (Update.Admin.RejectRegistrationResult "" (Err (D.errorToString err)))


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
            SessionsMsg (Update.Sessions.GotSessions serverUrl result)

        Err err ->
            SessionsMsg (Update.Sessions.GotSessions "" (Err ("Failed to decode sessions response: " ++ D.errorToString err)))


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
            SessionsMsg (Update.Sessions.GotArchivedSessions serverUrl result)

        Err err ->
            SessionsMsg (Update.Sessions.GotArchivedSessions "" (Err ("Failed to decode archived sessions response: " ++ D.errorToString err)))


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
            SessionsMsg (Update.Sessions.GotSession serverUrl result)

        Err err ->
            SessionsMsg (Update.Sessions.GotSession "" (Err ("Failed to decode session response: " ++ D.errorToString err)))


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
            RulesMsg (Update.Rules.GotRules serverUrl sessionId result)

        Err err ->
            RulesMsg (Update.Rules.GotRules "" "" (Err (D.errorToString err)))


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
            SessionDetailMsg (Update.SessionDetail.GotInvitations serverUrl result)

        Err err ->
            SessionDetailMsg (Update.SessionDetail.GotInvitations "" (Err ("Failed to decode invitations response: " ++ D.errorToString err)))


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
            SessionDetailMsg (Update.SessionDetail.GotSentInvitations serverUrl result)

        Err err ->
            SessionDetailMsg (Update.SessionDetail.GotSentInvitations "" (Err ("Failed to decode sent invitations response: " ++ D.errorToString err)))


{-| Decode connection changed event.

The JavaScript sends: { serverUrl: "...", connected: true/false }

-}
decodeConnectionChanged : D.Value -> Msg
decodeConnectionChanged value =
    let
        decoder =
            D.map2 Update.Notifications.ConnectionChanged
                (D.field "serverUrl" D.string)
                (D.field "connected" D.bool)
    in
    case D.decodeValue decoder value of
        Ok msg ->
            NotificationsMsg msg

        Err _ ->
            NoOp


{-| Decode order conflict event.

The JavaScript sends: { serverUrl: "...", sessionId: "...", year: Int }

-}
decodeOrderConflict : D.Value -> Msg
decodeOrderConflict value =
    let
        decoder =
            D.map3 Update.Notifications.OrderConflictReceived
                (D.field "serverUrl" D.string)
                (D.field "sessionId" D.string)
                (D.field "year" D.int)
    in
    case D.decodeValue decoder value of
        Ok msg ->
            NotificationsMsg msg

        Err _ ->
            NoOp


{-| Decode WebSocket notification event.

The JavaScript sends: { serverUrl: "...", id: "...", action: "..." }

-}
decodeNotification : (String -> String -> String -> Update.Notifications.Msg) -> D.Value -> Msg
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
            NotificationsMsg msg

        Err _ ->
            NoOp


{-| Decode session turn notification event.

The JavaScript sends: { serverUrl: "...", sessionId: "...", action: "...", year: number|null }

-}
decodeSessionTurnNotification : D.Value -> Msg
decodeSessionTurnNotification value =
    let
        decoder =
            D.map4 Update.Notifications.NotificationSessionTurn
                (D.field "serverUrl" D.string)
                (D.field "sessionId" D.string)
                (D.field "action" D.string)
                (D.field "year" (D.nullable D.int))
    in
    case D.decodeValue decoder value of
        Ok msg ->
            NotificationsMsg msg

        Err _ ->
            NoOp


{-| Decode pending registration notification event.

The JavaScript sends: { serverUrl: "...", id: "...", action: "...", userProfileId: string|null, nickname: string|null }

-}
decodePendingRegistrationNotification : D.Value -> Msg
decodePendingRegistrationNotification value =
    let
        decoder =
            D.map5 Update.Notifications.NotificationPendingRegistration
                (D.field "serverUrl" D.string)
                (D.field "id" D.string)
                (D.field "action" D.string)
                (D.field "userProfileId" (D.nullable D.string))
                (D.field "nickname" (D.nullable D.string))
    in
    case D.decodeValue decoder value of
        Ok msg ->
            NotificationsMsg msg

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
            TurnFilesMsg (Update.TurnFiles.GotTurnFiles serverUrl result)

        Err err ->
            TurnFilesMsg (Update.TurnFiles.GotTurnFiles "" (Err ("Failed to decode turn files response: " ++ D.errorToString err)))


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
            TurnFilesMsg (Update.TurnFiles.GotLatestTurn serverUrl result)

        Err err ->
            TurnFilesMsg (Update.TurnFiles.GotLatestTurn "" (Err ("Failed to decode latest turn response: " ++ D.errorToString err)))


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
            TurnFilesMsg (Update.TurnFiles.GotOrdersStatus serverUrl result)

        Err err ->
            TurnFilesMsg (Update.TurnFiles.GotOrdersStatus "" (Err ("Failed to decode orders status response: " ++ D.errorToString err)))


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
            RacesMsg (Update.Races.GotSessionPlayerRace serverUrl sessionId result)

        Err err ->
            RacesMsg (Update.Races.GotSessionPlayerRace "" "" (Err (D.errorToString err)))


{-| Decode player control status received result.

The JavaScript sends: { serverUrl: "...", sessionId: "...", ok: [...] } | { serverUrl: "...", sessionId: "...", error: "..." }

This allows managers to see the control status for all players in a session.

-}
decodePlayerControlResult : D.Value -> Msg
decodePlayerControlResult value =
    let
        decoder =
            D.map3 (\serverUrl sessionId result -> ( serverUrl, sessionId, result ))
                (D.field "serverUrl" D.string)
                (D.field "sessionId" D.string)
                (D.oneOf
                    [ D.field "ok" Decode.playerControlStatusList |> D.map Ok
                    , D.field "error" D.string |> D.map Err
                    ]
                )
    in
    case D.decodeValue decoder value of
        Ok ( serverUrl, sessionId, result ) ->
            AdminMsg (Update.Admin.GotPlayerControl serverUrl sessionId result)

        Err err ->
            AdminMsg (Update.Admin.GotPlayerControl "" "" (Err (D.errorToString err)))
