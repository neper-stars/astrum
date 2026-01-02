module View.Layout exposing (view)

{-| Main layout module.

This module renders the complete application UI with Discord-style layout:

  - Server bar on the left
  - Main content in the center
  - Status bar at the bottom
  - Modal dialogs and context menus as overlays

-}

import Api.Session exposing (Session)
import Dict
import Html exposing (..)
import Html.Attributes exposing (..)
import Html.Events exposing (..)
import Model exposing (..)
import Msg exposing (Msg(..))
import View.Dialog exposing (viewDialog)
import View.Helpers exposing (getCurrentUserId)
import View.Menus exposing (viewContextMenu, viewUserMenu)
import View.ServerBar exposing (viewServerBar)
import View.SessionDetail exposing (viewSessionDetail)
import View.SessionList exposing (viewSessionList)


{-| Main view function.
-}
view : Model -> Html Msg
view model =
    let
        isPlayerDragging =
            case model.sessionDetail of
                Just detail ->
                    detail.dragState /= Nothing

                Nothing ->
                    False

        isServerDragging =
            model.serverDragState /= Nothing

        isDragging =
            isPlayerDragging || isServerDragging
    in
    div
        [ class "app"
        , classList [ ( "app--dragging", isDragging ) ]
        ]
        [ viewServerBar model
        , viewMainContent model
        , viewContextMenu model.contextMenu model.serverData
        , viewUserMenu model
        , viewDialog model
        , viewToast model.toast
        ]


viewMainContent : Model -> Html Msg
viewMainContent model =
    div [ class "main-content" ]
        [ viewHeader model
        , viewContent model
        , viewStatusBar model
        ]


viewHeader : Model -> Html Msg
viewHeader model =
    let
        serverName =
            model.selectedServerUrl
                |> Maybe.andThen (\url -> getServerByUrl url model.servers)
                |> Maybe.map .name
                |> Maybe.withDefault "Astrum"

        serverData =
            getCurrentServerData model

        hasInvitations =
            not (List.isEmpty serverData.invitations)

        isGlobalManager =
            case serverData.connectionState of
                Connected info ->
                    info.isManager

                _ ->
                    False

        connectionStatus =
            case model.selectedServerUrl of
                Just _ ->
                    case serverData.connectionState of
                        Connected info ->
                            button
                                [ class "header__user-btn is-connected"
                                , onClick ToggleUserMenu
                                ]
                                [ span [ class "status-dot" ] []
                                , text info.username
                                , if hasInvitations then
                                    span [ class "header__notification-dot" ] []

                                  else
                                    text ""
                                , span [ class "header__user-arrow" ] [ text "\u{25BC}" ]
                                ]

                        Connecting ->
                            span [ class "header__status is-connecting" ]
                                [ span [ class "status-dot" ] []
                                , text "Connecting..."
                                ]

                        ConnectionError _ ->
                            span [ class "header__status is-error" ]
                                [ span [ class "status-dot" ] []
                                , text "Error"
                                ]

                        Disconnected ->
                            span [ class "header__status is-disconnected" ]
                                [ text "Not connected" ]

                Nothing ->
                    text ""
    in
    div [ class "header" ]
        [ div [ class "header__actions" ]
            [ button
                [ class "header__settings-btn"
                , onClick OpenSettingsDialog
                , title "Settings"
                ]
                [ text "\u{2699}" ]
            , case model.selectedServerUrl of
                Just _ ->
                    let
                        isFetching =
                            serverData.fetchingSessions

                        btnClass =
                            if isFetching then
                                "header__refresh-btn is-loading"

                            else
                                "header__refresh-btn"
                    in
                    button
                        ([ class btnClass
                         , title "Refresh"
                         ]
                            ++ (if isFetching then
                                    [ disabled True ]

                                else
                                    [ onClick RefreshSessions ]
                               )
                        )
                        [ text "\u{27F3}" ]

                Nothing ->
                    text ""
            , if isGlobalManager then
                button
                    [ class "header__admin-btn"
                    , onClick OpenUsersListDialog
                    , title "Manage Users"
                    ]
                    [ text "\u{1F464}"
                    , if serverData.pendingRegistrationsCount > 0 then
                        span [ class "header__pending-badge" ] []

                      else
                        text ""
                    ]

              else
                text ""
            ]
        , h1 [ class "header__title" ] [ text serverName ]
        , connectionStatus
        ]


