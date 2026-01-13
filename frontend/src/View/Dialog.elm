module View.Dialog exposing (viewDialog)

{-| Dialog router - renders the appropriate dialog based on model state.
-}

import Dict
import Html exposing (..)
import Html.Attributes exposing (..)
import Model exposing (..)
import Msg exposing (Msg(..))
import Set
import Update.Server
import View.Dialog.ApiKey exposing (viewChangeApikeyDialog)
import View.Dialog.Auth exposing (viewConnectDialog, viewRegisterDialog)
import View.Dialog.Bots exposing (viewAddBotDialog)
import View.Dialog.MapViewer exposing (viewMapViewerDialog)
import View.Dialog.SwitchToAI exposing (viewSwitchToAIDialog)
import View.Dialog.RaceBuilder exposing (viewRaceBuilderDialog)
import View.Dialog.Races exposing (viewRacesDialog, viewSetupRaceDialog)
import View.Dialog.Rules exposing (viewRulesDialog)
import View.Dialog.Server exposing (viewAddServerDialog, viewEditServerDialog, viewRemoveServerDialog)
import View.Dialog.Session exposing (viewCreateSessionDialog)
import View.Dialog.Settings exposing (viewSettingsDialog)
import View.Dialog.TurnFiles exposing (viewTurnFilesDialog)
import View.Dialog.Users exposing (viewCreateUserDialog, viewInvitationsDialog, viewInviteUserDialog, viewUsersListDialog)
import View.Helpers exposing (onMouseDownTarget)


{-| Render the active dialog if any.
-}
viewDialog : Model -> Html Msg
viewDialog model =
    let
        serverData =
            getCurrentServerData model
    in
    case model.dialog of
        Nothing ->
            text ""

        Just dialog ->
            div
                [ class "dialog-overlay"
                , onMouseDownTarget "dialog-overlay" (ServerMsg Update.Server.CloseDialog)
                ]
                [ div
                    [ class "dialog"
                    ]
                    [ case dialog of
                        AddServerDialog form ->
                            viewAddServerDialog model.hasDefaultServer form

                        EditServerDialog serverUrl form ->
                            viewEditServerDialog serverUrl form

                        RemoveServerDialog serverUrl _ ->
                            viewRemoveServerDialog serverUrl

                        ConnectDialog serverUrl form ->
                            viewConnectDialog serverUrl form

                        RegisterDialog serverUrl form ->
                            viewRegisterDialog serverUrl form

                        CreateSessionDialog form ->
                            viewCreateSessionDialog form

                        InviteUserDialog form ->
                            viewInviteUserDialog form serverData.userProfiles

                        InvitationsDialog ->
                            viewInvitationsDialog serverData.invitations serverData.sentInvitations

                        RacesDialog errorMsg ->
                            viewRacesDialog errorMsg serverData.races

                        SetupRaceDialog form ->
                            viewSetupRaceDialog form serverData.races

                        RulesDialog form ->
                            viewRulesDialog form

                        TurnFilesDialog form ->
                            let
                                hasConflict =
                                    Dict.get form.sessionId serverData.orderConflicts
                                        |> Maybe.map (Set.member form.year)
                                        |> Maybe.withDefault False
                            in
                            viewTurnFilesDialog form hasConflict

                        SettingsDialog ->
                            viewSettingsDialog model.appSettings model.wineCheckInProgress model.wineCheckMessage model.ntvdmCheckInProgress model.ntvdmCheckResult model.confirmingBrowserStars

                        UsersListDialog state ->
                            viewUsersListDialog state

                        CreateUserDialog form ->
                            viewCreateUserDialog form

                        ChangeApikeyDialog state ->
                            viewChangeApikeyDialog state

                        RaceBuilderDialog form ->
                            viewRaceBuilderDialog form

                        MapViewerDialog form ->
                            viewMapViewerDialog form

                        AddBotDialog form ->
                            viewAddBotDialog form

                        SwitchToAIDialog form ->
                            viewSwitchToAIDialog form
                    ]
                ]
