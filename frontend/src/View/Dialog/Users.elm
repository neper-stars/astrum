module View.Dialog.Users exposing
    ( viewCreateUserDialog
    , viewInviteUserDialog
    , viewInvitationsDialog
    , viewUsersListDialog
    )

{-| User-related dialogs: invite user, invitations list, users list (admin), and create user (admin).
-}

import Api.Invitation exposing (Invitation)
import Api.UserProfile exposing (UserProfile)
import Html exposing (..)
import Html.Attributes exposing (..)
import Html.Events exposing (..)
import Json.Decode as D
import Model exposing (CreateUserForm, DeleteUserState(..), InviteForm, PendingActionState(..), ResetApikeyState(..), UsersListPane(..), UsersListState)
import Msg exposing (Msg(..))
import View.Helpers exposing (viewFormError)


{-| Handle Escape key press to clear the filter.
Only stops propagation if there's text to clear, otherwise lets the dialog close.
-}
onEscapeClear : String -> Attribute Msg
onEscapeClear currentFilter =
    stopPropagationOn "keydown"
        (D.field "key" D.string
            |> D.andThen
                (\key ->
                    if key == "Escape" && not (String.isEmpty currentFilter) then
                        -- Clear filter and stop propagation
                        D.succeed ( UpdateUsersListFilter "", True )

                    else
                        -- Let the event propagate (will close dialog if Escape)
                        D.fail "not escape or filter empty"
                )
        )


{-| Dialog for inviting a user to a session.
-}
viewInviteUserDialog : InviteForm -> List UserProfile -> Html Msg
viewInviteUserDialog form userProfiles =
    div []
        [ div [ class "dialog__header" ]
            [ h2 [ class "dialog__title" ] [ text "Invite User" ]
            , button
                [ class "dialog__close"
                , onClick CloseDialog
                ]
                [ text "x" ]
            ]
        , div [ class "dialog__body" ]
            [ viewFormError form.error
            , if List.isEmpty userProfiles then
                div [ class "invite-dialog__loading" ] [ text "Loading users..." ]

              else
                div [ class "invite-dialog__users" ]
                    (List.map (viewUserOption form.selectedUserId) userProfiles)
            ]
        , div [ class "dialog__footer" ]
            [ button
                [ class "btn btn--secondary"
                , onClick CloseDialog
                ]
                [ text "Cancel" ]
            , button
                [ class "btn btn--primary"
                , disabled (form.selectedUserId == Nothing || form.submitting)
                , onClick SubmitInvite
                ]
                [ text
                    (if form.submitting then
                        "Inviting..."

                     else
                        "Send Invite"
                    )
                ]
            ]
        ]


viewUserOption : Maybe String -> UserProfile -> Html Msg
viewUserOption selectedUserId user =
    let
        isSelected =
            selectedUserId == Just user.id
    in
    div
        [ class "invite-dialog__user"
        , classList [ ( "is-selected", isSelected ) ]
        , onClick (SelectUserToInvite user.id)
        ]
        [ span [ class "invite-dialog__user-name" ] [ text user.nickname ]
        , span [ class "invite-dialog__user-email" ] [ text user.email ]
        ]


