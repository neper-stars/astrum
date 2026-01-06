module Update.Admin exposing
    ( Msg(..)
    , handleAddBotResult
    , handleApproveRegistrationResult
    , handleCancelApproveRegistration
    , handleCancelChangeApikey
    , handleCancelDeleteUser
    , handleCancelRejectRegistration
    , handleCancelResetApikey
    , handleChangeApikeyResult
    , handleCloseRegistrationMessage
    , handleConfirmApproveRegistration
    , handleConfirmDeleteUser
    , handleConfirmRejectRegistration
    , handleConfirmResetApikey
    , handleCopyApiKey
    , handleCopyToClipboard
    , handleCreateUserResult
    , handleDeleteUserResult
    , handleGotApiKey
    , handleGotPendingRegistrations
    , handleHideUserMenu
    , handleOpenAddBotDialog
    , handleOpenChangeApikeyDialog
    , handleOpenCreateUserDialog
    , handleOpenStarsBrowser
    , handleOpenUsersListDialog
    , handleRejectRegistrationResult
    , handleRemoveBotPlayer
    , handleRemoveBotResult
    , handleResetApikeyResult
    , handleSelectBotLevel
    , handleSelectBotRace
    , handleSubmitAddBot
    , handleSubmitApproveRegistration
    , handleSubmitChangeApikey
    , handleSubmitCreateUser
    , handleSubmitDeleteUser
    , handleSubmitRejectRegistration
    , handleSubmitResetApikey
    , handleSwitchUsersListPane
    , handleToggleUserMenu
    , handleUpdateCreateUserEmail
    , handleUpdateCreateUserNickname
    , handleUpdateUsersListFilter
    , handleViewRegistrationMessage
    , update
    )

{-| Update handlers for admin messages.

Handles users list, create user, delete user, reset API key,
bot players, pending registrations, change API key, and user menu.

-}

import Api.BotLevel exposing (BotLevel)
import Api.BotRace exposing (BotRace)
import Api.Encode as Encode
import Api.UserProfile exposing (UserProfile)
import Json.Encode as E
import Model exposing (..)
import Ports
import Process
import Task


{-| Admin messages.
-}
type Msg
    = -- Bot Player Messages
      OpenAddBotDialog String -- sessionId
    | SelectBotRace BotRace
    | SelectBotLevel BotLevel
    | SubmitAddBot
    | AddBotResult String (Result String ()) -- serverUrl, result
    | RemoveBotPlayer String String -- sessionId, playerRaceId (userProfileId for bots)
    | RemoveBotResult String (Result String ()) -- serverUrl, result
      -- Admin/Manager Messages
    | OpenUsersListDialog
    | UpdateUsersListFilter String -- filter users by nickname/email
    | OpenCreateUserDialog -- open create user dialog (admin)
    | UpdateCreateUserNickname String
    | UpdateCreateUserEmail String
    | SubmitCreateUser
    | CreateUserResult String (Result String { id : String, nickname : String, email : String }) -- serverUrl, result
    | ConfirmDeleteUser String String -- userId, nickname - show confirmation
    | CancelDeleteUser -- cancel confirmation
    | SubmitDeleteUser String -- userId - actually delete
    | DeleteUserResult String (Result String ()) -- serverUrl, result
    | ConfirmResetApikey String -- userId - show confirmation
    | CancelResetApikey -- cancel confirmation
    | SubmitResetApikey String -- userId - actually reset
    | ResetApikeyResult (Result String String) -- Result error newApikey
      -- Pending Registrations
    | SwitchUsersListPane -- toggle between users and pending pane
    | GotPendingRegistrations String (Result String (List { id : String, nickname : String, email : String, message : Maybe String })) -- serverUrl, result
    | ViewRegistrationMessage String String String -- userId, nickname, message
    | CloseRegistrationMessage
    | ConfirmApproveRegistration String String -- userId, nickname
    | CancelApproveRegistration
    | SubmitApproveRegistration String -- userId
    | ApproveRegistrationResult String (Result String String) -- serverUrl, Result error apikey
    | ConfirmRejectRegistration String String -- userId, nickname
    | CancelRejectRegistration
    | SubmitRejectRegistration String -- userId
    | RejectRegistrationResult String (Result String ()) -- serverUrl, result
      -- Change Own API Key Messages
    | OpenChangeApikeyDialog -- open confirmation dialog
    | CancelChangeApikey -- cancel
    | SubmitChangeApikey -- submit the change
    | ChangeApikeyResult (Result String String) -- Result error newApikey
      -- User Menu Messages
    | ToggleUserMenu
    | HideUserMenu
    | CopyApiKey String -- serverUrl - fetches and copies API key to clipboard
    | GotApiKey String (Result String String) -- serverUrl, apiKey
    | CopyToClipboard String -- message to show
    | HideToast -- hide toast after delay
      -- Stars Browser Messages
    | OpenStarsBrowser String String -- serverUrl, sessionId


