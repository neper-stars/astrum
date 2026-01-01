module View.Dialog.Auth exposing
    ( viewConnectDialog
    , viewRegisterDialog
    )

{-| Authentication dialogs: connect (login) and register.
-}

import Html exposing (..)
import Html.Attributes exposing (..)
import Html.Events exposing (..)
import Model exposing (ConnectForm, RegisterForm)
import Msg exposing (Msg(..))
import View.Helpers exposing (viewFormError)


{-| Dialog for connecting (logging in) to a server.
-}
viewConnectDialog : String -> ConnectForm -> Html Msg
viewConnectDialog serverUrl form =
    div []
        [ div [ class "dialog__header" ]
            [ h2 [ class "dialog__title" ] [ text "Connect to Server" ]
            , button
                [ class "dialog__close"
                , onClick CloseDialog
                ]
                [ text "x" ]
            ]
        , div [ class "dialog__body" ]
            [ div [ class "connect-dialog__tabs" ]
                [ button
                    [ class "connect-dialog__tab is-active" ]
                    [ text "Login" ]
                , button
                    [ class "connect-dialog__tab"
                    , onClick SwitchToRegister
                    ]
                    [ text "Register" ]
                ]
            , viewFormError form.error
            , div [ class "form-group" ]
                [ label [ class "form-label" ] [ text "Username" ]
                , input
                    [ class "form-input"
                    , type_ "text"
                    , placeholder "Your nickname"
                    , value form.username
                    , onInput UpdateConnectUsername
                    ]
                    []
                ]
            , div [ class "form-group" ]
                [ label [ class "form-label" ] [ text "API Key" ]
                , input
                    [ class "form-input"
                    , type_ "password"
                    , placeholder "Your API key"
                    , value form.password
                    , onInput UpdateConnectPassword
                    ]
                    []
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
                , onClick (SubmitConnect serverUrl)
                , disabled form.submitting
                ]
                [ text "Connect" ]
            ]
        ]


{-| Dialog for registering a new account.
-}
viewRegisterDialog : String -> RegisterForm -> Html Msg
viewRegisterDialog serverUrl form =
    div []
        [ div [ class "dialog__header" ]
            [ h2 [ class "dialog__title" ] [ text "Register Account" ]
            , button
                [ class "dialog__close"
                , onClick CloseDialog
                ]
                [ text "x" ]
            ]
        , div [ class "dialog__body" ]
            (if form.success then
                [ div [ class "register-success" ]
                    [ div [ class "register-success__icon" ] [ text "\u{2713}" ]
                    , h3 [ class "register-success__title" ] [ text "Registration Submitted" ]
                    , p [ class "register-success__message" ]
                        [ text "Your registration request has been submitted."
                        , br [] []
                        , text "A manager will review your request and you will receive your API key once approved."
                        ]
                    ]
                ]

             else
                [ div [ class "connect-dialog__tabs" ]
                    [ button
                        [ class "connect-dialog__tab"
                        , onClick SwitchToConnect
                        ]
                        [ text "Login" ]
                    , button
                        [ class "connect-dialog__tab is-active" ]
                        [ text "Register" ]
                    ]
                , viewFormError form.error
                , div [ class "form-group" ]
                    [ label [ class "form-label" ] [ text "Nickname" ]
                    , input
                        [ class "form-input"
                        , type_ "text"
                        , placeholder "Choose a nickname"
                        , value form.nickname
                        , onInput UpdateRegisterNickname
                        ]
                        []
                    ]
                , div [ class "form-group" ]
                    [ label [ class "form-label" ] [ text "Email" ]
                    , input
                        [ class "form-input"
                        , type_ "email"
                        , placeholder "your@email.com"
                        , value form.email
                        , onInput UpdateRegisterEmail
                        ]
                        []
                    ]
                , div [ class "form-group" ]
                    [ label [ class "form-label" ] [ text "Message (optional)" ]
                    , textarea
                        [ class "form-input"
                        , placeholder "Why do you want to join?"
                        , value form.message
                        , onInput UpdateRegisterMessage
                        ]
                        []
                    ]
                ]
            )
        , div [ class "dialog__footer dialog__footer--right" ]
            [ button
                [ class "btn btn-secondary"
                , onClick CloseDialog
                ]
                [ text
                    (if form.success then
                        "Close"

                     else
                        "Cancel"
                    )
                ]
            , if form.success then
                text ""

              else
                button
                    [ class "btn btn-primary"
                    , classList [ ( "btn-loading", form.submitting ) ]
                    , onClick (SubmitRegister serverUrl)
                    , disabled form.submitting
                    ]
                    [ text "Register" ]
            ]
        ]
