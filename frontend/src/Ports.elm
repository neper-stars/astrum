port module Ports exposing
    ( -- Outgoing (Elm -> JS -> Go)
      logDebug
    , clearSelection
    , getServers
    , addServer
    , updateServer
    , removeServer
    , connect
    , autoConnect
    , disconnect
    , register
    , createUser
    , deleteUser
    , getPendingRegistrations
    , approveRegistration
    , rejectRegistration
    , getSessions
    , getSession
    , createSession
    , joinSession
    , deleteSession
    , quitSession
    , promoteMember
    , getUserProfiles
    , inviteUser
    , getInvitations
    , getSentInvitations
    , acceptInvitation
    , declineInvitation
    , getRaces
    , uploadRace
    , downloadRace
    , deleteRace
    , setSessionRace
    , uploadAndSetSessionRace
    , setPlayerReady
    , getSessionPlayerRace
    , validateRaceConfig
    , getRaceTemplate
    , buildAndSaveRace
    , loadRaceFileConfig
    , getRules
    , setRules
    , startGame
    , reorderPlayers
    , reorderServers
    , getTurn
    , getLatestTurn
    , getOrdersStatus
    , openGameDir
    , launchStars
    , checkHasStarsExe
    , downloadSessionBackup
    , downloadHistoricBackup
    , getAppSettings
    , selectServersDir
    , setAutoDownloadStars
    , setZoomLevel
    , setUseWine
    , selectWinePrefixesDir
    , checkWineInstall
    , generateMap
    , saveMap
    , requestFullscreen
    , resetUserApikey
    , changeMyApikey
    , getApiKey
    , copyToClipboard
      -- Incoming (Go -> JS -> Elm)
    , serversReceived
    , serverAdded
    , serverUpdated
    , serverRemoved
    , connectResult
    , disconnectResult
    , registerResult
    , createUserResult
    , deleteUserResult
    , pendingRegistrationsReceived
    , approveRegistrationResult
    , rejectRegistrationResult
    , sessionsReceived
    , sessionReceived
    , sessionCreated
    , sessionJoined
    , sessionDeleted
    , sessionQuit
    , memberPromoted
    , userProfilesReceived
    , inviteResult
    , invitationsReceived
    , sentInvitationsReceived
    , invitationAccepted
    , invitationDeclined
    , cancelSentInvitation
    , sentInvitationCanceled
    , racesReceived
    , raceUploaded
    , raceDownloaded
    , raceDeleted
    , sessionRaceSet
    , uploadAndSetSessionRaceResult
    , playerReadyResult
    , sessionPlayerRaceReceived
    , raceBuilderValidation
    , raceTemplateReceived
    , raceBuilderSaved
    , raceFileConfigLoaded
    , rulesReceived
    , rulesSet
    , gameStarted
    , playersReordered
    , serversReordered
    , turnReceived
    , latestTurnReceived
    , ordersStatusReceived
    , appSettingsReceived
    , serversDirSelected
    , autoDownloadStarsSet
    , zoomLevelSet
    , useWineSet
    , winePrefixesDirSelected
    , wineInstallChecked
    , checkNtvdmSupport
    , ntvdmChecked
    , resetApikeyResult
    , changeApikeyResult
    , apiKeyReceived
    , launchStarsResult
    , hasStarsExeResult
    , sessionBackupDownloaded
    , historicBackupDownloaded
    , mapGenerated
    , mapSaved
      -- Events from Go
    , sessionsUpdated
    , connectionChanged
    , orderConflictReceived
      -- WebSocket notifications
    , notificationSession
    , notificationInvitation
    , notificationRace
    , notificationRuleset
    , notificationPlayerRace
    , notificationSessionTurn
    , notificationOrderStatus
    , notificationPendingRegistration
      -- UI events from JS
    , escapePressed
    , zoomKeyPressed
    )

{-| Ports for communication between Elm and the Go backend via JavaScript.

## Architecture

    Elm <-> JavaScript <-> Go (Wails)

Outgoing ports send commands to Go.
Incoming ports receive results and events from Go.

-}

import Json.Decode as D
import Json.Encode as E



-- =============================================================================
-- OUTGOING PORTS (Elm -> JavaScript -> Go)
-- =============================================================================
-- Debug Logging


port logDebug : String -> Cmd msg



-- UI Utilities


port clearSelection : () -> Cmd msg



-- =============================================================================
-- Server Management


port getServers : () -> Cmd msg


port addServer : E.Value -> Cmd msg


port updateServer : E.Value -> Cmd msg


port removeServer : String -> Cmd msg



-- Authentication