{-| Dialog showing received and sent invitations.
-}
viewInvitationsDialog : List Invitation -> List Invitation -> Html Msg
viewInvitationsDialog receivedInvitations sentInvitations =
    div []
        [ div [ class "dialog__header" ]
            [ h2 [ class "dialog__title" ] [ text "Invitations" ]
            , button
                [ class "dialog__close"
                , onClick CloseDialog
                ]
                [ text "x" ]
            ]
        , div [ class "dialog__body" ]
            [ -- Received invitations section
              div [ class "invitations-dialog__section" ]
                [ h3 [ class "invitations-dialog__section-title" ] [ text "Received" ]
                , if List.isEmpty receivedInvitations then
                    div [ class "invitations-dialog__empty" ]
                        [ text "No pending invitations" ]

                  else
                    div [ class "invitations-dialog__list" ]
                        (List.map viewReceivedInvitationCard receivedInvitations)
                ]

            -- Sent invitations section
            , div [ class "invitations-dialog__section" ]
                [ h3 [ class "invitations-dialog__section-title" ] [ text "Sent" ]
                , if List.isEmpty sentInvitations then
                    div [ class "invitations-dialog__empty" ]
                        [ text "No sent invitations" ]

                  else
                    div [ class "invitations-dialog__list" ]
                        (List.map viewSentInvitationCard sentInvitations)
                ]
            ]
        , div [ class "dialog__footer dialog__footer--right" ]
            [ button
                [ class "btn btn-secondary"
                , onClick CloseDialog
                ]
                [ text "Close" ]
            ]
        ]


viewReceivedInvitationCard : Invitation -> Html Msg
viewReceivedInvitationCard invitation =
    div [ class "invitation-card" ]
        [ div [ class "invitation-card__info" ]
            [ div [ class "invitation-card__session" ]
                [ text invitation.sessionName ]
            , div [ class "invitation-card__inviter" ]
                [ text ("Invited by " ++ invitation.inviterNickname) ]
            ]
        , div [ class "invitation-card__actions" ]
            [ button
                [ class "btn btn--secondary btn--sm"
                , onClick (ViewInvitedSession invitation.sessionId)
                ]
                [ text "View" ]
            , button
                [ class "btn btn--secondary btn--sm"
                , onClick (DeclineInvitation invitation.id)
                ]
                [ text "Decline" ]
            , button
                [ class "btn btn--primary btn--sm"
                , onClick (AcceptInvitation invitation.id)
                ]
                [ text "Accept" ]
            ]
        ]


viewSentInvitationCard : Invitation -> Html Msg
viewSentInvitationCard invitation =
    div [ class "invitation-card invitation-card--sent" ]
        [ div [ class "invitation-card__info" ]
            [ div [ class "invitation-card__session" ]
                [ text invitation.sessionName ]
            , div [ class "invitation-card__invitee" ]
                [ text ("Sent to " ++ invitation.inviteeNickname) ]
            ]
        , div [ class "invitation-card__actions" ]
            [ button
                [ class "btn btn--secondary btn--sm"
                , onClick (ViewInvitedSession invitation.sessionId)
                ]
                [ text "View" ]
            , button
                [ class "btn btn--secondary btn--sm"
                , onClick (CancelSentInvitation invitation.id)
                ]
                [ text "Cancel" ]
            ]
        ]


{-| Check if a user matches the filter query (case-insensitive contains).
-}
userMatchesFilter : String -> UserProfile -> Bool
userMatchesFilter query user =
    let
        lowerQuery =
            String.toLower query

        lowerNickname =
            String.toLower user.nickname

        lowerEmail =
            String.toLower user.email
    in
    String.contains lowerQuery lowerNickname || String.contains lowerQuery lowerEmail


