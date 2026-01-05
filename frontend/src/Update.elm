module Update exposing (update)

{-| Application update logic.

This module routes all messages to their appropriate handler modules.

-}

import Model exposing (Model)
import Msg exposing (Msg(..))
import Update.Admin as Admin
import Update.Auth as Auth
import Update.DragDrop as DragDrop
import Update.MapViewer as MapViewer
import Update.Notifications as Notifications
import Update.RaceBuilder as RaceBuilder
import Update.Races as Races
import Update.Rules as Rules
import Update.Server as Server
import Update.SessionDetail as SessionDetail
import Update.Sessions as Sessions
import Update.Settings as Settings
import Update.TurnFiles as TurnFiles
import Update.UI as UI



-- =============================================================================
-- UPDATE
-- =============================================================================


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        NoOp ->
            ( model, Cmd.none )

        -- =====================================================================
        -- Server Messages
        -- =====================================================================
        GotServers result ->
            Server.handleGotServers model result

        SelectServer serverUrl ->
            Server.handleSelectServer model serverUrl

        GotHasDefaultServer result ->
            Server.handleGotHasDefaultServer model result

        AddDefaultServer ->
            Server.handleAddDefaultServer model

        DefaultServerAdded result ->
            Server.handleDefaultServerAdded model result

        OpenAddServerDialog ->
            Server.handleOpenAddServerDialog model

        OpenEditServerDialog serverUrl ->
            Server.handleOpenEditServerDialog model serverUrl

        OpenRemoveServerDialog serverUrl serverName ->
            Server.handleOpenRemoveServerDialog model serverUrl serverName

        CloseDialog ->
            Server.handleCloseDialog model

        UpdateServerFormName name ->
            Server.handleUpdateServerFormName model name

        UpdateServerFormUrl url ->
            Server.handleUpdateServerFormUrl model url

        SubmitAddServer ->
            Server.handleSubmitAddServer model

        SubmitEditServer serverId ->
            Server.handleSubmitEditServer model serverId

        ConfirmRemoveServer serverId ->
            Server.handleConfirmRemoveServer model serverId

        ServerAdded result ->
            Server.handleServerAdded model result

        ServerUpdated result ->
            Server.handleServerUpdated model result

        ServerRemoved result ->
            Server.handleServerRemoved model result

        -- Context menu
        ShowContextMenu serverUrl x y ->
            Server.handleShowContextMenu model serverUrl x y

        HideContextMenu ->
            Server.handleHideContextMenu model

        -- =====================================================================
        -- Auth Messages
        -- =====================================================================
        UpdateConnectUsername username ->
            Auth.handleUpdateConnectUsername model username

        UpdateConnectPassword password ->
            Auth.handleUpdateConnectPassword model password

        UpdateRegisterNickname nickname ->
            Auth.handleUpdateRegisterNickname model nickname

        UpdateRegisterEmail email ->
            Auth.handleUpdateRegisterEmail model email

        UpdateRegisterMessage message ->
            Auth.handleUpdateRegisterMessage model message

        SwitchToRegister ->
            Auth.handleSwitchToRegister model

        SwitchToConnect ->
            Auth.handleSwitchToConnect model

        SubmitConnect serverUrl ->
            Auth.handleSubmitConnect model serverUrl

        SubmitRegister serverUrl ->
            Auth.handleSubmitRegister model serverUrl

        ConnectResult serverUrl result ->
            Auth.handleConnectResult model serverUrl result

        RegisterResult serverUrl result ->
            Auth.handleRegisterResult model serverUrl result

        Disconnect serverUrl ->
            Auth.handleDisconnect model serverUrl

        DisconnectResult serverUrl result ->
            Auth.handleDisconnectResult model serverUrl result

        -- =====================================================================
        -- Session Messages
        -- =====================================================================
        GotSessions serverUrl result ->
            Sessions.handleGotSessions model serverUrl result

        GotSession serverUrl result ->
            Sessions.handleGotSession model serverUrl result

        GotFetchStartTime serverUrl time ->
            Sessions.handleGotFetchStartTime model serverUrl time

        GotFetchEndTime serverUrl result time ->
            Sessions.handleGotFetchEndTime model serverUrl result time

        SetSessionFilter filter ->
            Sessions.handleSetSessionFilter model filter

        RefreshSessions ->
            Sessions.handleRefreshSessions model

        FetchArchivedSessions ->
            Sessions.handleFetchArchivedSessions model

        GotArchivedSessions serverUrl result ->
            Sessions.handleGotArchivedSessions model serverUrl result

        OpenCreateSessionDialog ->
            Sessions.handleOpenCreateSessionDialog model

        UpdateCreateSessionName name ->
            Sessions.handleUpdateCreateSessionName model name

        UpdateCreateSessionPublic isPublic ->
            Sessions.handleUpdateCreateSessionPublic model isPublic

        SubmitCreateSession ->
            Sessions.handleSubmitCreateSession model

        SessionCreated serverUrl result ->
            Sessions.handleSessionCreated model serverUrl result

        JoinSession sessionId ->
            Sessions.handleJoinSession model sessionId

        SessionJoined serverUrl result ->
            Sessions.handleSessionJoined model serverUrl result

        DeleteSession sessionId ->
            Sessions.handleDeleteSession model sessionId

        SessionDeleted serverUrl result ->
            Sessions.handleSessionDeleted model serverUrl result

        QuitSession sessionId ->
            Sessions.handleQuitSession model sessionId

        SessionQuitResult serverUrl result ->
            Sessions.handleSessionQuitResult model serverUrl result

        PromoteMember sessionId userId ->
            Sessions.handlePromoteMember model sessionId userId

        MemberPromoted serverUrl result ->
            Sessions.handleMemberPromoted model serverUrl result

        ArchiveSession sessionId ->
            Sessions.handleArchiveSession model sessionId

        SessionArchived serverUrl result ->
            Sessions.handleSessionArchived model serverUrl result

        SessionsUpdated serverUrl ->
            Sessions.handleSessionsUpdated model serverUrl

        StartGame sessionId ->
            Sessions.handleStartGame model sessionId

        GameStarted serverUrl result ->
            Sessions.handleGameStarted model serverUrl result

        SetPlayerReady sessionId ready ->
            Sessions.handleSetPlayerReady model sessionId ready

        PlayerReadyResult serverUrl result ->
            Sessions.handlePlayerReadyResult model serverUrl result

        -- =====================================================================
        -- Session Detail Messages
        -- =====================================================================
        ViewSessionDetail sessionId ->
            SessionDetail.handleViewSessionDetail model sessionId

        CloseSessionDetail ->
            SessionDetail.handleCloseSessionDetail model

        TogglePlayersExpanded ->
            SessionDetail.handleTogglePlayersExpanded model

        GotUserProfiles serverUrl result ->
            SessionDetail.handleGotUserProfiles model serverUrl result

        OpenInviteDialog ->
            SessionDetail.handleOpenInviteDialog model

        SelectUserToInvite userId ->
            SessionDetail.handleSelectUserToInvite model userId

        SubmitInvite ->
            SessionDetail.handleSubmitInvite model

        InviteResult serverUrl result ->
            SessionDetail.handleInviteResult model serverUrl result

        OpenInvitationsDialog ->
            SessionDetail.handleOpenInvitationsDialog model

        ViewInvitedSession sessionId ->
            SessionDetail.handleViewInvitedSession model sessionId

        GotInvitations serverUrl result ->
            SessionDetail.handleGotInvitations model serverUrl result

        GotSentInvitations serverUrl result ->
            SessionDetail.handleGotSentInvitations model serverUrl result

        AcceptInvitation invitationId ->
            SessionDetail.handleAcceptInvitation model invitationId

        InvitationAccepted serverUrl result ->
            SessionDetail.handleInvitationAccepted model serverUrl result

        DeclineInvitation invitationId ->
            SessionDetail.handleDeclineInvitation model invitationId

        InvitationDeclined serverUrl result ->
            SessionDetail.handleInvitationDeclined model serverUrl result

        CancelSentInvitation invitationId ->
            SessionDetail.handleCancelSentInvitation model invitationId

        SentInvitationCanceled serverUrl result ->
            SessionDetail.handleSentInvitationCanceled model serverUrl result

        -- =====================================================================
        -- Races Messages
        -- =====================================================================
        OpenRacesDialog ->
            Races.handleOpenRacesDialog model

        GotRaces serverUrl result ->
            Races.handleGotRaces model serverUrl result

        UploadRace ->
            Races.handleUploadRace model

        RaceUploaded serverUrl result ->
            Races.handleRaceUploaded model serverUrl result

        DownloadRace raceId ->
            Races.handleDownloadRace model raceId

        RaceDownloaded result ->
            Races.handleRaceDownloaded model result

        DeleteRace raceId ->
            Races.handleDeleteRace model raceId

        RaceDeleted serverUrl result ->
            Races.handleRaceDeleted model serverUrl result

        OpenSetupRaceDialog sessionId ->
            Races.handleOpenSetupRaceDialog model sessionId

        SelectRaceForSession raceId ->
            Races.handleSelectRaceForSession model raceId

        SubmitSetupRace ->
            Races.handleSubmitSetupRace model

        SetupRaceResult serverUrl result ->
            Races.handleSetupRaceResult model serverUrl result

        GotSessionPlayerRace serverUrl sessionId result ->
            Races.handleGotSessionPlayerRace model serverUrl sessionId result

        UploadAndSetRace ->
            Races.handleUploadAndSetRace model

        -- =====================================================================
        -- Rules Messages
        -- =====================================================================
        OpenRulesDialog sessionId rulesIsSet ->
            Rules.handleOpenRulesDialog model sessionId rulesIsSet

        GotRules serverUrl sessionId result ->
            Rules.handleGotRules model serverUrl sessionId result

        SubmitRules ->
            Rules.handleSubmitRules model

        RulesSet serverUrl result ->
            Rules.handleRulesSet model serverUrl result

        -- Universe configuration
        UpdateRulesUniverseSize val ->
            Rules.handleUpdateRulesUniverseSize model val

        UpdateRulesDensity val ->
            Rules.handleUpdateRulesDensity model val

        UpdateRulesStartingDistance val ->
            Rules.handleUpdateRulesStartingDistance model val

        -- Game options
        UpdateRulesMaximumMinerals val ->
            Rules.handleUpdateRulesMaximumMinerals model val

        UpdateRulesSlowerTechAdvances val ->
            Rules.handleUpdateRulesSlowerTechAdvances model val

        UpdateRulesAcceleratedBbsPlay val ->
            Rules.handleUpdateRulesAcceleratedBbsPlay model val

        UpdateRulesNoRandomEvents val ->
            Rules.handleUpdateRulesNoRandomEvents model val

        UpdateRulesComputerPlayersFormAlliances val ->
            Rules.handleUpdateRulesComputerPlayersFormAlliances model val

        UpdateRulesPublicPlayerScores val ->
            Rules.handleUpdateRulesPublicPlayerScores model val

        UpdateRulesGalaxyClumping val ->
            Rules.handleUpdateRulesGalaxyClumping model val

        -- Victory conditions
        UpdateRulesVcOwnsPercentOfPlanets val ->
            Rules.handleUpdateRulesVcOwnsPercentOfPlanets model val

        UpdateRulesVcOwnsPercentOfPlanetsValue val ->
            Rules.handleUpdateRulesVcOwnsPercentOfPlanetsValue model val

        UpdateRulesVcAttainTechInFields val ->
            Rules.handleUpdateRulesVcAttainTechInFields model val

        UpdateRulesVcAttainTechInFieldsTechValue val ->
            Rules.handleUpdateRulesVcAttainTechInFieldsTechValue model val

        UpdateRulesVcAttainTechInFieldsFieldsValue val ->
            Rules.handleUpdateRulesVcAttainTechInFieldsFieldsValue model val

        UpdateRulesVcExceedScoreOf val ->
            Rules.handleUpdateRulesVcExceedScoreOf model val

        UpdateRulesVcExceedScoreOfValue val ->
            Rules.handleUpdateRulesVcExceedScoreOfValue model val

        UpdateRulesVcExceedNextPlayerScoreBy val ->
            Rules.handleUpdateRulesVcExceedNextPlayerScoreBy model val

        UpdateRulesVcExceedNextPlayerScoreByValue val ->
            Rules.handleUpdateRulesVcExceedNextPlayerScoreByValue model val

        UpdateRulesVcHasProductionCapacityOf val ->
            Rules.handleUpdateRulesVcHasProductionCapacityOf model val

        UpdateRulesVcHasProductionCapacityOfValue val ->
            Rules.handleUpdateRulesVcHasProductionCapacityOfValue model val

        UpdateRulesVcOwnsCapitalShips val ->
            Rules.handleUpdateRulesVcOwnsCapitalShips model val

        UpdateRulesVcOwnsCapitalShipsValue val ->
            Rules.handleUpdateRulesVcOwnsCapitalShipsValue model val

        UpdateRulesVcHaveHighestScoreAfterYears val ->
            Rules.handleUpdateRulesVcHaveHighestScoreAfterYears model val

        UpdateRulesVcHaveHighestScoreAfterYearsValue val ->
            Rules.handleUpdateRulesVcHaveHighestScoreAfterYearsValue model val

        UpdateRulesVcWinnerMustMeet val ->
            Rules.handleUpdateRulesVcWinnerMustMeet model val

        UpdateRulesVcMinYearsBeforeWinner val ->
            Rules.handleUpdateRulesVcMinYearsBeforeWinner model val

        -- =====================================================================
        -- Turn Files Messages
        -- =====================================================================
        OpenTurnFilesDialog sessionId year isLatestYear ->
            TurnFiles.handleOpenTurnFilesDialog model sessionId year isLatestYear

        GotTurnFiles serverUrl result ->
            TurnFiles.handleGotTurnFiles model serverUrl result

        GotLatestTurn serverUrl result ->
            TurnFiles.handleGotLatestTurn model serverUrl result

        GotOrdersStatus serverUrl result ->
            TurnFiles.handleGotOrdersStatus model serverUrl result

        OpenGameDir sessionId ->
            TurnFiles.handleOpenGameDir model sessionId

        LaunchStars sessionId ->
            TurnFiles.handleLaunchStars model sessionId

        LaunchStarsResult result ->
            TurnFiles.handleLaunchStarsResult model result

        GotHasStarsExe result ->
            TurnFiles.handleGotHasStarsExe model result

        -- =====================================================================
        -- Session Backup Messages
        -- =====================================================================
        DownloadSessionBackup sessionId ->
            Sessions.handleDownloadSessionBackup model sessionId

        SessionBackupDownloaded serverUrl result ->
            Sessions.handleSessionBackupDownloaded model serverUrl result

        DownloadHistoricBackup sessionId ->
            Sessions.handleDownloadHistoricBackup model sessionId

        HistoricBackupDownloaded serverUrl result ->
            Sessions.handleHistoricBackupDownloaded model serverUrl result

        -- =====================================================================
        -- Drag and Drop Messages
        -- =====================================================================
        MouseDownOnPlayer playerId playerName x y ->
            DragDrop.handleMouseDownOnPlayer model playerId playerName x y

        MouseMoveWhileDragging x y ->
            DragDrop.handleMouseMoveWhileDragging model x y

        MouseEnterPlayer playerId ->
            DragDrop.handleMouseEnterPlayer model playerId

        MouseLeavePlayer ->
            DragDrop.handleMouseLeavePlayer model

        MouseUpEndDrag ->
            DragDrop.handleMouseUpEndDrag model

        PlayersReordered serverUrl result ->
            DragDrop.handlePlayersReordered model serverUrl result

        ServerDragStart serverUrl y ->
            DragDrop.handleServerDragStart model serverUrl y

        ServerDragMove y ->
            DragDrop.handleServerDragMove model y

        ServerDragEnter serverUrl ->
            DragDrop.handleServerDragEnter model serverUrl

        ServerDragLeave ->
            DragDrop.handleServerDragLeave model

        ServerDragEnd ->
            DragDrop.handleServerDragEnd model

        ServersReordered result ->
            DragDrop.handleServersReordered model result

        -- =====================================================================
        -- Settings Messages
        -- =====================================================================
        OpenSettingsDialog ->
            Settings.handleOpenSettingsDialog model

        GotAppSettings result ->
            Settings.handleGotAppSettings model result

        SelectServersDir ->
            Settings.handleSelectServersDir model

        ServersDirSelected result ->
            Settings.handleServersDirSelected model result

        SetAutoDownloadStars enabled ->
            Settings.handleSetAutoDownloadStars model enabled

        AutoDownloadStarsSet result ->
            Settings.handleAutoDownloadStarsSet model result

        SetUseWine useWine ->
            Settings.handleSetUseWine model useWine

        UseWineSet result ->
            Settings.handleUseWineSet model result

        SelectWinePrefixesDir ->
            Settings.handleSelectWinePrefixesDir model

        WinePrefixesDirSelected result ->
            Settings.handleWinePrefixesDirSelected model result

        CheckWineInstall ->
            Settings.handleCheckWineInstall model

        WineInstallChecked result ->
            Settings.handleWineInstallChecked model result

        CheckNtvdmSupport ->
            Settings.handleCheckNtvdmSupport model

        NtvdmChecked result ->
            Settings.handleNtvdmChecked model result

        -- =====================================================================
        -- Map Viewer Messages
        -- =====================================================================
        OpenMapViewer sessionId year raceName playerNumber ->
            MapViewer.handleOpenMapViewer model sessionId year raceName playerNumber

        UpdateMapWidth val ->
            MapViewer.handleUpdateMapWidth model val

        UpdateMapHeight val ->
            MapViewer.handleUpdateMapHeight model val

        SelectMapPreset preset ->
            MapViewer.handleSelectMapPreset model preset

        ToggleShowNames ->
            MapViewer.handleToggleShowNames model

        ToggleShowFleets ->
            MapViewer.handleToggleShowFleets model

        UpdateShowFleetPaths val ->
            MapViewer.handleUpdateShowFleetPaths model val

        ToggleShowMines ->
            MapViewer.handleToggleShowMines model

        ToggleShowWormholes ->
            MapViewer.handleToggleShowWormholes model

        ToggleShowLegend ->
            MapViewer.handleToggleShowLegend model

        ToggleShowScannerCoverage ->
            MapViewer.handleToggleShowScannerCoverage model

        GenerateMap ->
            MapViewer.handleGenerateMap model

        MapGenerated result ->
            MapViewer.handleMapGenerated model result

        SaveMap ->
            MapViewer.handleSaveMap model

        MapSaved result ->
            MapViewer.handleMapSaved model result

        ToggleMapFullscreen ->
            MapViewer.handleToggleMapFullscreen model

        SelectMapFormat format ->
            MapViewer.handleSelectMapFormat model format

        UpdateGifDelay delay ->
            MapViewer.handleUpdateGifDelay model delay

        GenerateAnimatedMap ->
            MapViewer.handleGenerateAnimatedMap model

        AnimatedMapGenerated result ->
            MapViewer.handleAnimatedMapGenerated model result

        SaveGif ->
            MapViewer.handleSaveGif model

        GifSaved result ->
            MapViewer.handleGifSaved model result

        -- =====================================================================
        -- Race Builder Messages
        -- =====================================================================
        OpenRaceBuilder origin ->
            RaceBuilder.handleOpenRaceBuilder model origin

        SelectRaceBuilderTab tab ->
            RaceBuilder.handleSelectRaceBuilderTab model tab

        LoadRaceTemplate templateName ->
            RaceBuilder.handleLoadRaceTemplate model templateName

        RaceTemplateLoaded result ->
            RaceBuilder.handleRaceTemplateLoaded model result

        SelectCustomTemplate ->
            RaceBuilder.handleSelectCustomTemplate model

        -- Identity tab
        UpdateRaceBuilderSingularName val ->
            RaceBuilder.handleUpdateRaceBuilderSingularName model val

        UpdateRaceBuilderPluralName val ->
            RaceBuilder.handleUpdateRaceBuilderPluralName model val

        UpdateRaceBuilderPassword val ->
            RaceBuilder.handleUpdateRaceBuilderPassword model val

        UpdateRaceBuilderIcon val ->
            RaceBuilder.handleUpdateRaceBuilderIcon model val

        UpdateRaceBuilderLeftoverPoints val ->
            RaceBuilder.handleUpdateRaceBuilderLeftoverPoints model val

        -- PRT/LRT tab
        UpdateRaceBuilderPRT prt ->
            RaceBuilder.handleUpdateRaceBuilderPRT model prt

        ToggleRaceBuilderLRT lrt ->
            RaceBuilder.handleToggleRaceBuilderLRT model lrt

        -- Habitability tab
        UpdateRaceBuilderGravityCenter val ->
            RaceBuilder.handleUpdateRaceBuilderGravityCenter model val

        UpdateRaceBuilderGravityWidth val ->
            RaceBuilder.handleUpdateRaceBuilderGravityWidth model val

        UpdateRaceBuilderGravityImmune val ->
            RaceBuilder.handleUpdateRaceBuilderGravityImmune model val

        UpdateRaceBuilderTemperatureCenter val ->
            RaceBuilder.handleUpdateRaceBuilderTemperatureCenter model val

        UpdateRaceBuilderTemperatureWidth val ->
            RaceBuilder.handleUpdateRaceBuilderTemperatureWidth model val

        UpdateRaceBuilderTemperatureImmune val ->
            RaceBuilder.handleUpdateRaceBuilderTemperatureImmune model val

        UpdateRaceBuilderRadiationCenter val ->
            RaceBuilder.handleUpdateRaceBuilderRadiationCenter model val

        UpdateRaceBuilderRadiationWidth val ->
            RaceBuilder.handleUpdateRaceBuilderRadiationWidth model val

        UpdateRaceBuilderRadiationImmune val ->
            RaceBuilder.handleUpdateRaceBuilderRadiationImmune model val

        UpdateRaceBuilderGrowthRate val ->
            RaceBuilder.handleUpdateRaceBuilderGrowthRate model val

        -- Hab button hold-to-repeat
        HabButtonPressed field ->
            RaceBuilder.handleHabButtonPressed model field

        HabButtonReleased ->
            RaceBuilder.handleHabButtonReleased model

        HabButtonTick ->
            RaceBuilder.handleHabButtonTick model

        -- Economy tab
        UpdateRaceBuilderColonistsPerResource val ->
            RaceBuilder.handleUpdateRaceBuilderColonistsPerResource model val

        UpdateRaceBuilderFactoryOutput val ->
            RaceBuilder.handleUpdateRaceBuilderFactoryOutput model val

        UpdateRaceBuilderFactoryCost val ->
            RaceBuilder.handleUpdateRaceBuilderFactoryCost model val

        UpdateRaceBuilderFactoryCount val ->
            RaceBuilder.handleUpdateRaceBuilderFactoryCount model val

        UpdateRaceBuilderFactoriesUseLessGerm val ->
            RaceBuilder.handleUpdateRaceBuilderFactoriesUseLessGerm model val

        UpdateRaceBuilderMineOutput val ->
            RaceBuilder.handleUpdateRaceBuilderMineOutput model val

        UpdateRaceBuilderMineCost val ->
            RaceBuilder.handleUpdateRaceBuilderMineCost model val

        UpdateRaceBuilderMineCount val ->
            RaceBuilder.handleUpdateRaceBuilderMineCount model val

        -- Research tab
        UpdateRaceBuilderResearchEnergy val ->
            RaceBuilder.handleUpdateRaceBuilderResearchEnergy model val

        UpdateRaceBuilderResearchWeapons val ->
            RaceBuilder.handleUpdateRaceBuilderResearchWeapons model val

        UpdateRaceBuilderResearchPropulsion val ->
            RaceBuilder.handleUpdateRaceBuilderResearchPropulsion model val

        UpdateRaceBuilderResearchConstruction val ->
            RaceBuilder.handleUpdateRaceBuilderResearchConstruction model val

        UpdateRaceBuilderResearchElectronics val ->
            RaceBuilder.handleUpdateRaceBuilderResearchElectronics model val

        UpdateRaceBuilderResearchBiotech val ->
            RaceBuilder.handleUpdateRaceBuilderResearchBiotech model val

        UpdateRaceBuilderTechsStartHigh val ->
            RaceBuilder.handleUpdateRaceBuilderTechsStartHigh model val

        -- Validation
        RaceBuilderValidationReceived result ->
            RaceBuilder.handleRaceBuilderValidationReceived model result

        -- View/Copy race
        ViewRaceInBuilder raceId raceName ->
            RaceBuilder.handleViewRaceInBuilder model raceId raceName

        RaceFileLoaded result ->
            RaceBuilder.handleRaceFileLoaded model result

        CreateRaceFromExisting ->
            RaceBuilder.handleCreateRaceFromExisting model

        -- Save/Cancel
        SubmitRaceBuilder ->
            RaceBuilder.handleSubmitRaceBuilder model

        RaceBuilderSaved result ->
            RaceBuilder.handleRaceBuilderSaved model result

        -- =====================================================================
        -- Notification Messages
        -- =====================================================================
        ConnectionChanged serverUrl state ->
            Notifications.handleConnectionChanged model serverUrl state

        OrderConflictReceived serverUrl sessionId year ->
            Notifications.handleOrderConflictReceived model serverUrl sessionId year

        NotificationSession serverUrl id action ->
            Notifications.handleNotificationSession model serverUrl id action

        NotificationInvitation serverUrl id action ->
            Notifications.handleNotificationInvitation model serverUrl id action

        NotificationRace serverUrl id action ->
            Notifications.handleNotificationRace model serverUrl id action

        NotificationPlayerRace serverUrl id action ->
            Notifications.handleNotificationPlayerRace model serverUrl id action

        NotificationRuleset serverUrl sessionId action ->
            Notifications.handleNotificationRuleset model serverUrl sessionId action

        NotificationSessionTurn serverUrl sessionId action maybeYear ->
            Notifications.handleNotificationSessionTurn model serverUrl sessionId action maybeYear

        NotificationOrderStatus serverUrl sessionId action ->
            Notifications.handleNotificationOrderStatus model serverUrl sessionId action

        NotificationPendingRegistration serverUrl id action maybeUserProfileId maybeNickname ->
            Notifications.handleNotificationPendingRegistration model serverUrl id action maybeUserProfileId maybeNickname

        -- =====================================================================
        -- Stars Browser Messages
        -- =====================================================================
        OpenStarsBrowser serverUrl sessionId _ ->
            Admin.handleOpenStarsBrowser model serverUrl sessionId

        -- =====================================================================
        -- Admin/Manager Messages
        -- =====================================================================
        OpenUsersListDialog ->
            Admin.handleOpenUsersListDialog model

        UpdateUsersListFilter query ->
            Admin.handleUpdateUsersListFilter model query

        OpenCreateUserDialog ->
            Admin.handleOpenCreateUserDialog model

        UpdateCreateUserNickname nickname ->
            Admin.handleUpdateCreateUserNickname model nickname

        UpdateCreateUserEmail email ->
            Admin.handleUpdateCreateUserEmail model email

        SubmitCreateUser ->
            Admin.handleSubmitCreateUser model

        CreateUserResult serverUrl result ->
            Admin.handleCreateUserResult model serverUrl result

        ConfirmDeleteUser userId nickname ->
            Admin.handleConfirmDeleteUser model userId nickname

        CancelDeleteUser ->
            Admin.handleCancelDeleteUser model

        SubmitDeleteUser userId ->
            Admin.handleSubmitDeleteUser model userId

        DeleteUserResult serverUrl result ->
            Admin.handleDeleteUserResult model serverUrl result

        ConfirmResetApikey userId ->
            Admin.handleConfirmResetApikey model userId

        CancelResetApikey ->
            Admin.handleCancelResetApikey model

        SubmitResetApikey userId ->
            Admin.handleSubmitResetApikey model userId

        ResetApikeyResult result ->
            Admin.handleResetApikeyResult model result

        -- =====================================================================
        -- Bot Player Messages
        -- =====================================================================
        OpenAddBotDialog sessionId ->
            Admin.handleOpenAddBotDialog model sessionId

        SelectBotRace raceId ->
            Admin.handleSelectBotRace model raceId

        SelectBotLevel level ->
            Admin.handleSelectBotLevel model level

        SubmitAddBot ->
            Admin.handleSubmitAddBot model

        AddBotResult serverUrl result ->
            Admin.handleAddBotResult model serverUrl result

        -- =====================================================================
        -- Pending Registration Messages
        -- =====================================================================
        SwitchUsersListPane ->
            Admin.handleSwitchUsersListPane model

        GotPendingRegistrations serverUrl result ->
            Admin.handleGotPendingRegistrations model serverUrl result

        ViewRegistrationMessage userId nickname message ->
            Admin.handleViewRegistrationMessage model userId nickname message

        CloseRegistrationMessage ->
            Admin.handleCloseRegistrationMessage model

        ConfirmApproveRegistration userId nickname ->
            Admin.handleConfirmApproveRegistration model userId nickname

        CancelApproveRegistration ->
            Admin.handleCancelApproveRegistration model

        SubmitApproveRegistration userId ->
            Admin.handleSubmitApproveRegistration model userId

        ApproveRegistrationResult serverUrl result ->
            Admin.handleApproveRegistrationResult model serverUrl result

        ConfirmRejectRegistration userId nickname ->
            Admin.handleConfirmRejectRegistration model userId nickname

        CancelRejectRegistration ->
            Admin.handleCancelRejectRegistration model

        SubmitRejectRegistration userId ->
            Admin.handleSubmitRejectRegistration model userId

        RejectRegistrationResult _ result ->
            Admin.handleRejectRegistrationResult model result

        -- =====================================================================
        -- Change Own API Key Messages
        -- =====================================================================
        OpenChangeApikeyDialog ->
            Admin.handleOpenChangeApikeyDialog model

        CancelChangeApikey ->
            Admin.handleCancelChangeApikey model

        SubmitChangeApikey ->
            Admin.handleSubmitChangeApikey model

        ChangeApikeyResult result ->
            Admin.handleChangeApikeyResult model result

        -- =====================================================================
        -- User Menu Messages
        -- =====================================================================
        ToggleUserMenu ->
            Admin.handleToggleUserMenu model

        HideUserMenu ->
            Admin.handleHideUserMenu model

        CopyApiKey serverUrl ->
            Admin.handleCopyApiKey model serverUrl

        GotApiKey _ result ->
            Admin.handleGotApiKey model result

        CopyToClipboard text ->
            Admin.handleCopyToClipboard model text

        HideToast ->
            Admin.handleHideToast model

        -- =====================================================================
        -- Global UI Messages
        -- =====================================================================
        ClearError ->
            UI.handleClearError model

        EscapePressed ->
            UI.handleEscapePressed model

        -- =====================================================================
        -- Zoom Messages
        -- =====================================================================
        ZoomIn ->
            UI.handleZoomIn model

        ZoomOut ->
            UI.handleZoomOut model

        ZoomReset ->
            UI.handleZoomReset model

        ZoomLevelSet result ->
            UI.handleZoomLevelSet model result

        -- =====================================================================
        -- Browser Stars! Messages
        -- =====================================================================
        RequestEnableBrowserStars enabled ->
            UI.handleRequestEnableBrowserStars model enabled

        ConfirmEnableBrowserStars ->
            UI.handleConfirmEnableBrowserStars model

        CancelEnableBrowserStars ->
            UI.handleCancelEnableBrowserStars model

        EnableBrowserStarsSet result ->
            UI.handleEnableBrowserStarsSet model result