port connect : E.Value -> Cmd msg


port autoConnect : String -> Cmd msg


port disconnect : String -> Cmd msg


port register : E.Value -> Cmd msg


port createUser : E.Value -> Cmd msg


port deleteUser : E.Value -> Cmd msg


port getPendingRegistrations : String -> Cmd msg


port approveRegistration : E.Value -> Cmd msg


port rejectRegistration : E.Value -> Cmd msg



-- Sessions


port getSessions : String -> Cmd msg


port getSession : E.Value -> Cmd msg


port createSession : E.Value -> Cmd msg


port joinSession : E.Value -> Cmd msg


port deleteSession : E.Value -> Cmd msg


port quitSession : E.Value -> Cmd msg


port promoteMember : E.Value -> Cmd msg



-- User Profiles & Invitations


port getUserProfiles : String -> Cmd msg


port inviteUser : E.Value -> Cmd msg


port getInvitations : String -> Cmd msg


port getSentInvitations : String -> Cmd msg


port acceptInvitation : E.Value -> Cmd msg


port declineInvitation : E.Value -> Cmd msg


port cancelSentInvitation : E.Value -> Cmd msg



-- Races


port getRaces : String -> Cmd msg


port uploadRace : E.Value -> Cmd msg


port downloadRace : E.Value -> Cmd msg


port deleteRace : E.Value -> Cmd msg


port setSessionRace : E.Value -> Cmd msg


port uploadAndSetSessionRace : E.Value -> Cmd msg


port setPlayerReady : E.Value -> Cmd msg


port getSessionPlayerRace : E.Value -> Cmd msg



-- Race Builder


port validateRaceConfig : E.Value -> Cmd msg


port getRaceTemplate : E.Value -> Cmd msg


port buildAndSaveRace : E.Value -> Cmd msg


port loadRaceFileConfig : E.Value -> Cmd msg



-- Rules


port getRules : E.Value -> Cmd msg


port setRules : E.Value -> Cmd msg



-- Start Game


port startGame : E.Value -> Cmd msg



-- Player Reordering


port reorderPlayers : E.Value -> Cmd msg



-- Server Reordering


port reorderServers : E.Value -> Cmd msg



-- Turn Files


port getTurn : E.Value -> Cmd msg


port getLatestTurn : E.Value -> Cmd msg


port getOrdersStatus : E.Value -> Cmd msg


port openGameDir : E.Value -> Cmd msg


port launchStars : E.Value -> Cmd msg


port checkHasStarsExe : E.Value -> Cmd msg


port downloadSessionBackup : E.Value -> Cmd msg


port downloadHistoricBackup : E.Value -> Cmd msg



-- App Settings


port getAppSettings : () -> Cmd msg


port selectServersDir : () -> Cmd msg


port resetUserApikey : E.Value -> Cmd msg


port changeMyApikey : String -> Cmd msg


port getApiKey : String -> Cmd msg


port copyToClipboard : String -> Cmd msg


port setAutoDownloadStars : Bool -> Cmd msg


port setZoomLevel : Int -> Cmd msg


port setUseWine : Bool -> Cmd msg


port selectWinePrefixesDir : () -> Cmd msg


port checkWineInstall : () -> Cmd msg


port checkNtvdmSupport : () -> Cmd msg



-- Map Viewer


port generateMap : E.Value -> Cmd msg


port saveMap : E.Value -> Cmd msg


port requestFullscreen : String -> Cmd msg



-- =============================================================================
-- INCOMING PORTS (Go -> JavaScript -> Elm)
-- =============================================================================
-- Server Management


port serversReceived : (D.Value -> msg) -> Sub msg


port serverAdded : (D.Value -> msg) -> Sub msg


port serverUpdated : (D.Value -> msg) -> Sub msg


port serverRemoved : (D.Value -> msg) -> Sub msg



-- Authentication


port connectResult : (D.Value -> msg) -> Sub msg


port disconnectResult : (D.Value -> msg) -> Sub msg


port registerResult : (D.Value -> msg) -> Sub msg


port createUserResult : (D.Value -> msg) -> Sub msg


port deleteUserResult : (D.Value -> msg) -> Sub msg


port pendingRegistrationsReceived : (D.Value -> msg) -> Sub msg


port approveRegistrationResult : (D.Value -> msg) -> Sub msg


port rejectRegistrationResult : (D.Value -> msg) -> Sub msg



-- Sessions


port sessionsReceived : (D.Value -> msg) -> Sub msg


port sessionReceived : (D.Value -> msg) -> Sub msg


port sessionCreated : (D.Value -> msg) -> Sub msg