{-| Update function for admin messages.
-}
update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        OpenAddBotDialog sessionId ->
            handleOpenAddBotDialog model sessionId

        SelectBotRace race ->
            handleSelectBotRace model race

        SelectBotLevel level ->
            handleSelectBotLevel model level

        SubmitAddBot ->
            handleSubmitAddBot model

        AddBotResult serverUrl result ->
            handleAddBotResult model serverUrl result

        RemoveBotPlayer sessionId playerRaceId ->
            handleRemoveBotPlayer model sessionId playerRaceId

        RemoveBotResult serverUrl result ->
            handleRemoveBotResult model serverUrl result

        OpenUsersListDialog ->
            handleOpenUsersListDialog model

        UpdateUsersListFilter query ->
            handleUpdateUsersListFilter model query

        OpenCreateUserDialog ->
            handleOpenCreateUserDialog model

        UpdateCreateUserNickname nickname ->
            handleUpdateCreateUserNickname model nickname

        UpdateCreateUserEmail email ->
            handleUpdateCreateUserEmail model email

        SubmitCreateUser ->
            handleSubmitCreateUser model

        CreateUserResult serverUrl result ->
            handleCreateUserResult model serverUrl result

        ConfirmDeleteUser userId nickname ->
            handleConfirmDeleteUser model userId nickname

        CancelDeleteUser ->
            handleCancelDeleteUser model

        SubmitDeleteUser userId ->
            handleSubmitDeleteUser model userId

        DeleteUserResult serverUrl result ->
            handleDeleteUserResult model serverUrl result

        ConfirmResetApikey userId ->
            handleConfirmResetApikey model userId

        CancelResetApikey ->
            handleCancelResetApikey model

        SubmitResetApikey userId ->
            handleSubmitResetApikey model userId

        ResetApikeyResult result ->
            handleResetApikeyResult model result

        SwitchUsersListPane ->
            handleSwitchUsersListPane model

        GotPendingRegistrations serverUrl result ->
            handleGotPendingRegistrations model serverUrl result

        ViewRegistrationMessage userId nickname message ->
            handleViewRegistrationMessage model userId nickname message

        CloseRegistrationMessage ->
            handleCloseRegistrationMessage model

        ConfirmApproveRegistration userId nickname ->
            handleConfirmApproveRegistration model userId nickname

        CancelApproveRegistration ->
            handleCancelApproveRegistration model

        SubmitApproveRegistration userId ->
            handleSubmitApproveRegistration model userId

        ApproveRegistrationResult serverUrl result ->
            handleApproveRegistrationResult model serverUrl result

        ConfirmRejectRegistration userId nickname ->
            handleConfirmRejectRegistration model userId nickname

        CancelRejectRegistration ->
            handleCancelRejectRegistration model

        SubmitRejectRegistration userId ->
            handleSubmitRejectRegistration model userId

        RejectRegistrationResult _ result ->
            handleRejectRegistrationResult model result

        OpenChangeApikeyDialog ->
            handleOpenChangeApikeyDialog model

        CancelChangeApikey ->
            handleCancelChangeApikey model

        SubmitChangeApikey ->
            handleSubmitChangeApikey model

        ChangeApikeyResult result ->
            handleChangeApikeyResult model result

        ToggleUserMenu ->
            handleToggleUserMenu model

        HideUserMenu ->
            handleHideUserMenu model

        CopyApiKey serverUrl ->
            handleCopyApiKey model serverUrl

        GotApiKey _ result ->
            handleGotApiKey model result

        CopyToClipboard text ->
            handleCopyToClipboard model text

        HideToast ->
            ( { model | toast = Nothing }, Cmd.none )

        OpenStarsBrowser serverUrl sessionId ->
            handleOpenStarsBrowser model serverUrl sessionId



