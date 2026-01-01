module View.Helpers exposing
    ( viewFormError
    , onClickTarget
    , getCurrentUserId
    , getNickname
    )

{-| Shared view helper functions used across multiple view modules.
-}

import Api.UserProfile exposing (UserProfile)
import Html exposing (..)
import Html.Attributes exposing (..)
import Html.Events exposing (..)
import Json.Decode as Decode
import Model exposing (..)
import Msg exposing (Msg(..))


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


{-| Handle click only if the target element has the specified class.
This allows clicking on child elements without triggering the parent handler.
-}
onClickTarget : String -> Msg -> Attribute Msg
onClickTarget targetClass msg =
    on "click"
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
-}
getCurrentUserId : Model -> Maybe String
getCurrentUserId model =
    case (getCurrentServerData model).connectionState of
        Connected info ->
            Just info.userId

        _ ->
            Nothing


{-| Look up a user's nickname by their ID. Falls back to the ID if not found.
-}
getNickname : List UserProfile -> String -> String
getNickname userProfiles userId =
    userProfiles
        |> List.filter (\u -> u.id == userId)
        |> List.head
        |> Maybe.map .nickname
        |> Maybe.withDefault userId
