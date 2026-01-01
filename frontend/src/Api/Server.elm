module Api.Server exposing (Server)

{-| Server type definition.

Represents a Neper server that Astrum can connect to.

-}


{-| A server configuration.
-}
type alias Server =
    { url : String
    , name : String
    , iconUrl : Maybe String
    , hasCredentials : Bool
    , defaultUsername : Maybe String
    , isConnected : Bool
    , order : Int
    }
