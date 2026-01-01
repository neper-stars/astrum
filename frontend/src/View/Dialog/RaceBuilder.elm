module View.Dialog.RaceBuilder exposing (viewRaceBuilderDialog)

{-| Race Builder dialog - create custom races matching Stars! race builder.
-}

import Html exposing (..)
import Html.Attributes exposing (..)
import Html.Events exposing (..)
import Model exposing (HabButton(..), HabitabilityDisplay, LRTInfo, PRTInfo, RaceBuilderForm, RaceBuilderMode(..), RaceBuilderTab(..), RaceConfig, RaceValidation)
import Msg exposing (Msg(..))



-- =============================================================================
-- PRT CONSTANTS (Primary Racial Traits)
-- =============================================================================


prtHyperExpansion : Int
prtHyperExpansion =
    0


prtSuperStealth : Int
prtSuperStealth =
    1


prtWarMonger : Int
prtWarMonger =
    2


prtClaimAdjuster : Int
prtClaimAdjuster =
    3


prtInnerStrength : Int
prtInnerStrength =
    4


prtSpaceDemolition : Int
prtSpaceDemolition =
    5


prtPacketPhysics : Int
prtPacketPhysics =
    6


prtInterstellarTraveler : Int
prtInterstellarTraveler =
    7


prtAlternateReality : Int
prtAlternateReality =
    8


prtJackOfAllTrades : Int
prtJackOfAllTrades =
    9



-- =============================================================================
-- LRT CONSTANTS (Lesser Racial Traits)
-- =============================================================================


lrtImprovedFuelEfficiency : Int
lrtImprovedFuelEfficiency =
    0


lrtTotalTerraforming : Int
lrtTotalTerraforming =
    1


lrtAdvancedRemoteMining : Int
lrtAdvancedRemoteMining =
    2


lrtImprovedStarbases : Int
lrtImprovedStarbases =
    3


lrtGeneralizedResearch : Int
lrtGeneralizedResearch =
    4


lrtUltimateRecycling : Int
lrtUltimateRecycling =
    5


lrtMineralAlchemy : Int
lrtMineralAlchemy =
    6


lrtNoRamScoopEngines : Int
lrtNoRamScoopEngines =
    7


lrtCheapEngines : Int
lrtCheapEngines =
    8


lrtOnlyBasicRemoteMining : Int
lrtOnlyBasicRemoteMining =
    9


lrtNoAdvancedScanners : Int
lrtNoAdvancedScanners =
    10


lrtLowStartingPopulation : Int
lrtLowStartingPopulation =
    11


lrtBleedingEdgeTechnology : Int
lrtBleedingEdgeTechnology =
    12


lrtRegeneratingShields : Int
lrtRegeneratingShields =
    13



-- =============================================================================
-- VIEW
-- =============================================================================


{-| View the race builder dialog.
-}
viewRaceBuilderDialog : RaceBuilderForm -> Html Msg
viewRaceBuilderDialog form =
    let
        isReadOnly =
            case form.mode of
                EditMode ->
                    False

                ViewMode _ ->
                    True
    in
    div [ class "race-builder" ]
        [ viewHeader form.mode
        , viewTabs form.activeTab
        , viewPointsBar form.validation
        , if form.loading then
            div [ class "race-builder__content race-builder__content--loading" ]
                [ div [ class "race-builder__loading" ]
                    [ text "Loading race data..." ]
                ]

          else
            viewTabContent form.activeTab form.config form.validation form.selectedTemplate isReadOnly
        , viewFooter form
        ]


{-| Dialog header.
-}
viewHeader : RaceBuilderMode -> Html Msg
viewHeader mode =
    let
        title =
            case mode of
                EditMode ->
                    "Race Builder"

                ViewMode { raceName } ->
                    "View Race: " ++ raceName
    in
    div [ class "dialog__header" ]
        [ h2 [ class "dialog__title" ] [ text title ]
        , button
            [ class "dialog__close"
            , onClick CloseDialog
            ]
            [ text "x" ]
        ]


{-| Tab navigation.
-}
viewTabs : RaceBuilderTab -> Html Msg
viewTabs activeTab =
    div [ class "race-builder__tabs" ]
        [ viewTab IdentityTab "Identity" activeTab
        , viewTab PrimaryTraitTab "Primary Trait" activeTab
        , viewTab LesserTraitsTab "Lesser Traits" activeTab
        , viewTab HabitabilityTab "Habitability" activeTab
        , viewTab EconomyTab "Economy" activeTab
        , viewTab ResearchTab "Research" activeTab
        ]