-- =============================================================================
-- STARS BROWSER
-- =============================================================================


{-| Open Stars! browser in a new window.
-}
handleOpenStarsBrowser : Model -> String -> String -> ( Model, Cmd Msg )
handleOpenStarsBrowser model serverUrl sessionId =
    ( model
    , Ports.openStarsBrowserWindow
        (E.object
            [ ( "serverUrl", E.string serverUrl )
            , ( "sessionId", E.string sessionId )
            ]
        )
    )



-- =============================================================================
-- USERS LIST DIALOG
-- =============================================================================


{-| Open users list dialog.
-}
handleOpenUsersListDialog : Model -> ( Model, Cmd Msg )
handleOpenUsersListDialog model =
    case model.selectedServerUrl of
        Just serverUrl ->
            let
                serverData =
                    getServerData serverUrl model.serverData

                currentUserId =
                    case serverData.connectionState of
                        Connected info ->
                            info.userId

                        _ ->
                            ""
            in
            ( { model | dialog = Just (UsersListDialog (emptyUsersListState currentUserId serverData.userProfiles)) }
            , Cmd.batch
                [ Ports.getUserProfiles serverUrl
                , Ports.getPendingRegistrations serverUrl
                ]
            )

        Nothing ->
            ( model, Cmd.none )


{-| Update users list filter.
-}
handleUpdateUsersListFilter : Model -> String -> ( Model, Cmd Msg )
handleUpdateUsersListFilter model query =
    case model.dialog of
        Just (UsersListDialog state) ->
            ( { model | dialog = Just (UsersListDialog { state | filterQuery = query }) }
            , Cmd.none
            )

        _ ->
            ( model, Cmd.none )



-- =============================================================================
-- CREATE USER
-- =============================================================================


{-| Open create user dialog.
-}
handleOpenCreateUserDialog : Model -> ( Model, Cmd Msg )
handleOpenCreateUserDialog model =
    ( { model | dialog = Just (CreateUserDialog emptyCreateUserForm) }
    , Cmd.none
    )


{-| Update create user nickname.
-}
handleUpdateCreateUserNickname : Model -> String -> ( Model, Cmd Msg )
handleUpdateCreateUserNickname model nickname =
    case model.dialog of
        Just (CreateUserDialog form) ->
            ( { model | dialog = Just (CreateUserDialog { form | nickname = nickname }) }
            , Cmd.none
            )

        _ ->
            ( model, Cmd.none )


{-| Update create user email.
-}
handleUpdateCreateUserEmail : Model -> String -> ( Model, Cmd Msg )
handleUpdateCreateUserEmail model email =
    case model.dialog of
        Just (CreateUserDialog form) ->
            ( { model | dialog = Just (CreateUserDialog { form | email = email }) }
            , Cmd.none
            )

        _ ->
            ( model, Cmd.none )


{-| Submit create user.
-}
handleSubmitCreateUser : Model -> ( Model, Cmd Msg )
handleSubmitCreateUser model =
    case ( model.dialog, model.selectedServerUrl ) of
        ( Just (CreateUserDialog form), Just serverUrl ) ->
            if String.isEmpty form.nickname || String.isEmpty form.email then
                ( { model | dialog = Just (CreateUserDialog { form | error = Just "Nickname and email are required" }) }
                , Cmd.none
                )

            else
                ( { model | dialog = Just (CreateUserDialog { form | submitting = True, error = Nothing }) }
                , Ports.createUser (Encode.createUser serverUrl form.nickname form.email)
                )

        _ ->
            ( model, Cmd.none )


