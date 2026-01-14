module View.SessionDetail exposing (viewSessionDetail)

{-| Session detail view - displays detailed information about a single session.
-}

import Api.AIType
import Api.Invitation exposing (Invitation)
import Api.OrdersStatus exposing (OrdersStatus)
import Api.PlayerControl exposing (ControlStatus(..), PlayerControlStatus)
import Api.Race exposing (Race)
import Api.Session exposing (Session, SessionPlayer, isArchived, isStarted)
import Api.TurnFiles exposing (TurnFiles)
import Api.UserProfile exposing (UserProfile)
import Dict
import Html exposing (..)
import Html.Attributes exposing (..)
import Html.Events exposing (..)
import Json.Decode as Decode
import Model exposing (..)
import Msg exposing (Msg(..))
import Update.Admin
import Update.DragDrop
import Update.MapViewer
import Update.Races
import Update.Rules
import Update.SessionDetail
import Update.Sessions
import Update.TurnFiles
import View.Helpers exposing (getNickname)
import View.Icons as Icons
import View.SessionList exposing (viewOrdersSummary)


{-| Render the session detail view.
-}
viewSessionDetail : Session -> SessionDetailView -> Dict.Dict Int TurnFiles -> Dict.Dict Int OrdersStatus -> Model -> Html Msg
viewSessionDetail session detail availableTurns ordersStatusByYear model =
    let
        serverData =
            getCurrentServerData model

        -- Check if current user is a manager/owner
        currentUserId =
            getCurrentUserId model

        isManager =
            case currentUserId of
                Just uid ->
                    List.member uid session.managers

                Nothing ->
                    False

        -- Check if current user is a global (server) manager
        isGlobalManager =
            case serverData.connectionState of
                Connected info ->
                    info.isManager

                _ ->
                    False

        -- Can add bot: session or global manager, session not started, less than 16 players
        canAddBot =
            (isManager || isGlobalManager) && not (isStarted session) && List.length session.players < 16

        -- Check if current user is a member or manager
        isMemberOrManager =
            case currentUserId of
                Just uid ->
                    List.member uid session.members || List.member uid session.managers

                Nothing ->
                    False

        -- Check if user has an invitation to this session
        hasInvitation =
            List.any (\inv -> inv.sessionId == session.id) serverData.invitations

        -- Show join button if not a member, not started, and (public or has invitation)
        canJoin =
            not isMemberOrManager && not (isStarted session) && (session.isPublic || hasInvitation)

        isPlayer =
            case currentUserId of
                Just uid ->
                    List.any (\p -> p.userProfileId == uid) session.players

                Nothing ->
                    False

        -- Get current player's ready state
        currentPlayerReady =
            case currentUserId of
                Just uid ->
                    session.players
                        |> List.filter (\p -> p.userProfileId == uid)
                        |> List.head
                        |> Maybe.map .ready
                        |> Maybe.withDefault False

                Nothing ->
                    False

        -- Get current player's number (1-indexed position in players list)
        currentPlayerNumber =
            case currentUserId of
                Just uid ->
                    session.players
                        |> List.indexedMap Tuple.pair
                        |> List.filter (\( _, p ) -> p.userProfileId == uid)
                        |> List.head
                        |> Maybe.map (\( idx, _ ) -> idx + 1)
                        |> Maybe.withDefault 1

                Nothing ->
                    1

        -- Show setup/change race button if user is:
        -- 1. a member/manager but not yet a player, OR
        -- 2. a player but not ready (can change race until ready)
        -- Note: hidden once session is started
        showSetupRaceButton =
            isMemberOrManager && not currentPlayerReady && not (isStarted session)

        -- Check if all players are ready (only players, not members/managers)
        allPlayersReady =
            not (List.isEmpty session.players)
                && List.all .ready session.players

        -- Determine if game can be started (rules set + all players ready + not already started)
        -- Check if stars.exe exists in the game directory
        hasStarsExe =
            Dict.get session.id serverData.sessionHasStarsExe
                |> Maybe.withDefault False

        -- Reason why game can't be started (for tooltip)
        startGameBlockedReason =
            if isStarted session then
                Just "Game has already started"

            else if not session.rulesIsSet then
                Just "Rules must be configured first"

            else if List.isEmpty session.players then
                Just "No players have joined yet"

            else if not allPlayersReady then
                Just "All players must be ready"

            else
                Nothing

        -- Can quit session if: member/manager, not started, not ready,
        -- and if manager then not the last manager
        canQuit =
            isMemberOrManager
                && not (isStarted session)
                && not currentPlayerReady
                && (not isManager || List.length session.managers > 1)
    in
    div [ class "session-detail" ]
        [ div [ class "session-detail__header" ]
            [ button
                [ class "session-detail__back"
                , onClick (SessionDetailMsg Update.SessionDetail.CloseSessionDetail)
                ]
                [ text "< Back" ]
            , h2 [ class "session-detail__title" ] [ text session.name ]
            , div [ class "session-detail__header-actions" ]
                [ -- Join button (for non-members when session is public or has invitation)
                  if canJoin then
                    button
                        [ class "btn btn--primary"
                        , onClick (SessionsMsg (Update.Sessions.JoinSession session.id))
                        ]
                        [ text "Join" ]

                  else
                    text ""
                , -- Start Game button (only for managers, when not already started)
                  if isManager && not (isStarted session) then
                    let
                        isStarting =
                            model.startingSessionId == Just session.id
                    in
                    if isStarting then
                        -- Show loading state while starting
                        button
                            [ class "btn btn--success btn--loading"
                            , disabled True
                            ]
                            [ text "Starting..." ]

                    else
                        case startGameBlockedReason of
                            Just reason ->
                                -- Wrap disabled button in a span so tooltip works
                                span [ class "tooltip-wrapper", attribute "title" reason ]
                                    [ button
                                        [ class "btn btn--success btn--disabled"
                                        , disabled True
                                        ]
                                        [ text "Start Game" ]
                                    ]

                            Nothing ->
                                button
                                    [ class "btn btn--success"
                                    , onClick (SessionsMsg (Update.Sessions.StartGame session.id))
                                    ]
                                    [ text "Start Game" ]

                  else
                    text ""
                , -- Invite User button (managers only, not started)
                  if isManager && not (isStarted session) then
                    button
                        [ class "btn btn--primary"
                        , onClick (SessionDetailMsg Update.SessionDetail.OpenInviteDialog)
                        ]
                        [ text "Invite User" ]

                  else
                    text ""
                , -- Backup Session button (managers only, when started)
                  if isManager && isStarted session then
                    button
                        [ class "btn btn--secondary"
                        , onClick (SessionsMsg (Update.Sessions.DownloadSessionBackup session.id))
                        , attribute "title" "Download session backup"
                        ]
                        [ text (Icons.download ++ " Backup") ]

                  else
                    text ""
                , -- Historic Backup button (players only, when started)
                  if isPlayer && isStarted session then
                    button
                        [ class "btn btn--secondary"
                        , onClick (SessionsMsg (Update.Sessions.DownloadHistoricBackup session.id))
                        , attribute "title" "Download all historic game files"
                        ]
                        [ text (Icons.download ++ " Historic") ]

                  else
                    text ""
                , -- Archive Session button (managers only, when started)
                  if isManager && isStarted session then
                    button
                        [ class "btn btn--secondary"
                        , onClick (SessionsMsg (Update.Sessions.ArchiveSession session.id))
                        , attribute "title" "Mark session as archived (finished)"
                        ]
                        [ text (Icons.archive ++ " Archive") ]

                  else
                    text ""
                , -- Delete Session button (managers only)
                  if isManager then
                    button
                        [ class "btn btn--danger"
                        , onClick (SessionsMsg (Update.Sessions.DeleteSession session.id))
                        ]
                        [ text "Delete" ]

                  else
                    text ""
                , -- Quit Session button (members who can quit)
                  if canQuit then
                    button
                        [ class "btn btn--secondary"
                        , onClick (SessionsMsg (Update.Sessions.QuitSession session.id))
                        ]
                        [ text "Quit" ]

                  else
                    text ""
                ]
            ]
        , let
            -- Get invitees for this session from sent invitations
            sessionInvitees =
                List.filter (\inv -> inv.sessionId == session.id) serverData.sentInvitations
          in
          div [ class "session-detail__content" ]
            [ -- Row 1: Info (2/3) + Managers (1/3)
              div [ class "session-detail__section-row" ]
                [ div [ class "session-detail__section session-detail__section--two-thirds" ]
                    [ h3 [ class "session-detail__section-title" ] [ text "Info" ]
                    , div [ class "session-detail__info" ]
                        [ div [ class "session-detail__row" ]
                            [ span [ class "session-detail__label" ] [ text "Status" ]
                            , span
                                [ class "session-detail__value"
                                , classList
                                    [ ( "session-detail__value--started", isStarted session )
                                    , ( "session-detail__value--archived", isArchived session )
                                    , ( "session-detail__value--not-started", not (isStarted session) && not (isArchived session) )
                                    ]
                                ]
                                [ text
                                    (if isArchived session then
                                        "Archived"

                                     else if isStarted session then
                                        "Started"

                                     else
                                        "Not Started"
                                    )
                                ]
                            ]
                        , div [ class "session-detail__row" ]
                            [ span [ class "session-detail__label" ] [ text "Visibility" ]
                            , span [ class "session-detail__value" ]
                                [ text
                                    (if session.isPublic then
                                        "Public"

                                     else
                                        "Private"
                                    )
                                ]
                            ]
                        , div [ class "session-detail__row" ]
                            [ span [ class "session-detail__label" ] [ text "Session ID" ]
                            , span [ class "session-detail__value session-detail__value--mono" ]
                                [ text session.id ]
                            ]
                        , div [ class "session-detail__row" ]
                            [ span [ class "session-detail__label" ] [ text "Rules" ]
                            , if session.rulesIsSet then
                                -- Rules exist - anyone can view, managers can also edit
                                button
                                    [ class "btn btn-sm btn-secondary"
                                    , onClick (RulesMsg (Update.Rules.OpenRulesDialog session.id session.rulesIsSet))
                                    ]
                                    [ text "View Rules" ]

                              else if isManager then
                                -- Rules not set - only managers can create them
                                button
                                    [ class "btn btn-sm btn-primary"
                                    , onClick (RulesMsg (Update.Rules.OpenRulesDialog session.id session.rulesIsSet))
                                    ]
                                    [ text "Configure Rules" ]

                              else
                                -- Rules not set and not a manager - show status text
                                span [ class "session-detail__value session-detail__value--muted" ]
                                    [ text "Not configured" ]
                            ]
                        ]
                    ]
                , div [ class "session-detail__section session-detail__section--one-third" ]
                    [ h3 [ class "session-detail__section-title" ]
                        [ text ("Managers (" ++ String.fromInt (List.length session.managers) ++ ")") ]
                    , div [ class "session-detail__members" ]
                        (if List.isEmpty session.managers then
                            [ div [ class "session-detail__empty" ] [ text "No managers" ] ]

                         else
                            List.map (viewMemberId serverData.userProfiles) session.managers
                        )
                    ]
                ]

            -- Row 2: Members (1/2) + Invitees (1/2)
            , div [ class "session-detail__section-row" ]
                [ div [ class "session-detail__section session-detail__section--half" ]
                    [ h3 [ class "session-detail__section-title" ]
                        [ text ("Members (" ++ String.fromInt (List.length session.members) ++ ")") ]
                    , div [ class "session-detail__members" ]
                        (if List.isEmpty session.members then
                            [ div [ class "session-detail__empty" ] [ text "No members" ] ]

                         else
                            List.map (viewMemberWithPromote serverData.userProfiles isManager session.id) session.members
                        )
                    ]
                , div [ class "session-detail__section session-detail__section--half" ]
                    [ h3 [ class "session-detail__section-title" ]
                        [ text ("Invitees (" ++ String.fromInt (List.length sessionInvitees) ++ ")") ]
                    , div [ class "session-detail__members" ]
                        (if List.isEmpty sessionInvitees then
                            [ div [ class "session-detail__empty" ] [ text "No pending invitations" ] ]

                         else
                            List.map viewInvitee sessionInvitees
                        )
                    ]
                ]
            , div [ class "session-detail__section" ]
                [ div [ class "session-detail__section-header" ]
                    [ h3
                        [ class "session-detail__section-title session-detail__section-title--clickable"
                        , title "Players are members who have already set the race with which they want to play. Click to expand/collapse."
                        , onClick (SessionDetailMsg Update.SessionDetail.TogglePlayersExpanded)
                        ]
                        [ span [ class "session-detail__expand-icon" ]
                            [ text
                                (if detail.playersExpanded then
                                    Icons.expand

                                 else
                                    Icons.collapse
                                )
                            ]
                        , text ("Players (" ++ String.fromInt (List.length session.players) ++ ")")
                        , span [ class "session-detail__help-icon" ] [ text "?" ]
                        ]
                    , if showSetupRaceButton then
                        button
                            [ class "btn btn-success btn-sm"
                            , onClick (RacesMsg (Update.Races.OpenSetupRaceDialog session.id))
                            ]
                            [ text
                                (if isPlayer then
                                    "Change Race"

                                 else
                                    "Setup My Race"
                                )
                            ]

                      else
                        text ""
                    , if canAddBot then
                        button
                            [ class "btn btn-secondary btn-sm"
                            , onClick (AdminMsg (Update.Admin.OpenAddBotDialog session.id))
                            , title "Add a bot player to this session"
                            ]
                            [ text "+ Add Bot" ]

                      else
                        text ""
                    ]
                , if detail.playersExpanded then
                    div [ class "session-detail__players" ]
                        (if List.isEmpty session.players then
                            [ div [ class "session-detail__empty" ] [ text "No players yet" ] ]

                         else
                            let
                                myRace =
                                    Dict.get session.id serverData.sessionPlayerRaces

                                -- Get player control status for this session (managers only)
                                playerControlList =
                                    Dict.get session.id serverData.sessionPlayerControl
                                        |> Maybe.withDefault []
                            in
                            List.indexedMap
                                (\idx player ->
                                    viewPlayerRow serverData.userProfiles myRace session.id currentUserId isManager isGlobalManager (isStarted session) detail.dragState playerControlList idx player
                                )
                                session.players
                        )

                  else
                    text ""
                ]
            , -- Turns section (only show if game is started and there are turns)
              if isStarted session && not (Dict.isEmpty availableTurns) then
                let
                    sortedYears =
                        availableTurns
                            |> Dict.keys
                            |> List.sort

                    latestYear =
                        sortedYears
                            |> List.maximum
                in
                div [ class "session-detail__section" ]
                    [ div [ class "session-detail__section-header" ]
                        [ h3 [ class "session-detail__section-title" ]
                            [ text ("Turns (" ++ String.fromInt (Dict.size availableTurns) ++ ")") ]
                        , let
                            enableBrowserStars =
                                model.appSettings
                                    |> Maybe.map .enableBrowserStars
                                    |> Maybe.withDefault False
                          in
                          div [ class "session-detail__section-actions" ]
                            [ -- Launch Stars! button: disabled when browser mode is enabled
                              if enableBrowserStars then
                                button
                                    [ class "btn btn--primary btn--sm"
                                    , disabled True
                                    , title "You enabled Stars! in browser. Do not mix Stars! executables to manipulate files."
                                    ]
                                    [ text "Launch Stars!" ]

                              else if hasStarsExe then
                                button
                                    [ class "btn btn--primary btn--sm"
                                    , onClick (TurnFilesMsg (Update.TurnFiles.LaunchStars session.id))
                                    ]
                                    [ text "Launch Stars!" ]

                              else
                                button
                                    [ class "btn btn--primary btn--sm"
                                    , disabled True
                                    , title "stars.exe not found in game directory. Enable auto-download in Settings or manually copy stars.exe."
                                    ]
                                    [ text "Launch Stars!" ]
                            , button
                                [ class "btn btn--secondary btn--sm"
                                , onClick (TurnFilesMsg (Update.TurnFiles.OpenGameDir session.id))
                                ]
                                [ text "Open Game Dir" ]
                            , -- Play in Browser button: only show when browser mode is enabled
                              if enableBrowserStars then
                                case model.selectedServerUrl of
                                    Just serverUrl ->
                                        button
                                            [ class "btn btn--primary btn--sm"
                                            , onClick (AdminMsg (Update.Admin.OpenStarsBrowser serverUrl session.id))
                                            , title "Play Stars! in the browser using DOSBox emulation"
                                            ]
                                            [ text "Play in Browser" ]

                                    Nothing ->
                                        text ""

                              else
                                text ""
                            , case ( latestYear, Dict.get session.id serverData.sessionPlayerRaces ) of
                                ( Just year, Just race ) ->
                                    case Dict.get session.id serverData.sessionTurns |> Maybe.andThen (Dict.get year) of
                                        Just _ ->
                                            button
                                                [ class "btn btn--secondary btn--sm"
                                                , onClick (MapViewerMsg (Update.MapViewer.OpenMapViewer session.id year race.nameSingular currentPlayerNumber))
                                                ]
                                                [ text "View Map" ]

                                        Nothing ->
                                            text ""

                                _ ->
                                    text ""
                            ]
                        ]
                    , div [ class "session-detail__turns" ]
                        (sortedYears
                            |> List.map
                                (\year ->
                                    viewTurnItem session.id year (latestYear == Just year) (Dict.get year ordersStatusByYear)
                                )
                        )
                    ]

              else
                text ""
            ]
        ]


