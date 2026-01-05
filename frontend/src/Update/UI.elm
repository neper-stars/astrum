module Update.UI exposing
    ( handleCancelEnableBrowserStars
    , handleClearError
    , handleConfirmEnableBrowserStars
    , handleEnableBrowserStarsSet
    , handleEscapePressed
    , handleRequestEnableBrowserStars
    , handleZoomIn
    , handleZoomLevelSet
    , handleZoomOut
    , handleZoomReset
    )

{-| Update handlers for UI-related messages.

Handles zoom controls, escape key, error clearing, and browser Stars! feature toggle.

-}

import Model exposing (..)
import Msg exposing (Msg)
import Ports



-- =============================================================================
-- ERROR HANDLING
-- =============================================================================


{-| Clear the global error message.
-}
handleClearError : Model -> ( Model, Cmd Msg )
handleClearError model =
    ( { model | error = Nothing }
    , Cmd.none
    )


{-| Handle Escape key press - close dialogs and menus.
-}
handleEscapePressed : Model -> ( Model, Cmd Msg )
handleEscapePressed model =
    ( { model
        | dialog = Nothing
        , contextMenu = Nothing
        , showUserMenu = False
      }
    , Cmd.none
    )



-- =============================================================================
-- ZOOM CONTROLS
-- =============================================================================


{-| Handle zoom in request.
-}
handleZoomIn : Model -> ( Model, Cmd Msg )
handleZoomIn model =
    let
        currentLevel =
            model.appSettings
                |> Maybe.map .zoomLevel
                |> Maybe.withDefault 100

        newLevel =
            min 200 (currentLevel + 10)
    in
    ( model
    , Ports.setZoomLevel newLevel
    )


{-| Handle zoom out request.
-}
handleZoomOut : Model -> ( Model, Cmd Msg )
handleZoomOut model =
    let
        currentLevel =
            model.appSettings
                |> Maybe.map .zoomLevel
                |> Maybe.withDefault 100

        newLevel =
            max 50 (currentLevel - 10)
    in
    ( model
    , Ports.setZoomLevel newLevel
    )


{-| Handle zoom reset request.
-}
handleZoomReset : Model -> ( Model, Cmd Msg )
handleZoomReset model =
    ( model
    , Ports.setZoomLevel 100
    )


{-| Handle zoom level set result from backend.
-}
handleZoomLevelSet : Model -> Result String AppSettings -> ( Model, Cmd Msg )
handleZoomLevelSet model result =
    case result of
        Ok settings ->
            ( { model | appSettings = Just settings }
            , Cmd.none
            )

        Err _ ->
            ( model, Cmd.none )



-- =============================================================================
-- BROWSER STARS! FEATURE
-- =============================================================================


{-| Handle request to enable/disable browser Stars! feature.
-}
handleRequestEnableBrowserStars : Model -> Bool -> ( Model, Cmd Msg )
handleRequestEnableBrowserStars model enabled =
    if enabled then
        -- Show confirmation dialog when enabling
        ( { model | confirmingBrowserStars = True }, Cmd.none )

    else
        -- Disable directly without confirmation
        ( model, Ports.setEnableBrowserStars False )


{-| Handle user confirming the browser Stars! warning.
-}
handleConfirmEnableBrowserStars : Model -> ( Model, Cmd Msg )
handleConfirmEnableBrowserStars model =
    ( { model | confirmingBrowserStars = False }
    , Ports.setEnableBrowserStars True
    )


{-| Handle user cancelling the browser Stars! warning.
-}
handleCancelEnableBrowserStars : Model -> ( Model, Cmd Msg )
handleCancelEnableBrowserStars model =
    ( { model | confirmingBrowserStars = False }, Cmd.none )


{-| Handle browser Stars! setting result from backend.
-}
handleEnableBrowserStarsSet : Model -> Result String AppSettings -> ( Model, Cmd Msg )
handleEnableBrowserStarsSet model result =
    case result of
        Ok settings ->
            ( { model | appSettings = Just settings }
            , Cmd.none
            )

        Err _ ->
            ( model, Cmd.none )
