module Update.Helpers exposing
    ( clearMapContent
    , insertAt
    , moveItem
    , removeSessionTurn
    , setConnectionState
    , storeSessionTurn
    , updateConnectForm
    , updateCreateSessionForm
    , updateDialogError
    , updateInviteForm
    , updateMapOptions
    , updateMapViewerForm
    , updateRegisterForm
    , updateRulesForm
    , updateRules
    , updateServerForm
    , updateSetupRaceForm
    , updateRaceBuilderForm
    )

{-| Shared helper functions for Update modules.

These helpers handle common patterns like updating forms in dialogs,
managing server data, and list manipulation.

-}

import Api.Rules exposing (Rules)
import Api.TurnFiles exposing (TurnFiles)
import Dict
import Model exposing (..)


-- =============================================================================
-- LIST HELPERS
-- =============================================================================


{-| Move an item in a list from one index to another.
-}
moveItem : Int -> Int -> List a -> List a
moveItem fromIndex toIndex list =
    let
        item =
            List.drop fromIndex list |> List.head
    in
    case item of
        Just movedItem ->
            list
                |> List.indexedMap Tuple.pair
                |> List.filter (\( i, _ ) -> i /= fromIndex)
                |> List.map Tuple.second
                |> insertAt toIndex movedItem

        Nothing ->
            list


{-| Insert an item at a specific index in a list.
-}
insertAt : Int -> a -> List a -> List a
insertAt index item list =
    List.take index list ++ [ item ] ++ List.drop index list



-- =============================================================================
-- CONNECTION STATE HELPERS
-- =============================================================================


{-| Set connection state for a server in the serverData dict.
-}
setConnectionState : String -> ConnectionState -> Model -> Model
setConnectionState serverUrl state model =
    { model
        | serverData =
            updateServerData serverUrl
                (\sd -> { sd | connectionState = state })
                model.serverData
    }



-- =============================================================================
-- TURN FILE HELPERS
-- =============================================================================


{-| Store turn files for a session/year, or remove a year's turn.
-}
storeSessionTurn : String -> String -> Maybe TurnFiles -> Model -> Model
storeSessionTurn serverUrl sessionId maybeTurnFiles model =
    { model
        | serverData =
            updateServerData serverUrl
                (\sd ->
                    let
                        currentTurns =
                            Dict.get sessionId sd.sessionTurns
                                |> Maybe.withDefault Dict.empty

                        newTurns =
                            case maybeTurnFiles of
                                Just turnFiles ->
                                    Dict.insert turnFiles.year turnFiles currentTurns

                                Nothing ->
                                    currentTurns
                    in
                    { sd | sessionTurns = Dict.insert sessionId newTurns sd.sessionTurns }
                )
                model.serverData
    }


{-| Remove a turn year from the session turns.
-}
removeSessionTurn : String -> String -> Int -> Model -> Model
removeSessionTurn serverUrl sessionId year model =
    { model
        | serverData =
            updateServerData serverUrl
                (\sd ->
                    let
                        currentTurns =
                            Dict.get sessionId sd.sessionTurns
                                |> Maybe.withDefault Dict.empty

                        newTurns =
                            Dict.remove year currentTurns
                    in
                    { sd | sessionTurns = Dict.insert sessionId newTurns sd.sessionTurns }
                )
                model.serverData
    }



-- =============================================================================
-- FORM UPDATE HELPERS
-- =============================================================================


{-| Update a server form in the current dialog.
-}
updateServerForm : Model -> (ServerForm -> ServerForm) -> Model
updateServerForm model updater =
    case model.dialog of
        Just (AddServerDialog form) ->
            { model | dialog = Just (AddServerDialog (updater form)) }

        Just (EditServerDialog url form) ->
            { model | dialog = Just (EditServerDialog url (updater form)) }

        _ ->
            model


{-| Update the connect form in the current dialog.
-}
updateConnectForm : Model -> (ConnectForm -> ConnectForm) -> Model
updateConnectForm model updater =
    case model.dialog of
        Just (ConnectDialog url form) ->
            { model | dialog = Just (ConnectDialog url (updater form)) }

        _ ->
            model