viewPlayerRow : List UserProfile -> Maybe Race -> String -> Maybe String -> Bool -> Bool -> Bool -> Maybe DragState -> List PlayerControlStatus -> Int -> SessionPlayer -> Html Msg
viewPlayerRow userProfiles myRace sessionId currentUserId isManager isGlobalManager sessionStarted dragState playerControlList index player =
    let
        isCurrentUser =
            currentUserId == Just player.userProfileId

        -- playerNumber is 1-indexed for display purposes
        playerNumber =
            index + 1

        -- playerOrder is 0-indexed for API calls (matches Neper API spec)
        playerOrder =
            index

        nickname =
            getNickname userProfiles player.userProfileId

        -- For bot players, show the race name if available, otherwise "Bot #N"
        displayName =
            if player.isBot then
                case player.botRaceName of
                    Just raceName ->
                        raceName

                    Nothing ->
                        "Bot #" ++ String.fromInt playerNumber

            else if isCurrentUser then
                case myRace of
                    Just race ->
                        nickname ++ " (" ++ race.namePlural ++ ")"

                    Nothing ->
                        nickname

            else
                nickname

        -- Can view/manage player control (managers only)
        canManagePlayerControl =
            (isManager || isGlobalManager) && sessionStarted

        -- Find player control status for this player (by playerOrder, which is 0-indexed)
        playerControl =
            playerControlList
                |> List.filter (\pc -> pc.playerOrder == playerOrder)
                |> List.head

        -- Determine if this player is currently AI-controlled
        isAIControlled =
            case playerControl of
                Just pc ->
                    pc.controlStatus == AI

                Nothing ->
                    False

        -- Get AI type name if AI-controlled
        aiTypeName =
            case playerControl of
                Just pc ->
                    case pc.aiControlType of
                        Just aiCode ->
                            Api.AIType.fromString aiCode
                                |> Maybe.map Api.AIType.toRaceName

                        Nothing ->
                            Nothing

                Nothing ->
                    Nothing

        -- Drag state helpers
        isDragging =
            case dragState of
                Just ds ->
                    ds.draggedPlayerId == player.userProfileId

                Nothing ->
                    False

        isDragOver =
            case dragState of
                Just ds ->
                    ds.dragOverPlayerId == Just player.userProfileId

                Nothing ->
                    False

        -- Mouse-based drag attributes (only if manager and session not started)
        -- We use mouse events because WebKit in Wails doesn't support HTML5 drag events
        -- Using preventDefaultOn to stop text selection during drag
        -- Drag is disabled once session is started (Stars! doesn't allow player reordering after start)
        canDrag =
            isManager && not sessionStarted

        mouseAttrs =
            if canDrag then
                [ preventDefaultOn "mousedown"
                    (Decode.map2
                        (\x y -> ( DragDropMsg (Update.DragDrop.MouseDownOnPlayer player.userProfileId player.userProfileId x y), True ))
                        (Decode.field "clientX" Decode.float)
                        (Decode.field "clientY" Decode.float)
                    )
                , on "mouseenter" (Decode.succeed (DragDropMsg (Update.DragDrop.MouseEnterPlayer player.userProfileId)))
                , on "mouseleave" (Decode.succeed (DragDropMsg Update.DragDrop.MouseLeavePlayer))
                ]

            else
                []
    in
    div
        [ class "session-detail__player-wrapper"
        , classList
            [ ( "session-detail__player-wrapper--dragging", isDragging )
            , ( "session-detail__player-wrapper--drag-over", isDragOver )
            ]
        ]
        [ -- Draggable card area
          div
            ([ class "session-detail__player"
             , classList
                [ ( "session-detail__player--draggable", canDrag )
                ]
             ]
                ++ mouseAttrs
            )
            [ span [ class "session-detail__player-number" ]
                [ text (String.fromInt playerNumber) ]
            , div [ class "session-detail__player-info" ]
                [ span [ class "session-detail__player-id" ]
                    [ text displayName ]
                , span
                    [ class "session-detail__player-status"
                    , classList
                        [ ( "session-detail__player-status--ready", player.ready )
                        , ( "session-detail__player-status--not-ready", not player.ready && not player.isBot )
                        , ( "session-detail__player-status--bot", player.isBot )
                        , ( "session-detail__player-status--ai-controlled", isAIControlled && canManagePlayerControl )
                        ]
                    ]
                    [ text
                        (if player.isBot then
                            "AI Player"

                         else if player.ready then
                            "Ready"

                         else
                            "Not Ready"
                        )
                    ]

                -- Show AI control indicator for managers (only on started sessions)
                , if canManagePlayerControl && not player.isBot then
                    case aiTypeName of
                        Just typeName ->
                            span [ class "session-detail__ai-indicator session-detail__ai-indicator--ai" ]
                                [ text ("AI: " ++ typeName) ]

                        Nothing ->
                            if not (List.isEmpty playerControlList) then
                                span [ class "session-detail__ai-indicator session-detail__ai-indicator--human" ]
                                    [ text "Human" ]

                            else
                                text ""

                  else
                    text ""
                ]
            ]
        , -- Actions area (outside draggable zone) - always rendered for consistent width
          -- Hide ready/unready button once session is started
          div [ class "session-detail__player-actions" ]
            [ if isCurrentUser && not sessionStarted then
                button
                    [ class
                        (if player.ready then
                            "btn btn-secondary btn-sm"

                         else
                            "btn btn-success btn-sm"
                        )
                    , onClick (SessionsMsg (Update.Sessions.SetPlayerReady sessionId (not player.ready)))
                    ]
                    [ text
                        (if player.ready then
                            "Unready"

                         else
                            "Ready"
                        )
                    ]

              else if player.isBot && isManager && not sessionStarted then
                -- Remove bot button (only for managers, before game starts)
                button
                    [ class "btn btn-danger btn-sm session-detail__remove-bot"
                    , onClick (AdminMsg (Update.Admin.RemoveBotPlayer sessionId player.id))
                    , title "Remove bot player"
                    ]
                    [ text "×" ]

              else if canManagePlayerControl && not player.isBot then
                -- AI control buttons for managers on started sessions (not for bot slots)
                -- Note: playerOrder is 0-indexed as per Neper API spec
                if isAIControlled then
                    button
                        [ class "btn btn-secondary btn-sm"
                        , onClick (AdminMsg (Update.Admin.SwitchToHuman sessionId playerOrder))
                        , title "Switch back to human control"
                        ]
                        [ text "Switch to Human" ]

                else if not (List.isEmpty playerControlList) then
                    -- Only show if we have player control data
                    button
                        [ class "btn btn-warning btn-sm"
                        , onClick (AdminMsg (Update.Admin.OpenSwitchToAIDialog sessionId playerOrder nickname))
                        , title "Switch player to AI control"
                        ]
                        [ text "Switch to AI" ]

                else
                    text ""

              else
                text ""
            ]
        ]


{-| View a member with optional promote button (for managers).
-}
viewMemberWithPromote : List UserProfile -> Bool -> String -> String -> Html Msg
viewMemberWithPromote userProfiles isManager sessionId memberId =
    div [ class "session-detail__member-wrapper" ]
        [ div [ class "session-detail__member" ]
            [ text (getNickname userProfiles memberId) ]
        , div [ class "session-detail__member-actions" ]
            [ if isManager then
                button
                    [ class "btn btn--primary btn--xs"
                    , onClick (SessionsMsg (Update.Sessions.PromoteMember sessionId memberId))
                    , title "Promote to manager"
                    ]
                    [ text "Promote" ]

              else
                text ""
            ]
        ]


viewMemberId : List UserProfile -> String -> Html Msg
viewMemberId userProfiles memberId =
    div [ class "session-detail__member" ]
        [ text (getNickname userProfiles memberId) ]


{-| View a single invitee (from sent invitation).
-}
viewInvitee : Invitation -> Html Msg
viewInvitee invitation =
    div [ class "session-detail__member session-detail__invitee" ]
        [ span [ class "session-detail__invitee-name" ] [ text invitation.inviteeNickname ]
        , button
            [ class "btn btn--danger btn--xs"
            , onClick (SessionDetailMsg (Update.SessionDetail.CancelSentInvitation invitation.id))
            , title "Cancel invitation"
            ]
            [ text "×" ]
        ]


{-| View a single turn item. Latest year is highlighted.
-}
viewTurnItem : String -> Int -> Bool -> Maybe OrdersStatus -> Html Msg
viewTurnItem sessionId year isLatest maybeOrdersStatus =
    let
        -- Show orders summary badge if we have data, or loading indicator for latest year
        ordersBadge =
            case maybeOrdersStatus of
                Just ordersStatus ->
                    viewOrdersSummary ordersStatus.players

                Nothing ->
                    if isLatest then
                        -- Only show loading indicator for the latest year
                        span [ class "session-detail__orders-loading" ] [ text "..." ]

                    else
                        text ""
    in
    button
        [ class "session-detail__turn-link"
        , classList [ ( "session-detail__turn-link--latest", isLatest ) ]
        , onClick (TurnFilesMsg (Update.TurnFiles.OpenTurnFilesDialog sessionId year isLatest))
        ]
        [ text ("Year " ++ String.fromInt year)
        , ordersBadge
        ]
