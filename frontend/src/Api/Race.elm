module Api.Race exposing (Race)

{-| Race type definition.

Represents a race file uploaded by a user for Stars! games.

-}


{-| A race definition.
-}
type alias Race =
    { id : String
    , userId : String
    , nameSingular : String
    , namePlural : String
    }
