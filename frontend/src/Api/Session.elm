module Api.Session exposing (Session, SessionPlayer, SessionState(..), isArchived, isStarted)

{-| Session type definition.

Represents a game session on a Neper server.

-}


{-| Session state enum.
-}
type SessionState
    = Pending
    | Started
    | Archived


{-| Check if a session is started (game in progress).
-}
isStarted : Session -> Bool
isStarted session =
    session.state == Started


{-| Check if a session is archived (game finished).
-}
isArchived : Session -> Bool
isArchived session =
    session.state == Archived


{-| A game session.
-}
type alias Session =
    { id : String
    , name : String
    , isPublic : Bool
    , members : List String
    , managers : List String
    , state : SessionState
    , rulesIsSet : Bool
    , players : List SessionPlayer
    , pendingInvitation : Bool -- True if current user has pending invitation (from API)
    }


{-| A player in a session with ready state.
-}
type alias SessionPlayer =
    { userProfileId : String
    , ready : Bool
    , playerOrder : Int
    , isBot : Bool
    , botRaceName : Maybe String
    }