{-| Handle create user result.
-}
handleCreateUserResult : Model -> String -> Result String { id : String, nickname : String, email : String } -> ( Model, Cmd Msg )
handleCreateUserResult model serverUrl result =
    case model.dialog of
        Just (CreateUserDialog form) ->
            case result of
                Ok user ->
                    let
                        createdProfile : UserProfile
                        createdProfile =
                            { id = user.id
                            , nickname = user.nickname
                            , email = user.email
                            , isActive = False
                            , isManager = False
                            , pending = True
                            , message = Nothing
                            }
                    in
                    ( { model
                        | dialog =
                            Just
                                (CreateUserDialog
                                    { form
                                        | submitting = False
                                        , createdUser = Just createdProfile
                                    }
                                )
                      }
                    , Ports.getUserProfiles serverUrl
                    )

                Err err ->
                    ( { model | dialog = Just (CreateUserDialog { form | submitting = False, error = Just err }) }
                    , Cmd.none
                    )

        _ ->
            ( model, Cmd.none )



-- =============================================================================
-- DELETE USER
-- =============================================================================


{-| Confirm delete user.
-}
handleConfirmDeleteUser : Model -> String -> String -> ( Model, Cmd Msg )
handleConfirmDeleteUser model userId nickname =
    case model.dialog of
        Just (UsersListDialog state) ->
            ( { model | dialog = Just (UsersListDialog { state | deleteState = ConfirmingDelete userId nickname }) }
            , Cmd.none
            )

        _ ->
            ( model, Cmd.none )


{-| Cancel delete user.
-}
handleCancelDeleteUser : Model -> ( Model, Cmd Msg )
handleCancelDeleteUser model =
    case model.dialog of
        Just (UsersListDialog state) ->
            ( { model | dialog = Just (UsersListDialog { state | deleteState = NoDelete }) }
            , Cmd.none
            )

        _ ->
            ( model, Cmd.none )


{-| Submit delete user.
-}
handleSubmitDeleteUser : Model -> String -> ( Model, Cmd Msg )
handleSubmitDeleteUser model userId =
    case ( model.selectedServerUrl, model.dialog ) of
        ( Just serverUrl, Just (UsersListDialog state) ) ->
            let
                nickname =
                    state.users
                        |> List.filter (\u -> u.id == userId)
                        |> List.head
                        |> Maybe.map .nickname
                        |> Maybe.withDefault userId
            in
            ( { model | dialog = Just (UsersListDialog { state | deleteState = DeletingUser userId nickname }) }
            , Ports.deleteUser (Encode.deleteUser serverUrl userId)
            )

        _ ->
            ( model, Cmd.none )


{-| Handle delete user result.
-}
handleDeleteUserResult : Model -> String -> Result String () -> ( Model, Cmd Msg )
handleDeleteUserResult model serverUrl result =
    case model.dialog of
        Just (UsersListDialog state) ->
            case result of
                Ok () ->
                    -- Remove the deleted user from the list and reset delete state
                    let
                        deletedUserId =
                            case state.deleteState of
                                DeletingUser uid _ ->
                                    uid

                                _ ->
                                    ""

                        updatedUsers =
                            List.filter (\u -> u.id /= deletedUserId) state.users
                    in
                    ( { model | dialog = Just (UsersListDialog { state | users = updatedUsers, deleteState = NoDelete }) }
                    , Ports.getUserProfiles serverUrl
                    )

                Err err ->
                    let
                        nickname =
                            case state.deleteState of
                                DeletingUser _ n ->
                                    n

                                _ ->
                                    "User"
                    in
                    ( { model | dialog = Just (UsersListDialog { state | deleteState = DeleteError nickname err }) }
                    , Cmd.none
                    )

        _ ->
            ( model, Cmd.none )



-- =============================================================================
-- RESET API KEY
-- =============================================================================


{-| Confirm reset API key.
-}
handleConfirmResetApikey : Model -> String -> ( Model, Cmd Msg )
handleConfirmResetApikey model userId =
    case model.dialog of
        Just (UsersListDialog state) ->
            let
                nickname =
                    state.users
                        |> List.filter (\u -> u.id == userId)
                        |> List.head
                        |> Maybe.map .nickname
                        |> Maybe.withDefault userId
            in
            ( { model | dialog = Just (UsersListDialog { state | resetState = ConfirmingReset userId nickname }) }
            , Cmd.none
            )

        _ ->
            ( model, Cmd.none )


{-| Cancel reset API key.
-}
handleCancelResetApikey : Model -> ( Model, Cmd Msg )
handleCancelResetApikey model =
    case model.dialog of
        Just (UsersListDialog state) ->
            ( { model | dialog = Just (UsersListDialog { state | resetState = NoReset }) }
            , Cmd.none
            )

        _ ->
            ( model, Cmd.none )