{-| Admin dialog for listing all users and managing their API keys.
-}
viewUsersListDialog : UsersListState -> Html Msg
viewUsersListDialog state =
    div [ class "users-list-dialog" ]
        [ div [ class "dialog__header" ]
            [ h2 [ class "dialog__title" ] [ text "User Management" ]
            , button
                [ class "dialog__close"
                , onClick CloseDialog
                ]
                [ text "\u{00D7}" ]
            ]
        , div [ class "users-list-dialog__tabs" ]
            [ button
                [ class "users-list-dialog__tab"
                , classList [ ( "is-active", state.activePane == UsersPane ) ]
                , onClick SwitchUsersListPane
                ]
                [ text ("Users (" ++ String.fromInt (List.length state.users) ++ ")") ]
            , button
                [ class "users-list-dialog__tab"
                , classList [ ( "is-active", state.activePane == PendingPane ) ]
                , onClick SwitchUsersListPane
                ]
                [ text ("Pending (" ++ String.fromInt (List.length state.pendingUsers) ++ ")") ]
            ]
        , div [ class "users-list-dialog__filter" ]
            [ div [ class "users-list-dialog__filter-wrapper" ]
                [ input
                    [ class "users-list-dialog__filter-input"
                    , type_ "text"
                    , placeholder "Filter by nickname or email..."
                    , value state.filterQuery
                    , onInput UpdateUsersListFilter
                    , onEscapeClear state.filterQuery
                    ]
                    []
                , if String.isEmpty state.filterQuery then
                    text ""

                  else
                    button
                        [ class "users-list-dialog__filter-clear"
                        , onClick (UpdateUsersListFilter "")
                        , title "Clear filter (Esc)"
                        ]
                        [ text "\u{232B}" ]
                ]
            ]
        , div [ class "dialog__body" ]
            [ case state.activePane of
                UsersPane ->
                    viewUsersPane state

                PendingPane ->
                    viewPendingPane state
            ]
        , div [ class "dialog__footer" ]
            [ button
                [ class "btn btn--secondary"
                , onClick CloseDialog
                ]
                [ text "Close" ]
            , case state.activePane of
                UsersPane ->
                    button
                        [ class "btn btn--primary"
                        , onClick OpenCreateUserDialog
                        ]
                        [ text "Create User" ]

                PendingPane ->
                    text ""
            ]
        ]


{-| View for the Users pane.
-}
viewUsersPane : UsersListState -> Html Msg
viewUsersPane state =
    case state.deleteState of
        ConfirmingDelete userId nickname ->
            viewConfirmDeleteUser userId nickname

        DeletingUser _ nickname ->
            viewDeletingUser nickname

        DeleteError nickname err ->
            viewDeleteUserError nickname err

        NoDelete ->
            case state.resetState of
                ConfirmingReset userId nickname ->
                    viewConfirmResetApikey userId nickname

                ResettingApikey _ nickname ->
                    viewResettingApikey nickname

                ResetComplete nickname newApikey ->
                    viewResetApikeyComplete nickname newApikey

                NoReset ->
                    let
                        filteredUsers =
                            if String.isEmpty state.filterQuery then
                                state.users

                            else
                                List.filter (userMatchesFilter state.filterQuery) state.users
                    in
                    if List.isEmpty state.users then
                        div [ class "users-list-dialog__loading" ]
                            [ text "Loading users..." ]

                    else if List.isEmpty filteredUsers then
                        div [ class "users-list-dialog__empty" ]
                            [ text "No users match your filter." ]

                    else
                        div [ class "users-list-dialog__list" ]
                            (List.map (viewUserListItem state.currentUserId) filteredUsers)


{-| View for the Pending registrations pane.
-}
viewPendingPane : UsersListState -> Html Msg
viewPendingPane state =
    case state.pendingActionState of
        ViewingMessage userId nickname message ->
            viewRegistrationMessage userId nickname message

        ConfirmingApprove userId nickname ->
            viewConfirmApprove userId nickname

        ApprovingUser _ nickname ->
            viewApprovingUser nickname

        ApproveComplete nickname apikey ->
            viewApproveComplete nickname apikey

        ApproveError nickname err ->
            viewApproveError nickname err

        ConfirmingReject userId nickname ->
            viewConfirmReject userId nickname

        RejectingUser _ nickname ->
            viewRejectingUser nickname

        RejectError nickname err ->
            viewRejectError nickname err

        NoPendingAction ->
            let
                filteredPending =
                    if String.isEmpty state.filterQuery then
                        state.pendingUsers

                    else
                        List.filter (userMatchesFilter state.filterQuery) state.pendingUsers
            in
            if List.isEmpty state.pendingUsers then
                div [ class "users-list-dialog__empty" ]
                    [ text "No pending registration requests." ]

            else if List.isEmpty filteredPending then
                div [ class "users-list-dialog__empty" ]
                    [ text "No pending registrations match your filter." ]

            else
                div [ class "users-list-dialog__list" ]
                    (List.map viewPendingUserItem filteredPending)


