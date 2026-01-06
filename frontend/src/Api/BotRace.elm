module Api.BotRace exposing
    ( BotRace(..)
    , allRaces
    , fromInt
    , toInt
    , toString
    )

{-| Bot race types for AI players.

The race determines the visual appearance and name of bot players.

-}


{-| Available bot races.
-}
type BotRace
    = Random
    | Robotoids
    | Turindrones
    | Automitrons
    | Rototills
    | Cybertrons
    | Macintis


{-| All available bot races in order.
-}
allRaces : List BotRace
allRaces =
    [ Random
    , Robotoids
    , Turindrones
    , Automitrons
    , Rototills
    , Cybertrons
    , Macintis
    ]


{-| Convert a bot race to its API integer ID.
-}
toInt : BotRace -> Int
toInt race =
    case race of
        Random ->
            0

        Robotoids ->
            1

        Turindrones ->
            2

        Automitrons ->
            3

        Rototills ->
            4

        Cybertrons ->
            5

        Macintis ->
            6


{-| Parse an integer to a bot race. Returns Nothing for invalid values.
-}
fromInt : Int -> Maybe BotRace
fromInt n =
    case n of
        0 ->
            Just Random

        1 ->
            Just Robotoids

        2 ->
            Just Turindrones

        3 ->
            Just Automitrons

        4 ->
            Just Rototills

        5 ->
            Just Cybertrons

        6 ->
            Just Macintis

        _ ->
            Nothing


{-| Get the display name for a bot race.
-}
toString : BotRace -> String
toString race =
    case race of
        Random ->
            "Random"

        Robotoids ->
            "Robotoids"

        Turindrones ->
            "Turindrones"

        Automitrons ->
            "Automitrons"

        Rototills ->
            "Rototills"

        Cybertrons ->
            "Cybertrons"

        Macintis ->
            "Macintis"
