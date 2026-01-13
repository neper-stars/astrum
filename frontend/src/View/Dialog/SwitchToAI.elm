module View.Dialog.SwitchToAI exposing (viewSwitchToAIDialog)

{-| Dialog for switching a human player to AI control.
-}

import Api.AIType as AIType exposing (AIType)
import Html exposing (..)
import Html.Attributes exposing (..)
import Html.Events exposing (..)
import Model exposing (SwitchToAIForm)
import Msg exposing (Msg(..))
import Update.Admin
import Update.Server
import View.Helpers exposing (viewFormError)


{-| Dialog for switching a player to AI control.
-}
viewSwitchToAIDialog : SwitchToAIForm -> Html Msg
viewSwitchToAIDialog form =
    div [ class "switch-to-ai-dialog" ]
        [ div [ class "dialog__header" ]
            [ h2 [ class "dialog__title" ] [ text "Switch to AI Control" ]
            , button
                [ class "dialog__close"
                , onClick (ServerMsg Update.Server.CloseDialog)
                ]
                [ text "x" ]
            ]
        , div [ class "dialog__body" ]
            [ viewFormError form.error
            , p [ class "dialog__description" ]
                [ text "Switch "
                , strong [] [ text form.nickname ]
                , text " to AI control. Select the AI personality type:"
                ]
            , div [ class "form-group" ]
                [ label [ class "form-label" ] [ text "AI Type" ]
                , div [ class "ai-type-list" ]
                    (List.map (viewAITypeRadio form.selectedAIType) AIType.allTypes)
                ]
            ]
        , div [ class "dialog__footer dialog__footer--right" ]
            [ button
                [ class "btn btn-secondary"
                , onClick (ServerMsg Update.Server.CloseDialog)
                ]
                [ text "Cancel" ]
            , button
                [ class "btn btn-primary"
                , classList [ ( "btn-loading", form.submitting ) ]
                , onClick (AdminMsg Update.Admin.SubmitSwitchToAI)
                , disabled form.submitting
                ]
                [ text "Switch to AI" ]
            ]
        ]


{-| Render a radio button for an AI type.
-}
viewAITypeRadio : AIType -> AIType -> Html Msg
viewAITypeRadio selectedType aiType =
    label [ class "ai-type-option" ]
        [ input
            [ type_ "radio"
            , name "ai-type"
            , checked (selectedType == aiType)
            , onClick (AdminMsg (Update.Admin.SelectAIType aiType))
            ]
            []
        , span [ class "ai-type-label" ]
            [ text (AIType.toDisplayName aiType ++ " (" ++ AIType.toRaceName aiType ++ ")") ]
        ]