viewUserListItem : String -> UserProfile -> Html Msg
viewUserListItem currentUserId user =
    let
        isSelf =
            user.id == currentUserId
    in
    div [ class "users-list-dialog__item" ]
        [ div [ class "users-list-dialog__user-info" ]
            [ div [ class "users-list-dialog__name-row" ]
                [ span [ class "users-list-dialog__nickname" ]
                    [ text user.nickname
                    , if isSelf then
                        span [ class "users-list-dialog__self-badge" ] [ text " (you)" ]

                      else
                        text ""
                    ]
                , div [ class "users-list-dialog__badges" ]
                    [ if user.isManager then
                        span [ class "users-list-dialog__badge users-list-dialog__badge--manager" ]
                            [ text "Manager" ]

                      else
                        text ""
                    , if user.isActive then
                        span [ class "users-list-dialog__badge users-list-dialog__badge--active" ]
                            [ text "Active" ]

                      else
                        span [ class "users-list-dialog__badge users-list-dialog__badge--inactive" ]
                            [ text "Inactive" ]
                    ]
                ]
            , span [ class "users-list-dialog__email" ] [ text user.email ]
            ]
        , div [ class "users-list-dialog__actions" ]
            [ if isSelf then
                text ""

              else
                button
                    [ class "users-list-dialog__delete-btn"
                    , onClick (ConfirmDeleteUser user.id user.nickname)
                    , title "Delete User"
                    ]
                    [ text "\u{1F5D1}" ]
            , button
                [ class "users-list-dialog__reset-btn"
                , onClick (ConfirmResetApikey user.id)
                , title "Reset API Key"
                ]
                [ text "\u{1F512}" ]
            ]
        ]


{-| Confirmation view for resetting API key.
-}
viewConfirmResetApikey : String -> String -> Html Msg
viewConfirmResetApikey userId nickname =
    div [ class "users-list-dialog__confirm" ]
        [ div [ class "confirm-dialog__icon is-warning" ] [ text "!" ]
        , h3 [ class "confirm-dialog__title" ] [ text "Reset API Key?" ]
        , p [ class "confirm-dialog__message" ]
            [ text ("Are you sure you want to reset the API key for " ++ nickname ++ "?")
            , br [] []
            , text "This action cannot be undone."
            ]
        , div [ class "confirm-dialog__actions" ]
            [ button
                [ class "btn btn--secondary"
                , onClick CancelResetApikey
                ]
                [ text "Cancel" ]
            , button
                [ class "btn btn--warning"
                , onClick (SubmitResetApikey userId)
                ]
                [ text "Reset API Key" ]
            ]
        ]


{-| Loading view while resetting API key.
-}
viewResettingApikey : String -> Html Msg
viewResettingApikey nickname =
    div [ class "users-list-dialog__loading" ]
        [ div [ class "spinner" ] []
        , text ("Resetting API key for " ++ nickname ++ "...")
        ]


{-| View showing the new API key after reset.
-}
viewResetApikeyComplete : String -> String -> Html Msg
viewResetApikeyComplete nickname newApikey =
    div [ class "users-list-dialog__result" ]
        [ div [ class "users-list-dialog__result-icon" ] [ text "\u{2713}" ]
        , h3 [ class "users-list-dialog__result-title" ]
            [ text ("New API Key for " ++ nickname) ]
        , div [ class "users-list-dialog__result-warning" ]
            [ text "Please save this key as the server will not show it again:" ]
        , div [ class "users-list-dialog__result-key" ]
            [ text newApikey ]
        , button
            [ class "btn btn--primary"
            , onClick CancelResetApikey
            ]
            [ text "Done" ]
        ]


