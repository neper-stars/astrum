module Update.DragDrop exposing
    ( handleMouseDownOnPlayer
    , handleMouseEnterPlayer
    , handleMouseLeavePlayer
    , handleMouseMoveWhileDragging
    , handleMouseUpEndDrag
    , handlePlayersReordered
    , handleServerDragEnd
    , handleServerDragEnter
    , handleServerDragLeave
    , handleServerDragMove
    , handleServerDragStart
    , handleServersReordered
    )

{-| Update handlers for drag and drop reordering.

Handles player reordering within sessions and server reordering in the sidebar.

-}

import Api.Encode as Encode
import Json.Encode as E
import Model exposing (..)
import Msg exposing (Msg)
import Ports
import Update.Helpers exposing (moveItem)



-- =============================================================================
-- PLAYER DRAG AND DROP
-- =============================================================================


{-| Handle mouse down on a player to start dragging.
-}
handleMouseDownOnPlayer : Model -> String -> String -> Float -> Float -> ( Model, Cmd Msg )
handleMouseDownOnPlayer model playerId playerName mouseX mouseY =
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


{-| Handle mouse move while dragging.
-}
handleMouseMoveWhileDragging : Model -> Float -> Float -> ( Model, Cmd Msg )
handleMouseMoveWhileDragging model mouseX mouseY =
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


{-| Handle mouse entering a player during drag.
-}
handleMouseEnterPlayer : Model -> String -> ( Model, Cmd Msg )
handleMouseEnterPlayer model playerId =
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


{-| Handle mouse leaving a player during drag.
-}
handleMouseLeavePlayer : Model -> ( Model, Cmd Msg )
handleMouseLeavePlayer model =
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


{-| Handle mouse up to end drag and complete reorder.
-}
handleMouseUpEndDrag : Model -> ( Model, Cmd Msg )
handleMouseUpEndDrag model =
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


{-| Handle players reordered result.
-}
handlePlayersReordered : Model -> String -> Result String () -> ( Model, Cmd Msg )
handlePlayersReordered model serverUrl result =
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



-- =============================================================================
-- SERVER DRAG AND DROP
-- =============================================================================


{-| Handle start of server drag.
-}
handleServerDragStart : Model -> String -> Float -> ( Model, Cmd Msg )
handleServerDragStart model serverUrl mouseY =
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


{-| Handle server drag move.
-}
handleServerDragMove : Model -> Float -> ( Model, Cmd Msg )
handleServerDragMove model mouseY =
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


{-| Handle mouse entering a server during drag.
-}
handleServerDragEnter : Model -> String -> ( Model, Cmd Msg )
handleServerDragEnter model serverUrl =
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


{-| Handle mouse leaving a server during drag.
-}
handleServerDragLeave : Model -> ( Model, Cmd Msg )
handleServerDragLeave model =
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


{-| Handle end of server drag and complete reorder.
-}
handleServerDragEnd : Model -> ( Model, Cmd Msg )
handleServerDragEnd model =
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


{-| Handle servers reordered result.
-}
handleServersReordered : Model -> Result String () -> ( Model, Cmd Msg )
handleServersReordered model result =
    case result of
        Ok _ ->
            -- Order already updated optimistically in ServerDragEnd
            ( model, Cmd.none )

        Err err ->
            -- On error, refresh servers to get correct order
            ( { model | error = Just err }
            , Ports.getServers ()
            )
