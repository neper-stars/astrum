module Update.SessionDetail exposing
    ( handleAcceptInvitation
    , handleCancelSentInvitation
    , handleCloseSessionDetail
    , handleDeclineInvitation
    , handleGotInvitations
    , handleGotSentInvitations
    , handleGotUserProfiles
    , handleInvitationAccepted
    , handleInvitationDeclined
    , handleInviteResult
    , handleOpenInvitationsDialog
    , handleOpenInviteDialog
    , handleSelectUserToInvite
    , handleSentInvitationCanceled
    , handleSubmitInvite
    , handleTogglePlayersExpanded
    , handleViewInvitedSession
    , handleViewSessionDetail
    )

{-| Update handlers for session detail and invitation messages.

Handles session detail view, invitations, and user profiles.

-}

import Api.Encode as Encode
import Api.Invitation exposing (Invitation)
import Api.Session exposing (Session)
import Api.UserProfile exposing (UserProfile)
import Json.Encode as E
import Model exposing (..)
import Msg exposing (Msg)
import Ports
import Update.Helpers exposing (updateInviteForm)



-- =============================================================================
-- SESSION DETAIL VIEW
-- =============================================================================


{-| View session detail.
-}
handleViewSessionDetail : Model -> String -> ( Model, Cmd Msg )
handleViewSessionDetail model sessionId =
    let
        serverData =
            getCurrentServerData model

        maybeSession =
            List.filter (\s -> s.id == sessionId) serverData.sessions
                |> List.head

        -- Fetch latest turn and check for stars.exe if session is started
        -- Also always fetch session player race for current user
        cmds =
            case ( maybeSession, model.selectedServerUrl ) of
                ( Just session, Just serverUrl ) ->
                    let
                        baseCmds =
                            -- Always try to fetch the current user's race for this session
                            [ Ports.getSessionPlayerRace (Encode.getSessionPlayerRace serverUrl sessionId) ]

                        turnCmds =
                            if Api.Session.isStarted session then
                                [ Ports.getLatestTurn (Encode.getLatestTurn serverUrl sessionId)
                                , Ports.checkHasStarsExe (Encode.checkHasStarsExe serverUrl sessionId)
                                ]

                            else
                                []
                    in
                    baseCmds ++ turnCmds

                _ ->
                    []

        -- Save lastViewedSession for the current server
        updatedServerData =
            case model.selectedServerUrl of
                Just serverUrl ->
                    updateServerData serverUrl
                        (\sd -> { sd | lastViewedSession = Just sessionId })
                        model.serverData

                Nothing ->
                    model.serverData

        -- Players section is collapsed by default when session is started
        isSessionStarted =
            maybeSession |> Maybe.map Api.Session.isStarted |> Maybe.withDefault False
    in
    ( { model
        | sessionDetail =
            Just
                { sessionId = sessionId
                , showInviteDialog = False
                , dragState = Nothing
                , playersExpanded = not isSessionStarted
                }
        , serverData = updatedServerData
      }
    , Cmd.batch cmds
    )


{-| Close session detail.
-}
handleCloseSessionDetail : Model -> ( Model, Cmd Msg )
handleCloseSessionDetail model =
    let
        updatedServerData =
            case model.selectedServerUrl of
                Just serverUrl ->
                    updateServerData serverUrl
                        (\sd -> { sd | lastViewedSession = Nothing })
                        model.serverData

                Nothing ->
                    model.serverData
    in
    ( { model | sessionDetail = Nothing, serverData = updatedServerData }
    , Cmd.none
    )


{-| Toggle players section expanded state.
-}
handleTogglePlayersExpanded : Model -> ( Model, Cmd Msg )
handleTogglePlayersExpanded model =
    case model.sessionDetail of
        Just detail ->
            ( { model | sessionDetail = Just { detail | playersExpanded = not detail.playersExpanded } }
            , Cmd.none
            )

        Nothing ->
            ( model, Cmd.none )



