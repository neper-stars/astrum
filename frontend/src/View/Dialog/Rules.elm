module View.Dialog.Rules exposing (viewRulesDialog)

{-| Rules dialog for configuring game rules.
-}

import Html exposing (..)
import Html.Attributes exposing (..)
import Html.Events exposing (..)
import Model exposing (RulesForm)
import Msg exposing (Msg(..))
import View.Helpers exposing (viewFormError)


{-| Dialog for viewing or editing game rules.
-}
viewRulesDialog : RulesForm -> Html Msg
viewRulesDialog form =
    let
        r =
            form.rules
    in
    div [ class "rules-dialog" ]
        [ div [ class "dialog__header" ]
            [ h2 [ class "dialog__title" ]
                [ text
                    (if form.isManager then
                        "Configure Game Rules"

                     else
                        "Game Rules"
                    )
                ]
            , button
                [ class "dialog__close"
                , onClick CloseDialog
                ]
                [ text "x" ]
            ]
        , div [ class "dialog__body rules-dialog__body" ]
            [ viewFormError form.error
            , if form.loading then
                div [ class "loading" ]
                    [ div [ class "spinner" ] []
                    , text "Loading rules..."
                    ]

              else
                div [ class "rules-dialog__content" ]
                    [ -- Universe Settings
                      viewRulesSection "Universe Settings"
                        [ viewRulesSelect form.isManager
                            "Universe Size"
                            r.universeSize
                            [ ( 0, "Tiny (400 ly)" )
                            , ( 1, "Small (800 ly)" )
                            , ( 2, "Medium (1200 ly)" )
                            , ( 3, "Large (1600 ly)" )
                            , ( 4, "Huge (2000 ly)" )
                            ]
                            UpdateRulesUniverseSize
                        , viewRulesSelect form.isManager
                            "Density"
                            r.density
                            [ ( 0, "Sparse" )
                            , ( 1, "Normal" )
                            , ( 2, "Dense" )
                            , ( 3, "Packed" )
                            ]
                            UpdateRulesDensity
                        , viewRulesSelect form.isManager
                            "Starting Distance"
                            r.startingDistance
                            [ ( 0, "Close" )
                            , ( 1, "Moderate" )
                            , ( 2, "Farther" )
                            , ( 3, "Distant" )
                            ]
                            UpdateRulesStartingDistance
                        ]

                    -- Game Options
                    , viewRulesSection "Game Options"
                        [ viewRulesCheckbox form.isManager
                            "Maximum Minerals"
                            "Start with maximum mineral concentrations"
                            r.maximumMinerals
                            UpdateRulesMaximumMinerals
                        , viewRulesCheckbox form.isManager
                            "Slower Tech Advances"
                            "Technology costs 2x more to research"
                            r.slowerTechAdvances
                            UpdateRulesSlowerTechAdvances
                        , viewRulesCheckbox form.isManager
                            "Accelerated BBS Play"
                            "Faster game progression for play-by-post"
                            r.acceleratedBbsPlay
                            UpdateRulesAcceleratedBbsPlay
                        , viewRulesCheckbox form.isManager
                            "No Random Events"
                            "Disable mystery traders, comets, etc."
                            r.noRandomEvents
                            UpdateRulesNoRandomEvents
                        , viewRulesCheckbox form.isManager
                            "Computer Players Form Alliances"
                            "AI players can ally with each other"
                            r.computerPlayersFormAlliances
                            UpdateRulesComputerPlayersFormAlliances
                        , viewRulesCheckbox form.isManager
                            "Public Player Scores"
                            "All players can see everyone's scores"
                            r.publicPlayerScores
                            UpdateRulesPublicPlayerScores
                        , viewRulesCheckbox form.isManager
                            "Galaxy Clumping"
                            "Stars cluster together in the galaxy"
                            r.galaxyClumping
                            UpdateRulesGalaxyClumping
                        ]

                    -- Victory Conditions
                    , viewRulesSection "Victory Conditions"
                        [ viewRulesVictoryCondition form.isManager
                            "Owns"
                            r.vcOwnsPercentOfPlanets
                            (String.fromInt r.vcOwnsPercentOfPlanetsValue)
                            "% of all planets"
                            UpdateRulesVcOwnsPercentOfPlanets
                            UpdateRulesVcOwnsPercentOfPlanetsValue
                        , viewRulesVictoryConditionTech form.isManager
                            "Attain tech level"
                            r.vcAttainTechInFields
                            (String.fromInt r.vcAttainTechInFieldsTechValue)
                            (String.fromInt r.vcAttainTechInFieldsFieldsValue)
                            UpdateRulesVcAttainTechInFields
                            UpdateRulesVcAttainTechInFieldsTechValue
                            UpdateRulesVcAttainTechInFieldsFieldsValue
                        , viewRulesVictoryCondition form.isManager
                            "Exceed score of"
                            r.vcExceedScoreOf
                            (String.fromInt r.vcExceedScoreOfValue)
                            ""
                            UpdateRulesVcExceedScoreOf
                            UpdateRulesVcExceedScoreOfValue
                        , viewRulesVictoryCondition form.isManager
                            "Exceed second place score by"
                            r.vcExceedNextPlayerScoreBy
                            (String.fromInt r.vcExceedNextPlayerScoreByValue)
                            "%"
                            UpdateRulesVcExceedNextPlayerScoreBy
                            UpdateRulesVcExceedNextPlayerScoreByValue
                        , viewRulesVictoryCondition form.isManager
                            "Production capacity of"
                            r.vcHasProductionCapacityOf
                            (String.fromInt r.vcHasProductionCapacityOfValue)
                            "k resources"
                            UpdateRulesVcHasProductionCapacityOf
                            UpdateRulesVcHasProductionCapacityOfValue
                        , viewRulesVictoryCondition form.isManager
                            "Owns"
                            r.vcOwnsCapitalShips
                            (String.fromInt r.vcOwnsCapitalShipsValue)
                            "capital ships"
                            UpdateRulesVcOwnsCapitalShips
                            UpdateRulesVcOwnsCapitalShipsValue
                        , viewRulesVictoryCondition form.isManager
                            "Highest score after"
                            r.vcHaveHighestScoreAfterYears
                            (String.fromInt r.vcHaveHighestScoreAfterYearsValue)
                            "years"
                            UpdateRulesVcHaveHighestScoreAfterYears
                            UpdateRulesVcHaveHighestScoreAfterYearsValue
                        ]

                    -- Victory Condition Meta
                    , viewRulesSection "Victory Requirements"
                        [ div [ class "rules-dialog__field" ]
                            [ label [ class "rules-dialog__label" ]
                                [ text "Winner must meet" ]
                            , if form.isManager then
                                input
                                    [ type_ "number"
                                    , class "rules-dialog__input rules-dialog__input--small"
                                    , value (String.fromInt r.vcWinnerMustMeet)
                                    , Html.Attributes.min "0"
                                    , Html.Attributes.max "7"
                                    , onInput UpdateRulesVcWinnerMustMeet
                                    ]
                                    []

                              else
                                span [ class "rules-dialog__value" ]
                                    [ text (String.fromInt r.vcWinnerMustMeet) ]
                            , span [] [ text " of the above conditions" ]
                            ]
                        , div [ class "rules-dialog__field" ]
                            [ label [ class "rules-dialog__label" ]
                                [ text "Minimum years before winner declared" ]
                            , if form.isManager then
                                input
                                    [ type_ "number"
                                    , class "rules-dialog__input rules-dialog__input--small"
                                    , value (String.fromInt r.vcMinYearsBeforeWinner)
                                    , Html.Attributes.min "30"
                                    , Html.Attributes.max "500"
                                    , onInput UpdateRulesVcMinYearsBeforeWinner
                                    ]
                                    []

                              else
                                span [ class "rules-dialog__value" ]
                                    [ text (String.fromInt r.vcMinYearsBeforeWinner) ]
                            ]
                        ]
                    ]
            ]
        , div [ class "dialog__footer dialog__footer--right" ]
            [ button
                [ class "btn btn-secondary"
                , onClick CloseDialog
                ]
                [ text
                    (if form.isManager then
                        "Cancel"

                     else
                        "Close"
                    )
                ]
            , if form.isManager then
                button
                    [ class "btn btn-primary"
                    , disabled form.submitting
                    , onClick SubmitRules
                    ]
                    [ text
                        (if form.submitting then
                            "Saving..."

                         else
                            "Save Rules"
                        )
                    ]

              else
                text ""
            ]
        ]


