module Model exposing
    ( AppSettings
    , ChangeApikeyState(..)
    , ConnectForm
    , ConnectedInfo
    , ConnectionState(..)
    , ContextMenu
    , CreateSessionForm
    , CreateUserForm
    , DeleteUserState(..)
    , Dialog(..)
    , DragState
    , FetchResult
    , Flags
    , HabButton(..)
    , HabitabilityDisplay
    , InviteForm
    , LRTInfo
    , MapOptions
    , MapOutputFormat(..)
    , MapViewerForm
    , Model
    , NtvdmCheckResult
    , PRTInfo
    , PendingActionState(..)
    , RaceBuilderForm
    , RaceBuilderMode(..)
    , RaceBuilderOrigin(..)
    , RaceBuilderTab(..)
    , RaceConfig
    , RaceValidation
    , RaceValidationError
    , RegisterForm
    , ResetApikeyState(..)
    , RulesForm
    , ServerData
    , ServerDragState
    , ServerForm
    , SessionDetailView
    , SessionFilter(..)
    , SetupRaceForm
    , TurnFilesForm
    , UsersListPane(..)
    , UsersListState
    , defaultRaceConfig
    , emptyConnectForm
    , emptyCreateUserForm
    , emptyHabitabilityDisplay
    , emptyInviteForm
    , emptyMapViewerForm
    , emptyRaceBuilderForm
    , emptyRegisterForm
    , emptyServerData
    , emptyServerForm
    , emptySetupRaceForm
    , emptyTurnFilesForm
    , emptyUsersListState
    , getConnectionState
    , getCurrentServerData
    , getServerByUrl
    , getServerData
    , getSessionById
    , init
    , isConnected
    , updateServerData
    )

{-| Application state model.

This module defines the complete state of the Astrum application,
including servers, sessions, connection state, and UI state.

-}

import Api.Invitation exposing (Invitation)
import Api.OrdersStatus exposing (OrdersStatus)
import Api.Race exposing (Race)
import Api.Rules exposing (Rules)
import Api.Server exposing (Server)
import Api.Session exposing (Session)
import Api.TurnFiles exposing (TurnFiles)
import Api.UserProfile exposing (UserProfile)
import Dict exposing (Dict)
import Set exposing (Set)



-- =============================================================================
-- FLAGS
-- =============================================================================


{-| Flags passed from JavaScript on initialization.
Currently empty but reserved for future use (e.g., initial config).
-}
type alias Flags =
    {}



-- =============================================================================
-- MODEL
-- =============================================================================


{-| App settings (global configuration).
-}
type alias AppSettings =
    { serversDir : String
    , autoDownloadStars : Bool
    , zoomLevel : Int
    , useWine : Bool
    , winePrefixesDir : String
    , validWineInstall : Bool
    , enableBrowserStars : Bool
    }


{-| Result of an NTVDM availability check (Windows).
-}
type alias NtvdmCheckResult =
    { available : Bool
    , is64Bit : Bool
    , message : String
    , helpUrl : Maybe String
    }


{-| The complete application state.
-}
type alias Model =
    { -- Server list (from config)
      servers : List Server
    , selectedServerUrl : Maybe String

    -- Per-server data (sessions, invitations, races, etc.)
    , serverData : Dict String ServerData

    -- App settings (global configuration)
    , appSettings : Maybe AppSettings

    -- Wine check state (transient, not persisted)
    , wineCheckInProgress : Bool
    , wineCheckMessage : Maybe String

    -- NTVDM check state (Windows, transient)
    , ntvdmCheckInProgress : Bool
    , ntvdmCheckResult : Maybe NtvdmCheckResult

    -- Session view state
    , selectedSessionId : Maybe String
    , sessionFilter : SessionFilter
    , sessionDetail : Maybe SessionDetailView

    -- UI state
    , dialog : Maybe Dialog
    , contextMenu : Maybe ContextMenu
    , showUserMenu : Bool
    , toast : Maybe String -- Temporary success message
    , loading : Bool
    , error : Maybe String
    , confirmingBrowserStars : Bool -- Showing confirmation dialog for browser Stars! feature

    -- Long-running operations
    , startingSessionId : Maybe String -- Session ID currently being started (loading state)
    , pendingViewSessionId : Maybe String -- Session ID to view after fetching (from invitation)

    -- Server drag state for reordering
    , serverDragState : Maybe ServerDragState
    }


