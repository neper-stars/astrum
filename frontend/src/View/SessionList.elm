module View.SessionList exposing
    ( viewSessionList
    , viewOrdersSummary
    )

{-| Session list view - displays the grid of session cards with filtering.
-}

import Api.OrdersStatus exposing (OrdersStatus, PlayerOrderStatus)
import Api.Session exposing (Session, isArchived, isStarted)
import Api.TurnFiles exposing (TurnFiles)
import Dict
import Html exposing (..)
import Html.Attributes exposing (..)
import Html.Events exposing (..)
import Json.Decode as Decode
import Model exposing (..)
import Msg exposing (Msg(..))
import View.Helpers exposing (getCurrentUserId)


{-| Render the session list with filters and session cards.
-}
viewSessionList : Model -> Html Msg
viewSessionList model =
    let
        serverData =
            getCurrentServerData model

        currentUserId =
            getCurrentUserId model

        filteredSessions =
            filterSessions currentUserId model.sessionFilter serverData.sessions serverData.sessionOrdersStatus
    in
    div [ class "session-list" ]
        [ div [ class "session-list__header" ]
            [ h2 [ class "session-list__title" ] [ text "Sessions" ]
            , div [ class "session-list__actions" ]
                [ button
                    [ class "btn btn-secondary btn-sm"
                    , onClick RefreshSessions
                    ]
                    [ text "Refresh" ]
                , button
                    [ class "btn btn-primary btn-sm"
                    , onClick OpenCreateSessionDialog
                    ]
                    [ text "Create Session" ]
                ]
            , div [ class "session-list__filters" ]
                [ viewFilterButton AllSessions "All" model.sessionFilter
                , viewFilterButton MySessions "My Sessions" model.sessionFilter
                , viewFilterButton PublicSessions "Public" model.sessionFilter
                , viewFilterButton InvitedSessions "Invited" model.sessionFilter
                , viewFilterButtonWithTooltip JoinableSessions "Joinable" model.sessionFilter "Sessions you can join (public or invited, with available player slots)"
                , viewFilterButtonWithTooltip MyTurn "My Turn" model.sessionFilter "Sessions where you have a turn to submit"
                , viewFilterButtonWithTooltip ArchivedSessions "Archived" model.sessionFilter "Finished sessions that have been archived"
                ]
            ]
        , if List.isEmpty filteredSessions then
            if model.sessionFilter == ArchivedSessions && not serverData.archivedSessionsFetched then
                div [ class "session-list__empty" ]
                    [ p [] [ text "Archived sessions are not loaded by default." ]
                    , button
                        [ class "btn btn-primary"
                        , onClick FetchArchivedSessions
                        ]
                        [ text "Fetch Archived Sessions" ]
                    ]

            else
                div [ class "session-list__empty" ]
                    [ text "No sessions found" ]

          else
            div [ class "session-list__grid" ]
                (List.map (viewSessionCard currentUserId serverData.sessionTurns serverData.sessionOrdersStatus) filteredSessions)
        ]


viewFilterButton : SessionFilter -> String -> SessionFilter -> Html Msg
viewFilterButton filter label activeFilter =
    button
        [ class "filter-btn"
        , classList [ ( "is-active", filter == activeFilter ) ]
        , onClick (SetSessionFilter filter)
        ]
        [ text label ]


viewFilterButtonWithTooltip : SessionFilter -> String -> SessionFilter -> String -> Html Msg
viewFilterButtonWithTooltip filter label activeFilter tooltip =
    button
        [ class "filter-btn"
        , classList [ ( "is-active", filter == activeFilter ) ]
        , onClick (SetSessionFilter filter)
        , attribute "title" tooltip
        ]
        [ text label ]


filterSessions : Maybe String -> SessionFilter -> List Session -> Dict.Dict String (Dict.Dict Int OrdersStatus) -> List Session
filterSessions maybeUserId filter sessions ordersStatusDict =
    let
        notArchived s =
            not (isArchived s)
    in
    case filter of
        AllSessions ->
            List.filter notArchived sessions

        MySessions ->
            case maybeUserId of
                Just userId ->
                    List.filter (\s -> isUserInSession userId s && notArchived s) sessions

                Nothing ->
                    []

        PublicSessions ->
            List.filter (\s -> s.isPublic && notArchived s) sessions

        InvitedSessions ->
            List.filter (\s -> s.pendingInvitation && notArchived s) sessions

        JoinableSessions ->
            case maybeUserId of
                Just userId ->
                    List.filter
                        (\s ->
                            notArchived s
                                && not (isStarted s)
                                && not (isUserInSession userId s)
                                && not (isPlayerInSession userId s)
                                && (s.isPublic || s.pendingInvitation)
                                && (List.length s.players < 16)
                        )
                        sessions

                Nothing ->
                    -- Not logged in, show public sessions with available slots
                    List.filter
                        (\s ->
                            notArchived s
                                && not (isStarted s)
                                && s.isPublic
                                && (List.length s.players < 16)
                        )
                        sessions

        MyTurn ->
            case maybeUserId of
                Just userId ->
                    -- hasUnsubmittedTurn already checks isStarted, which excludes archived
                    List.filter (hasUnsubmittedTurn userId ordersStatusDict) sessions

                Nothing ->
                    []

        ArchivedSessions ->
            List.filter isArchived sessions


{-| Check if a user is a member or manager of a session.
-}
isUserInSession : String -> Session -> Bool
isUserInSession userId session =
    List.member userId session.members || List.member userId session.managers


