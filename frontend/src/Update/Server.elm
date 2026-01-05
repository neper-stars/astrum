module Update.Server exposing
    ( handleAddDefaultServer
    , handleCloseDialog
    , handleConfirmRemoveServer
    , handleDefaultServerAdded
    , handleGotHasDefaultServer
    , handleGotServers
    , handleOpenAddServerDialog
    , handleOpenEditServerDialog
    , handleOpenRemoveServerDialog
    , handleSelectServer
    , handleServerAdded
    , handleServerRemoved
    , handleServerUpdated
    , handleShowContextMenu
    , handleHideContextMenu
    , handleSubmitAddServer
    , handleSubmitEditServer
    , handleUpdateServerFormName
    , handleUpdateServerFormUrl
    )

{-| Update handlers for server management messages.

Handles server CRUD, selection, and context menus.

-}

import Api.Encode as Encode
import Api.Server exposing (Server)
import Api.Session
import Model exposing (..)
import Msg exposing (Msg)
import Ports
import Update.Helpers exposing (updateDialogError, updateServerForm)



-- =============================================================================
-- SERVER LIST
-- =============================================================================


{-| Handle servers list result from backend.
-}
handleGotServers : Model -> Result String (List Server) -> ( Model, Cmd Msg )
handleGotServers model result =
    case result of
        Ok servers ->
            ( { model
                | servers = servers
                , loading = False
                , error = Nothing
              }
            , Ports.getAppSettings ()
            )

        Err err ->
            ( { model
                | loading = False
                , error = Just err
              }
            , Cmd.none
            )


{-| Handle server selection.
-}
handleSelectServer : Model -> String -> ( Model, Cmd Msg )
handleSelectServer model serverUrl =
    let
        -- Save current session detail to previous server's lastViewedSession
        serverDataWithSavedView =
            case ( model.selectedServerUrl, model.sessionDetail ) of
                ( Just prevServerUrl, Just detail ) ->
                    updateServerData prevServerUrl
                        (\sd -> { sd | lastViewedSession = Just detail.sessionId })
                        model.serverData

                ( Just prevServerUrl, Nothing ) ->
                    -- Clear lastViewedSession if we're on session list
                    updateServerData prevServerUrl
                        (\sd -> { sd | lastViewedSession = Nothing })
                        model.serverData

                _ ->
                    model.serverData

        -- Get the new server's data to check for lastViewedSession
        newServerData =
            getServerData serverUrl serverDataWithSavedView

        -- Try to restore session detail if lastViewedSession exists and session is still valid
        ( restoredSessionDetail, restoredSelectedSessionId ) =
            case newServerData.lastViewedSession of
                Just sessionId ->
                    -- Check if session still exists
                    case List.filter (\s -> s.id == sessionId) newServerData.sessions |> List.head of
                        Just session ->
                            ( Just
                                { sessionId = sessionId
                                , showInviteDialog = False
                                , dragState = Nothing
                                , playersExpanded = not (Api.Session.isStarted session)
                                }
                            , Just sessionId
                            )

                        Nothing ->
                            -- Session was deleted, clear the lastViewedSession
                            ( Nothing, Nothing )

                Nothing ->
                    ( Nothing, Nothing )

        -- If session was deleted, update serverData to clear lastViewedSession
        finalServerData =
            case ( newServerData.lastViewedSession, restoredSessionDetail ) of
                ( Just _, Nothing ) ->
                    -- Session was deleted, clear it
                    updateServerData serverUrl
                        (\sd -> { sd | lastViewedSession = Nothing })
                        serverDataWithSavedView

                _ ->
                    serverDataWithSavedView

        newModel =
            { model
                | selectedServerUrl = Just serverUrl
                , contextMenu = Nothing
                , selectedSessionId = restoredSelectedSessionId
                , sessionDetail = restoredSessionDetail
                , serverData = finalServerData
            }

        maybeServer =
            getServerByUrl serverUrl model.servers
    in
    if isConnected serverUrl model.serverData then
        -- Already connected, just switch view (data is kept up-to-date via notifications)
        ( newModel
        , Cmd.none
        )

    else
        -- Not connected, check if we have saved credentials
        case maybeServer of
            Just server ->
                if server.hasCredentials then
                    -- Try auto-connect with saved credentials
                    ( { newModel
                        | serverData =
                            updateServerData serverUrl
                                (\sd -> { sd | connectionState = Connecting })
                                newModel.serverData
                      }
                    , Ports.autoConnect serverUrl
                    )

                else
                    -- No credentials, show connect dialog
                    ( { newModel
                        | dialog = Just (ConnectDialog serverUrl emptyConnectForm)
                      }
                    , Cmd.none
                    )

            Nothing ->
                -- Server not found, show connect dialog anyway
                ( { newModel
                    | dialog = Just (ConnectDialog serverUrl emptyConnectForm)
                  }
                , Cmd.none
                )



-- =============================================================================
-- SERVER CRUD RESULTS
-- =============================================================================


{-| Handle server added result.
-}
handleServerAdded : Model -> Result String Server -> ( Model, Cmd Msg )
handleServerAdded model result =
    case result of
        Ok _ ->
            ( { model | dialog = Nothing }
            , Ports.getServers ()
            )

        Err err ->
            ( updateDialogError model err
            , Cmd.none
            )


{-| Handle server updated result.
-}
handleServerUpdated : Model -> Result String () -> ( Model, Cmd Msg )
handleServerUpdated model result =
    case result of
        Ok _ ->
            ( { model | dialog = Nothing }
            , Ports.getServers ()
            )

        Err err ->
            ( updateDialogError model err
            , Cmd.none
            )