viewRulesSection : String -> List (Html Msg) -> Html Msg
viewRulesSection title content =
    div [ class "rules-dialog__section" ]
        [ h3 [ class "rules-dialog__section-title" ] [ text title ]
        , div [ class "rules-dialog__section-content" ] content
        ]


viewRulesSelect : Bool -> String -> Int -> List ( Int, String ) -> (Int -> Msg) -> Html Msg
viewRulesSelect isEditable labelText currentValue options toMsg =
    div [ class "rules-dialog__field" ]
        [ label [ class "rules-dialog__label" ] [ text labelText ]
        , if isEditable then
            select
                [ class "rules-dialog__select"
                , onInput (\s -> toMsg (Maybe.withDefault currentValue (String.toInt s)))
                ]
                (List.map
                    (\( val, txt ) ->
                        option
                            [ value (String.fromInt val)
                            , selected (val == currentValue)
                            ]
                            [ text txt ]
                    )
                    options
                )

          else
            span [ class "rules-dialog__value" ]
                [ text
                    (List.filterMap
                        (\( val, txt ) ->
                            if val == currentValue then
                                Just txt

                            else
                                Nothing
                        )
                        options
                        |> List.head
                        |> Maybe.withDefault "Unknown"
                    )
                ]
        ]


viewRulesCheckbox : Bool -> String -> String -> Bool -> (Bool -> Msg) -> Html Msg
viewRulesCheckbox isEditable labelText description currentValue toMsg =
    div [ class "rules-dialog__field rules-dialog__field--checkbox" ]
        [ label [ class "rules-dialog__checkbox-label" ]
            [ if isEditable then
                input
                    [ type_ "checkbox"
                    , checked currentValue
                    , onCheck toMsg
                    ]
                    []

              else
                span [ class "rules-dialog__checkbox-indicator" ]
                    [ text
                        (if currentValue then
                            "[x]"

                         else
                            "[ ]"
                        )
                    ]
            , span [ class "rules-dialog__checkbox-text" ] [ text labelText ]
            ]
        , if not (String.isEmpty description) then
            p [ class "rules-dialog__field-description" ] [ text description ]

          else
            text ""
        ]