viewTab : RaceBuilderTab -> String -> RaceBuilderTab -> Html Msg
viewTab tab label activeTab =
    button
        [ class "race-builder__tab"
        , classList [ ( "is-active", tab == activeTab ) ]
        , onClick (SelectRaceBuilderTab tab)
        ]
        [ text label ]


{-| Points bar showing advantage points and validation status.
-}
viewPointsBar : RaceValidation -> Html Msg
viewPointsBar validation =
    let
        pointsClass =
            if validation.points < 0 then
                "race-builder__points--negative"

            else if validation.points == 0 then
                "race-builder__points--zero"

            else
                "race-builder__points--positive"
    in
    div [ class "race-builder__points-bar" ]
        [ div [ class ("race-builder__points " ++ pointsClass) ]
            [ span [ class "race-builder__points-label" ] [ text "Advantage Points: " ]
            , span [ class "race-builder__points-value" ] [ text (String.fromInt validation.points) ]
            ]
        , if not validation.isValid then
            div [ class "race-builder__errors" ]
                (List.map viewValidationError validation.errors)

          else if not (List.isEmpty validation.warnings) then
            div [ class "race-builder__warnings" ]
                (List.map (\w -> div [ class "race-builder__warning" ] [ text w ]) validation.warnings)

          else
            text ""
        ]


viewValidationError : { field : String, message : String } -> Html msg
viewValidationError err =
    div [ class "race-builder__error" ]
        [ text err.message ]


{-| Tab content based on active tab.
-}
viewTabContent : RaceBuilderTab -> RaceConfig -> RaceValidation -> String -> Bool -> Html Msg
viewTabContent tab config validation selectedTemplate isReadOnly =
    div [ class "race-builder__content" ]
        [ case tab of
            IdentityTab ->
                viewIdentityTab config selectedTemplate isReadOnly

            PrimaryTraitTab ->
                viewPRTTab config validation.prtInfos isReadOnly

            LesserTraitsTab ->
                viewLRTTab config validation.lrtInfos isReadOnly

            HabitabilityTab ->
                viewHabitabilityTab config validation.habitability isReadOnly

            EconomyTab ->
                viewEconomyTab config isReadOnly

            ResearchTab ->
                viewResearchTab config isReadOnly
        ]