{-| Update the register form in the current dialog.
-}
updateRegisterForm : Model -> (RegisterForm -> RegisterForm) -> Model
updateRegisterForm model updater =
    case model.dialog of
        Just (RegisterDialog url form) ->
            { model | dialog = Just (RegisterDialog url (updater form)) }

        _ ->
            model


{-| Update the create session form in the current dialog.
-}
updateCreateSessionForm : Model -> (Model.CreateSessionForm -> Model.CreateSessionForm) -> Model
updateCreateSessionForm model updater =
    case model.dialog of
        Just (CreateSessionDialog form) ->
            { model | dialog = Just (CreateSessionDialog (updater form)) }

        _ ->
            model


{-| Update invite form helper.
-}
updateInviteForm : Model -> (InviteForm -> InviteForm) -> Model
updateInviteForm model updater =
    case model.dialog of
        Just (InviteUserDialog form) ->
            { model | dialog = Just (InviteUserDialog (updater form)) }

        _ ->
            model


{-| Update setup race form helper.
-}
updateSetupRaceForm : Model -> (SetupRaceForm -> SetupRaceForm) -> Model
updateSetupRaceForm model updater =
    case model.dialog of
        Just (SetupRaceDialog form) ->
            { model | dialog = Just (SetupRaceDialog (updater form)) }

        _ ->
            model


{-| Update rules form helper.
-}
updateRulesForm : Model -> (RulesForm -> RulesForm) -> Model
updateRulesForm model updater =
    case model.dialog of
        Just (RulesDialog form) ->
            { model | dialog = Just (RulesDialog (updater form)) }

        _ ->
            model


{-| Update rules within the rules form.
-}
updateRules : Model -> (Rules -> Rules) -> Model
updateRules model rulesUpdater =
    updateRulesForm model
        (\form -> { form | rules = rulesUpdater form.rules })


{-| Update map viewer form helper.
-}
updateMapViewerForm : Model -> (MapViewerForm -> MapViewerForm) -> Model
updateMapViewerForm model updater =
    case model.dialog of
        Just (MapViewerDialog form) ->
            { model | dialog = Just (MapViewerDialog (updater form)) }

        _ ->
            model


{-| Update map options within the map viewer form.
-}
updateMapOptions : Model -> (MapOptions -> MapOptions) -> Model
updateMapOptions model optionsUpdater =
    updateMapViewerForm model
        (\form -> { form | options = optionsUpdater form.options })


{-| Clear generated map content when format changes.
-}
clearMapContent : Model -> Model
clearMapContent model =
    updateMapViewerForm model
        (\form -> { form | generatedSvg = Nothing, generatedGif = Nothing, error = Nothing })


{-| Update race builder form helper.
-}
updateRaceBuilderForm : Model -> (RaceBuilderForm -> RaceBuilderForm) -> Model
updateRaceBuilderForm model updater =
    case model.dialog of
        Just (RaceBuilderDialog form) ->
            { model | dialog = Just (RaceBuilderDialog (updater form)) }

        _ ->
            model


{-| Set error on the current dialog form.
-}
updateDialogError : Model -> String -> Model
updateDialogError model err =
    case model.dialog of
        Just (AddServerDialog form) ->
            { model | dialog = Just (AddServerDialog { form | error = Just err, submitting = False }) }

        Just (EditServerDialog url form) ->
            { model | dialog = Just (EditServerDialog url { form | error = Just err, submitting = False }) }

        Just (ConnectDialog url form) ->
            { model | dialog = Just (ConnectDialog url { form | error = Just err, submitting = False }) }

        Just (RegisterDialog url form) ->
            { model | dialog = Just (RegisterDialog url { form | error = Just err, submitting = False }) }

        Just (CreateSessionDialog form) ->
            { model | dialog = Just (CreateSessionDialog { form | error = Just err, submitting = False }) }

        Just (InviteUserDialog form) ->
            { model | dialog = Just (InviteUserDialog { form | error = Just err, submitting = False }) }

        Just (SetupRaceDialog form) ->
            { model | dialog = Just (SetupRaceDialog { form | error = Just err, submitting = False }) }

        Just (RulesDialog form) ->
            { model | dialog = Just (RulesDialog { form | error = Just err, submitting = False }) }

        _ ->
            model
