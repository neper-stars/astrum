module View.Dialog.TurnFiles exposing (viewTurnFilesDialog)

{-| Turn files dialog for viewing turn data and orders status.
-}

import Api.OrdersStatus exposing (PlayerOrderStatus)
import Html exposing (..)
import Html.Attributes exposing (..)
import Html.Events exposing (..)
import Model exposing (TurnFilesForm)
import Msg exposing (Msg(..))
import View.Helpers exposing (viewFormError)


{-| Dialog for viewing turn files and orders status.
-}
viewTurnFilesDialog : TurnFilesForm -> Bool -> Html Msg
viewTurnFilesDialog form hasConflict =
    div [ class "turn-files-dialog" ]
        [ div [ class "dialog__header" ]
            [ h2 [ class "dialog__title" ]
                [ text ("Year " ++ String.fromInt form.year) ]
            , button
                [ class "dialog__close"
                , onClick CloseDialog
                ]
                [ text "x" ]
            ]
        , div [ class "dialog__body" ]
            [ viewFormError form.error

            -- Order conflict warning
            , if hasConflict then
                div [ class "turn-files-dialog__conflict-warning" ]
                    [ text "Warning: Local order file was modified after upload. This may indicate a problem." ]

              else
                text ""

            -- Orders Status section (show if we have data, or loading for latest year)
            , case form.ordersStatus of
                Just ordersStatus ->
                    div [ class "turn-files-dialog__section" ]
                        [ h3 [ class "turn-files-dialog__section-title" ] [ text "Orders Status" ]
                        , div [ class "turn-files-dialog__orders" ]
                            (List.map viewPlayerOrderStatus ordersStatus.players)
                        ]

                Nothing ->
                    if form.isLatestYear then
                        div [ class "turn-files-dialog__section" ]
                            [ h3 [ class "turn-files-dialog__section-title" ] [ text "Orders Status" ]
                            , div [ class "turn-files-dialog__loading" ]
                                [ text "Loading orders status..." ]
                            ]

                    else
                        text ""

            -- Turn Files section
            , div [ class "turn-files-dialog__section" ]
                [ h3 [ class "turn-files-dialog__section-title" ] [ text "Turn Files" ]
                , if form.loading then
                    div [ class "turn-files-dialog__loading" ]
                        [ text "Loading turn files..." ]

                  else
                    case form.turnFiles of
                        Just turnFiles ->
                            div [ class "turn-files-dialog__files" ]
                                [ div [ class "turn-files-dialog__file" ]
                                    [ span [ class "turn-files-dialog__file-label" ]
                                        [ text "Universe File (.xy)" ]
                                    , div [ class "turn-files-dialog__file-info" ]
                                        [ span [ class "turn-files-dialog__file-size" ]
                                            [ text (String.fromInt (String.length turnFiles.universe) ++ " bytes (base64)") ]
                                        ]
                                    ]
                                , div [ class "turn-files-dialog__file" ]
                                    [ span [ class "turn-files-dialog__file-label" ]
                                        [ text "Turn File (.m)" ]
                                    , div [ class "turn-files-dialog__file-info" ]
                                        [ span [ class "turn-files-dialog__file-size" ]
                                            [ text (String.fromInt (String.length turnFiles.turn) ++ " bytes (base64)") ]
                                        ]
                                    ]
                                ]

                        Nothing ->
                            div [ class "turn-files-dialog__empty" ]
                                [ text "No turn files available" ]
                ]
            ]
        , div [ class "dialog__footer" ]
            [ case form.turnFiles of
                Just _ ->
                    button
                        [ class "btn btn--secondary"
                        , onClick (OpenMapViewer form.sessionId form.year form.raceName form.playerNumber)
                        ]
                        [ text "View Map" ]

                Nothing ->
                    text ""
            , button
                [ class "btn btn--secondary"
                , onClick CloseDialog
                ]
                [ text "Close" ]
            ]
        ]


{-| View a single player's order status in the dialog.
-}
viewPlayerOrderStatus : PlayerOrderStatus -> Html Msg
viewPlayerOrderStatus player =
    div
        [ class "turn-files-dialog__order-row"
        , classList
            [ ( "turn-files-dialog__order-row--submitted", player.submitted )
            , ( "turn-files-dialog__order-row--pending", not player.submitted )
            ]
        ]
        [ span [ class "turn-files-dialog__order-number" ]
            [ text (String.fromInt (player.playerOrder + 1)) ]
        , span [ class "turn-files-dialog__order-name" ]
            [ text
                (if player.isBot then
                    player.nickname ++ " (Bot)"

                 else
                    player.nickname
                )
            ]
        , span [ class "turn-files-dialog__order-status" ]
            [ text
                (if player.submitted then
                    "Submitted"

                 else
                    "Pending"
                )
            ]
        ]
