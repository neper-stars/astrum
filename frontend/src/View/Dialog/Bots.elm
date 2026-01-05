module View.Dialog.Bots exposing (viewAddBotDialog)

{-| Bot player dialog: add bot to session.
-}

import Html exposing (..)
import Html.Attributes exposing (..)
import Html.Events exposing (..)
import Model exposing (AddBotForm)
import Msg exposing (Msg(..))
import View.Helpers exposing (viewFormError)


{-| Bot race names by index.
-}
botRaceName : Int -> String
botRaceName index =
    case index of
        0 ->
            "Random"

        1 ->
            "Robotoids"

        2 ->
            "Turindrones"

        3 ->
            "Automitrons"

        4 ->
            "Rototills"

        5 ->
            "Cybertrons"

        6 ->
            "Macintis"

        _ ->
            "Unknown"


{-| Bot difficulty level names by index.
-}
botLevelName : Int -> String
botLevelName index =
    case index of
        0 ->
            "Random"

        1 ->
            "Easy"

        2 ->
            "Standard"

        3 ->
            "Tough"

        4 ->
            "Expert"

        _ ->
            "Unknown"


{-| Dialog for adding a bot player to a session.
-}
viewAddBotDialog : AddBotForm -> Html Msg
viewAddBotDialog form =
    div [ class "add-bot-dialog" ]
        [ div [ class "dialog__header" ]
            [ h2 [ class "dialog__title" ] [ text "Add Bot Player" ]
            , button
                [ class "dialog__close"
                , onClick CloseDialog
                ]
                [ text "x" ]
            ]
        , div [ class "dialog__body" ]
            [ viewFormError form.error
            , div [ class "form-group" ]
                [ label [ class "form-label" ] [ text "Bot Race" ]
                , select
                    [ class "form-select"
                    , onInput (\s -> SelectBotRace (Maybe.withDefault 0 (String.toInt s)))
                    ]
                    (List.map
                        (\i ->
                            option
                                [ value (String.fromInt i)
                                , selected (form.selectedRace == i)
                                ]
                                [ text (botRaceName i) ]
                        )
                        (List.range 0 6)
                    )
                ]
            , div [ class "form-group" ]
                [ label [ class "form-label" ] [ text "Difficulty" ]
                , select
                    [ class "form-select"
                    , onInput (\s -> SelectBotLevel (Maybe.withDefault 2 (String.toInt s)))
                    ]
                    (List.map
                        (\i ->
                            option
                                [ value (String.fromInt i)
                                , selected (form.selectedLevel == i)
                                ]
                                [ text (botLevelName i) ]
                        )
                        (List.range 0 4)
                    )
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
                , onClick SubmitAddBot
                , disabled form.submitting
                ]
                [ text "Add Bot" ]
            ]
        ]
