module View.Dialog.MapViewer exposing (viewMapViewerDialog)

{-| Map viewer dialog for displaying SVG maps of Stars! games.
-}

import Html exposing (..)
import Html.Attributes exposing (..)
import Html.Events exposing (onCheck, onClick, onInput)
import Json.Encode as E
import Model exposing (MapOptions, MapViewerForm)
import Msg exposing (Msg(..))


{-| View the map viewer dialog.
-}
viewMapViewerDialog : MapViewerForm -> Html Msg
viewMapViewerDialog form =
    div [ class "map-viewer-dialog" ]
        [ viewHeader form
        , viewBody form
        , viewFooter form
        ]


{-| Dialog header with title and close button.
-}
viewHeader : MapViewerForm -> Html Msg
viewHeader form =
    div [ class "dialog__header" ]
        [ h2 [ class "dialog__title" ]
            [ text ("Map Viewer - Year " ++ String.fromInt form.year) ]
        , button
            [ class "dialog__close"
            , onClick CloseDialog
            ]
            [ text "\u{00D7}" ]
        ]


{-| Dialog body with options panel and map display.
-}
viewBody : MapViewerForm -> Html Msg
viewBody form =
    div [ class "dialog__body map-viewer-dialog__body" ]
        [ viewOptionsPanel form.options
        , viewMapDisplay form
        ]


{-| Options panel (left side).
-}
viewOptionsPanel : MapOptions -> Html Msg
viewOptionsPanel options =
    div [ class "map-viewer-dialog__options" ]
        [ h3 [ class "map-viewer-dialog__section-title" ] [ text "Resolution" ]
        , viewResolutionOptions options
        , h3 [ class "map-viewer-dialog__section-title" ] [ text "Display Options" ]
        , viewDisplayOptions options
        ]


{-| Resolution options (presets and custom).
-}
viewResolutionOptions : MapOptions -> Html Msg
viewResolutionOptions options =
    div [ class "map-viewer-dialog__resolution" ]
        [ div [ class "map-viewer-dialog__presets" ]
            [ label [] [ text "Preset:" ]
            , select [ onInput SelectMapPreset ]
                [ option [ value "800x600", selected (options.width == 800 && options.height == 600) ] [ text "800 x 600" ]
                , option [ value "1024x768", selected (options.width == 1024 && options.height == 768) ] [ text "1024 x 768" ]
                , option [ value "1920x1080", selected (options.width == 1920 && options.height == 1080) ] [ text "1920 x 1080 (Full HD)" ]
                , option [ value "2560x1440", selected (options.width == 2560 && options.height == 1440) ] [ text "2560 x 1440 (2K)" ]
                , option [ value "custom" ] [ text "Custom" ]
                ]
            ]
        , div [ class "map-viewer-dialog__custom-size" ]
            [ label [] [ text "Width:" ]
            , input
                [ type_ "number"
                , value (String.fromInt options.width)
                , onInput UpdateMapWidth
                , Html.Attributes.min "400"
                , Html.Attributes.max "4096"
                ]
                []
            , label [] [ text "Height:" ]
            , input
                [ type_ "number"
                , value (String.fromInt options.height)
                , onInput UpdateMapHeight
                , Html.Attributes.min "300"
                , Html.Attributes.max "4096"
                ]
                []
            ]
        ]


{-| Display options (checkboxes).
-}
viewDisplayOptions : MapOptions -> Html Msg
viewDisplayOptions options =
    div [ class "map-viewer-dialog__display-options" ]
        [ viewCheckbox "Show planet names" options.showNames ToggleShowNames
        , viewCheckbox "Show fleets" options.showFleets ToggleShowFleets
        , viewFleetPathsInput options.showFleetPaths
        , viewCheckbox "Show minefields" options.showMines ToggleShowMines
        , viewCheckbox "Show wormholes" options.showWormholes ToggleShowWormholes
        , viewCheckbox "Show legend" options.showLegend ToggleShowLegend
        , viewCheckbox "Show scanner coverage" options.showScannerCoverage ToggleShowScannerCoverage
        ]


{-| Single checkbox with label.
-}
viewCheckbox : String -> Bool -> Msg -> Html Msg
viewCheckbox labelText isChecked msg =
    label [ class "map-viewer-dialog__checkbox" ]
        [ input
            [ type_ "checkbox"
            , checked isChecked
            , onClick msg
            ]
            []
        , text labelText
        ]


{-| Fleet paths input (number of years).
-}
viewFleetPathsInput : Int -> Html Msg
viewFleetPathsInput years =
    div [ class "map-viewer-dialog__fleet-paths" ]
        [ label [] [ text "Fleet paths (years):" ]
        , input
            [ type_ "number"
            , value (String.fromInt years)
            , onInput UpdateShowFleetPaths
            , Html.Attributes.min "0"
            , Html.Attributes.max "10"
            , placeholder "0 = off"
            ]
            []
        ]


{-| Map display area (right side).
-}
viewMapDisplay : MapViewerForm -> Html Msg
viewMapDisplay form =
    div [ class "map-viewer-dialog__display" ]
        [ case form.error of
            Just err ->
                div [ class "dialog__error" ] [ text err ]

            Nothing ->
                text ""
        , case form.generatedSvg of
            Just svg ->
                div [ class "map-viewer-dialog__svg-container" ]
                    [ Html.node "iframe"
                        [ id "map-viewer-frame"
                        , attribute "srcdoc" (wrapSvgInHtml svg)
                        , class "map-viewer-dialog__svg-frame"
                        ]
                        []
                    , button
                        [ class "map-viewer-dialog__fullscreen-btn"
                        , onClick ToggleMapFullscreen
                        , title "View fullscreen"
                        ]
                        [ text "⛶" ]
                    ]

            Nothing ->
                div [ class "map-viewer-dialog__placeholder" ]
                    [ text "Click \"Generate Map\" to create the map" ]
        ]


{-| Wrap SVG content in an HTML document with centering styles.
-}
wrapSvgInHtml : String -> String
wrapSvgInHtml svg =
    """<!DOCTYPE html>
<html>
<head>
<style>
html, body {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    background: #1a1a2e;
}
body {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100%;
}
svg {
    max-width: 100%;
    max-height: 100%;
}
</style>
</head>
<body>
""" ++ svg ++ """
</body>
</html>"""


{-| Dialog footer with action buttons.
-}
viewFooter : MapViewerForm -> Html Msg
viewFooter form =
    div [ class "dialog__footer" ]
        [ div [ class "dialog__actions" ]
            [ button
                [ class "btn btn--primary"
                , onClick GenerateMap
                , disabled form.generating
                ]
                [ text
                    (if form.generating then
                        "Generating..."

                     else
                        "Generate Map"
                    )
                ]
            , case form.generatedSvg of
                Just _ ->
                    button
                        [ class "btn btn--secondary"
                        , onClick SaveMap
                        , disabled form.saving
                        ]
                        [ text
                            (if form.saving then
                                "Saving..."

                             else
                                "Save SVG"
                            )
                        ]

                Nothing ->
                    text ""
            , button
                [ class "btn"
                , onClick CloseDialog
                ]
                [ text "Close" ]
            ]
        ]
