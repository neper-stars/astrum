module View.Dialog.Bots exposing (viewAddBotDialog)

{-| Bot player dialog: add bot to session.
-}

import Api.BotLevel as BotLevel exposing (BotLevel)
import Api.BotRace as BotRace exposing (BotRace)
import Html exposing (..)
import Html.Attributes exposing (..)
import Html.Events exposing (..)
import Model exposing (AddBotForm)
import Msg exposing (Msg(..))
import Update.Admin
import Update.Server
import View.Helpers exposing (viewFormError)


{-| Dialog for adding a bot player to a session.
-}
viewAddBotDialog : AddBotForm -> Html Msg
viewAddBotDialog form =
    div [ class "add-bot-dialog" ]
        [ div [ class "dialog__header" ]
            [ h2 [ class "dialog__title" ] [ text "Add Bot Player" ]
            , button
                [ class "dialog__close"
                , onClick (ServerMsg Update.Server.CloseDialog)
                ]
                [ text "x" ]
            ]
        , div [ class "dialog__body" ]
            [ viewFormError form.error
            , div [ class "form-group" ]
                [ label [ class "form-label" ] [ text "Bot Race" ]
                , select
                    [ class "form-select"
                    , onInput
                        (\s ->
                            case String.toInt s |> Maybe.andThen BotRace.fromInt of
                                Just race ->
                                    AdminMsg (Update.Admin.SelectBotRace race)

                                Nothing ->
                                    AdminMsg (Update.Admin.SelectBotRace BotRace.Random)
                        )
                    ]
                    (List.map (viewBotRaceOption form.selectedRace) BotRace.allRaces)
                ]
            , div [ class "form-group" ]
                [ label [ class "form-label" ] [ text "Difficulty" ]
                , select
                    [ class "form-select"
                    , onInput
                        (\s ->
                            case String.toInt s |> Maybe.andThen BotLevel.fromInt of
                                Just level ->
                                    AdminMsg (Update.Admin.SelectBotLevel level)

                                Nothing ->
                                    AdminMsg (Update.Admin.SelectBotLevel BotLevel.Standard)
                        )
                    ]
                    (List.map (viewBotLevelOption form.selectedLevel) BotLevel.allLevels)
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
                , onClick (AdminMsg Update.Admin.SubmitAddBot)
                , disabled form.submitting
                ]
                [ text "Add Bot" ]
            ]
        ]


{-| Render a single bot race option.
-}
viewBotRaceOption : BotRace -> BotRace -> Html Msg
viewBotRaceOption selectedRace race =
    option
        [ value (String.fromInt (BotRace.toInt race))
        , selected (selectedRace == race)
        ]
        [ text (BotRace.toString race) ]


{-| Render a single bot level option.
-}
viewBotLevelOption : BotLevel -> BotLevel -> Html Msg
viewBotLevelOption selectedLevel level =
    option
        [ value (String.fromInt (BotLevel.toInt level))
        , selected (selectedLevel == level)
        ]
        [ text (BotLevel.toString level) ]