{-| Submit reset API key.
-}
handleSubmitResetApikey : Model -> String -> ( Model, Cmd Msg )
handleSubmitResetApikey model userId =
    case ( model.dialog, model.selectedServerUrl ) of
        ( Just (UsersListDialog state), Just serverUrl ) ->
            let
                nickname =
                    state.users
                        |> List.filter (\u -> u.id == userId)
                        |> List.head
                        |> Maybe.map .nickname
                        |> Maybe.withDefault userId
            in
            ( { model | dialog = Just (UsersListDialog { state | resetState = ResettingApikey userId nickname }) }
            , Ports.resetUserApikey
                (E.object
                    [ ( "serverUrl", E.string serverUrl )
                    , ( "userId", E.string userId )
                    ]
                )
            )

        _ ->
            ( model, Cmd.none )


{-| Handle reset API key result.
-}
handleResetApikeyResult : Model -> Result String String -> ( Model, Cmd Msg )
handleResetApikeyResult model result =
    case model.dialog of
        Just (UsersListDialog state) ->
            case result of
                Ok newApikey ->
                    let
                        nickname =
                            case state.resetState of
                                ResettingApikey _ n ->
                                    n

                                ConfirmingReset _ n ->
                                    n

                                _ ->
                                    "User"
                    in
                    ( { model | dialog = Just (UsersListDialog { state | resetState = ResetComplete nickname newApikey }) }
                    , Cmd.none
                    )

                Err err ->
                    ( { model | error = Just err, dialog = Just (UsersListDialog { state | resetState = NoReset }) }
                    , Cmd.none
                    )

        _ ->
            ( model, Cmd.none )



-- =============================================================================
-- BOT PLAYER
-- =============================================================================


{-| Open add bot dialog.
-}
handleOpenAddBotDialog : Model -> String -> ( Model, Cmd Msg )
handleOpenAddBotDialog model sessionId =
    ( { model | dialog = Just (AddBotDialog (emptyAddBotForm sessionId)) }
    , Cmd.none
    )


{-| Select bot race.
-}
handleSelectBotRace : Model -> BotRace -> ( Model, Cmd Msg )
handleSelectBotRace model race =
    case model.dialog of
        Just (AddBotDialog form) ->
            ( { model | dialog = Just (AddBotDialog { form | selectedRace = race }) }
            , Cmd.none
            )

        _ ->
            ( model, Cmd.none )


{-| Select bot level.
-}
handleSelectBotLevel : Model -> BotLevel -> ( Model, Cmd Msg )
handleSelectBotLevel model level =
    case model.dialog of
        Just (AddBotDialog form) ->
            ( { model | dialog = Just (AddBotDialog { form | selectedLevel = level }) }
            , Cmd.none
            )

        _ ->
            ( model, Cmd.none )


{-| Submit add bot.
-}
handleSubmitAddBot : Model -> ( Model, Cmd Msg )
handleSubmitAddBot model =
    case ( model.dialog, model.selectedServerUrl ) of
        ( Just (AddBotDialog form), Just serverUrl ) ->
            ( { model | dialog = Just (AddBotDialog { form | submitting = True, error = Nothing }) }
            , Ports.addBotPlayer
                (E.object
                    [ ( "serverUrl", E.string serverUrl )
                    , ( "sessionId", E.string form.sessionId )
                    , ( "raceId", E.string (String.fromInt (Api.BotRace.toInt form.selectedRace)) )
                    , ( "botLevel", E.int (Api.BotLevel.toInt form.selectedLevel) )
                    ]
                )
            )

        _ ->
            ( model, Cmd.none )


{-| Handle add bot result.
-}
handleAddBotResult : Model -> String -> Result String () -> ( Model, Cmd Msg )
handleAddBotResult model serverUrl result =
    case model.dialog of
        Just (AddBotDialog form) ->
            case result of
                Ok () ->
                    -- Close dialog and refresh session to see the new bot player
                    ( { model | dialog = Nothing }
                    , Ports.getSession
                        (E.object
                            [ ( "serverUrl", E.string serverUrl )
                            , ( "sessionId", E.string form.sessionId )
                            ]
                        )
                    )

                Err err ->
                    ( { model | dialog = Just (AddBotDialog { form | submitting = False, error = Just err }) }
                    , Cmd.none
                    )

        _ ->
            ( model, Cmd.none )