{-| Identity tab: names, password, icon, template, leftover points.
    Matches Stars! Custom Race Wizard Step 1 layout exactly.
-}
viewIdentityTab : RaceConfig -> String -> Bool -> Html Msg
viewIdentityTab config selectedTemplate isReadOnly =
    div [ class "race-builder__identity" ]
        [ -- Race Name (singular)
          div [ class "race-builder__identity-row" ]
            [ label [ class "race-builder__identity-label", for "singularName" ] [ text "Race Name:" ]
            , input
                [ type_ "text"
                , class "race-builder__identity-input"
                , id "singularName"
                , value config.singularName
                , onInput UpdateRaceBuilderSingularName
                , maxlength 15
                , disabled isReadOnly
                ]
                []
            ]

        -- Plural Race Name
        , div [ class "race-builder__identity-row" ]
            [ label [ class "race-builder__identity-label", for "pluralName" ] [ text "Plural Race Name:" ]
            , input
                [ type_ "text"
                , class "race-builder__identity-input"
                , id "pluralName"
                , value config.pluralName
                , onInput UpdateRaceBuilderPluralName
                , maxlength 15
                , disabled isReadOnly
                ]
                []
            ]

        -- Password
        , div [ class "race-builder__identity-row" ]
            [ label [ class "race-builder__identity-label", for "password" ] [ text "Password:" ]
            , input
                [ type_ "password"
                , class "race-builder__identity-input race-builder__identity-input--short"
                , id "password"
                , value config.password
                , onInput UpdateRaceBuilderPassword
                , maxlength 15
                , disabled isReadOnly
                ]
                []
            ]

        -- Predefined Races (templates)
        , fieldset [ class "race-builder__predefined" ]
            [ legend [] [ text "Predefined Races" ]
            , div [ class "race-builder__predefined-grid" ]
                [ viewTemplateOption "humanoid" "Humanoid" selectedTemplate isReadOnly
                , viewTemplateOption "silicanoid" "Silicanoid" selectedTemplate isReadOnly
                , viewTemplateOption "rabbitoid" "Rabbitoid" selectedTemplate isReadOnly
                , viewTemplateOption "antetheral" "Antetheral" selectedTemplate isReadOnly
                , viewTemplateOption "insectoid" "Insectoid" selectedTemplate isReadOnly
                , viewTemplateOption "random" "Random" selectedTemplate isReadOnly
                , viewTemplateOption "nucleotid" "Nucleotoid" selectedTemplate isReadOnly
                , label [ class "race-builder__predefined-option" ]
                    [ input
                        [ type_ "radio"
                        , name "template"
                        , checked (selectedTemplate == "custom")
                        , onClick SelectCustomTemplate
                        , disabled isReadOnly
                        ]
                        []
                    , text "Custom"
                    ]
                ]
            ]

        -- Bottom row: Leftover points dropdown + Icon picker (same row, like Stars!)
        , div [ class "race-builder__bottom-row" ]
            [ -- Leftover advantage points (left side)
              div [ class "race-builder__leftover-section" ]
                [ label [ for "leftover" ] [ text "Spend up to 50 leftover advantage points on:" ]
                , select
                    [ class "race-builder__leftover-select"
                    , id "leftover"
                    , onInput (String.toInt >> Maybe.withDefault 0 >> UpdateRaceBuilderLeftoverPoints)
                    , disabled isReadOnly
                    ]
                    [ option [ value "0", selected (config.leftoverPointsOn == 0) ] [ text "Surface minerals" ]
                    , option [ value "1", selected (config.leftoverPointsOn == 1) ] [ text "Mineral concentrations" ]
                    , option [ value "2", selected (config.leftoverPointsOn == 2) ] [ text "Mines" ]
                    , option [ value "3", selected (config.leftoverPointsOn == 3) ] [ text "Factories" ]
                    , option [ value "4", selected (config.leftoverPointsOn == 4) ] [ text "Defenses" ]
                    ]
                ]

            -- Icon picker (right side, same row)
            , div [ class "race-builder__icon-picker" ]
                [ img
                    [ src (raceIconPath config.icon)
                    , alt ("Race icon " ++ String.fromInt config.icon)
                    , class "race-builder__icon-image"
                    ]
                    []
                , div [ class "race-builder__icon-nav" ]
                    [ button
                        [ class "race-builder__icon-btn"
                        , onClick (UpdateRaceBuilderIcon (wrapIcon (config.icon - 1)))
                        , disabled isReadOnly
                        , title "Previous icon"
                        ]
                        [ text "<" ]
                    , button
                        [ class "race-builder__icon-btn"
                        , onClick (UpdateRaceBuilderIcon (wrapIcon (config.icon + 1)))
                        , disabled isReadOnly
                        , title "Next icon"
                        ]
                        [ text ">" ]
                    ]
                ]
            ]
        ]


{-| Get the path to a race icon image.
    Icons are stored as 1-32, matching file names 01.png to 32.png.
-}
raceIconPath : Int -> String
raceIconPath iconNum =
    "/images/race_icons/" ++ String.padLeft 2 '0' (String.fromInt iconNum) ++ ".png"


{-| Wrap icon number to stay in valid range 1-32.
-}
wrapIcon : Int -> Int
wrapIcon n =
    if n < 1 then
        32

    else if n > 32 then
        1

    else
        n


{-| Template radio option.
-}
viewTemplateOption : String -> String -> String -> Bool -> Html Msg
viewTemplateOption templateId displayName selectedTemplate isReadOnly =
    label [ class "race-builder__predefined-option" ]
        [ input
            [ type_ "radio"
            , name "template"
            , checked (selectedTemplate == templateId)
            , onClick (LoadRaceTemplate templateId)
            , disabled isReadOnly
            ]
            []
        , text displayName
        ]


