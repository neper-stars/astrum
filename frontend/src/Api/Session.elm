module Api.Session exposing (Session, SessionPlayer)

{-| Session type definition.

Represents a game session on a Neper server.

-}


{-| A game session.
-}
type alias Session =
    { id : String
    , name : String
    , isPublic : Bool
    , members : List String
    , managers : List String
    , started : Bool
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
    }