port sessionJoined : (D.Value -> msg) -> Sub msg


port sessionDeleted : (D.Value -> msg) -> Sub msg


port sessionQuit : (D.Value -> msg) -> Sub msg


port memberPromoted : (D.Value -> msg) -> Sub msg



-- User Profiles & Invitations


port userProfilesReceived : (D.Value -> msg) -> Sub msg


port inviteResult : (D.Value -> msg) -> Sub msg


port invitationsReceived : (D.Value -> msg) -> Sub msg


port sentInvitationsReceived : (D.Value -> msg) -> Sub msg


port invitationAccepted : (D.Value -> msg) -> Sub msg


port invitationDeclined : (D.Value -> msg) -> Sub msg


port sentInvitationCanceled : (D.Value -> msg) -> Sub msg



-- Races


port racesReceived : (D.Value -> msg) -> Sub msg


port raceUploaded : (D.Value -> msg) -> Sub msg


port raceDownloaded : (D.Value -> msg) -> Sub msg


port raceDeleted : (D.Value -> msg) -> Sub msg


port sessionRaceSet : (D.Value -> msg) -> Sub msg


port uploadAndSetSessionRaceResult : (D.Value -> msg) -> Sub msg


port playerReadyResult : (D.Value -> msg) -> Sub msg


port sessionPlayerRaceReceived : (D.Value -> msg) -> Sub msg



-- Race Builder


port raceBuilderValidation : (D.Value -> msg) -> Sub msg


port raceTemplateReceived : (D.Value -> msg) -> Sub msg


port raceBuilderSaved : (D.Value -> msg) -> Sub msg


port raceFileConfigLoaded : (D.Value -> msg) -> Sub msg



-- Rules


port rulesReceived : (D.Value -> msg) -> Sub msg


port rulesSet : (D.Value -> msg) -> Sub msg



-- Start Game


port gameStarted : (D.Value -> msg) -> Sub msg



-- Player Reordering


port playersReordered : (D.Value -> msg) -> Sub msg



-- Server Reordering


port serversReordered : (D.Value -> msg) -> Sub msg



-- Turn Files


port turnReceived : (D.Value -> msg) -> Sub msg


port latestTurnReceived : (D.Value -> msg) -> Sub msg


port ordersStatusReceived : (D.Value -> msg) -> Sub msg



-- App Settings


port appSettingsReceived : (D.Value -> msg) -> Sub msg


port serversDirSelected : (D.Value -> msg) -> Sub msg


port autoDownloadStarsSet : (D.Value -> msg) -> Sub msg


port zoomLevelSet : (D.Value -> msg) -> Sub msg


port useWineSet : (D.Value -> msg) -> Sub msg


port winePrefixesDirSelected : (D.Value -> msg) -> Sub msg


port wineInstallChecked : (D.Value -> msg) -> Sub msg


port ntvdmChecked : (D.Value -> msg) -> Sub msg


port resetApikeyResult : (D.Value -> msg) -> Sub msg


port changeApikeyResult : (D.Value -> msg) -> Sub msg


port apiKeyReceived : (D.Value -> msg) -> Sub msg


port launchStarsResult : (D.Value -> msg) -> Sub msg


port hasStarsExeResult : (D.Value -> msg) -> Sub msg


port sessionBackupDownloaded : (D.Value -> msg) -> Sub msg


port historicBackupDownloaded : (D.Value -> msg) -> Sub msg



-- Map Viewer


port mapGenerated : (D.Value -> msg) -> Sub msg


port mapSaved : (D.Value -> msg) -> Sub msg



-- Events from Go backend


port sessionsUpdated : (String -> msg) -> Sub msg


port connectionChanged : (D.Value -> msg) -> Sub msg


port orderConflictReceived : (D.Value -> msg) -> Sub msg



-- WebSocket Notifications
-- Each notification includes: { serverUrl: String, id: String, action: String }


port notificationSession : (D.Value -> msg) -> Sub msg


port notificationInvitation : (D.Value -> msg) -> Sub msg


port notificationRace : (D.Value -> msg) -> Sub msg


port notificationRuleset : (D.Value -> msg) -> Sub msg


port notificationPlayerRace : (D.Value -> msg) -> Sub msg


port notificationSessionTurn : (D.Value -> msg) -> Sub msg


port notificationOrderStatus : (D.Value -> msg) -> Sub msg


port notificationPendingRegistration : (D.Value -> msg) -> Sub msg



-- UI Events from JavaScript


port escapePressed : (() -> msg) -> Sub msg


port zoomKeyPressed : (String -> msg) -> Sub msg