-- =============================================================================
-- USER PROFILES
-- =============================================================================


{-| Handle user profiles result.
-}
handleGotUserProfiles : Model -> String -> Result String (List UserProfile) -> ( Model, Cmd Msg )
handleGotUserProfiles model serverUrl result =
    case result of
        Ok profiles ->
            let
                updatedModel =
                    { model
                        | serverData =
                            updateServerData serverUrl
                                (\sd -> { sd | userProfiles = profiles })
                                model.serverData
                    }

                -- Also update the UsersListDialog if it's open
                -- Filter out pending users (they appear in Pending pane)
                finalModel =
                    case model.dialog of
                        Just (UsersListDialog state) ->
                            { updatedModel | dialog = Just (UsersListDialog { state | users = List.filter (\u -> not u.pending) profiles }) }

                        _ ->
                            updatedModel
            in
            ( finalModel, Cmd.none )

        Err _ ->
            ( model, Cmd.none )



-- =============================================================================
-- INVITE USER
-- =============================================================================


{-| Open invite user dialog.
-}
handleOpenInviteDialog : Model -> ( Model, Cmd Msg )
handleOpenInviteDialog model =
    case model.sessionDetail of
        Just detail ->
            ( { model
                | dialog = Just (InviteUserDialog (emptyInviteForm detail.sessionId))
              }
            , case model.selectedServerUrl of
                Just serverUrl ->
                    Ports.getUserProfiles serverUrl

                Nothing ->
                    Cmd.none
            )

        Nothing ->
            ( model, Cmd.none )


{-| Select user to invite.
-}
handleSelectUserToInvite : Model -> String -> ( Model, Cmd Msg )
handleSelectUserToInvite model userId =
    ( updateInviteForm model (\f -> { f | selectedUserId = Just userId })
    , Cmd.none
    )


{-| Submit invite.
-}
handleSubmitInvite : Model -> ( Model, Cmd Msg )
handleSubmitInvite model =
    case model.dialog of
        Just (InviteUserDialog form) ->
            case ( model.selectedServerUrl, form.selectedUserId ) of
                ( Just serverUrl, Just userId ) ->
                    ( updateInviteForm model (\f -> { f | submitting = True, error = Nothing })
                    , Ports.inviteUser
                        (E.object
                            [ ( "serverUrl", E.string serverUrl )
                            , ( "sessionId", E.string form.sessionId )
                            , ( "userProfileId", E.string userId )
                            ]
                        )
                    )

                _ ->
                    ( model, Cmd.none )

        _ ->
            ( model, Cmd.none )


{-| Handle invite result.
-}
handleInviteResult : Model -> String -> Result String () -> ( Model, Cmd Msg )
handleInviteResult model serverUrl result =
    case result of
        Ok _ ->
            ( { model | dialog = Nothing }
            , Ports.getSentInvitations serverUrl
            )

        Err err ->
            ( updateInviteForm model (\f -> { f | submitting = False, error = Just err })
            , Cmd.none
            )



-- =============================================================================
-- INVITATIONS DIALOG
-- =============================================================================


{-| Open invitations dialog.
-}
handleOpenInvitationsDialog : Model -> ( Model, Cmd Msg )
handleOpenInvitationsDialog model =
    case model.selectedServerUrl of
        Just serverUrl ->
            ( { model
                | dialog = Just InvitationsDialog
                , showUserMenu = False
              }
            , Cmd.batch
                [ Ports.getInvitations serverUrl
                , Ports.getSentInvitations serverUrl
                ]
            )

        Nothing ->
            ( model, Cmd.none )


{-| View invited session.
-}
handleViewInvitedSession : Model -> String -> ( Model, Cmd Msg )
handleViewInvitedSession model sessionId =
    case model.selectedServerUrl of
        Just serverUrl ->
            ( { model
                | dialog = Nothing
                , pendingViewSessionId = Just sessionId
              }
            , Ports.getSession (Encode.getSession serverUrl sessionId)
            )

        Nothing ->
            ( model, Cmd.none )