{-| Handle remove bot player.
-}
handleRemoveBotPlayer : Model -> String -> String -> ( Model, Cmd Msg )
handleRemoveBotPlayer model sessionId playerRaceId =
    case model.selectedServerUrl of
        Just serverUrl ->
            ( model
            , Ports.removeBotPlayer
                (E.object
                    [ ( "serverUrl", E.string serverUrl )
                    , ( "sessionId", E.string sessionId )
                    , ( "playerRaceId", E.string playerRaceId )
                    ]
                )
            )

        Nothing ->
            ( model, Cmd.none )


{-| Handle remove bot result.
-}
handleRemoveBotResult : Model -> String -> Result String () -> ( Model, Cmd Msg )
handleRemoveBotResult model serverUrl result =
    case result of
        Ok () ->
            -- Refresh sessions to see the updated player list
            ( model
            , Ports.getSessions serverUrl
            )

        Err err ->
            ( { model | error = Just err }
            , Cmd.none
            )



-- =============================================================================
-- PENDING REGISTRATIONS
-- =============================================================================


{-| Switch users list pane.
-}
handleSwitchUsersListPane : Model -> ( Model, Cmd Msg )
handleSwitchUsersListPane model =
    case model.dialog of
        Just (UsersListDialog state) ->
            let
                newPane =
                    case state.activePane of
                        UsersPane ->
                            PendingPane

                        PendingPane ->
                            UsersPane

                cmd =
                    case ( newPane, model.selectedServerUrl ) of
                        ( PendingPane, Just serverUrl ) ->
                            Ports.getPendingRegistrations serverUrl

                        _ ->
                            Cmd.none
            in
            ( { model | dialog = Just (UsersListDialog { state | activePane = newPane }) }
            , cmd
            )

        _ ->
            ( model, Cmd.none )


{-| Handle pending registrations result.
-}
handleGotPendingRegistrations : Model -> String -> Result String (List { id : String, nickname : String, email : String, message : Maybe String }) -> ( Model, Cmd Msg )
handleGotPendingRegistrations model serverUrl result =
    case result of
        Ok pendingList ->
            let
                pendingProfiles =
                    List.map
                        (\p ->
                            { id = p.id
                            , nickname = p.nickname
                            , email = p.email
                            , isActive = False
                            , isManager = False
                            , pending = True
                            , message = p.message
                            }
                        )
                        pendingList

                -- Always update the count in ServerData
                updatedServerData =
                    updateServerData serverUrl
                        (\sd -> { sd | pendingRegistrationsCount = List.length pendingList })
                        model.serverData

                -- Update dialog if open
                updatedDialog =
                    case model.dialog of
                        Just (UsersListDialog state) ->
                            Just (UsersListDialog { state | pendingUsers = pendingProfiles })

                        other ->
                            other
            in
            ( { model | serverData = updatedServerData, dialog = updatedDialog }
            , Cmd.none
            )

        Err _ ->
            ( model, Cmd.none )


{-| View registration message.
-}
handleViewRegistrationMessage : Model -> String -> String -> String -> ( Model, Cmd Msg )
handleViewRegistrationMessage model userId nickname message =
    case model.dialog of
        Just (UsersListDialog state) ->
            ( { model | dialog = Just (UsersListDialog { state | pendingActionState = ViewingMessage userId nickname message }) }
            , Cmd.none
            )

        _ ->
            ( model, Cmd.none )


{-| Close registration message.
-}
handleCloseRegistrationMessage : Model -> ( Model, Cmd Msg )
handleCloseRegistrationMessage model =
    case model.dialog of
        Just (UsersListDialog state) ->
            ( { model | dialog = Just (UsersListDialog { state | pendingActionState = NoPendingAction }) }
            , Cmd.none
            )

        _ ->
            ( model, Cmd.none )


{-| Confirm approve registration.
-}
handleConfirmApproveRegistration : Model -> String -> String -> ( Model, Cmd Msg )
handleConfirmApproveRegistration model userId nickname =
    case model.dialog of
        Just (UsersListDialog state) ->
            ( { model | dialog = Just (UsersListDialog { state | pendingActionState = ConfirmingApprove userId nickname }) }
            , Cmd.none
            )

        _ ->
            ( model, Cmd.none )


