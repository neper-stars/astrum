module Main exposing (main)

{-| Main entry point for the Astrum application.

This module wires together the Elm Architecture components:
Model, Update, View, and Subscriptions.

-}

import Browser
import Model exposing (Flags, Model)
import Msg exposing (Msg)
import Ports
import Subscriptions exposing (subscriptions)
import Update exposing (update)
import View exposing (view)


main : Program Flags Model Msg
main =
    Browser.element
        { init = init
        , update = update
        , subscriptions = subscriptions
        , view = view
        }


{-| Initialize the application.

On startup, we immediately request the list of servers from the Go backend.

-}
init : Flags -> ( Model, Cmd Msg )
init _ =
    let
        ( model, cmd ) =
            Model.init
    in
    ( model
    , Cmd.batch
        [ cmd
        , Ports.getServers ()
        , Ports.hasDefaultServer ()
        ]
    )