{-| Handle received invitations result.
-}
handleGotInvitations : Model -> String -> Result String (List Invitation) -> ( Model, Cmd Msg )
handleGotInvitations model serverUrl result =
    case result of
        Ok invitations ->
            let
                fetchSessionCmds =
                    invitations
                        |> List.map (\inv -> Ports.getSession (Encode.getSession serverUrl inv.sessionId))
                        |> Cmd.batch
            in
            ( { model
                | serverData =
                    updateServerData serverUrl
                        (\sd -> { sd | invitations = invitations })
                        model.serverData
              }
            , fetchSessionCmds
            )

        Err _ ->
            ( { model
                | serverData =
                    updateServerData serverUrl
                        (\sd -> { sd | invitations = [] })
                        model.serverData
              }
            , Cmd.none
            )


{-| Handle sent invitations result.
-}
handleGotSentInvitations : Model -> String -> Result String (List Invitation) -> ( Model, Cmd Msg )
handleGotSentInvitations model serverUrl result =
    case result of
        Ok invitations ->
            ( { model
                | serverData =
                    updateServerData serverUrl
                        (\sd -> { sd | sentInvitations = invitations })
                        model.serverData
              }
            , Cmd.none
            )

        Err _ ->
            ( { model
                | serverData =
                    updateServerData serverUrl
                        (\sd -> { sd | sentInvitations = [] })
                        model.serverData
              }
            , Cmd.none
            )



-- =============================================================================
-- INVITATION ACTIONS
-- =============================================================================


{-| Accept invitation.
-}
handleAcceptInvitation : Model -> String -> ( Model, Cmd Msg )
handleAcceptInvitation model invitationId =
    case model.selectedServerUrl of
        Just serverUrl ->
            ( model
            , Ports.acceptInvitation (Encode.acceptInvitation serverUrl invitationId)
            )

        Nothing ->
            ( model, Cmd.none )


{-| Handle invitation accepted result.
-}
handleInvitationAccepted : Model -> String -> Result String Session -> ( Model, Cmd Msg )
handleInvitationAccepted model serverUrl result =
    case result of
        Ok _ ->
            ( { model
                | dialog = Nothing
                , serverData =
                    updateServerData serverUrl
                        (\sd -> { sd | invitations = [] })
                        model.serverData
              }
            , Ports.getSessions serverUrl
            )

        Err _ ->
            ( model, Cmd.none )


{-| Decline invitation.
-}
handleDeclineInvitation : Model -> String -> ( Model, Cmd Msg )
handleDeclineInvitation model invitationId =
    case model.selectedServerUrl of
        Just serverUrl ->
            ( model
            , Ports.declineInvitation (Encode.declineInvitation serverUrl invitationId)
            )

        Nothing ->
            ( model, Cmd.none )


{-| Handle invitation declined result.
-}
handleInvitationDeclined : Model -> String -> Result String () -> ( Model, Cmd Msg )
handleInvitationDeclined model serverUrl result =
    case result of
        Ok _ ->
            ( model, Ports.getInvitations serverUrl )

        Err _ ->
            ( model, Cmd.none )


{-| Cancel sent invitation.
-}
handleCancelSentInvitation : Model -> String -> ( Model, Cmd Msg )
handleCancelSentInvitation model invitationId =
    case model.selectedServerUrl of
        Just serverUrl ->
            ( model
            , Ports.cancelSentInvitation (Encode.cancelSentInvitation serverUrl invitationId)
            )

        Nothing ->
            ( model, Cmd.none )


{-| Handle sent invitation canceled result.
-}
handleSentInvitationCanceled : Model -> String -> Result String () -> ( Model, Cmd Msg )
handleSentInvitationCanceled model serverUrl result =
    case result of
        Ok _ ->
            ( model, Ports.getSentInvitations serverUrl )

        Err _ ->
            ( model, Cmd.none )
