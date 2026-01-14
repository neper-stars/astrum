module Api.PlayerControl exposing
    ( ControlStatus(..)
    , PlayerControlStatus
    , controlStatusFromString
    )

{-| Player control status for AI switching functionality.

This module defines types for tracking whether players are controlled
by humans or AI in a session. Only session managers can see this info.

-}


{-| Control status indicates if a player is human or AI controlled.
-}
type ControlStatus
    = Human
    | AI


{-| Player control status information.
-}
type alias PlayerControlStatus =
    { playerOrder : Int
    , userProfileId : String
    , nickname : String
    , isBot : Bool -- Original player type (bot slot vs human slot)
    , aiControlType : Maybe String -- AI type code if AI-controlled, Nothing if human
    , controlStatus : ControlStatus -- Current control: Human or AI
    }


{-| Parse control status from string.
-}
controlStatusFromString : String -> ControlStatus
controlStatusFromString str =
    case str of
        "ai" ->
            AI

        _ ->
            Human