{-| Result of a session fetch operation for status bar display.
-}
type alias FetchResult =
    { sessionCount : Int
    , durationMs : Int
    }


{-| Per-server data - each server has its own sessions, invitations, etc.
-}
type alias ServerData =
    { connectionState : ConnectionState
    , sessions : List Session
    , userProfiles : List UserProfile
    , pendingRegistrationsCount : Int -- count of pending registrations (for badge)
    , invitations : List Invitation
    , sentInvitations : List Invitation -- invitations sent by current user
    , races : List Race
    , sessionRules : Dict String Rules -- sessionId -> Rules
    , sessionTurns : Dict String (Dict Int TurnFiles) -- sessionId -> (year -> TurnFiles)
    , sessionOrdersStatus : Dict String (Dict Int OrdersStatus) -- sessionId -> (year -> OrdersStatus)
    , orderConflicts : Dict String (Set Int) -- sessionId -> Set of years with local file conflicts
    , sessionHasStarsExe : Dict String Bool -- sessionId -> whether stars.exe exists in game dir
    , sessionPlayerRaces : Dict String Race -- sessionId -> current user's race for that session
    , lastViewedSession : Maybe String -- sessionId of last viewed session for this server
    , fetchingSessions : Bool -- whether we're currently fetching sessions
    , fetchStartTime : Maybe Int -- milliseconds since epoch when fetch started
    , lastFetchResult : Maybe FetchResult -- result of last fetch for status bar
    , archivedSessionsFetched : Bool -- whether archived sessions have been fetched
    }


{-| Empty server data for initialization.
-}
emptyServerData : ServerData
emptyServerData =
    { connectionState = Disconnected
    , sessions = []
    , userProfiles = []
    , pendingRegistrationsCount = 0
    , invitations = []
    , sentInvitations = []
    , races = []
    , lastViewedSession = Nothing
    , sessionRules = Dict.empty
    , sessionTurns = Dict.empty
    , sessionOrdersStatus = Dict.empty
    , orderConflicts = Dict.empty
    , sessionHasStarsExe = Dict.empty
    , sessionPlayerRaces = Dict.empty
    , fetchingSessions = False
    , fetchStartTime = Nothing
    , lastFetchResult = Nothing
    , archivedSessionsFetched = False
    }


{-| Initialize the model with default values.
-}
init : ( Model, Cmd msg )
init =
    ( { servers = []
      , selectedServerUrl = Nothing
      , serverData = Dict.empty
      , appSettings = Nothing
      , wineCheckInProgress = False
      , wineCheckMessage = Nothing
      , ntvdmCheckInProgress = False
      , ntvdmCheckResult = Nothing
      , selectedSessionId = Nothing
      , sessionFilter = AllSessions
      , sessionDetail = Nothing
      , dialog = Nothing
      , contextMenu = Nothing
      , showUserMenu = False
      , toast = Nothing
      , loading = True
      , error = Nothing
      , startingSessionId = Nothing
      , pendingViewSessionId = Nothing
      , serverDragState = Nothing
      , confirmingBrowserStars = False
      }
    , Cmd.none
    )



-- =============================================================================
-- CONNECTION STATE
-- =============================================================================


{-| Connection state for a server.
-}
type ConnectionState
    = Disconnected
    | Connecting
    | Connected ConnectedInfo
    | ConnectionError String


{-| Information about an active connection.
-}
type alias ConnectedInfo =
    { username : String
    , userId : String
    , isManager : Bool
    , serialKey : String
    }



-- =============================================================================
-- SESSION FILTER
-- =============================================================================


{-| Filter options for the session list.
-}
type SessionFilter
    = AllSessions
    | MySessions
    | PublicSessions
    | InvitedSessions
    | MyTurn
    | ArchivedSessions



-- =============================================================================
-- DIALOGS
-- =============================================================================


