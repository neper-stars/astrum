module Msg exposing (Msg(..))

{-| All application messages.

This module defines every possible message that can occur in the application.
Messages are grouped by domain for clarity.

-}

import Api.Invitation exposing (Invitation)
import Api.OrdersStatus exposing (OrdersStatus)
import Api.Race exposing (Race)
import Api.Rules exposing (Rules)
import Api.Server exposing (Server)
import Api.Session exposing (Session)
import Api.TurnFiles exposing (TurnFiles)
import Api.UserProfile exposing (UserProfile)
import Model exposing (HabButton, RaceBuilderOrigin, RaceBuilderTab, RaceConfig, RaceValidation, SessionFilter)
import Time


type Msg
    = NoOp
      -- =========================================================================
      -- Server Messages
      -- =========================================================================
    | GotServers (Result String (List Server))
    | SelectServer String
    | ServerAdded (Result String Server)
    | ServerUpdated (Result String ())
    | ServerRemoved (Result String ())
    | GotHasDefaultServer (Result String Bool)
    | AddDefaultServer
    | DefaultServerAdded (Result String Server)
      -- =========================================================================
      -- Server Dialog Messages
      -- =========================================================================
    | OpenAddServerDialog
    | OpenEditServerDialog String -- serverUrl
    | OpenRemoveServerDialog String String -- serverUrl, serverName
    | CloseDialog
    | UpdateServerFormName String
    | UpdateServerFormUrl String
    | SubmitAddServer
    | SubmitEditServer String -- old serverUrl
    | ConfirmRemoveServer String -- serverUrl
      -- =========================================================================
      -- Context Menu Messages
      -- =========================================================================
    | ShowContextMenu String Float Float -- serverUrl, x, y
    | HideContextMenu -- serverUrl
    | SwitchToRegister -- Switch from connect to register dialog
    | SwitchToConnect -- Switch from register to connect dialog
    | UpdateConnectUsername String
    | UpdateConnectPassword String
    | UpdateRegisterNickname String
    | UpdateRegisterEmail String
    | UpdateRegisterMessage String
    | SubmitConnect String -- serverUrl
    | SubmitRegister String -- serverUrl
    | ConnectResult String (Result String { username : String, userId : String, isManager : Bool, serialKey : String }) -- serverUrl, result
    | RegisterResult String (Result String { userId : String, nickname : String, pending : Bool }) -- serverUrl, result
    | Disconnect String -- serverUrl
    | DisconnectResult String (Result String ()) -- serverUrl, result
      -- =========================================================================
      -- Session Messages
      -- =========================================================================
    | GotSessions String (Result String (List Session)) -- serverUrl, sessions result
    | GotFetchStartTime String Time.Posix -- serverUrl, startTime
    | GotFetchEndTime String (Result String (List Session)) Time.Posix -- sessionId
    | SetSessionFilter SessionFilter
    | RefreshSessions
    | FetchArchivedSessions -- Fetch sessions including archived
    | GotArchivedSessions String (Result String (List Session)) -- serverUrl, sessions result
    | GotSession String (Result String Session) -- serverUrl, result
      -- =========================================================================
      -- Session Creation Messages
      -- =========================================================================
    | OpenCreateSessionDialog
    | UpdateCreateSessionName String
    | UpdateCreateSessionPublic Bool
    | SubmitCreateSession
    | SessionCreated String (Result String Session) -- serverUrl, result
      -- =========================================================================
      -- Session Join Messages
      -- =========================================================================
    | JoinSession String -- sessionId
    | SessionJoined String (Result String Session) -- serverUrl, result
      -- =========================================================================
      -- Session Delete Messages
      -- =========================================================================
    | DeleteSession String -- sessionId
    | SessionDeleted String (Result String ()) -- serverUrl, result
      -- =========================================================================
      -- Session Quit Messages
      -- =========================================================================
    | QuitSession String -- sessionId
    | SessionQuitResult String (Result String ()) -- serverUrl, result
      -- =========================================================================
      -- Member Promote Messages
      -- =========================================================================
    | PromoteMember String String -- sessionId, memberId
    | MemberPromoted String (Result String ()) -- serverUrl, result
      -- =========================================================================
      -- Session Archive Messages
      -- =========================================================================
    | ArchiveSession String -- sessionId
    | SessionArchived String (Result String ()) -- serverUrl, result
      -- =========================================================================
      -- Session Detail & Invitation Messages
      -- =========================================================================
    | ViewSessionDetail String -- sessionId
    | CloseSessionDetail
    | TogglePlayersExpanded -- Load user profiles for invite dialog
    | GotUserProfiles String (Result String (List UserProfile)) -- serverUrl, result
    | OpenInviteDialog
    | SelectUserToInvite String -- userId
    | SubmitInvite
    | InviteResult String (Result String ()) -- serverUrl, result
      -- =========================================================================
      -- Invitations List Messages
      -- =========================================================================
    | OpenInvitationsDialog
    | ViewInvitedSession String -- sessionId - view session from invitation
    | GotInvitations String (Result String (List Invitation)) -- serverUrl, result
    | GotSentInvitations String (Result String (List Invitation)) -- serverUrl, result
    | AcceptInvitation String -- invitationId
    | InvitationAccepted String (Result String Session) -- serverUrl, result
    | DeclineInvitation String -- invitationId
    | InvitationDeclined String (Result String ()) -- serverUrl, result
    | CancelSentInvitation String -- invitationId
    | SentInvitationCanceled String (Result String ()) -- serverUrl, result
      -- =========================================================================
      -- Races Messages
      -- =========================================================================
    | OpenRacesDialog
    | GotRaces String (Result String (List Race)) -- serverUrl, result
    | UploadRace -- triggers file picker
    | RaceUploaded String (Result String Race) -- serverUrl, result
    | DownloadRace String -- raceId
    | RaceDownloaded (Result String ())
    | DeleteRace String -- raceId
    | RaceDeleted String (Result String ()) -- serverUrl, result
      -- =========================================================================
      -- Setup Race Messages (for session)
      -- =========================================================================
    | OpenSetupRaceDialog String -- sessionId
    | SelectRaceForSession String -- raceId
    | SubmitSetupRace
    | SetupRaceResult String (Result String ()) -- serverUrl, result
    | UploadAndSetRace -- upload new race and use it
    | GotSessionPlayerRace String String (Result String Race) -- serverUrl, sessionId, result
      -- =========================================================================
      -- Race Builder Messages
      -- =========================================================================
    | OpenRaceBuilder RaceBuilderOrigin
    | SelectRaceBuilderTab RaceBuilderTab
    | LoadRaceTemplate String -- template name
    | RaceTemplateLoaded (Result String RaceConfig)
    | SelectCustomTemplate -- select "Custom" without changing values
      -- Identity tab
    | UpdateRaceBuilderSingularName String
    | UpdateRaceBuilderPluralName String
    | UpdateRaceBuilderPassword String
    | UpdateRaceBuilderIcon Int
    | UpdateRaceBuilderLeftoverPoints Int
      -- PRT tab
    | UpdateRaceBuilderPRT Int
      -- LRT tab
    | ToggleRaceBuilderLRT Int -- toggle LRT at index
      -- Habitability tab
    | UpdateRaceBuilderGravityCenter Int
    | UpdateRaceBuilderGravityWidth Int
    | UpdateRaceBuilderGravityImmune Bool -- min, max (converts to center/width)
    | UpdateRaceBuilderTemperatureCenter Int
    | UpdateRaceBuilderTemperatureWidth Int
    | UpdateRaceBuilderTemperatureImmune Bool -- min, max (converts to center/width)
    | UpdateRaceBuilderRadiationCenter Int
    | UpdateRaceBuilderRadiationWidth Int
    | UpdateRaceBuilderRadiationImmune Bool -- min, max (converts to center/width)
    | UpdateRaceBuilderGrowthRate Int
      -- Habitability button hold-to-repeat
    | HabButtonPressed HabButton -- Start holding a button
    | HabButtonReleased -- Stop holding
    | HabButtonTick -- Repeat tick while held
      -- Economy tab
    | UpdateRaceBuilderColonistsPerResource Int
    | UpdateRaceBuilderFactoryOutput Int
    | UpdateRaceBuilderFactoryCost Int
    | UpdateRaceBuilderFactoryCount Int
    | UpdateRaceBuilderFactoriesUseLessGerm Bool
    | UpdateRaceBuilderMineOutput Int
    | UpdateRaceBuilderMineCost Int
    | UpdateRaceBuilderMineCount Int
      -- Research tab
    | UpdateRaceBuilderResearchEnergy Int
    | UpdateRaceBuilderResearchWeapons Int
    | UpdateRaceBuilderResearchPropulsion Int
    | UpdateRaceBuilderResearchConstruction Int
    | UpdateRaceBuilderResearchElectronics Int
    | UpdateRaceBuilderResearchBiotech Int
    | UpdateRaceBuilderTechsStartHigh Bool
      -- Validation response
    | RaceBuilderValidationReceived (Result String RaceValidation)
      -- View/Copy race
    | ViewRaceInBuilder String String -- raceId, raceName
    | RaceFileLoaded (Result String RaceConfig)
    | CreateRaceFromExisting -- Switch from view mode to edit mode
      -- Save
    | SubmitRaceBuilder
    | RaceBuilderSaved (Result String Race)
      -- =========================================================================
      -- Player Ready State Messages
      -- =========================================================================
    | SetPlayerReady String Bool -- sessionId, ready
    | PlayerReadyResult String (Result String ()) -- serverUrl, result
      -- =========================================================================
      -- Start Game Messages
      -- =========================================================================
    | StartGame String -- sessionId
    | GameStarted String (Result String ()) -- serverUrl, result
      -- =========================================================================
      -- Player Reordering Messages (mouse-based drag and drop)
      -- =========================================================================
    | MouseDownOnPlayer String String Float Float -- playerId, playerName, mouseX, mouseY
    | MouseMoveWhileDragging Float Float -- mouseX, mouseY
    | MouseEnterPlayer String -- target playerId
    | MouseLeavePlayer
    | MouseUpEndDrag
    | PlayersReordered String (Result String ()) -- serverUrl, result
      -- =========================================================================
      -- Server Reordering Messages (drag and drop in server bar)
      -- =========================================================================
    | ServerDragStart String Float -- serverUrl, mouseY
    | ServerDragMove Float -- mouseY
    | ServerDragEnter String -- target serverUrl
    | ServerDragLeave
    | ServerDragEnd
    | ServersReordered (Result String ()) -- serverUrl, sessionId, result
    | OpenRulesDialog String Bool -- sessionId, rulesIsSet
    | GotRules String String (Result String Rules) -- serverUrl, sessionId, result (for currently open dialog)
    | UpdateRulesUniverseSize Int
    | UpdateRulesDensity Int
    | UpdateRulesStartingDistance Int
    | UpdateRulesMaximumMinerals Bool
    | UpdateRulesSlowerTechAdvances Bool
    | UpdateRulesAcceleratedBbsPlay Bool
    | UpdateRulesNoRandomEvents Bool
    | UpdateRulesComputerPlayersFormAlliances Bool
    | UpdateRulesPublicPlayerScores Bool
    | UpdateRulesGalaxyClumping Bool
    | UpdateRulesVcOwnsPercentOfPlanets Bool
    | UpdateRulesVcOwnsPercentOfPlanetsValue String
    | UpdateRulesVcAttainTechInFields Bool
    | UpdateRulesVcAttainTechInFieldsTechValue String
    | UpdateRulesVcAttainTechInFieldsFieldsValue String
    | UpdateRulesVcExceedScoreOf Bool
    | UpdateRulesVcExceedScoreOfValue String
    | UpdateRulesVcExceedNextPlayerScoreBy Bool
    | UpdateRulesVcExceedNextPlayerScoreByValue String
    | UpdateRulesVcHasProductionCapacityOf Bool
    | UpdateRulesVcHasProductionCapacityOfValue String
    | UpdateRulesVcOwnsCapitalShips Bool
    | UpdateRulesVcOwnsCapitalShipsValue String
    | UpdateRulesVcHaveHighestScoreAfterYears Bool
    | UpdateRulesVcHaveHighestScoreAfterYearsValue String
    | UpdateRulesVcWinnerMustMeet String
    | UpdateRulesVcMinYearsBeforeWinner String
    | SubmitRules
    | RulesSet String (Result String Rules) -- serverUrl, result
      -- =========================================================================
      -- External Events (from Go backend via ports)
      -- =========================================================================
    | SessionsUpdated String -- serverUrl - triggered by polling
    | ConnectionChanged String Bool -- serverUrl, isConnected
    | OrderConflictReceived String String Int -- serverUrl, sessionId, year
      -- =========================================================================
      -- Turn Files Messages
      -- =========================================================================
    | OpenTurnFilesDialog String Int Bool -- sessionId, year, isLatestYear
    | GotTurnFiles String (Result String TurnFiles) -- serverUrl, result
    | GotLatestTurn String (Result String TurnFiles) -- serverUrl, result
    | NotificationSessionTurn String String String (Maybe Int) -- serverUrl, sessionId, action, year
    | OpenGameDir String -- sessionId
    | LaunchStars String -- sessionId
    | LaunchStarsResult (Result String ()) -- sessionId
    | GotHasStarsExe (Result String { serverUrl : String, sessionId : String, hasStarsExe : Bool })
      -- =========================================================================
      -- Session Backup Messages (manager only)
      -- =========================================================================
    | DownloadSessionBackup String -- sessionId
    | SessionBackupDownloaded String (Result String ()) -- serverUrl, result
      -- =========================================================================
      -- Historic Backup Messages
      -- =========================================================================
    | DownloadHistoricBackup String -- sessionId
    | HistoricBackupDownloaded String (Result String ()) -- serverUrl, result
      -- =========================================================================
      -- Orders Status Messages
      -- =========================================================================
    | GotOrdersStatus String (Result String OrdersStatus) -- serverUrl, result
      -- =========================================================================
      -- App Settings Messages
      -- =========================================================================
    | OpenSettingsDialog
    | SelectServersDir
    | GotAppSettings (Result String { serversDir : String, autoDownloadStars : Bool, zoomLevel : Int, useWine : Bool, winePrefixesDir : String, validWineInstall : Bool, enableBrowserStars : Bool })
    | ServersDirSelected (Result String { serversDir : String, autoDownloadStars : Bool, zoomLevel : Int, useWine : Bool, winePrefixesDir : String, validWineInstall : Bool, enableBrowserStars : Bool })
    | SetAutoDownloadStars Bool
    | AutoDownloadStarsSet (Result String { serversDir : String, autoDownloadStars : Bool, zoomLevel : Int, useWine : Bool, winePrefixesDir : String, validWineInstall : Bool, enableBrowserStars : Bool })
    | SetUseWine Bool
    | UseWineSet (Result String { serversDir : String, autoDownloadStars : Bool, zoomLevel : Int, useWine : Bool, winePrefixesDir : String, validWineInstall : Bool, enableBrowserStars : Bool })
    | SelectWinePrefixesDir
    | WinePrefixesDirSelected (Result String { serversDir : String, autoDownloadStars : Bool, zoomLevel : Int, useWine : Bool, winePrefixesDir : String, validWineInstall : Bool, enableBrowserStars : Bool })
    | CheckWineInstall
    | WineInstallChecked (Result String { valid : Bool, message : String })
    | CheckNtvdmSupport
    | NtvdmChecked (Result String { available : Bool, is64Bit : Bool, message : String, helpUrl : Maybe String })
      -- Browser Stars! experimental feature
    | RequestEnableBrowserStars Bool -- Request to enable/disable (shows confirmation when enabling)
    | ConfirmEnableBrowserStars -- User confirmed the warning dialog
    | CancelEnableBrowserStars -- User cancelled the warning dialog
    | EnableBrowserStarsSet (Result String { serversDir : String, autoDownloadStars : Bool, zoomLevel : Int, useWine : Bool, winePrefixesDir : String, validWineInstall : Bool, enableBrowserStars : Bool })
      -- =========================================================================
      -- Admin/Manager Messages
      -- =========================================================================
    | OpenUsersListDialog
    | UpdateUsersListFilter String -- filter users by nickname/email
    | OpenCreateUserDialog -- open create user dialog (admin)
    | UpdateCreateUserNickname String
    | UpdateCreateUserEmail String
    | SubmitCreateUser
    | CreateUserResult String (Result String { id : String, nickname : String, email : String }) -- serverUrl, result
    | ConfirmDeleteUser String String -- userId, nickname - show confirmation
    | CancelDeleteUser -- cancel confirmation
    | SubmitDeleteUser String -- userId - actually delete
    | DeleteUserResult String (Result String ()) -- serverUrl, result
    | ConfirmResetApikey String -- userId - show confirmation
    | CancelResetApikey -- cancel confirmation
    | SubmitResetApikey String -- userId - actually reset
    | ResetApikeyResult (Result String String) -- Result error newApikey
      -- Pending Registrations
    | SwitchUsersListPane -- toggle between users and pending pane
    | GotPendingRegistrations String (Result String (List { id : String, nickname : String, email : String, message : Maybe String })) -- serverUrl, result
    | ViewRegistrationMessage String String String -- userId, nickname, message
    | CloseRegistrationMessage
    | ConfirmApproveRegistration String String -- userId, nickname
    | CancelApproveRegistration
    | SubmitApproveRegistration String -- userId
    | ApproveRegistrationResult String (Result String String) -- serverUrl, Result error apikey
    | ConfirmRejectRegistration String String -- userId, nickname
    | CancelRejectRegistration
    | SubmitRejectRegistration String -- userId
    | RejectRegistrationResult String (Result String ()) -- serverUrl, result
      -- =========================================================================
      -- Change Own API Key Messages (from user menu)
      -- =========================================================================
    | OpenChangeApikeyDialog -- open confirmation dialog
    | CancelChangeApikey -- cancel
    | SubmitChangeApikey -- submit the change
    | ChangeApikeyResult (Result String String) -- Result error newApikey
      -- =========================================================================
      -- WebSocket Notifications
      -- =========================================================================
    | NotificationSession String String String -- serverUrl, id, action
    | NotificationInvitation String String String -- serverUrl, id, action
    | NotificationRace String String String -- serverUrl, id, action
    | NotificationRuleset String String String -- serverUrl, sessionId, action
    | NotificationPlayerRace String String String -- serverUrl, id, action
    | NotificationOrderStatus String String String -- serverUrl, sessionId, action
    | NotificationPendingRegistration String String String (Maybe String) (Maybe String) -- serverUrl, id, action, userProfileId, nickname
      -- =========================================================================
      -- User Menu Messages
      -- =========================================================================
    | ToggleUserMenu
    | HideUserMenu
    | CopyApiKey String -- serverUrl - fetches and copies API key to clipboard
    | GotApiKey String (Result String String) -- serverUrl, apiKey
    | CopyToClipboard String -- message to show
    | HideToast -- auto-hide after timeout
      -- =========================================================================
      -- Zoom Messages
      -- =========================================================================
    | ZoomIn
    | ZoomOut
    | ZoomReset
    | ZoomLevelSet (Result String { serversDir : String, autoDownloadStars : Bool, zoomLevel : Int, useWine : Bool, winePrefixesDir : String, validWineInstall : Bool, enableBrowserStars : Bool })
      -- =========================================================================
      -- Map Viewer Messages
      -- =========================================================================
    | OpenMapViewer String Int String Int -- sessionId, year, raceName, playerNumber
    | UpdateMapWidth String
    | UpdateMapHeight String
    | SelectMapPreset String -- "800x600", "1024x768", etc.
    | ToggleShowNames
    | ToggleShowFleets
    | UpdateShowFleetPaths String
    | ToggleShowMines
    | ToggleShowWormholes
    | ToggleShowLegend
    | ToggleShowScannerCoverage
    | GenerateMap
    | MapGenerated (Result String String) -- SVG string result
    | SaveMap
    | MapSaved (Result String ())
    | ToggleMapFullscreen
    | SelectMapFormat String -- "svg" or "gif"
    | UpdateGifDelay String -- delay in ms
    | GenerateAnimatedMap
    | AnimatedMapGenerated (Result String String) -- base64 GIF result
    | SaveGif
    | GifSaved (Result String ())
      -- =========================================================================
      -- Stars Browser Messages
      -- =========================================================================
    | OpenStarsBrowser String String String -- error message
      -- =========================================================================
      -- Global UI Messages
      -- =========================================================================
    | ClearError
    | EscapePressed