{-| Confirmation view for deleting a user.
-}
viewConfirmDeleteUser : String -> String -> Html Msg
viewConfirmDeleteUser userId nickname =
    div [ class "users-list-dialog__confirm" ]
        [ div [ class "confirm-dialog__icon is-danger" ] [ text "!" ]
        , h3 [ class "confirm-dialog__title" ] [ text "Delete User?" ]
        , p [ class "confirm-dialog__message" ]
            [ text ("Are you sure you want to delete the user " ++ nickname ++ "?")
            , br [] []
            , text "This action cannot be undone."
            ]
        , div [ class "confirm-dialog__actions" ]
            [ button
                [ class "btn btn--secondary"
                , onClick CancelDeleteUser
                ]
                [ text "Cancel" ]
            , button
                [ class "btn btn--danger"
                , onClick (SubmitDeleteUser userId)
                ]
                [ text "Delete User" ]
            ]
        ]


{-| Loading view while deleting user.
-}
viewDeletingUser : String -> Html Msg
viewDeletingUser nickname =
    div [ class "users-list-dialog__loading" ]
        [ div [ class "spinner" ] []
        , text ("Deleting user " ++ nickname ++ "...")
        ]


{-| Error view when delete user fails.
-}
viewDeleteUserError : String -> String -> Html Msg
viewDeleteUserError nickname errorMsg =
    div [ class "users-list-dialog__error" ]
        [ div [ class "confirm-dialog__icon is-danger" ] [ text "!" ]
        , h3 [ class "confirm-dialog__title" ] [ text "Delete Failed" ]
        , p [ class "confirm-dialog__message" ]
            [ text ("Failed to delete user " ++ nickname ++ ":")
            , br [] []
            , text errorMsg
            ]
        , div [ class "confirm-dialog__actions" ]
            [ button
                [ class "btn btn--primary"
                , onClick CancelDeleteUser
                ]
                [ text "OK" ]
            ]
        ]


{-| Admin dialog for creating a new user.
-}
viewCreateUserDialog : CreateUserForm -> Html Msg
viewCreateUserDialog form =
    div [ class "create-user-dialog" ]
        [ div [ class "dialog__header" ]
            [ h2 [ class "dialog__title" ] [ text "Create User" ]
            , button
                [ class "dialog__close"
                , onClick CloseDialog
                ]
                [ text "\u{00D7}" ]
            ]
        , div [ class "dialog__body" ]
            [ case form.createdUser of
                Just user ->
                    viewCreateUserSuccess user

                Nothing ->
                    viewCreateUserForm form
            ]
        , div [ class "dialog__footer" ]
            [ case form.createdUser of
                Just _ ->
                    button
                        [ class "btn btn--primary"
                        , onClick OpenUsersListDialog
                        ]
                        [ text "Back to Users" ]

                Nothing ->
                    button
                        [ class "btn btn--secondary"
                        , onClick CloseDialog
                        ]
                        [ text "Cancel" ]
            , case form.createdUser of
                Just _ ->
                    text ""

                Nothing ->
                    button
                        [ class "btn btn--primary"
                        , disabled form.submitting
                        , onClick SubmitCreateUser
                        ]
                        [ text
                            (if form.submitting then
                                "Creating..."

                             else
                                "Create User"
                            )
                        ]
            ]
        ]


{-| Form for creating a new user.
-}
viewCreateUserForm : CreateUserForm -> Html Msg
viewCreateUserForm form =
    div []
        [ viewFormError form.error
        , div [ class "form-group" ]
            [ label [ class "form-label" ] [ text "Nickname" ]
            , input
                [ class "form-input"
                , type_ "text"
                , placeholder "User's nickname"
                , value form.nickname
                , onInput UpdateCreateUserNickname
                ]
                []
            ]
        , div [ class "form-group" ]
            [ label [ class "form-label" ] [ text "Email" ]
            , input
                [ class "form-input"
                , type_ "email"
                , placeholder "user@example.com"
                , value form.email
                , onInput UpdateCreateUserEmail
                ]
                []
            ]
        ]