{-| Cancel approve registration.
-}
handleCancelApproveRegistration : Model -> ( Model, Cmd Msg )
handleCancelApproveRegistration model =
    case model.dialog of
        Just (UsersListDialog state) ->
            ( { model | dialog = Just (UsersListDialog { state | pendingActionState = NoPendingAction }) }
            , Cmd.none
            )

        _ ->
            ( model, Cmd.none )


{-| Submit approve registration.
-}
handleSubmitApproveRegistration : Model -> String -> ( Model, Cmd Msg )
handleSubmitApproveRegistration model userId =
    case ( model.selectedServerUrl, model.dialog ) of
        ( Just serverUrl, Just (UsersListDialog state) ) ->
            let
                nickname =
                    state.pendingUsers
                        |> List.filter (\u -> u.id == userId)
                        |> List.head
                        |> Maybe.map .nickname
                        |> Maybe.withDefault userId
            in
            ( { model | dialog = Just (UsersListDialog { state | pendingActionState = ApprovingUser userId nickname }) }
            , Ports.approveRegistration (Encode.approveRegistration serverUrl userId)
            )

        _ ->
            ( model, Cmd.none )


{-| Handle approve registration result.
-}
handleApproveRegistrationResult : Model -> String -> Result String String -> ( Model, Cmd Msg )
handleApproveRegistrationResult model serverUrl result =
    case model.dialog of
        Just (UsersListDialog state) ->
            case result of
                Ok _ ->
                    -- API key is now sent directly to the user, admin doesn't need it
                    let
                        nickname =
                            case state.pendingActionState of
                                ApprovingUser _ n ->
                                    n

                                _ ->
                                    "User"

                        approvedUserId =
                            case state.pendingActionState of
                                ApprovingUser uid _ ->
                                    uid

                                _ ->
                                    ""

                        updatedPending =
                            List.filter (\u -> u.id /= approvedUserId) state.pendingUsers
                    in
                    -- Note: pendingRegistrationsCount is updated via notification
                    ( { model | dialog = Just (UsersListDialog { state | pendingUsers = updatedPending, pendingActionState = ApproveComplete nickname }) }
                    , Ports.getUserProfiles serverUrl
                    )

                Err err ->
                    let
                        nickname =
                            case state.pendingActionState of
                                ApprovingUser _ n ->
                                    n

                                _ ->
                                    "User"
                    in
                    ( { model | dialog = Just (UsersListDialog { state | pendingActionState = ApproveError nickname err }) }
                    , Cmd.none
                    )

        _ ->
            ( model, Cmd.none )


{-| Confirm reject registration.
-}
handleConfirmRejectRegistration : Model -> String -> String -> ( Model, Cmd Msg )
handleConfirmRejectRegistration model userId nickname =
    case model.dialog of
        Just (UsersListDialog state) ->
            ( { model | dialog = Just (UsersListDialog { state | pendingActionState = ConfirmingReject userId nickname }) }
            , Cmd.none
            )

        _ ->
            ( model, Cmd.none )


{-| Cancel reject registration.
-}
handleCancelRejectRegistration : Model -> ( Model, Cmd Msg )
handleCancelRejectRegistration model =
    case model.dialog of
        Just (UsersListDialog state) ->
            ( { model | dialog = Just (UsersListDialog { state | pendingActionState = NoPendingAction }) }
            , Cmd.none
            )

        _ ->
            ( model, Cmd.none )


{-| Submit reject registration.
-}
handleSubmitRejectRegistration : Model -> String -> ( Model, Cmd Msg )
handleSubmitRejectRegistration model userId =
    case ( model.selectedServerUrl, model.dialog ) of
        ( Just serverUrl, Just (UsersListDialog state) ) ->
            let
                nickname =
                    state.pendingUsers
                        |> List.filter (\u -> u.id == userId)
                        |> List.head
                        |> Maybe.map .nickname
                        |> Maybe.withDefault userId
            in
            ( { model | dialog = Just (UsersListDialog { state | pendingActionState = RejectingUser userId nickname }) }
            , Ports.rejectRegistration (Encode.rejectRegistration serverUrl userId)
            )

        _ ->
            ( model, Cmd.none )