{-| Active dialog state.
-}
type Dialog
    = AddServerDialog ServerForm
    | EditServerDialog String ServerForm -- serverUrl, form
    | RemoveServerDialog String String -- serverUrl, serverName
    | ConnectDialog String ConnectForm -- serverUrl, form
    | RegisterDialog String RegisterForm -- serverUrl, form
    | CreateSessionDialog CreateSessionForm
    | InviteUserDialog InviteForm
    | InvitationsDialog
    | RacesDialog (Maybe String) -- optional error message
    | SetupRaceDialog SetupRaceForm
    | RaceBuilderDialog RaceBuilderForm
    | RulesDialog RulesForm
    | TurnFilesDialog TurnFilesForm
    | SettingsDialog
    | UsersListDialog UsersListState -- admin users management
    | CreateUserDialog CreateUserForm -- admin create user
    | ChangeApikeyDialog ChangeApikeyState -- change own API key
    | MapViewerDialog MapViewerForm -- embedded Stars! browser


{-| Which pane is active in the users list dialog.
-}
type UsersListPane
    = UsersPane
    | PendingPane


{-| State for the users list dialog (admin).
-}
type alias UsersListState =
    { users : List UserProfile
    , pendingUsers : List UserProfile
    , currentUserId : String
    , activePane : UsersListPane
    , filterQuery : String
    , resetState : ResetApikeyState
    , deleteState : DeleteUserState
    , pendingActionState : PendingActionState
    }


{-| State for the API key reset flow.
-}
type ResetApikeyState
    = NoReset
    | ConfirmingReset String String -- userId, nickname
    | ResettingApikey String String -- userId, nickname (submitting)
    | ResetComplete String String -- nickname, newApikey


{-| State for the user delete flow.
-}
type DeleteUserState
    = NoDelete
    | ConfirmingDelete String String -- userId, nickname
    | DeletingUser String String -- userId, nickname (submitting)
    | DeleteError String String -- nickname, error message


{-| State for pending registration actions (approve/reject).
-}
type PendingActionState
    = NoPendingAction
    | ViewingMessage String String String -- userId, nickname, message
    | ConfirmingApprove String String -- userId, nickname
    | ApprovingUser String String -- userId, nickname (submitting)
    | ApproveComplete String String -- nickname, newApikey
    | ApproveError String String -- nickname, error message
    | ConfirmingReject String String -- userId, nickname
    | RejectingUser String String -- userId, nickname (submitting)
    | RejectError String String -- nickname, error message


{-| State for changing own API key.
-}
type ChangeApikeyState
    = ConfirmingChange
    | ChangingApikey
    | ChangeComplete String -- newApikey


{-| Form state for admin creating a new user.
-}
type alias CreateUserForm =
    { nickname : String
    , email : String
    , error : Maybe String
    , submitting : Bool
    , createdUser : Maybe UserProfile
    }


{-| Empty create user form.
-}
emptyCreateUserForm : CreateUserForm
emptyCreateUserForm =
    { nickname = ""
    , email = ""
    , error = Nothing
    , submitting = False
    , createdUser = Nothing
    }


{-| Session detail view state.
Only stores the session ID - the actual session is looked up from the sessions list.
-}
type alias SessionDetailView =
    { sessionId : String
    , showInviteDialog : Bool
    , dragState : Maybe DragState
    , playersExpanded : Bool
    }


{-| Drag state for player reordering.
-}
type alias DragState =
    { draggedPlayerId : String
    , draggedPlayerName : String
    , dragOverPlayerId : Maybe String
    , mouseX : Float
    , mouseY : Float
    }


{-| Drag state for server reordering in the server bar.
-}
type alias ServerDragState =
    { draggedServerUrl : String
    , dragOverServerUrl : Maybe String
    , mouseY : Float
    }



-- =============================================================================
-- FORMS
-- =============================================================================


{-| Form state for adding/editing a server.
-}
type alias ServerForm =
    { name : String
    , url : String
    , originalName : Maybe String -- Original name when editing (for rename warning)
    , error : Maybe String
    , submitting : Bool
    }


{-| Empty server form.
-}
emptyServerForm : ServerForm
emptyServerForm =
    { name = ""
    , url = ""
    , originalName = Nothing
    , error = Nothing
    , submitting = False
    }


{-| Form state for connecting to a server.
-}
type alias ConnectForm =
    { username : String
    , password : String
    , error : Maybe String
    , submitting : Bool
    }


{-| Empty connect form.
-}
emptyConnectForm : ConnectForm
emptyConnectForm =
    { username = ""
    , password = ""
    , error = Nothing
    , submitting = False
    }