{-| View for a pending registration item.
-}
viewPendingUserItem : UserProfile -> Html Msg
viewPendingUserItem user =
    div [ class "users-list-dialog__item" ]
        [ div [ class "users-list-dialog__user-info" ]
            [ span [ class "users-list-dialog__nickname" ] [ text user.nickname ]
            , span [ class "users-list-dialog__email" ] [ text user.email ]
            ]
        , div [ class "users-list-dialog__actions" ]
            [ case user.message of
                Just message ->
                    button
                        [ class "users-list-dialog__message-btn"
                        , onClick (ViewRegistrationMessage user.id user.nickname message)
                        , title "View registration message"
                        ]
                        [ text "\u{1F4AC}" ]

                Nothing ->
                    text ""
            , button
                [ class "btn btn--primary btn--sm"
                , onClick (ConfirmApproveRegistration user.id user.nickname)
                , title "Approve Registration"
                ]
                [ text "Approve" ]
            , button
                [ class "btn btn--danger btn--sm"
                , onClick (ConfirmRejectRegistration user.id user.nickname)
                , title "Reject Registration"
                ]
                [ text "Reject" ]
            ]
        ]


{-| View for displaying a registration message.
-}
viewRegistrationMessage : String -> String -> String -> Html Msg
viewRegistrationMessage userId nickname message =
    div [ class "users-list-dialog__message-view" ]
        [ div [ class "users-list-dialog__message-header" ]
            [ h3 [ class "users-list-dialog__message-title" ]
                [ text ("Message from " ++ nickname) ]
            ]
        , div [ class "users-list-dialog__message-content" ]
            [ p [] [ text message ] ]
        , div [ class "users-list-dialog__message-actions" ]
            [ button
                [ class "btn btn--secondary"
                , onClick CloseRegistrationMessage
                ]
                [ text "Back" ]
            , button
                [ class "btn btn--primary"
                , onClick (ConfirmApproveRegistration userId nickname)
                ]
                [ text "Approve" ]
            , button
                [ class "btn btn--danger"
                , onClick (ConfirmRejectRegistration userId nickname)
                ]
                [ text "Reject" ]
            ]
        ]


{-| Confirmation view for approving a registration.
-}
viewConfirmApprove : String -> String -> Html Msg
viewConfirmApprove userId nickname =
    div [ class "users-list-dialog__confirm" ]
        [ div [ class "confirm-dialog__icon is-success" ] [ text "\u{2713}" ]
        , h3 [ class "confirm-dialog__title" ] [ text "Approve Registration?" ]
        , p [ class "confirm-dialog__message" ]
            [ text ("Approve the registration request from " ++ nickname ++ "?")
            , br [] []
            , text "This will create their account and generate an API key."
            ]
        , div [ class "confirm-dialog__actions" ]
            [ button
                [ class "btn btn--secondary"
                , onClick CancelApproveRegistration
                ]
                [ text "Cancel" ]
            , button
                [ class "btn btn--primary"
                , onClick (SubmitApproveRegistration userId)
                ]
                [ text "Approve" ]
            ]
        ]


{-| Loading view while approving registration.
-}
viewApprovingUser : String -> Html Msg
viewApprovingUser nickname =
    div [ class "users-list-dialog__loading" ]
        [ div [ class "spinner" ] []
        , text ("Approving registration for " ++ nickname ++ "...")
        ]


{-| View showing the new API key after approval.
-}
viewApproveComplete : String -> String -> Html Msg
viewApproveComplete nickname newApikey =
    div [ class "users-list-dialog__result" ]
        [ div [ class "users-list-dialog__result-icon" ] [ text "\u{2713}" ]
        , h3 [ class "users-list-dialog__result-title" ]
            [ text ("Registration Approved: " ++ nickname) ]
        , div [ class "users-list-dialog__result-warning" ]
            [ text "Please save this API key as the server will not show it again:" ]
        , div [ class "users-list-dialog__result-key" ]
            [ text newApikey ]
        , button
            [ class "btn btn--primary"
            , onClick CancelApproveRegistration
            ]
            [ text "Done" ]
        ]