{-| Handle reject registration result.
-}
handleRejectRegistrationResult : Model -> Result String () -> ( Model, Cmd Msg )
handleRejectRegistrationResult model result =
    case model.dialog of
        Just (UsersListDialog state) ->
            case result of
                Ok () ->
                    let
                        rejectedUserId =
                            case state.pendingActionState of
                                RejectingUser uid _ ->
                                    uid

                                _ ->
                                    ""

                        updatedPending =
                            List.filter (\u -> u.id /= rejectedUserId) state.pendingUsers
                    in
                    -- Note: pendingRegistrationsCount is updated via notification
                    ( { model | dialog = Just (UsersListDialog { state | pendingUsers = updatedPending, pendingActionState = NoPendingAction }) }
                    , Cmd.none
                    )

                Err err ->
                    let
                        nickname =
                            case state.pendingActionState of
                                RejectingUser _ n ->
                                    n

                                _ ->
                                    "User"
                    in
                    ( { model | dialog = Just (UsersListDialog { state | pendingActionState = RejectError nickname err }) }
                    , Cmd.none
                    )

        _ ->
            ( model, Cmd.none )



-- =============================================================================
-- CHANGE OWN API KEY
-- =============================================================================


{-| Open change API key dialog.
-}
handleOpenChangeApikeyDialog : Model -> ( Model, Cmd Msg )
handleOpenChangeApikeyDialog model =
    ( { model | dialog = Just (ChangeApikeyDialog ConfirmingChange), showUserMenu = False }
    , Cmd.none
    )


{-| Cancel change API key.
-}
handleCancelChangeApikey : Model -> ( Model, Cmd Msg )
handleCancelChangeApikey model =
    ( { model | dialog = Nothing }
    , Cmd.none
    )


{-| Submit change API key.
-}
handleSubmitChangeApikey : Model -> ( Model, Cmd Msg )
handleSubmitChangeApikey model =
    case model.selectedServerUrl of
        Just serverUrl ->
            ( { model | dialog = Just (ChangeApikeyDialog ChangingApikey) }
            , Ports.changeMyApikey serverUrl
            )

        Nothing ->
            ( model, Cmd.none )


{-| Handle change API key result.
-}
handleChangeApikeyResult : Model -> Result String String -> ( Model, Cmd Msg )
handleChangeApikeyResult model result =
    case model.dialog of
        Just (ChangeApikeyDialog _) ->
            case result of
                Ok newApikey ->
                    ( { model | dialog = Just (ChangeApikeyDialog (ChangeComplete newApikey)) }
                    , Cmd.none
                    )

                Err err ->
                    ( { model | error = Just err, dialog = Nothing }
                    , Cmd.none
                    )

        _ ->
            ( model, Cmd.none )



-- =============================================================================
-- USER MENU
-- =============================================================================


{-| Toggle user menu.
-}
handleToggleUserMenu : Model -> ( Model, Cmd Msg )
handleToggleUserMenu model =
    ( { model | showUserMenu = not model.showUserMenu }
    , Cmd.none
    )


{-| Hide user menu.
-}
handleHideUserMenu : Model -> ( Model, Cmd Msg )
handleHideUserMenu model =
    ( { model | showUserMenu = False }
    , Cmd.none
    )


{-| Copy API key.
-}
handleCopyApiKey : Model -> String -> ( Model, Cmd Msg )
handleCopyApiKey model serverUrl =
    ( model
    , Ports.getApiKey serverUrl
    )


{-| Handle got API key result.
-}
handleGotApiKey : Model -> Result String String -> ( Model, Cmd Msg )
handleGotApiKey model result =
    case result of
        Ok apiKey ->
            ( { model | toast = Just "API key copied to clipboard" }
            , Cmd.batch
                [ Ports.copyToClipboard apiKey
                , Process.sleep 3000
                    |> Task.perform (\_ -> HideToast)
                ]
            )

        Err err ->
            ( { model | error = Just err }
            , Cmd.none
            )


{-| Copy text to clipboard.
-}
handleCopyToClipboard : Model -> String -> ( Model, Cmd Msg )
handleCopyToClipboard model text =
    ( model
    , Ports.copyToClipboard text
    )
