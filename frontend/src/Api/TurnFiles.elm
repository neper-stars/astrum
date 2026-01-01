module Api.TurnFiles exposing (TurnFiles)

{-| Turn files from the server.

Each turn includes the universe file (.xy) and player's turn file (.mN).

-}


{-| Turn files for a specific year.
-}
type alias TurnFiles =
    { sessionId : String
    , year : Int
    , universe : String -- Base64 encoded .xy file
    , turn : String -- Base64 encoded .mN file
    }
