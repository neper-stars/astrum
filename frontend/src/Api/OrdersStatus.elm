module Api.OrdersStatus exposing (OrdersStatus, PlayerOrderStatus)

{-| Order submission status for the pending turn.

Shows which players have submitted their orders for the current pending year.

-}


{-| Order status for all players in a session's pending turn.
-}
type alias OrdersStatus =
    { sessionId : String
    , pendingYear : Int
    , players : List PlayerOrderStatus
    }


{-| Order submission status for a single player.
-}
type alias PlayerOrderStatus =
    { playerOrder : Int
    , nickname : String
    , isBot : Bool
    , submitted : Bool
    }
