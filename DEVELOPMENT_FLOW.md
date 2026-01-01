# Development Flow: Adding a New Server API Endpoint

This document describes the step-by-step process for implementing a new endpoint from the Neper server API in the Astrum client.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              Elm Frontend                               │
│  ┌─────────┐    ┌─────────┐    ┌──────────┐    ┌───────────────────┐    │
│  │  View   │───▶│   Msg   │───▶│  Update  │───▶│  Ports (outgoing) │    │
│  └─────────┘    └─────────┘    └──────────┘    └───────────────────┘    │
│       ▲                                                   │             │
│       │                                                   ▼             │
│  ┌─────────┐    ┌─────────────┐    ┌──────────────────────────────┐     │
│  │  Model  │◀───│Subscriptions│◀───│      Ports (incoming)        │     │
│  └─────────┘    └─────────────┘    └──────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────────┘
                                        │                 ▲
                                        ▼                 │
┌─────────────────────────────────────────────────────────────────────────┐
│                         JavaScript (index.html)                         │
│                     Port handlers: Elm ←→ Wails/Go                      │
└─────────────────────────────────────────────────────────────────────────┘
                                        │                 ▲
                                        ▼                 │
┌─────────────────────────────────────────────────────────────────────────┐
│                              Go Backend                                 │
│  ┌─────────────┐         ┌─────────────┐         ┌─────────────┐        │
│  │   app.go    │────────▶│  api/*.go   │────────▶│ Neper Server│        │
│  │ (Wails App) │         │  (Client)   │         │   (HTTP)    │        │
│  └─────────────┘         └─────────────┘         └─────────────┘        │
└─────────────────────────────────────────────────────────────────────────┘
```

## Step-by-Step Implementation

### 1. Update Go API Types (`api/types.go`)

If the endpoint uses new data structures, add or update the Go types.

```go
// Example: Adding a new type
type MyNewType struct {
    ID          string `json:"id,omitempty"`
    Name        string `json:"name"`
    Description string `json:"description,omitempty"`
}
```

**Notes:**
- Use `json:"field_name"` tags matching the server's JSON format (usually snake_case)
- Use `omitempty` for optional fields

### 2. Add API Client Method (`api/sessions.go` or appropriate file)

Add the HTTP client method that calls the Neper server.

```go
// Example: GET request
func (c *Client) ListMyThings(ctx context.Context) ([]MyNewType, error) {
    resp, err := c.doRequest(ctx, "GET", "/api/v1/mythings", nil, true)
    if err != nil {
        return nil, err
    }

    var things []MyNewType
    if err := parseResponse(resp, &things); err != nil {
        return nil, err
    }

    return things, nil
}

// Example: POST request
func (c *Client) CreateMyThing(ctx context.Context, thing *MyNewType) (*MyNewType, error) {
    resp, err := c.doRequest(ctx, "POST", "/api/v1/mythings", thing, true)
    if err != nil {
        return nil, err
    }

    var created MyNewType
    if err := parseResponse(resp, &created); err != nil {
        return nil, err
    }

    return &created, nil
}

// Example: DELETE request (no response body)
func (c *Client) DeleteMyThing(ctx context.Context, thingID string) error {
    path := fmt.Sprintf("/api/v1/mythings/%s", thingID)
    resp, err := c.doRequest(ctx, "DELETE", path, nil, true)
    if err != nil {
        return err
    }

    if err := parseResponse(resp, nil); err != nil {
        return err
    }

    return nil
}
```

### 3. Add Wails-Exposed Method (`app.go`)

Create a method that the frontend can call. This bridges the API client with the Elm frontend.

```go
// MyThingInfo is the JSON-friendly representation for the frontend
// Use camelCase for JSON tags (frontend convention)
type MyThingInfo struct {
    ID          string `json:"id"`
    Name        string `json:"name"`
    Description string `json:"description"`
}

// GetMyThings returns all things for the current server
func (a *App) GetMyThings(serverURL string) ([]MyThingInfo, error) {
    a.mu.RLock()
    client, ok := a.clients[serverURL]
    mgr, mgrOk := a.authManagers[serverURL]
    a.mu.RUnlock()

    if !ok || !mgrOk {
        return nil, fmt.Errorf("not connected to server: %s", serverURL)
    }

    things, err := client.ListMyThings(mgr.GetContext())
    if err != nil {
        return nil, fmt.Errorf("failed to get things: %w", err)
    }

    result := make([]MyThingInfo, len(things))
    for i, t := range things {
        result[i] = MyThingInfo{
            ID:          t.ID,
            Name:        t.Name,
            Description: t.Description,
        }
    }

    return result, nil
}
```

**Notes:**
- Always check connection state before making API calls
- Use `a.mu.RLock()` for read operations, release before calling API
- Convert snake_case (API) to camelCase (frontend) in the Info struct
- Use `fmt.Errorf` with `%w` for error wrapping

### 4. Add Elm Type (`frontend/src/Api/MyThing.elm`)

Create a new Elm module for the type.

```elm
module Api.MyThing exposing (MyThing)

{-| MyThing type definition.
-}


type alias MyThing =
    { id : String
    , name : String
    , description : String
    }
```

### 5. Add Elm Decoder (`frontend/src/Api/Decode.elm`)

Add the JSON decoder for the new type.

```elm
-- Add to module exposing list
module Api.Decode exposing
    ( ...
    , myThing
    , myThingList
    )

-- Add import
import Api.MyThing exposing (MyThing)

-- Add decoder
{-| Decode a single MyThing.
-}
myThing : Decoder MyThing
myThing =
    D.map3 MyThing
        (D.field "id" D.string)
        (D.field "name" D.string)
        (D.field "description" D.string)


{-| Decode a list of MyThings.
-}
myThingList : Decoder (List MyThing)
myThingList =
    D.oneOf
        [ D.list myThing
        , D.null []
        ]
```

**Notes:**
- Use `D.map2`, `D.map3`, etc. up to `D.map8`
- For optional fields: `D.oneOf [ D.field "field" D.string, D.succeed "" ]`
- Always handle null lists with `D.oneOf [ D.list decoder, D.null [] ]`

### 6. Add Elm Encoder (if needed) (`frontend/src/Api/Encode.elm`)

For POST/PUT requests, add an encoder.

```elm
-- Add to module exposing list
module Api.Encode exposing
    ( ...
    , createMyThing
    )

{-| Encode create MyThing request.
-}
createMyThing : String -> String -> String -> E.Value
createMyThing serverUrl name description =
    E.object
        [ ( "serverUrl", E.string serverUrl )
        , ( "name", E.string name )
        , ( "description", E.string description )
        ]
```

### 7. Add Elm Ports (`frontend/src/Ports.elm`)

Add outgoing (Elm → JS) and incoming (JS → Elm) ports.

```elm
port module Ports exposing
    ( ...
    -- Add to exposing list
    , getMyThings
    , createMyThing
    , myThingsReceived
    , myThingCreated
    )

-- Outgoing ports
port getMyThings : String -> Cmd msg

port createMyThing : E.Value -> Cmd msg

-- Incoming ports
port myThingsReceived : (D.Value -> msg) -> Sub msg

port myThingCreated : (D.Value -> msg) -> Sub msg
```

### 8. Add Elm Messages (`frontend/src/Msg.elm`)

Add messages for the new functionality.

```elm
module Msg exposing (Msg(..))

import Api.MyThing exposing (MyThing)

type Msg
    = ...
    -- Add new messages
    | LoadMyThings
    | GotMyThings (Result String (List MyThing))
    | CreateMyThing String String  -- name, description
    | MyThingCreated (Result String MyThing)
```

### 9. Update Elm Model (if needed) (`frontend/src/Model.elm`)

Add state for the new data.

```elm
import Api.MyThing exposing (MyThing)

type alias Model =
    { ...
    , myThings : List MyThing
    }

init : Flags -> ( Model, Cmd msg )
init _ =
    ( { ...
      , myThings = []
      }
    , Cmd.none
    )
```

### 10. Add Elm Subscriptions (`frontend/src/Subscriptions.elm`)

Subscribe to the incoming ports.

```elm
subscriptions : Model -> Sub Msg
subscriptions _ =
    Sub.batch
        [ ...
        , Ports.myThingsReceived (decodeResult Decode.myThingList GotMyThings)
        , Ports.myThingCreated (decodeResult Decode.myThing MyThingCreated)
        ]
```

### 11. Add Elm Update Handler (`frontend/src/Update.elm`)

Handle the new messages.

```elm
update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        ...

        LoadMyThings ->
            case model.selectedServerUrl of
                Just serverUrl ->
                    ( model, Ports.getMyThings serverUrl )

                Nothing ->
                    ( model, Cmd.none )

        GotMyThings result ->
            case result of
                Ok things ->
                    ( { model | myThings = things }, Cmd.none )

                Err _ ->
                    ( { model | myThings = [] }, Cmd.none )

        CreateMyThing name description ->
            case model.selectedServerUrl of
                Just serverUrl ->
                    ( model
                    , Ports.createMyThing
                        (Encode.createMyThing serverUrl name description)
                    )

                Nothing ->
                    ( model, Cmd.none )

        MyThingCreated result ->
            case result of
                Ok thing ->
                    ( { model | myThings = thing :: model.myThings }
                    , Cmd.none
                    )

                Err _ ->
                    ( model, Cmd.none )
```

### 12. Add JavaScript Port Handlers (`frontend/static/index.html`)

Wire up the ports to call Go methods.

```javascript
// In the script section, add:

if (app.ports.getMyThings) {
    app.ports.getMyThings.subscribe(async (serverUrl) => {
        callGo(app.ports.myThingsReceived,
            window.go.main.App.GetMyThings(serverUrl));
    });
}

if (app.ports.createMyThing) {
    app.ports.createMyThing.subscribe(async (data) => {
        callGo(app.ports.myThingCreated,
            window.go.main.App.CreateMyThing(
                data.serverUrl,
                data.name,
                data.description
            ));
    });
}
```

**Notes:**
- Use `callGo` helper for simple request/response
- Use `callGoWithContext` if you need to include serverUrl in the response

### 13. Add Elm View (`frontend/src/View.elm`)

Add the UI components.

```elm
viewMyThings : List MyThing -> Html Msg
viewMyThings things =
    div [ class "my-things" ]
        [ h2 [] [ text "My Things" ]
        , if List.isEmpty things then
            div [ class "my-things__empty" ]
                [ text "No things found" ]
          else
            div [ class "my-things__list" ]
                (List.map viewMyThing things)
        ]

viewMyThing : MyThing -> Html Msg
viewMyThing thing =
    div [ class "my-thing-card" ]
        [ div [ class "my-thing-card__name" ]
            [ text thing.name ]
        , div [ class "my-thing-card__description" ]
            [ text thing.description ]
        ]
```

### 14. Add SCSS Styles (`frontend/styles/components/`)

Create or update SCSS for the new components.

```scss
// frontend/styles/components/_my-things.scss

@use '../variables' as *;
@use '../mixins' as *;

.my-things {
  padding: $spacing-md;

  &__empty {
    color: $text-secondary;
    font-style: italic;
    text-align: center;
    padding: $spacing-xl;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
  }
}

.my-thing-card {
  background-color: $bg-secondary;
  border-radius: $radius-md;
  padding: $spacing-md;

  &__name {
    font-size: $font-size-md;
    font-weight: $font-weight-medium;
    color: $text-primary;
  }

  &__description {
    font-size: $font-size-sm;
    color: $text-secondary;
    margin-top: $spacing-xs;
  }
}
```

Don't forget to import in `main.scss`:

```scss
@use 'components/my-things';
```

## Build Commands

After making changes, build with:

```bash
# Build Go backend
go build ./...

# Build Elm frontend
cd frontend && npm run build:elm

# Build SCSS
npm run build:scss

# Or build everything
cd .. && task build
```

## File Summary

| Layer      | File                                | Purpose                             |
|------------|-------------------------------------|-------------------------------------|
| Go API     | `api/types.go`                      | Data structures matching server API |
| Go API     | `api/sessions.go`                   | HTTP client methods                 |
| Go App     | `app.go`                            | Wails-exposed methods for frontend  |
| Elm Types  | `frontend/src/Api/MyThing.elm`      | Elm type alias                      |
| Elm Decode | `frontend/src/Api/Decode.elm`       | JSON decoders                       |
| Elm Encode | `frontend/src/Api/Encode.elm`       | JSON encoders (for POST/PUT)        |
| Elm Ports  | `frontend/src/Ports.elm`            | Port declarations                   |
| Elm Msg    | `frontend/src/Msg.elm`              | Message types                       |
| Elm Model  | `frontend/src/Model.elm`            | Application state                   |
| Elm Subs   | `frontend/src/Subscriptions.elm`    | Port subscriptions                  |
| Elm Update | `frontend/src/Update.elm`           | Message handlers                    |
| Elm View   | `frontend/src/View.elm`             | UI rendering                        |
| JS         | `frontend/static/index.html`        | Port ↔ Go wiring                    |
| SCSS       | `frontend/styles/components/*.scss` | Component styles                    |

## Common Patterns

### Handling Errors

Always use `Result String a` for operations that can fail:

```elm
-- In Msg
| GotData (Result String Data)

-- In Update
GotData result ->
    case result of
        Ok data ->
            ( { model | data = data, error = Nothing }, Cmd.none )

        Err errorMsg ->
            ( { model | error = Just errorMsg }, Cmd.none )
```

### Loading States

For operations that take time:

```elm
-- In Model
type alias Model =
    { ...
    , loading : Bool
    }

-- In Update
LoadData ->
    ( { model | loading = True }
    , Ports.getData serverUrl
    )

GotData result ->
    ( { model | loading = False, ... }, Cmd.none )
```

### Dialog Forms

For create/edit dialogs, use a form record:

```elm
-- In Model
type alias MyThingForm =
    { name : String
    , description : String
    , submitting : Bool
    , error : Maybe String
    }

emptyMyThingForm : MyThingForm
emptyMyThingForm =
    { name = ""
    , description = ""
    , submitting = False
    , error = Nothing
    }
```
