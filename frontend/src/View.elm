module View exposing (view)

{-| Main view module.

This module simply re-exports the view function from View.Layout.
The actual implementation is split into submodules under the View/ directory:

  - View.Layout - Main layout, header, content, status bar
  - View.ServerBar - Server bar on the left
  - View.SessionList - Session list and cards
  - View.SessionDetail - Session detail view
  - View.Menus - Context menu and user menu
  - View.Dialog - Dialog router
  - View.Dialog.Server - Add/Edit/Remove server dialogs
  - View.Dialog.Auth - Connect/Register dialogs
  - View.Dialog.Session - Create session dialog
  - View.Dialog.Users - User-related dialogs
  - View.Dialog.Races - Race-related dialogs
  - View.Dialog.Rules - Rules dialog
  - View.Dialog.TurnFiles - Turn files dialog
  - View.Dialog.Settings - Settings dialog
  - View.Dialog.ApiKey - Change API key dialog
  - View.Helpers - Shared helper functions

-}

import Html exposing (Html)
import Model exposing (Model)
import Msg exposing (Msg)
import View.Layout


{-| Main view function for the application.
-}
view : Model -> Html Msg
view =
    View.Layout.view
