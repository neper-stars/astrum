module View.Dialog.Races exposing
    ( viewRacesDialog
    , viewSetupRaceDialog
    )

{-| Race-related dialogs: races list and setup race for session.
-}

import Api.Race exposing (Race)
import Html exposing (..)
import Html.Attributes exposing (..)
import Html.Events exposing (..)
import Model exposing (RaceBuilderOrigin(..), SetupRaceForm)
import Msg exposing (Msg(..))
import View.Helpers exposing (viewFormError)


{-| Dialog showing the user's uploaded races.
-}
viewRacesDialog : Maybe String -> List Race -> Html Msg
viewRacesDialog errorMsg races =
    div []
        [ div [ class "dialog__header" ]
            [ h2 [ class "dialog__title" ] [ text "My Races" ]
            , button
                [ class "dialog__close"
                , onClick CloseDialog
                ]
                [ text "x" ]
            ]
        , div [ class "dialog__body" ]
            [ case errorMsg of
                Just err ->
                    div [ class "dialog__error" ]
                        [ text err ]

                Nothing ->
                    text ""
            , div [ class "races-dialog__actions" ]
                [ button
                    [ class "btn btn-primary"
                    , onClick (OpenRaceBuilder FromRacesDialog)
                    ]
                    [ text "Create Race" ]
                , button
                    [ class "btn btn-secondary"
                    , onClick UploadRace
                    ]
                    [ text "Upload Race" ]
                ]
            , if List.isEmpty races then
                div [ class "races-dialog__empty" ]
                    [ text "No races uploaded yet" ]

              else
                div [ class "races-dialog__list" ]
                    (List.map viewRaceCard races)
            ]
        , div [ class "dialog__footer dialog__footer--right" ]
            [ button
                [ class "btn btn-secondary"
                , onClick CloseDialog
                ]
                [ text "Close" ]
            ]
        ]


viewRaceCard : Race -> Html Msg
viewRaceCard race =
    div [ class "race-card" ]
        [ div [ class "race-card__info" ]
            [ div [ class "race-card__name" ]
                [ text race.namePlural ]
            , div [ class "race-card__singular" ]
                [ text ("Singular: " ++ race.nameSingular) ]
            ]
        , div [ class "race-card__actions" ]
            [ button
                [ class "btn btn--secondary btn--sm"
                , onClick (ViewRaceInBuilder race.id race.namePlural)
                , title "View race details"
                ]
                [ text "View" ]
            , button
                [ class "btn btn--secondary btn--sm"
                , onClick (DownloadRace race.id)
                , title "Download race file"
                ]
                [ text "Download" ]
            , button
                [ class "btn btn--danger btn--sm"
                , onClick (DeleteRace race.id)
                , title "Delete race"
                ]
                [ text "Delete" ]
            ]
        ]


{-| Dialog for selecting a race to use in a session.
-}
viewSetupRaceDialog : SetupRaceForm -> List Race -> Html Msg
viewSetupRaceDialog form races =
    div []
        [ div [ class "dialog__header" ]
            [ h2 [ class "dialog__title" ] [ text "Setup My Race" ]
            , button
                [ class "dialog__close"
                , onClick CloseDialog
                ]
                [ text "x" ]
            ]
        , div [ class "dialog__body" ]
            [ viewFormError form.error
            , p [ class "setup-race-dialog__description" ]
                [ text "Select a race from your profile to use in this session, or upload a new one." ]
            , div [ class "setup-race-dialog__actions" ]
                [ button
                    [ class "btn btn-primary"
                    , onClick (OpenRaceBuilder (FromSetupRaceDialog form.sessionId))
                    ]
                    [ text "Create New Race" ]
                , button
                    [ class "btn btn-secondary"
                    , onClick UploadAndSetRace
                    ]
                    [ text "Upload Race" ]
                ]
            , if List.isEmpty races then
                div [ class "setup-race-dialog__empty" ]
                    [ text "No races in your profile. Upload a race file to get started." ]

              else
                div [ class "setup-race-dialog__list" ]
                    (List.map (viewSetupRaceOption form.selectedRaceId) races)
            ]
        , div [ class "dialog__footer dialog__footer--right" ]
            [ button
                [ class "btn btn-secondary"
                , onClick CloseDialog
                ]
                [ text "Cancel" ]
            , button
                [ class "btn btn-primary"
                , disabled (form.selectedRaceId == Nothing || form.submitting)
                , onClick SubmitSetupRace
                ]
                [ text
                    (if form.submitting then
                        "Setting up..."

                     else
                        "Use This Race"
                    )
                ]
            ]
        ]


viewSetupRaceOption : Maybe String -> Race -> Html Msg
viewSetupRaceOption selectedRaceId race =
    let
        isSelected =
            selectedRaceId == Just race.id
    in
    div
        [ class "setup-race-dialog__race"
        , classList [ ( "is-selected", isSelected ) ]
        , onClick (SelectRaceForSession race.id)
        ]
        [ div [ class "setup-race-dialog__race-name" ]
            [ text race.namePlural ]
        , div [ class "setup-race-dialog__race-singular" ]
            [ text ("Singular: " ++ race.nameSingular) ]
        ]