{-| Form state for registering a new account.
-}
type alias RegisterForm =
    { nickname : String
    , email : String
    , message : String
    , error : Maybe String
    , submitting : Bool
    , success : Bool
    }


{-| Empty register form.
-}
emptyRegisterForm : RegisterForm
emptyRegisterForm =
    { nickname = ""
    , email = ""
    , message = ""
    , error = Nothing
    , submitting = False
    , success = False
    }


{-| Form state for creating a session.
-}
type alias CreateSessionForm =
    { name : String
    , isPublic : Bool
    , error : Maybe String
    , submitting : Bool
    }


{-| Form state for inviting a user to a session.
-}
type alias InviteForm =
    { sessionId : String
    , selectedUserId : Maybe String
    , error : Maybe String
    , submitting : Bool
    }


{-| Empty invite form.
-}
emptyInviteForm : String -> InviteForm
emptyInviteForm sessionId =
    { sessionId = sessionId
    , selectedUserId = Nothing
    , error = Nothing
    , submitting = False
    }


{-| Form state for setting up race in a session.
-}
type alias SetupRaceForm =
    { sessionId : String
    , selectedRaceId : Maybe String
    , error : Maybe String
    , submitting : Bool
    }


{-| Empty setup race form.
-}
emptySetupRaceForm : String -> SetupRaceForm
emptySetupRaceForm sessionId =
    { sessionId = sessionId
    , selectedRaceId = Nothing
    , error = Nothing
    , submitting = False
    }


{-| Form state for rules configuration.
-}
type alias RulesForm =
    { sessionId : String
    , rules : Rules
    , isManager : Bool -- true if user can edit, false if read-only
    , error : Maybe String
    , submitting : Bool
    , loading : Bool
    }


{-| Form state for turn files dialog (unified year view with files and orders status).
-}
type alias TurnFilesForm =
    { sessionId : String
    , year : Int
    , raceName : String
    , playerNumber : Int
    , turnFiles : Maybe TurnFiles
    , ordersStatus : Maybe OrdersStatus
    , isLatestYear : Bool
    , error : Maybe String
    , loading : Bool
    }


{-| Empty turn files form.
-}
emptyTurnFilesForm : String -> Int -> String -> Int -> Bool -> TurnFilesForm
emptyTurnFilesForm sessionId year raceName playerNumber isLatest =
    { sessionId = sessionId
    , year = year
    , raceName = raceName
    , playerNumber = playerNumber
    , turnFiles = Nothing
    , ordersStatus = Nothing
    , isLatestYear = isLatest
    , error = Nothing
    , loading = True
    }



-- =============================================================================
-- MAP VIEWER
-- =============================================================================


{-| Output format for map generation.
-}
type MapOutputFormat
    = SVGFormat
    | GIFFormat


{-| Options for map rendering.
-}
type alias MapOptions =
    { width : Int
    , height : Int
    , showNames : Bool
    , showFleets : Bool
    , showFleetPaths : Int
    , showMines : Bool
    , showWormholes : Bool
    , showLegend : Bool
    , showScannerCoverage : Bool
    , outputFormat : MapOutputFormat
    , gifDelay : Int -- milliseconds between frames
    }


{-| Default map options.
-}
defaultMapOptions : MapOptions
defaultMapOptions =
    { width = 1024
    , height = 768
    , showNames = False
    , showFleets = True
    , showFleetPaths = 4
    , showMines = True
    , showWormholes = True
    , showLegend = True
    , showScannerCoverage = True
    , outputFormat = SVGFormat
    , gifDelay = 500
    }


{-| Form state for map viewer dialog.
-}
type alias MapViewerForm =
    { sessionId : String
    , year : Int
    , raceName : String
    , playerNumber : Int
    , options : MapOptions
    , generatedSvg : Maybe String
    , generatedGif : Maybe String -- base64-encoded GIF
    , generating : Bool
    , generatingGif : Bool
    , saving : Bool
    , error : Maybe String
    }


{-| Empty map viewer form.
-}
emptyMapViewerForm : String -> Int -> String -> Int -> MapViewerForm
emptyMapViewerForm sessionId year raceName playerNumber =
    { sessionId = sessionId
    , year = year
    , raceName = raceName
    , playerNumber = playerNumber
    , options = defaultMapOptions
    , generatedSvg = Nothing
    , generatedGif = Nothing
    , generating = False
    , generatingGif = False
    , saving = False
    , error = Nothing
    }



