module Api.Invitation exposing (Invitation)

{-| Invitation type definition.

Represents an invitation to join a game session.

-}


{-| An invitation to join a session.
-}
type alias Invitation =
    { id : String
    , sessionId : String
    , sessionName : String
    , userProfileId : String
    , inviterId : String
    , inviterNickname : String
    , inviteeNickname : String -- For sent invitations
    }