{-| Error view when approve registration fails.
-}
viewApproveError : String -> String -> Html Msg
viewApproveError nickname errorMsg =
    div [ class "users-list-dialog__error" ]
        [ div [ class "confirm-dialog__icon is-danger" ] [ text "!" ]
        , h3 [ class "confirm-dialog__title" ] [ text "Approval Failed" ]
        , p [ class "confirm-dialog__message" ]
            [ text ("Failed to approve registration for " ++ nickname ++ ":")
            , br [] []
            , text errorMsg
            ]
        , div [ class "confirm-dialog__actions" ]
            [ button
                [ class "btn btn--primary"
                , onClick CancelApproveRegistration
                ]
                [ text "OK" ]
            ]
        ]


{-| Confirmation view for rejecting a registration.
-}
viewConfirmReject : String -> String -> Html Msg
viewConfirmReject userId nickname =
    div [ class "users-list-dialog__confirm" ]
        [ div [ class "confirm-dialog__icon is-danger" ] [ text "!" ]
        , h3 [ class "confirm-dialog__title" ] [ text "Reject Registration?" ]
        , p [ class "confirm-dialog__message" ]
            [ text ("Are you sure you want to reject the registration from " ++ nickname ++ "?")
            , br [] []
            , text "This action cannot be undone."
            ]
        , div [ class "confirm-dialog__actions" ]
            [ button
                [ class "btn btn--secondary"
                , onClick CancelRejectRegistration
                ]
                [ text "Cancel" ]
            , button
                [ class "btn btn--danger"
                , onClick (SubmitRejectRegistration userId)
                ]
                [ text "Reject" ]
            ]
        ]


{-| Loading view while rejecting registration.
-}
viewRejectingUser : String -> Html Msg
viewRejectingUser nickname =
    div [ class "users-list-dialog__loading" ]
        [ div [ class "spinner" ] []
        , text ("Rejecting registration for " ++ nickname ++ "...")
        ]


{-| Error view when reject registration fails.
-}
viewRejectError : String -> String -> Html Msg
viewRejectError nickname errorMsg =
    div [ class "users-list-dialog__error" ]
        [ div [ class "confirm-dialog__icon is-danger" ] [ text "!" ]
        , h3 [ class "confirm-dialog__title" ] [ text "Rejection Failed" ]
        , p [ class "confirm-dialog__message" ]
            [ text ("Failed to reject registration for " ++ nickname ++ ":")
            , br [] []
            , text errorMsg
            ]
        , div [ class "confirm-dialog__actions" ]
            [ button
                [ class "btn btn--primary"
                , onClick CancelRejectRegistration
                ]
                [ text "OK" ]
            ]
        ]


{-| Success view after creating a user.
-}
viewCreateUserSuccess : UserProfile -> Html Msg
viewCreateUserSuccess user =
    div [ class "create-user-dialog__success" ]
        [ div [ class "create-user-dialog__success-icon" ] [ text "\u{2713}" ]
        , h3 [ class "create-user-dialog__success-title" ] [ text "User Created" ]
        , div [ class "create-user-dialog__user-info" ]
            [ div [ class "create-user-dialog__field" ]
                [ span [ class "create-user-dialog__label" ] [ text "Nickname:" ]
                , span [ class "create-user-dialog__value" ] [ text user.nickname ]
                ]
            , div [ class "create-user-dialog__field" ]
                [ span [ class "create-user-dialog__label" ] [ text "Email:" ]
                , span [ class "create-user-dialog__value" ] [ text user.email ]
                ]
            ]
        , p [ class "create-user-dialog__note" ]
            [ text "Use the \"Reset API Key\" button in the users list to generate an API key for this user." ]
        ]