{-| Check if a user is a player in a session.
-}
isPlayerInSession : String -> Session -> Bool
isPlayerInSession userId session =
    List.any (\p -> p.userProfileId == userId) session.players


{-| Check if a user has an unsubmitted turn in a started session.
Returns True if:

  - Session is started
  - User is a player in the session
  - User has not submitted their orders for the current turn

-}
hasUnsubmittedTurn : String -> Dict.Dict String (Dict.Dict Int OrdersStatus) -> Session -> Bool
hasUnsubmittedTurn userId ordersStatusDict session =
    if not (isStarted session) then
        False

    else
        -- Find the user's player info in the session
        case List.filter (\p -> p.userProfileId == userId) session.players |> List.head of
            Nothing ->
                -- User is not a player in this session
                False

            Just player ->
                -- Get the latest orders status for this session
                case Dict.get session.id ordersStatusDict of
                    Nothing ->
                        -- No orders status data yet, assume pending
                        False

                    Just yearDict ->
                        -- Get the latest year's orders status
                        case Dict.keys yearDict |> List.maximum |> Maybe.andThen (\y -> Dict.get y yearDict) of
                            Nothing ->
                                False

                            Just ordersStatus ->
                                -- Find this player's order status
                                case List.filter (\pos -> pos.playerOrder == player.playerOrder) ordersStatus.players |> List.head of
                                    Nothing ->
                                        False

                                    Just playerOrderStatus ->
                                        -- Return True if NOT submitted
                                        not playerOrderStatus.submitted


viewSessionCard : Maybe String -> Dict.Dict String (Dict.Dict Int TurnFiles) -> Dict.Dict String (Dict.Dict Int OrdersStatus) -> Session -> Html Msg
viewSessionCard maybeUserId allSessionTurns allSessionOrdersStatus session =
    let
        isAlreadyMemberOrManager =
            case maybeUserId of
                Just userId ->
                    isUserInSession userId session

                Nothing ->
                    False

        -- Get turn data for this session if started and user is member or manager
        maybeTurnInfo =
            if isStarted session && isAlreadyMemberOrManager then
                let
                    sessionTurns =
                        Dict.get session.id allSessionTurns
                            |> Maybe.withDefault Dict.empty

                    latestYear =
                        Dict.keys sessionTurns
                            |> List.maximum

                    ordersStatus =
                        Dict.get session.id allSessionOrdersStatus
                            |> Maybe.withDefault Dict.empty
                in
                latestYear
                    |> Maybe.map
                        (\year ->
                            { year = year
                            , ordersStatus = Dict.get year ordersStatus
                            }
                        )

            else
                Nothing
    in
    div
        [ class "session-card"
        , onClick (ViewSessionDetail session.id)
        ]
        [ div [ class "session-card__header" ]
            [ h3 [ class "session-card__title" ] [ text session.name ]
            , div [ class "session-card__badges" ]
                [ span
                    [ class "session-card__badge"
                    , classList
                        [ ( "is-public", session.isPublic )
                        , ( "is-private", not session.isPublic )
                        ]
                    ]
                    [ text
                        (if session.isPublic then
                            "Public"

                         else
                            "Private"
                        )
                    ]
                , span
                    [ class "session-card__badge"
                    , classList
                        [ ( "is-started", isStarted session )
                        , ( "is-archived", isArchived session )
                        , ( "is-not-started", not (isStarted session) && not (isArchived session) )
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
            ]
        , -- Turn info section (only for started sessions where user is member or manager)
          case maybeTurnInfo of
            Just turnInfo ->
                div [ class "session-card__turn" ]
                    [ span [ class "session-card__turn-year" ]
                        [ text ("Year " ++ String.fromInt turnInfo.year) ]
                    , case turnInfo.ordersStatus of
                        Just ordersStatus ->
                            viewOrdersSummary ordersStatus.players

                        Nothing ->
                            span [ class "session-card__orders-loading" ] [ text "..." ]
                    ]

            Nothing ->
                text ""
        , div [ class "session-card__info" ]
            [ div [ class "session-card__row" ]
                [ span [ class "session-card__label" ] [ text "Managers + Members" ]
                , span [ class "session-card__value" ]
                    [ text (String.fromInt (List.length session.managers + List.length session.members)) ]
                ]
            , div [ class "session-card__row" ]
                [ span [ class "session-card__label" ] [ text "Players" ]
                , span [ class "session-card__value" ]
                    [ text (String.fromInt (List.length session.players)) ]
                ]
            ]
        , div [ class "session-card__footer" ]
            [ span [ class "session-card__members" ]
                [ text (String.fromInt (List.length session.managers + List.length session.members) ++ " users") ]
            , if not isAlreadyMemberOrManager && not (isStarted session) then
                button
                    [ class "btn btn-sm btn-primary session-card__action"
                    , onClick (JoinSession session.id)
                    , stopPropagationOn "click" (Decode.succeed ( JoinSession session.id, True ))
                    ]
                    [ text "Join" ]

              else
                text ""
            ]
        ]


{-| Show a summary of orders status (e.g., "3/5" submitted).
-}
viewOrdersSummary : List PlayerOrderStatus -> Html Msg
viewOrdersSummary players =
    let
        submitted =
            List.filter .submitted players |> List.length

        total =
            List.length players

        allSubmitted =
            submitted == total
    in
    span
        [ class "session-detail__orders-summary"
        , classList [ ( "session-detail__orders-summary--complete", allSubmitted ) ]
        ]
        [ text (String.fromInt submitted ++ "/" ++ String.fromInt total) ]