{-| Primary Racial Trait tab.

Stars! displays PRTs in two columns, with items going down each column:
Left column: HE, SS, WM, CA, IS
Right column: SD, PP, IT, AR, JOAT

Below the grid is a "Description of Trait" section showing the selected PRT's description.

-}
viewPRTTab : RaceConfig -> List PRTInfo -> Bool -> Html Msg
viewPRTTab config prtInfos isReadOnly =
    let
        -- Get PRT by index from the list
        getPRT idx =
            List.filter (\p -> p.index == idx) prtInfos |> List.head

        -- Get the selected PRT's description
        selectedPRTDesc =
            getPRT config.prt
                |> Maybe.map .desc
                |> Maybe.withDefault ""

        -- Render a PRT option using data from Houston
        renderPRT idx =
            case getPRT idx of
                Just prt ->
                    viewPRTOption prt config.prt isReadOnly

                Nothing ->
                    text ""
    in
    div [ class "race-builder__prt" ]
        [ div [ class "race-builder__prt-grid" ]
            [ -- Row 1: HE, SD
              renderPRT prtHyperExpansion
            , renderPRT prtSpaceDemolition

            -- Row 2: SS, PP
            , renderPRT prtSuperStealth
            , renderPRT prtPacketPhysics

            -- Row 3: WM, IT
            , renderPRT prtWarMonger
            , renderPRT prtInterstellarTraveler

            -- Row 4: CA, AR
            , renderPRT prtClaimAdjuster
            , renderPRT prtAlternateReality

            -- Row 5: IS, JOAT
            , renderPRT prtInnerStrength
            , renderPRT prtJackOfAllTrades
            ]

        -- Description of Trait section (like Stars!)
        , div [ class "race-builder__trait-description" ]
            [ div [ class "race-builder__trait-description-label" ] [ text "Description of Trait" ]
            , div [ class "race-builder__trait-description-box" ]
                [ text selectedPRTDesc ]
            ]
        ]


viewPRTOption : PRTInfo -> Int -> Bool -> Html Msg
viewPRTOption prt currentPrt isReadOnly =
    label
        [ class "race-builder__prt-option"
        , classList [ ( "is-selected", prt.index == currentPrt ) ]
        ]
        [ input
            [ type_ "radio"
            , class "race-builder__prt-radio"
            , checked (prt.index == currentPrt)
            , onClick (UpdateRaceBuilderPRT prt.index)
            , disabled isReadOnly
            ]
            []
        , span [ class "race-builder__prt-name" ] [ text prt.name ]
        ]


{-| Lesser Racial Traits tab.

Stars! displays LRTs in two columns, with items going down each column:
Left column: IFE, TT, ARM, ISB, GR, UR, MA
Right column: NRSE, CE, OBRM, NAS, LSP, BET, RS

Below the grid is a description section showing the first selected LRT's description.

-}
viewLRTTab : RaceConfig -> List LRTInfo -> Bool -> Html Msg
viewLRTTab config lrtInfos isReadOnly =
    let
        -- Get LRT by index from the list
        getLRT idx =
            List.filter (\l -> l.index == idx) lrtInfos |> List.head

        -- Get the first selected LRT for the description
        firstSelectedLRT =
            config.lrt
                |> List.head
                |> Maybe.andThen getLRT

        -- Render an LRT option using data from Houston
        renderLRT idx =
            case getLRT idx of
                Just lrt ->
                    viewLRTOption lrt config.lrt isReadOnly

                Nothing ->
                    text ""
    in
    div [ class "race-builder__lrt" ]
        [ div [ class "race-builder__lrt-grid" ]
            [ -- Row 1: IFE, NRSE
              renderLRT lrtImprovedFuelEfficiency
            , renderLRT lrtNoRamScoopEngines

            -- Row 2: TT, CE
            , renderLRT lrtTotalTerraforming
            , renderLRT lrtCheapEngines

            -- Row 3: ARM, OBRM
            , renderLRT lrtAdvancedRemoteMining
            , renderLRT lrtOnlyBasicRemoteMining

            -- Row 4: ISB, NAS
            , renderLRT lrtImprovedStarbases
            , renderLRT lrtNoAdvancedScanners

            -- Row 5: GR, LSP
            , renderLRT lrtGeneralizedResearch
            , renderLRT lrtLowStartingPopulation

            -- Row 6: UR, BET
            , renderLRT lrtUltimateRecycling
            , renderLRT lrtBleedingEdgeTechnology

            -- Row 7: MA, RS
            , renderLRT lrtMineralAlchemy
            , renderLRT lrtRegeneratingShields
            ]

        -- Description section (like Stars!) - shows first selected LRT
        , case firstSelectedLRT of
            Just lrt ->
                div [ class "race-builder__trait-description" ]
                    [ div [ class "race-builder__trait-description-label" ] [ text lrt.name ]
                    , div [ class "race-builder__trait-description-box" ]
                        [ text lrt.desc ]
                    ]

            Nothing ->
                text ""
        ]


