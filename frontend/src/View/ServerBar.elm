module View.ServerBar exposing (viewServerBar)

{-| Server bar view - the vertical bar on the left side showing server buttons.
-}

import Api.Server exposing (Server)
import Dict
import Html exposing (..)
import Html.Attributes exposing (..)
import Html.Events exposing (..)
import Json.Decode as Decode
import Model exposing (..)
import Msg exposing (Msg(..))


{-| Render the server bar with all server buttons.
-}
viewServerBar : Model -> Html Msg
viewServerBar model =
    div [ class "server-bar" ]
        [ div [ class "server-bar__list" ]
            (List.map (viewServerButton model.selectedServerUrl model.serverData model.serverDragState) model.servers)
        , div [ class "server-bar__bottom" ]
            [ button
                [ class "add-server-btn"
                , onClick OpenAddServerDialog
                , title "Add Server"
                ]
                [ text "+" ]
            ]
        ]


viewServerButton : Maybe String -> Dict.Dict String ServerData -> Maybe ServerDragState -> Server -> Html Msg
viewServerButton selectedUrl serverData dragState server =
    let
        isSelected =
            selectedUrl == Just server.url

        connectionState =
            getConnectionState server.url serverData

        statusClass =
            case connectionState of
                Connected _ ->
                    "is-online"

                Connecting ->
                    "is-connecting"

                ConnectionError _ ->
                    "is-offline"

                Disconnected ->
                    "is-offline"

        isDragging =
            case dragState of
                Just ds ->
                    ds.draggedServerUrl == server.url

                Nothing ->
                    False

        isDraggedOver =
            case dragState of
                Just ds ->
                    ds.dragOverServerUrl == Just server.url

                Nothing ->
                    False

        dragEvents =
            [ onMouseDownServer server.url
            , onMouseEnter (ServerDragEnter server.url)
            , onMouseLeave ServerDragLeave
            ]
    in
    div
        ([ class "server-button"
         , classList
            [ ( "is-selected", isSelected )
            , ( "is-dragging", isDragging )
            , ( "is-drag-over", isDraggedOver )
            ]
         ]
            ++ dragEvents
        )
        [ div [ class "server-button__indicator" ] []
        , button
            [ class "server-button__btn"
            , onClick (SelectServer server.url)
            , onContextMenu server.url
            , title server.name
            ]
            [ span [ class "server-button__initials" ]
                [ text (serverInitials server.name) ]
            ]
        , div [ class ("server-button__status " ++ statusClass) ] []
        , div [ class "server-tooltip" ] [ text server.name ]
        ]


{-| Handle mouse down on server button for drag and drop.
-}
onMouseDownServer : String -> Attribute Msg
onMouseDownServer serverUrl =
    preventDefaultOn "mousedown"
        (Decode.map2
            (\y button ->
                if button == 0 then
                    -- Left click only
                    ( ServerDragStart serverUrl y, True )

                else
                    ( NoOp, False )
            )
            (Decode.field "clientY" Decode.float)
            (Decode.field "button" Decode.int)
        )


{-| Get initials from server name (first letter of each word, max 2).
-}
serverInitials : String -> String
serverInitials name =
    String.words name
        |> List.map (String.left 1)
        |> List.take 2
        |> String.concat
        |> String.toUpper


{-| Handle right-click on server button.
-}
onContextMenu : String -> Attribute Msg
onContextMenu serverUrl =
    preventDefaultOn "contextmenu"
        (Decode.map2 (\x y -> ( ShowContextMenu serverUrl x y, True ))
            (Decode.field "clientX" Decode.float)
            (Decode.field "clientY" Decode.float)
        )
