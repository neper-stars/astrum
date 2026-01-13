module View.Helpers exposing
    ( getCurrentUserId
    , getNickname
    , onMouseDownTarget
    , viewFormError
    )

{-| Shared view helper functions used across multiple view modules.
-}

import Api.UserProfile exposing (UserProfile)
import Html exposing (..)
import Html.Attributes exposing (..)
import Html.Events exposing (..)
import Json.Decode as Decode
import Model
import Msg exposing (Msg)


{-| Display a form error message, or nothing if no error.
-}
viewFormError : Maybe String -> Html Msg
viewFormError maybeError =
    case maybeError of
        Nothing ->
            text ""

        Just error ->
            div [ class "connect-dialog__error" ]
                [ text error ]


{-| Handle mousedown only if the target element has the specified class.
Similar to onClickTarget but uses mousedown event. This prevents accidental
dialog closing when user selects text in an input and releases mouse outside.
-}
onMouseDownTarget : String -> Msg -> Attribute Msg
onMouseDownTarget targetClass msg =
    on "mousedown"
        (Decode.field "target" (Decode.field "className" Decode.string)
            |> Decode.andThen
                (\className ->
                    if String.contains targetClass className then
                        Decode.succeed msg

                    else
                        Decode.fail "not target"
                )
        )


{-| Get the current user ID from the connection state.
Re-exported from Model.
-}
getCurrentUserId : Model.Model -> Maybe String
getCurrentUserId =
    Model.getCurrentUserId


{-| Look up a user's nickname by their ID. Falls back to the ID if not found.
-}
getNickname : List UserProfile -> String -> String
getNickname userProfiles userId =
    userProfiles
        |> List.filter (\u -> u.id == userId)
        |> List.head
        |> Maybe.map .nickname
        |> Maybe.withDefault userId