viewLRTOption : LRTInfo -> List Int -> Bool -> Html Msg
viewLRTOption lrt selectedLrts isReadOnly =
    let
        isSelected =
            List.member lrt.index selectedLrts
    in
    label
        [ class "race-builder__lrt-option"
        , classList [ ( "is-selected", isSelected ) ]
        ]
        [ input
            [ type_ "checkbox"
            , class "race-builder__lrt-checkbox"
            , checked isSelected
            , onClick (ToggleRaceBuilderLRT lrt.index)
            , disabled isReadOnly
            ]
            []
        , span [ class "race-builder__lrt-name" ] [ text lrt.name ]
        ]


{-| Habitability tab.
-}
viewHabitabilityTab : RaceConfig -> HabitabilityDisplay -> Bool -> Html Msg
viewHabitabilityTab config habDisplay isReadOnly =
    div [ class "race-builder__habitability" ]
        [ -- Gravity
          viewHabRange
            { label = "Gravity"
            , center = config.gravityCenter
            , width = config.gravityWidth
            , immune = config.gravityImmune
            , onCenterChange = UpdateRaceBuilderGravityCenter
            , onWidthChange = UpdateRaceBuilderGravityWidth
            , onImmuneChange = UpdateRaceBuilderGravityImmune
            , minDisplay = habDisplay.gravityMin
            , maxDisplay = habDisplay.gravityMax
            , rangeDisplay = habDisplay.gravityRange
            , barColor = "#4a9eff"
            , isReadOnly = isReadOnly
            , expandBtn = GravityExpandBtn
            , shrinkBtn = GravityShrinkBtn
            , leftBtn = GravityLeftBtn
            , rightBtn = GravityRightBtn
            }

        -- Temperature
        , viewHabRange
            { label = "Temperature"
            , center = config.temperatureCenter
            , width = config.temperatureWidth
            , immune = config.temperatureImmune
            , onCenterChange = UpdateRaceBuilderTemperatureCenter
            , onWidthChange = UpdateRaceBuilderTemperatureWidth
            , onImmuneChange = UpdateRaceBuilderTemperatureImmune
            , minDisplay = habDisplay.temperatureMin
            , maxDisplay = habDisplay.temperatureMax
            , rangeDisplay = habDisplay.temperatureRange
            , barColor = "#ff6b4a"
            , isReadOnly = isReadOnly
            , expandBtn = TemperatureExpandBtn
            , shrinkBtn = TemperatureShrinkBtn
            , leftBtn = TemperatureLeftBtn
            , rightBtn = TemperatureRightBtn
            }

        -- Radiation
        , viewHabRange
            { label = "Radiation"
            , center = config.radiationCenter
            , width = config.radiationWidth
            , immune = config.radiationImmune
            , onCenterChange = UpdateRaceBuilderRadiationCenter
            , onWidthChange = UpdateRaceBuilderRadiationWidth
            , onImmuneChange = UpdateRaceBuilderRadiationImmune
            , minDisplay = habDisplay.radiationMin
            , maxDisplay = habDisplay.radiationMax
            , rangeDisplay = habDisplay.radiationRange
            , barColor = "#4aff6b"
            , isReadOnly = isReadOnly
            , expandBtn = RadiationExpandBtn
            , shrinkBtn = RadiationShrinkBtn
            , leftBtn = RadiationLeftBtn
            , rightBtn = RadiationRightBtn
            }

        -- Growth Rate
        , div [ class "race-builder__hab-section" ]
            [ div [ class "race-builder__hab-header" ]
                [ span [ class "race-builder__hab-label" ] [ text "Growth Rate" ]
                , span [ class "race-builder__hab-value" ] [ text (String.fromInt config.growthRate ++ "%") ]
                ]
            , div [ class "race-builder__growth-slider" ]
                [ span [ class "race-builder__growth-min" ] [ text "1%" ]
                , input
                    [ type_ "range"
                    , class "race-builder__slider"
                    , Html.Attributes.min "1"
                    , Html.Attributes.max "20"
                    , value (String.fromInt config.growthRate)
                    , onInput (String.toInt >> Maybe.withDefault 15 >> UpdateRaceBuilderGrowthRate)
                    , disabled isReadOnly
                    ]
                    []
                , span [ class "race-builder__growth-max" ] [ text "20%" ]
                ]
            ]
        ]