{-| Handle server removed result.
-}
handleServerRemoved : Model -> Result String () -> ( Model, Cmd Msg )
handleServerRemoved model result =
    case result of
        Ok _ ->
            ( { model
                | dialog = Nothing
                , selectedServerUrl = Nothing
              }
            , Cmd.batch [ Ports.getServers (), Ports.hasDefaultServer () ]
            )

        Err err ->
            ( { model | error = Just err }
            , Cmd.none
            )


{-| Handle has default server check result.
-}
handleGotHasDefaultServer : Model -> Result String Bool -> ( Model, Cmd Msg )
handleGotHasDefaultServer model result =
    case result of
        Ok hasDefault ->
            ( { model | hasDefaultServer = hasDefault }
            , Cmd.none
            )

        Err _ ->
            ( model, Cmd.none )


{-| Handle add default server request.
-}
handleAddDefaultServer : Model -> ( Model, Cmd Msg )
handleAddDefaultServer model =
    ( model, Ports.addDefaultServer () )


{-| Handle default server added result.
-}
handleDefaultServerAdded : Model -> Result String Server -> ( Model, Cmd Msg )
handleDefaultServerAdded model result =
    case result of
        Ok server ->
            ( { model
                | servers = model.servers ++ [ server ]
                , hasDefaultServer = True
                , dialog = Nothing
              }
            , Cmd.none
            )

        Err err ->
            ( updateDialogError model err
            , Cmd.none
            )



-- =============================================================================
-- SERVER DIALOGS
-- =============================================================================


{-| Open add server dialog.
-}
handleOpenAddServerDialog : Model -> ( Model, Cmd Msg )
handleOpenAddServerDialog model =
    ( { model | dialog = Just (AddServerDialog emptyServerForm) }
    , Ports.hasDefaultServer ()
    )


{-| Open edit server dialog.
-}
handleOpenEditServerDialog : Model -> String -> ( Model, Cmd Msg )
handleOpenEditServerDialog model serverUrl =
    case getServerByUrl serverUrl model.servers of
        Just server ->
            ( { model
                | dialog =
                    Just
                        (EditServerDialog serverUrl
                            { name = server.name
                            , url = server.url
                            , originalName = Just server.name
                            , error = Nothing
                            , submitting = False
                            }
                        )
                , contextMenu = Nothing
              }
            , Cmd.none
            )

        Nothing ->
            ( model, Cmd.none )


{-| Open remove server dialog.
-}
handleOpenRemoveServerDialog : Model -> String -> String -> ( Model, Cmd Msg )
handleOpenRemoveServerDialog model serverUrl serverName =
    ( { model
        | dialog = Just (RemoveServerDialog serverUrl serverName)
        , contextMenu = Nothing
      }
    , Cmd.none
    )


{-| Handle dialog close.
-}
handleCloseDialog : Model -> ( Model, Cmd Msg )
handleCloseDialog model =
    -- Check if we're closing a successful registration dialog
    -- If so, trigger auto-connect
    case model.dialog of
        Just (RegisterDialog serverUrl form) ->
            if form.success then
                ( { model | dialog = Nothing }
                , Ports.autoConnect serverUrl
                )

            else
                ( { model | dialog = Nothing }
                , Cmd.none
                )

        _ ->
            ( { model | dialog = Nothing }
            , Cmd.none
            )



-- =============================================================================
-- SERVER FORM UPDATES
-- =============================================================================


{-| Update server form name field.
-}
handleUpdateServerFormName : Model -> String -> ( Model, Cmd Msg )
handleUpdateServerFormName model name =
    ( updateServerForm model (\form -> { form | name = name })
    , Cmd.none
    )


{-| Update server form URL field.
-}
handleUpdateServerFormUrl : Model -> String -> ( Model, Cmd Msg )
handleUpdateServerFormUrl model url =
    ( updateServerForm model (\form -> { form | url = url })
    , Cmd.none
    )


{-| Submit add server form.
-}
handleSubmitAddServer : Model -> ( Model, Cmd Msg )
handleSubmitAddServer model =
    case model.dialog of
        Just (AddServerDialog form) ->
            if String.isEmpty form.name || String.isEmpty form.url then
                ( updateDialogError model "Name and URL are required"
                , Cmd.none
                )

            else
                ( updateServerForm model (\f -> { f | submitting = True, error = Nothing })
                , Ports.addServer (Encode.addServer form.name form.url)
                )

        _ ->
            ( model, Cmd.none )


{-| Submit edit server form.
-}
handleSubmitEditServer : Model -> String -> ( Model, Cmd Msg )
handleSubmitEditServer model oldUrl =
    case model.dialog of
        Just (EditServerDialog _ form) ->
            if String.isEmpty form.name || String.isEmpty form.url then
                ( updateDialogError model "Name and URL are required"
                , Cmd.none
                )

            else
                ( updateServerForm model (\f -> { f | submitting = True, error = Nothing })
                , Ports.updateServer (Encode.updateServer oldUrl form.name form.url)
                )

        _ ->
            ( model, Cmd.none )


{-| Confirm remove server.
-}
handleConfirmRemoveServer : Model -> String -> ( Model, Cmd Msg )
handleConfirmRemoveServer model serverUrl =
    ( { model | dialog = Nothing }
    , Ports.removeServer serverUrl
    )



-- =============================================================================
-- CONTEXT MENU
-- =============================================================================


{-| Show context menu for a server.
-}
handleShowContextMenu : Model -> String -> Float -> Float -> ( Model, Cmd Msg )
handleShowContextMenu model serverUrl x y =
    ( { model
        | contextMenu = Just { serverUrl = serverUrl, x = x, y = y }
      }
    , Cmd.none
    )


{-| Hide context menu.
-}
handleHideContextMenu : Model -> ( Model, Cmd Msg )
handleHideContextMenu model =
    ( { model | contextMenu = Nothing }
    , Cmd.none
    )
