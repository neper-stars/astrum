module Api.UserProfile exposing (UserProfile, decoder)

{-| UserProfile type definition.

Represents a user profile on a Neper server.

-}

import Json.Decode as D
import Json.Decode.Pipeline exposing (optional, required)


{-| A user profile.
-}
type alias UserProfile =
    { id : String
    , nickname : String
    , email : String
    , isActive : Bool
    , isManager : Bool
    , message : Maybe String -- Registration message (for pending users)
    }


{-| JSON decoder for UserProfile.
-}
decoder : D.Decoder UserProfile
decoder =
    D.succeed UserProfile
        |> required "id" D.string
        |> required "nickname" D.string
        |> required "email" D.string
        |> required "isActive" D.bool
        |> required "isManager" D.bool
        |> optional "message" (D.maybe D.string) Nothing