{-| View a habitability range control matching Stars! GUI layout.

Layout:
- Row 1: Label | Bar | Range values (min/to/max stacked)
- Row 2: "<< >>" expand | Immune checkbox | ">> <<" shrink

Hold-to-repeat: Buttons use onMouseDown/onMouseUp to support repeated action while held.

-}
viewHabRange :
    { label : String
    , center : Int
    , width : Int
    , immune : Bool
    , onCenterChange : Int -> Msg
    , onWidthChange : Int -> Msg
    , onImmuneChange : Bool -> Msg
    , minDisplay : String
    , maxDisplay : String
    , rangeDisplay : String
    , barColor : String
    , isReadOnly : Bool
    , expandBtn : HabButton
    , shrinkBtn : HabButton
    , leftBtn : HabButton
    , rightBtn : HabButton
    }
    -> Html Msg
viewHabRange opts =
    let
        minVal =
            Basics.max 0 (opts.center - opts.width)

        maxVal =
            Basics.min 100 (opts.center + opts.width)

        -- Can we expand? (width < 50, since max range is 0-100)
        canExpand =
            opts.width < 50 && not opts.isReadOnly

        -- Can we shrink? (width > 1, minimum range of 2)
        canShrink =
            opts.width > 1 && not opts.isReadOnly

        -- Can we move left? (min > 0)
        canMoveLeft =
            minVal > 0 && not opts.isReadOnly

        -- Can we move right? (max < 100)
        canMoveRight =
            maxVal < 100 && not opts.isReadOnly
    in
    div [ class "race-builder__hab-section" ]
        [ -- Row 1: Label + Bar with move buttons + Range values
          div [ class "race-builder__hab-row" ]
            [ -- Label
              span [ class "race-builder__hab-label" ] [ text opts.label ]

            -- Move left button (hold-to-repeat)
            , button
                [ class "race-builder__hab-btn race-builder__hab-btn--move"
                , disabled (not canMoveLeft || opts.immune)
                , onMouseDown (HabButtonPressed opts.leftBtn)
                , onMouseUp HabButtonReleased
                , onMouseLeave HabButtonReleased
                , title "Move range left (hold to repeat)"
                ]
                [ text "<" ]

            -- Visual bar showing the range (empty when immune, like Stars!)
            , div [ class "race-builder__hab-bar" ]
                [ if opts.immune then
                    -- No bar fill when immune
                    text ""

                  else
                    div
                        [ class "race-builder__hab-bar-fill"
                        , style "left" (String.fromInt minVal ++ "%")
                        , style "width" (String.fromInt (Basics.max 1 (maxVal - minVal)) ++ "%")
                        , style "background-color" opts.barColor
                        ]
                        []
                ]

            -- Move right button (hold-to-repeat)
            , button
                [ class "race-builder__hab-btn race-builder__hab-btn--move"
                , disabled (not canMoveRight || opts.immune)
                , onMouseDown (HabButtonPressed opts.rightBtn)
                , onMouseUp HabButtonReleased
                , onMouseLeave HabButtonReleased
                , title "Move range right (hold to repeat)"
                ]
                [ text ">" ]

            -- Range values stacked (min / to / max)
            , div [ class "race-builder__hab-range-stack" ]
                [ div [ class "race-builder__hab-range-val" ] [ text opts.minDisplay ]
                , div [ class "race-builder__hab-range-to" ] [ text "to" ]
                , div [ class "race-builder__hab-range-val" ] [ text opts.maxDisplay ]
                ]
            ]

        -- Row 2: Expand button | Immune checkbox | Shrink button (hold-to-repeat)
        , div [ class "race-builder__hab-controls" ]
            [ button
                [ class "race-builder__hab-btn"
                , disabled (not canExpand || opts.immune)
                , onMouseDown (HabButtonPressed opts.expandBtn)
                , onMouseUp HabButtonReleased
                , onMouseLeave HabButtonReleased
                , title "Expand range (hold to repeat)"
                ]
                [ text "<< >>" ]
            , label [ class "race-builder__hab-immune" ]
                [ input
                    [ type_ "checkbox"
                    , checked opts.immune
                    , onClick (opts.onImmuneChange (not opts.immune))
                    , disabled opts.isReadOnly
                    ]
                    []
                , text "Immune"
                ]
            , button
                [ class "race-builder__hab-btn"
                , disabled (not canShrink || opts.immune)
                , onMouseDown (HabButtonPressed opts.shrinkBtn)
                , onMouseUp HabButtonReleased
                , onMouseLeave HabButtonReleased
                , title "Shrink range (hold to repeat)"
                ]
                [ text ">> <<" ]
            ]
        ]