viewContent : Model -> Html Msg
viewContent model =
    let
        serverData =
            getCurrentServerData model

        -- Floating drag preview
        dragPreview =
            case model.sessionDetail of
                Just detail ->
                    case detail.dragState of
                        Just dragState ->
                            div
                                [ class "drag-preview"
                                , style "position" "fixed"
                                , style "left" (String.fromFloat (dragState.mouseX - 100) ++ "px")
                                , style "top" (String.fromFloat (dragState.mouseY - 20) ++ "px")
                                , style "pointer-events" "none"
                                , style "z-index" "10000"
                                ]
                                [ div [ class "session-detail__player session-detail__player--drag-clone" ]
                                    [ span [ class "session-detail__player-id" ]
                                        [ text dragState.draggedPlayerName ]
                                    ]
                                ]

                        Nothing ->
                            text ""

                Nothing ->
                    text ""
    in
    div [ class "content" ]
        [ case model.sessionDetail of
            Just detail ->
                case getSessionById detail.sessionId serverData.sessions of
                    Just session ->
                        let
                            availableTurns =
                                Dict.get session.id serverData.sessionTurns
                                    |> Maybe.withDefault Dict.empty

                            ordersStatusByYear =
                                Dict.get session.id serverData.sessionOrdersStatus
                                    |> Maybe.withDefault Dict.empty
                        in
                        viewSessionDetail session detail availableTurns ordersStatusByYear model

                    Nothing ->
                        -- Session not found, show list
                        viewSessionListOrEmpty model

            Nothing ->
                viewSessionListOrEmpty model
        , dragPreview
        ]


viewSessionListOrEmpty : Model -> Html Msg
viewSessionListOrEmpty model =
    case model.selectedServerUrl of
        Nothing ->
            viewEmptyState

        Just serverUrl ->
            if isConnected serverUrl model.serverData then
                viewSessionList model

            else
                viewDisconnectedState


viewEmptyState : Html Msg
viewEmptyState =
    div [ class "empty-state" ]
        [ div [ class "empty-state__icon" ] [ text "+" ]
        , h2 [ class "empty-state__title" ] [ text "Welcome to Astrum" ]
        , p [ class "empty-state__description" ]
            [ text "Select a server from the sidebar to get started, or add a new server." ]
        ]


viewDisconnectedState : Html Msg
viewDisconnectedState =
    div [ class "empty-state" ]
        [ div [ class "empty-state__icon" ] [ text "!" ]
        , h2 [ class "empty-state__title" ] [ text "Not Connected" ]
        , p [ class "empty-state__description" ]
            [ text "Click on the server to connect." ]
        ]


viewStatusBar : Model -> Html Msg
viewStatusBar model =
    let
        serverData =
            getCurrentServerData model

        statusText =
            case serverData.connectionState of
                Connected info ->
                    "Connected as " ++ info.username

                Connecting ->
                    "Connecting..."

                ConnectionError err ->
                    "Error: " ++ err

                Disconnected ->
                    case model.selectedServerUrl of
                        Just _ ->
                            "Not connected"

                        Nothing ->
                            "Select a server"

        -- Format duration in seconds with milliseconds (e.g., "0.234s")
        formatDuration ms =
            let
                seconds =
                    toFloat ms / 1000

                formatted =
                    String.fromFloat seconds
                        |> String.split "."
                        |> (\parts ->
                                case parts of
                                    [ whole, decimal ] ->
                                        whole ++ "." ++ String.left 3 (decimal ++ "000")

                                    [ whole ] ->
                                        whole ++ ".000"

                                    _ ->
                                        String.fromFloat seconds
                           )
            in
            formatted ++ "s"

        sessionCountText =
            case serverData.lastFetchResult of
                Just result ->
                    String.fromInt result.sessionCount
                        ++ " sessions in "
                        ++ formatDuration result.durationMs

                Nothing ->
                    String.fromInt (List.length serverData.sessions) ++ " sessions"
    in
    div [ class "status-bar" ]
        [ div [ class "status-bar__left" ]
            [ span [ class "status-bar__item" ] [ text statusText ]
            , case model.error of
                Just err ->
                    span
                        [ class "status-bar__item status-bar__error status-bar__error--dismissible"
                        , onClick ClearError
                        , title "Click to dismiss"
                        ]
                        [ text err
                        , span [ class "status-bar__error-dismiss" ] [ text "✕" ]
                        ]

                Nothing ->
                    text ""
            ]
        , div [ class "status-bar__right" ]
            [ span [ class "status-bar__item" ] [ text sessionCountText ]
            ]
        ]


{-| Toast notification for temporary success messages.
-}
viewToast : Maybe String -> Html Msg
viewToast maybeMessage =
    case maybeMessage of
        Just message ->
            div [ class "toast toast--success" ]
                [ text message ]

        Nothing ->
            text ""
