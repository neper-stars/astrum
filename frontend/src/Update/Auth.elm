module Update.Auth exposing
    ( handleConnectResult
    , handleDisconnect
    , handleDisconnectResult
    , handleRegisterResult
    , handleSubmitConnect
    , handleSubmitRegister
    , handleSwitchToConnect
    , handleSwitchToRegister
    , handleUpdateConnectPassword
    , handleUpdateConnectUsername
    , handleUpdateRegisterEmail
    , handleUpdateRegisterMessage
    , handleUpdateRegisterNickname
    )

{-| Update handlers for authentication-related messages.

Handles connect/register forms, login/logout, and authentication results.

-}

import Api.Encode as Encode
import Model exposing (..)
import Msg exposing (Msg)
import Ports
import Update.Helpers exposing (setConnectionState, updateConnectForm, updateDialogError, updateRegisterForm)



-- =============================================================================
-- FORM UPDATES
-- =============================================================================


{-| Update connect form username field.
-}
handleUpdateConnectUsername : Model -> String -> ( Model, Cmd Msg )
handleUpdateConnectUsername model username =
    ( updateConnectForm model (\form -> { form | username = username })
    , Cmd.none
    )


{-| Update connect form password field.
-}
handleUpdateConnectPassword : Model -> String -> ( Model, Cmd Msg )
handleUpdateConnectPassword model password =
    ( updateConnectForm model (\form -> { form | password = password })
    , Cmd.none
    )


{-| Update register form nickname field.
-}
handleUpdateRegisterNickname : Model -> String -> ( Model, Cmd Msg )
handleUpdateRegisterNickname model nickname =
    ( updateRegisterForm model (\form -> { form | nickname = nickname })
    , Cmd.none
    )


{-| Update register form email field.
-}
handleUpdateRegisterEmail : Model -> String -> ( Model, Cmd Msg )
handleUpdateRegisterEmail model email =
    ( updateRegisterForm model (\form -> { form | email = email })
    , Cmd.none
    )


{-| Update register form message field.
-}
handleUpdateRegisterMessage : Model -> String -> ( Model, Cmd Msg )
handleUpdateRegisterMessage model message =
    ( updateRegisterForm model (\form -> { form | message = message })
    , Cmd.none
    )



-- =============================================================================
-- DIALOG SWITCHING
-- =============================================================================


{-| Switch from connect dialog to register dialog.
-}
handleSwitchToRegister : Model -> ( Model, Cmd Msg )
handleSwitchToRegister model =
    case model.dialog of
        Just (ConnectDialog serverUrl _) ->
            ( { model | dialog = Just (RegisterDialog serverUrl emptyRegisterForm) }
            , Cmd.none
            )

        _ ->
            ( model, Cmd.none )


{-| Switch from register dialog to connect dialog.
-}
handleSwitchToConnect : Model -> ( Model, Cmd Msg )
handleSwitchToConnect model =
    case model.dialog of
        Just (RegisterDialog serverUrl _) ->
            ( { model | dialog = Just (ConnectDialog serverUrl emptyConnectForm) }
            , Cmd.none
            )

        _ ->
            ( model, Cmd.none )



-- =============================================================================
-- AUTHENTICATION ACTIONS
-- =============================================================================


{-| Submit connect form.
-}
handleSubmitConnect : Model -> String -> ( Model, Cmd Msg )
handleSubmitConnect model serverUrl =
    case model.dialog of
        Just (ConnectDialog _ form) ->
            if String.isEmpty form.username || String.isEmpty form.password then
                ( updateDialogError model "Username and password are required"
                , Cmd.none
                )

            else
                ( updateConnectForm
                    (setConnectionState serverUrl Connecting model)
                    (\f -> { f | submitting = True, error = Nothing })
                , Ports.connect (Encode.connect serverUrl form.username form.password)
                )

        _ ->
            ( model, Cmd.none )