-- =============================================================================
-- RACE BUILDER
-- =============================================================================


{-| Tab options for the race builder dialog.
-}
type RaceBuilderTab
    = IdentityTab
    | PrimaryTraitTab
    | LesserTraitsTab
    | HabitabilityTab
    | EconomyTab
    | ResearchTab


{-| Where the race builder was opened from.
-}
type RaceBuilderOrigin
    = FromRacesDialog
    | FromSetupRaceDialog String -- sessionId


{-| Mode for the race builder - edit (create new) or view (read-only).
-}
type RaceBuilderMode
    = EditMode
    | ViewMode { raceId : String, raceName : String }


{-| Habitability button being held for repeat action.
-}
type HabButton
    = GravityExpandBtn
    | GravityShrinkBtn
    | GravityLeftBtn
    | GravityRightBtn
    | TemperatureExpandBtn
    | TemperatureShrinkBtn
    | TemperatureLeftBtn
    | TemperatureRightBtn
    | RadiationExpandBtn
    | RadiationShrinkBtn
    | RadiationLeftBtn
    | RadiationRightBtn


{-| Form state for the race builder dialog.
-}
type alias RaceBuilderForm =
    { origin : RaceBuilderOrigin
    , mode : RaceBuilderMode
    , activeTab : RaceBuilderTab
    , config : RaceConfig
    , validation : RaceValidation
    , submitting : Bool
    , loading : Bool
    , error : Maybe String
    , selectedTemplate : String -- "custom", "humanoid", "rabbitoid", etc.
    , heldHabButton : Maybe HabButton -- button being held for repeat action
    }


{-| Race configuration - mirrors the Go RaceConfig struct.
-}
type alias RaceConfig =
    { singularName : String
    , pluralName : String
    , password : String
    , icon : Int
    , prt : Int
    , lrt : List Int -- indices of selected LRTs (0-13)
    , gravityCenter : Int
    , gravityWidth : Int
    , gravityImmune : Bool
    , temperatureCenter : Int
    , temperatureWidth : Int
    , temperatureImmune : Bool
    , radiationCenter : Int
    , radiationWidth : Int
    , radiationImmune : Bool
    , growthRate : Int
    , colonistsPerResource : Int
    , factoryOutput : Int
    , factoryCost : Int
    , factoryCount : Int
    , factoriesUseLessGerm : Bool
    , mineOutput : Int
    , mineCost : Int
    , mineCount : Int
    , researchEnergy : Int
    , researchWeapons : Int
    , researchPropulsion : Int
    , researchConstruction : Int
    , researchElectronics : Int
    , researchBiotech : Int
    , techsStartHigh : Bool
    , leftoverPointsOn : Int
    }


{-| Validation result from the race builder.
-}
type alias RaceValidation =
    { points : Int
    , isValid : Bool
    , errors : List RaceValidationError
    , warnings : List String
    , habitability : HabitabilityDisplay
    , prtInfos : List PRTInfo
    , lrtInfos : List LRTInfo
    }


{-| Information about a Primary Racial Trait (from Houston).
-}
type alias PRTInfo =
    { index : Int
    , code : String
    , name : String
    , desc : String
    , pointCost : Int
    }


{-| Information about a Lesser Racial Trait (from Houston).
-}
type alias LRTInfo =
    { index : Int
    , code : String
    , name : String
    , desc : String
    , pointCost : Int
    }


{-| Habitability display information from backend.
-}
type alias HabitabilityDisplay =
    { gravityMin : String
    , gravityMax : String
    , gravityRange : String
    , gravityImmune : Bool
    , temperatureMin : String
    , temperatureMax : String
    , temperatureRange : String
    , temperatureImmune : Bool
    , radiationMin : String
    , radiationMax : String
    , radiationRange : String
    , radiationImmune : Bool
    }


{-| A single validation error.
-}
type alias RaceValidationError =
    { field : String
    , message : String
    }


