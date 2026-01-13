module Api.AIType exposing
    ( AIType(..)
    , allTypes
    , fromString
    , toDisplayName
    , toRaceName
    , toString
    )

{-| AI control types for switching human players to AI control.

These are the different AI "expert" personalities available in Stars!

-}


{-| Available AI expert types.
-}
type AIType
    = HE -- Hyper Expansion (Robotoids)
    | SS -- Super Stealth (Turindromes)
    | IS -- Inner Strength (Automitrons)
    | CA -- Claim Adjuster (Rototills)
    | PP -- Packet Physics (Cybertrons)
    | AR -- Alternate Reality (Macinti)


{-| All available AI types in order.
-}
allTypes : List AIType
allTypes =
    [ HE
    , SS
    , IS
    , CA
    , PP
    , AR
    ]


{-| Convert an AI type to its API string code.
-}
toString : AIType -> String
toString aiType =
    case aiType of
        HE ->
            "HE"

        SS ->
            "SS"

        IS ->
            "IS"

        CA ->
            "CA"

        PP ->
            "PP"

        AR ->
            "AR"


{-| Parse a string to an AI type. Returns Nothing for invalid values.
-}
fromString : String -> Maybe AIType
fromString str =
    case str of
        "HE" ->
            Just HE

        "SS" ->
            Just SS

        "IS" ->
            Just IS

        "CA" ->
            Just CA

        "PP" ->
            Just PP

        "AR" ->
            Just AR

        _ ->
            Nothing


{-| Get the display name for an AI type.
-}
toDisplayName : AIType -> String
toDisplayName aiType =
    case aiType of
        HE ->
            "Hyper Expansion"

        SS ->
            "Super Stealth"

        IS ->
            "Inner Strength"

        CA ->
            "Claim Adjuster"

        PP ->
            "Packet Physics"

        AR ->
            "Alternate Reality"


{-| Get the race name for an AI type.
-}
toRaceName : AIType -> String
toRaceName aiType =
    case aiType of
        HE ->
            "Robotoids"

        SS ->
            "Turindromes"

        IS ->
            "Automitrons"

        CA ->
            "Rototills"

        PP ->
            "Cybertrons"

        AR ->
            "Macinti"