{-| Economy tab - matches Stars! race wizard exactly.
-}
viewEconomyTab : RaceConfig -> Bool -> Html Msg
viewEconomyTab config isReadOnly =
    div [ class "race-builder__economy" ]
        [ -- Colonists per Resource
          viewEconomyRow
            { prefix = "One resource is generated each year for every "
            , value = config.colonistsPerResource
            , suffix = " colonists."
            , minVal = 700
            , maxVal = 2500
            , step = 100
            , onChange = UpdateRaceBuilderColonistsPerResource
            , isReadOnly = isReadOnly
            }

        -- Factory settings header
        , h4 [ class "race-builder__section-title" ] [ text "Factories" ]
        , viewEconomyRow
            { prefix = "Every 10 factories produce "
            , value = config.factoryOutput
            , suffix = " resources each year."
            , minVal = 5
            , maxVal = 15
            , step = 1
            , onChange = UpdateRaceBuilderFactoryOutput
            , isReadOnly = isReadOnly
            }
        , viewEconomyRow
            { prefix = "Factories require "
            , value = config.factoryCost
            , suffix = " resources to build."
            , minVal = 5
            , maxVal = 25
            , step = 1
            , onChange = UpdateRaceBuilderFactoryCost
            , isReadOnly = isReadOnly
            }
        , viewEconomyRow
            { prefix = "Every 10,000 colonists may operate up to "
            , value = config.factoryCount
            , suffix = " factories."
            , minVal = 5
            , maxVal = 25
            , step = 1
            , onChange = UpdateRaceBuilderFactoryCount
            , isReadOnly = isReadOnly
            }
        , label [ class "race-builder__checkbox-field" ]
            [ input
                [ type_ "checkbox"
                , checked config.factoriesUseLessGerm
                , onClick (UpdateRaceBuilderFactoriesUseLessGerm (not config.factoriesUseLessGerm))
                , disabled isReadOnly
                ]
                []
            , text " Factories cost 1kT less of Germanium to build"
            ]

        -- Mine settings header
        , h4 [ class "race-builder__section-title" ] [ text "Mines" ]
        , viewEconomyRow
            { prefix = "Every 10 mines produce up to "
            , value = config.mineOutput
            , suffix = " kT of each mineral each year."
            , minVal = 5
            , maxVal = 25
            , step = 1
            , onChange = UpdateRaceBuilderMineOutput
            , isReadOnly = isReadOnly
            }
        , viewEconomyRow
            { prefix = "Mines require "
            , value = config.mineCost
            , suffix = " resources to build."
            , minVal = 2
            , maxVal = 15
            , step = 1
            , onChange = UpdateRaceBuilderMineCost
            , isReadOnly = isReadOnly
            }
        , viewEconomyRow
            { prefix = "Every 10,000 colonists may operate up to "
            , value = config.mineCount
            , suffix = " mines."
            , minVal = 5
            , maxVal = 25
            , step = 1
            , onChange = UpdateRaceBuilderMineCount
            , isReadOnly = isReadOnly
            }
        ]


{-| A single economy setting row with native number input (up/down arrows).
-}
viewEconomyRow :
    { prefix : String
    , value : Int
    , suffix : String
    , minVal : Int
    , maxVal : Int
    , step : Int
    , onChange : Int -> Msg
    , isReadOnly : Bool
    }
    -> Html Msg
viewEconomyRow opts =
    div [ class "race-builder__economy-row" ]
        [ span [ class "race-builder__economy-text" ] [ text opts.prefix ]
        , input
            [ type_ "number"
            , class "race-builder__economy-input"
            , value (String.fromInt opts.value)
            , Html.Attributes.min (String.fromInt opts.minVal)
            , Html.Attributes.max (String.fromInt opts.maxVal)
            , step (String.fromInt opts.step)
            , onInput (String.toInt >> Maybe.withDefault opts.value >> opts.onChange)
            , disabled opts.isReadOnly
            ]
            []
        , span [ class "race-builder__economy-text" ] [ text opts.suffix ]
        ]


