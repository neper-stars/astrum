module Api.BotLevel exposing
    ( BotLevel(..)
    , allLevels
    , fromInt
    , toInt
    , toString
    )

{-| Bot difficulty levels for AI players.
-}


{-| Available bot difficulty levels.
-}
type BotLevel
    = Random
    | Easy
    | Standard
    | Tough
    | Expert


{-| All available bot levels in order.
-}
allLevels : List BotLevel
allLevels =
    [ Random
    , Easy
    , Standard
    , Tough
    , Expert
    ]


{-| Convert a bot level to its API integer ID.
-}
toInt : BotLevel -> Int
toInt level =
    case level of
        Random ->
            0

        Easy ->
            1

        Standard ->
            2

        Tough ->
            3

        Expert ->
            4


{-| Parse an integer to a bot level. Returns Nothing for invalid values.
-}
fromInt : Int -> Maybe BotLevel
fromInt n =
    case n of
        0 ->
            Just Random

        1 ->
            Just Easy

        2 ->
            Just Standard

        3 ->
            Just Tough

        4 ->
            Just Expert

        _ ->
            Nothing


{-| Get the display name for a bot level.
-}
toString : BotLevel -> String
toString level =
    case level of
        Random ->
            "Random"

        Easy ->
            "Easy"

        Standard ->
            "Standard"

        Tough ->
            "Tough"

        Expert ->
            "Expert"
