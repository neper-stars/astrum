module View.Dialog.Session exposing (viewCreateSessionDialog)

{-| Session-related dialogs: create session.
-}

import Html exposing (..)
import Html.Attributes exposing (..)
import Html.Events exposing (..)
import Model exposing (CreateSessionForm)
import Msg exposing (Msg(..))
import View.Helpers exposing (viewFormError)


{-| Dialog for creating a new session.
-}
viewCreateSessionDialog : CreateSessionForm -> Html Msg
viewCreateSessionDialog form =
    div []
        [ div [ class "dialog__header" ]
            [ h2 [ class "dialog__title" ] [ text "Create Session" ]
            , button
                [ class "dialog__close"
                , onClick CloseDialog
                ]
                [ text "x" ]
            ]
        , div [ class "dialog__body" ]
            [ viewFormError form.error
            , div [ class "form-group" ]
                [ label [ class "form-label" ] [ text "Session Name" ]
                , input
                    [ class "form-input"
                    , type_ "text"
                    , placeholder "My Game Session"
                    , value form.name
                    , onInput UpdateCreateSessionName
                    ]
                    []
                ]
            , div [ class "form-group" ]
                [ div
                    [ class "form-checkbox"
                    , onClick (UpdateCreateSessionPublic (not form.isPublic))
                    ]
                    [ input
                        [ type_ "checkbox"
                        , checked form.isPublic
                        ]
                        []
                    , span [ class "form-checkbox__label" ] [ text "Public session" ]
                    ]
                , p [ class "form-help" ]
                    [ text "Public sessions can be joined by anyone. Private sessions require an invitation." ]
                ]
            ]
        , div [ class "dialog__footer dialog__footer--right" ]
            [ button
                [ class "btn btn-secondary"
                , onClick CloseDialog
                ]
                [ text "Cancel" ]
            , button
                [ class "btn btn-primary"
                , classList [ ( "btn-loading", form.submitting ) ]
                , onClick SubmitCreateSession
                , disabled form.submitting
                ]
                [ text "Create Session" ]
            ]
        ]