viewRulesVictoryCondition :
    Bool
    -> String
    -> Bool
    -> String
    -> String
    -> (Bool -> Msg)
    -> (String -> Msg)
    -> Html Msg
viewRulesVictoryCondition isEditable prefix enabled valueStr suffix toggleMsg valueMsg =
    div [ class "rules-dialog__field rules-dialog__field--victory" ]
        [ label [ class "rules-dialog__checkbox-label" ]
            [ if isEditable then
                input
                    [ type_ "checkbox"
                    , checked enabled
                    , onCheck toggleMsg
                    ]
                    []

              else
                span [ class "rules-dialog__checkbox-indicator" ]
                    [ text
                        (if enabled then
                            "[x]"

                         else
                            "[ ]"
                        )
                    ]
            , span [] [ text (prefix ++ " ") ]
            , if isEditable then
                input
                    [ type_ "number"
                    , class "rules-dialog__input rules-dialog__input--inline"
                    , value valueStr
                    , onInput valueMsg
                    , disabled (not enabled)
                    ]
                    []

              else
                span [ class "rules-dialog__value rules-dialog__value--inline" ]
                    [ text valueStr ]
            , span [] [ text (" " ++ suffix) ]
            ]
        ]


viewRulesVictoryConditionTech :
    Bool
    -> String
    -> Bool
    -> String
    -> String
    -> (Bool -> Msg)
    -> (String -> Msg)
    -> (String -> Msg)
    -> Html Msg
viewRulesVictoryConditionTech isEditable prefix enabled techValueStr fieldsValueStr toggleMsg techMsg fieldsMsg =
    div [ class "rules-dialog__field rules-dialog__field--victory" ]
        [ label [ class "rules-dialog__checkbox-label" ]
            [ if isEditable then
                input
                    [ type_ "checkbox"
                    , checked enabled
                    , onCheck toggleMsg
                    ]
                    []

              else
                span [ class "rules-dialog__checkbox-indicator" ]
                    [ text
                        (if enabled then
                            "[x]"

                         else
                            "[ ]"
                        )
                    ]
            , span [] [ text (prefix ++ " ") ]
            , if isEditable then
                input
                    [ type_ "number"
                    , class "rules-dialog__input rules-dialog__input--inline"
                    , value techValueStr
                    , onInput techMsg
                    , disabled (not enabled)
                    ]
                    []

              else
                span [ class "rules-dialog__value rules-dialog__value--inline" ]
                    [ text techValueStr ]
            , span [] [ text " in " ]
            , if isEditable then
                input
                    [ type_ "number"
                    , class "rules-dialog__input rules-dialog__input--inline"
                    , value fieldsValueStr
                    , onInput fieldsMsg
                    , disabled (not enabled)
                    ]
                    []

              else
                span [ class "rules-dialog__value rules-dialog__value--inline" ]
                    [ text fieldsValueStr ]
            , span [] [ text " fields" ]
            ]
        ]