{-| Submit register form.
-}
handleSubmitRegister : Model -> String -> ( Model, Cmd Msg )
handleSubmitRegister model serverUrl =
    case model.dialog of
        Just (RegisterDialog _ form) ->
            if String.isEmpty form.nickname || String.isEmpty form.email then
                ( updateDialogError model "Nickname and email are required"
                , Cmd.none
                )

            else
                ( updateRegisterForm model (\f -> { f | submitting = True, error = Nothing })
                , Ports.register (Encode.register serverUrl form.nickname form.email form.message)
                )

        _ ->
            ( model, Cmd.none )


{-| Handle connect result from backend.
-}
handleConnectResult : Model -> String -> Result String { username : String, userId : String, isManager : Bool, serialKey : String } -> ( Model, Cmd Msg )
handleConnectResult model serverUrl result =
    case result of
        Ok info ->
            let
                -- Base commands for all users
                baseCmds =
                    [ Ports.getSessions serverUrl
                    , Ports.getInvitations serverUrl
                    , Ports.getSentInvitations serverUrl
                    , Ports.getUserProfiles serverUrl
                    ]

                -- Add pending registrations fetch for managers
                allCmds =
                    if info.isManager then
                        baseCmds ++ [ Ports.getPendingRegistrations serverUrl ]

                    else
                        baseCmds
            in
            ( { model | dialog = Nothing }
                |> setConnectionState serverUrl (Connected { username = info.username, userId = info.userId, isManager = info.isManager, serialKey = info.serialKey })
            , Cmd.batch allCmds
            )

        Err err ->
            let
                modelWithError =
                    setConnectionState serverUrl (ConnectionError err) model
            in
            case model.dialog of
                Just (ConnectDialog _ _) ->
                    -- Dialog is open, update it with error
                    ( updateConnectForm modelWithError
                        (\f -> { f | submitting = False, error = Just err })
                    , Cmd.none
                    )

                Nothing ->
                    -- No dialog (auto-connect failed), show connect dialog with error
                    let
                        -- Pre-fill username if server has saved credentials
                        form =
                            case getServerByUrl serverUrl model.servers of
                                Just server ->
                                    { emptyConnectForm
                                        | username = Maybe.withDefault "" server.defaultUsername
                                        , error = Just err
                                    }

                                Nothing ->
                                    { emptyConnectForm | error = Just err }
                    in
                    ( { modelWithError
                        | dialog = Just (ConnectDialog serverUrl form)
                      }
                    , Cmd.none
                    )

                _ ->
                    -- Some other dialog is open, just update connection state
                    ( modelWithError, Cmd.none )


{-| Handle register result from backend.
-}
handleRegisterResult : Model -> String -> Result String { userId : String, nickname : String, pending : Bool } -> ( Model, Cmd Msg )
handleRegisterResult model _ result =
    case result of
        Ok regResult ->
            -- API key is saved, show success message
            -- Auto-connect will happen when user closes the dialog (serverUrl is in the dialog)
            -- If pending, user can create races but not join/create sessions
            ( updateRegisterForm model
                (\f ->
                    { f
                        | submitting = False
                        , success = True
                        , pending = regResult.pending
                    }
                )
            , Cmd.none
            )

        Err err ->
            ( updateRegisterForm model (\f -> { f | submitting = False, error = Just err })
            , Cmd.none
            )


{-| Handle disconnect request.
-}
handleDisconnect : Model -> String -> ( Model, Cmd Msg )
handleDisconnect model serverUrl =
    ( { model
        | showUserMenu = False
        , contextMenu = Nothing
      }
    , Ports.disconnect serverUrl
    )


{-| Handle disconnect result from backend.
-}
handleDisconnectResult : Model -> String -> Result String () -> ( Model, Cmd Msg )
handleDisconnectResult model serverUrl result =
    case result of
        Ok _ ->
            ( { model
                | selectedSessionId = Nothing
                , sessionDetail = Nothing
                , showUserMenu = False
                , serverData =
                    updateServerData serverUrl
                        (\_ -> emptyServerData)
                        model.serverData
              }
            , Cmd.none
            )

        Err err ->
            ( { model | error = Just err }
            , Cmd.none
            )