{-| Research tab - Stars! style 2x3 grid of research boxes.
-}
viewResearchTab : RaceConfig -> Bool -> Html Msg
viewResearchTab config isReadOnly =
    div [ class "race-builder__research" ]
        [ -- 2x3 grid of research boxes
          div [ class "race-builder__research-grid" ]
            [ viewResearchBox "Energy" config.researchEnergy UpdateRaceBuilderResearchEnergy isReadOnly
            , viewResearchBox "Construction" config.researchConstruction UpdateRaceBuilderResearchConstruction isReadOnly
            , viewResearchBox "Weapons" config.researchWeapons UpdateRaceBuilderResearchWeapons isReadOnly
            , viewResearchBox "Electronics" config.researchElectronics UpdateRaceBuilderResearchElectronics isReadOnly
            , viewResearchBox "Propulsion" config.researchPropulsion UpdateRaceBuilderResearchPropulsion isReadOnly
            , viewResearchBox "Biotechnology" config.researchBiotech UpdateRaceBuilderResearchBiotech isReadOnly
            ]

        -- Techs start high checkbox
        , label [ class "race-builder__checkbox-field" ]
            [ input
                [ type_ "checkbox"
                , checked config.techsStartHigh
                , onClick (UpdateRaceBuilderTechsStartHigh (not config.techsStartHigh))
                , disabled isReadOnly
                ]
                []
            , text "All \"Costs 75% extra\" research fields start at Tech 4"
            ]
        ]


{-| A single research box with title and 3 vertically stacked radio options.
-}
viewResearchBox : String -> Int -> (Int -> Msg) -> Bool -> Html Msg
viewResearchBox fieldName currentLevel onChange isReadOnly =
    fieldset [ class "race-builder__research-box" ]
        [ legend [ class "race-builder__research-title" ] [ text (fieldName ++ " Research") ]
        , label [ class "race-builder__research-option" ]
            [ input
                [ type_ "radio"
                , name ("research-" ++ fieldName)
                , checked (currentLevel == 0)
                , onClick (onChange 0)
                , disabled isReadOnly
                ]
                []
            , text "Costs 75% extra"
            ]
        , label [ class "race-builder__research-option" ]
            [ input
                [ type_ "radio"
                , name ("research-" ++ fieldName)
                , checked (currentLevel == 1)
                , onClick (onChange 1)
                , disabled isReadOnly
                ]
                []
            , text "Costs standard amount"
            ]
        , label [ class "race-builder__research-option" ]
            [ input
                [ type_ "radio"
                , name ("research-" ++ fieldName)
                , checked (currentLevel == 2)
                , onClick (onChange 2)
                , disabled isReadOnly
                ]
                []
            , text "Costs 50% less"
            ]
        ]


{-| Generic radio option for other fields (leftover points, etc.)
-}
viewRadioOption : String -> Int -> Int -> String -> Msg -> Bool -> Html Msg
viewRadioOption groupName optionValue currentValue label_ msg isReadOnly =
    label [ class "race-builder__radio-option" ]
        [ input
            [ type_ "radio"
            , name groupName
            , checked (optionValue == currentValue)
            , onClick msg
            , disabled isReadOnly
            ]
            []
        , text label_
        ]


{-| Footer with action buttons.
-}
viewFooter : RaceBuilderForm -> Html Msg
viewFooter form =
    let
        isViewMode =
            case form.mode of
                ViewMode _ ->
                    True

                EditMode ->
                    False
    in
    div [ class "dialog__footer dialog__footer--right" ]
        [ case form.error of
            Just err ->
                div [ class "dialog__error" ] [ text err ]

            Nothing ->
                text ""
        , button
            [ class "btn btn-secondary"
            , onClick CloseDialog
            ]
            [ text
                (if isViewMode then
                    "Close"

                 else
                    "Cancel"
                )
            ]
        , if isViewMode then
            button
                [ class "btn btn-primary"
                , onClick CreateRaceFromExisting
                ]
                [ text "Create Race from This" ]

          else
            button
                [ class "btn btn-primary"
                , disabled (not form.validation.isValid || form.submitting)
                , onClick SubmitRaceBuilder
                ]
                [ text
                    (if form.submitting then
                        "Creating..."

                     else
                        "Create Race"
                    )
                ]
        ]
