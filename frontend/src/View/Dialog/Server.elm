module View.Dialog.Server exposing
    ( viewAddServerDialog
    , viewEditServerDialog
    , viewRemoveServerDialog
    )

{-| Server-related dialogs: add, edit, and remove server.
-}

import Html exposing (..)
import Html.Attributes exposing (..)
import Html.Events exposing (..)
import Model exposing (ServerForm, defaultServerUrl)
import Msg exposing (Msg(..))
import View.Helpers exposing (viewFormError)


{-| Dialog for adding a new server.
-}
viewAddServerDialog : Bool -> ServerForm -> Html Msg
viewAddServerDialog hasDefaultServer form =
    div []
        [ div [ class "dialog__header" ]
            [ h2 [ class "dialog__title" ] [ text "Add Server" ]
            , button
                [ class "dialog__close"
                , onClick CloseDialog
                ]
                [ text "x" ]
            ]
        , div [ class "dialog__body" ]
            [ viewFormError form.error
            , if not hasDefaultServer then
                div [ class "dialog__info" ]
                    [ div [ class "dialog__info-content" ]
                        [ p [] [ text "The official free Neper server is not configured." ]
                        , button
                            [ class "btn btn-primary btn-sm"
                            , onClick AddDefaultServer
                            ]
                            [ text "Add Neper Server" ]
                        ]
                    ]

              else
                text ""
            , div [ class "form-group" ]
                [ label [ class "form-label" ] [ text "Server Name" ]
                , input
                    [ class "form-input"
                    , type_ "text"
                    , placeholder "My Server"
                    , value form.name
                    , onInput UpdateServerFormName
                    ]
                    []
                ]
            , div [ class "form-group" ]
                [ label [ class "form-label" ] [ text "Server URL" ]
                , input
                    [ class "form-input"
                    , type_ "url"
                    , placeholder "https://neper.example.com"
                    , value form.url
                    , onInput UpdateServerFormUrl
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
                , onClick SubmitAddServer
                , disabled form.submitting
                ]
                [ text "Add Server" ]
            ]
        ]


{-| Dialog for editing an existing server.
-}
viewEditServerDialog : String -> ServerForm -> Html Msg
viewEditServerDialog serverUrl form =
    let
        isRenaming =
            case form.originalName of
                Just originalName ->
                    form.name /= originalName

                Nothing ->
                    False
    in
    div []
        [ div [ class "dialog__header" ]
            [ h2 [ class "dialog__title" ] [ text "Edit Server" ]
            , button
                [ class "dialog__close"
                , onClick CloseDialog
                ]
                [ text "x" ]
            ]
        , div [ class "dialog__body" ]
            [ viewFormError form.error
            , div [ class "form-group" ]
                [ label [ class "form-label" ] [ text "Server Name" ]
                , input
                    [ class "form-input"
                    , type_ "text"
                    , value form.name
                    , onInput UpdateServerFormName
                    ]
                    []
                ]
            , div [ class "form-group" ]
                [ label [ class "form-label" ] [ text "Server URL" ]
                , input
                    [ class "form-input"
                    , type_ "url"
                    , value form.url
                    , onInput UpdateServerFormUrl
                    ]
                    []
                ]
            , if isRenaming then
                div [ class "dialog__warning" ]
                    [ span [ class "dialog__warning-icon" ] [ text "⚠" ]
                    , div [ class "dialog__warning-text" ]
                        [ text "You are renaming this server. Please close any Stars! games for this server before proceeding. The server's game directory will be renamed."
                        ]
                    ]

              else
                text ""
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
                , onClick (SubmitEditServer serverUrl)
                , disabled form.submitting
                ]
                [ text "Save Changes" ]
            ]
        ]


{-| Confirmation dialog for removing a server.
-}
viewRemoveServerDialog : String -> Html Msg
viewRemoveServerDialog serverUrl =
    let
        isDefaultServer =
            serverUrl == defaultServerUrl
    in
    div [ class "confirm-dialog" ]
        [ div [ class "confirm-dialog__icon is-danger" ] [ text "!" ]
        , h2 [ class "confirm-dialog__title" ] [ text "Remove Server?" ]
        , p [ class "confirm-dialog__message" ]
            [ text "Are you sure you want to remove this server? This action cannot be undone." ]
        , if isDefaultServer then
            div [ class "dialog__warning" ]
                [ span [ class "dialog__warning-icon" ] [ text "⚠" ]
                , div [ class "dialog__warning-text" ]
                    [ text "This is the official free Neper server hosted for everyone. You can re-add it later from the Add Server dialog."
                    ]
                ]

          else
            text ""
        , div [ class "confirm-dialog__actions" ]
            [ button
                [ class "btn btn-secondary"
                , onClick CloseDialog
                ]
                [ text "Cancel" ]
            , button
                [ class "btn btn-danger"
                , onClick (ConfirmRemoveServer serverUrl)
                ]
                [ text "Remove" ]
            ]
        ]