{-| Default race configuration (Humanoid-like defaults).
-}
defaultRaceConfig : RaceConfig
defaultRaceConfig =
    { singularName = "Humanoid"
    , pluralName = "Humanoids"
    , password = ""
    , icon = 1
    , prt = 9 -- Jack of All Trades
    , lrt = []
    , gravityCenter = 50
    , gravityWidth = 35
    , gravityImmune = False
    , temperatureCenter = 50
    , temperatureWidth = 35
    , temperatureImmune = False
    , radiationCenter = 50
    , radiationWidth = 35
    , radiationImmune = False
    , growthRate = 15
    , colonistsPerResource = 1000
    , factoryOutput = 10
    , factoryCost = 10
    , factoryCount = 10
    , factoriesUseLessGerm = False
    , mineOutput = 10
    , mineCost = 5
    , mineCount = 10
    , researchEnergy = 1 -- Standard
    , researchWeapons = 1
    , researchPropulsion = 1
    , researchConstruction = 1
    , researchElectronics = 1
    , researchBiotech = 1
    , techsStartHigh = False
    , leftoverPointsOn = 0 -- Surface Minerals
    }


{-| Empty race builder form.
-}
emptyRaceBuilderForm : RaceBuilderOrigin -> RaceBuilderForm
emptyRaceBuilderForm origin =
    { origin = origin
    , mode = EditMode
    , activeTab = IdentityTab
    , config = defaultRaceConfig
    , validation =
        { points = 0
        , isValid = False
        , errors = []
        , warnings = []
        , habitability = emptyHabitabilityDisplay
        , prtInfos = []
        , lrtInfos = []
        }
    , submitting = False
    , loading = False
    , error = Nothing
    , selectedTemplate = "humanoid" -- Default to Humanoid template
    , heldHabButton = Nothing
    }


{-| Default/empty habitability display info.
-}
emptyHabitabilityDisplay : HabitabilityDisplay
emptyHabitabilityDisplay =
    { gravityMin = ""
    , gravityMax = ""
    , gravityRange = ""
    , gravityImmune = False
    , temperatureMin = ""
    , temperatureMax = ""
    , temperatureRange = ""
    , temperatureImmune = False
    , radiationMin = ""
    , radiationMax = ""
    , radiationRange = ""
    , radiationImmune = False
    }


{-| Empty users list state for admin dialog.
-}
emptyUsersListState : String -> List UserProfile -> UsersListState
emptyUsersListState currentUserId users =
    { users = users
    , pendingUsers = []
    , currentUserId = currentUserId
    , activePane = UsersPane
    , filterQuery = ""
    , resetState = NoReset
    , deleteState = NoDelete
    , pendingActionState = NoPendingAction
    }



-- =============================================================================
-- CONTEXT MENU
-- =============================================================================


{-| Context menu state (for right-click menus).
-}
type alias ContextMenu =
    { serverUrl : String
    , x : Float
    , y : Float
    }



-- =============================================================================
-- HELPERS
-- =============================================================================


{-| Find a server by its URL.
-}
getServerByUrl : String -> List Server -> Maybe Server
getServerByUrl url servers =
    List.filter (\s -> s.url == url) servers
        |> List.head


{-| Find a session by its ID in a list of sessions.
-}
getSessionById : String -> List Session -> Maybe Session
getSessionById id sessions =
    List.filter (\s -> s.id == id) sessions
        |> List.head


{-| Get the server data for a server URL.
-}
getServerData : String -> Dict String ServerData -> ServerData
getServerData serverUrl data =
    Dict.get serverUrl data
        |> Maybe.withDefault emptyServerData


{-| Get the server data for the currently selected server.
-}
getCurrentServerData : Model -> ServerData
getCurrentServerData model =
    model.selectedServerUrl
        |> Maybe.map (\url -> getServerData url model.serverData)
        |> Maybe.withDefault emptyServerData


{-| Update server data for a specific server URL.
-}
updateServerData : String -> (ServerData -> ServerData) -> Dict String ServerData -> Dict String ServerData
updateServerData serverUrl updater data =
    let
        current =
            getServerData serverUrl data
    in
    Dict.insert serverUrl (updater current) data


{-| Check if a server is connected.
-}
isConnected : String -> Dict String ServerData -> Bool
isConnected serverUrl data =
    case getConnectionState serverUrl data of
        Connected _ ->
            True

        _ ->
            False


{-| Get the connection state for a server.
-}
getConnectionState : String -> Dict String ServerData -> ConnectionState
getConnectionState serverUrl data =
    (getServerData serverUrl data).connectionState
