/**
 * Elm Ports - JavaScript interop for Wails/Go backend
 *
 * This module handles all communication between Elm and the Go backend via Wails.
 * It subscribes to Elm outgoing ports and sends results back through incoming ports.
 */

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Handle Go results with consistent error handling.
 */
async function callGo(port, goCall) {
    try {
        const result = await goCall;
        port.send({ ok: result });
    } catch (err) {
        port.send({ error: err.message || String(err) });
    }
}

/**
 * Handle Go calls that need serverUrl in the result.
 */
async function callGoWithContext(port, serverUrl, goCall) {
    try {
        const result = await goCall;
        port.send({ serverUrl: serverUrl, ok: result });
    } catch (err) {
        port.send({ serverUrl: serverUrl, error: err.message || String(err) });
    }
}

/**
 * Handle Go calls that need both serverUrl and sessionId in the result.
 */
async function callGoWithServerAndSessionContext(port, serverUrl, sessionId, goCall) {
    try {
        const result = await goCall;
        port.send({ serverUrl: serverUrl, sessionId: sessionId, ok: result });
    } catch (err) {
        port.send({ serverUrl: serverUrl, sessionId: sessionId, error: err.message || String(err) });
    }
}

/**
 * Create a file input, add to DOM, and handle selection.
 * Required for WebKit/Wails to work reliably.
 */
function createFileInput(accept, onFileSelected) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.style.display = 'none';
    document.body.appendChild(input);

    input.onchange = async (e) => {
        document.body.removeChild(input);
        const file = e.target.files[0];
        if (file) {
            onFileSelected(file);
        }
    };

    input.addEventListener('cancel', () => document.body.removeChild(input));
    input.click();
}

/**
 * Read a file as base64.
 */
function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const base64Data = event.target.result.split(',')[1];
            resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// =============================================================================
// Port Initialization
// =============================================================================

/**
 * Initialize all Elm ports.
 * @param {Object} app - The Elm application instance
 */
function initPorts(app) {
    // =========================================================================
    // Debug Logging
    // =========================================================================

    if (app.ports.logDebug) {
        app.ports.logDebug.subscribe(async (message) => {
            window.go.main.App.LogDebug(message);
        });
    }

    // =========================================================================
    // UI Utilities
    // =========================================================================

    if (app.ports.clearSelection) {
        app.ports.clearSelection.subscribe(() => {
            window.getSelection().removeAllRanges();
        });
    }

    if (app.ports.copyToClipboard) {
        app.ports.copyToClipboard.subscribe((text) => {
            navigator.clipboard.writeText(text).catch(err => {
                console.error('Failed to copy to clipboard:', err);
            });
        });
    }

    // =========================================================================
    // Server Management
    // =========================================================================

    if (app.ports.getServers) {
        app.ports.getServers.subscribe(async () => {
            callGo(app.ports.serversReceived, window.go.main.App.GetServers());
        });
    }

    if (app.ports.addServer) {
        app.ports.addServer.subscribe(async (data) => {
            callGo(app.ports.serverAdded, window.go.main.App.AddServer(data.name, data.url));
        });
    }

    if (app.ports.updateServer) {
        app.ports.updateServer.subscribe(async (data) => {
            callGo(app.ports.serverUpdated,
                window.go.main.App.UpdateServer(data.oldUrl, data.name, data.url));
        });
    }

    if (app.ports.removeServer) {
        app.ports.removeServer.subscribe(async (serverUrl) => {
            callGo(app.ports.serverRemoved, window.go.main.App.RemoveServer(serverUrl));
        });
    }

    if (app.ports.reorderServers) {
        app.ports.reorderServers.subscribe(async (data) => {
            callGo(app.ports.serversReordered,
                window.go.main.App.ReorderServers(data.serverOrders));
        });
    }

    if (app.ports.hasDefaultServer) {
        app.ports.hasDefaultServer.subscribe(async () => {
            callGo(app.ports.hasDefaultServerResult, window.go.main.App.HasDefaultServer());
        });
    }

    if (app.ports.addDefaultServer) {
        app.ports.addDefaultServer.subscribe(async () => {
            callGo(app.ports.defaultServerAdded, window.go.main.App.AddDefaultServer());
        });
    }

    // =========================================================================
    // Authentication
    // =========================================================================

    if (app.ports.connect) {
        app.ports.connect.subscribe(async (data) => {
            callGoWithContext(app.ports.connectResult, data.serverUrl,
                window.go.main.App.Connect(data.serverUrl, data.username, data.password));
        });
    }

    if (app.ports.autoConnect) {
        app.ports.autoConnect.subscribe(async (serverUrl) => {
            callGoWithContext(app.ports.connectResult, serverUrl,
                window.go.main.App.AutoConnect(serverUrl));
        });
    }

    if (app.ports.disconnect) {
        app.ports.disconnect.subscribe(async (serverUrl) => {
            callGoWithContext(app.ports.disconnectResult, serverUrl,
                window.go.main.App.Disconnect(serverUrl));
        });
    }

    if (app.ports.register) {
        app.ports.register.subscribe(async (data) => {
            callGoWithContext(app.ports.registerResult, data.serverUrl,
                window.go.main.App.Register(data.serverUrl, data.nickname, data.email, data.message));
        });
    }

    if (app.ports.createUser) {
        app.ports.createUser.subscribe(async (data) => {
            callGoWithContext(app.ports.createUserResult, data.serverUrl,
                window.go.main.App.CreateUserProfile(data.serverUrl, data.nickname, data.email));
        });
    }

    if (app.ports.deleteUser) {
        app.ports.deleteUser.subscribe(async (data) => {
            callGoWithContext(app.ports.deleteUserResult, data.serverUrl,
                window.go.main.App.DeleteUserProfile(data.serverUrl, data.userId));
        });
    }

    if (app.ports.getPendingRegistrations) {
        app.ports.getPendingRegistrations.subscribe(async (serverUrl) => {
            callGoWithContext(app.ports.pendingRegistrationsReceived, serverUrl,
                window.go.main.App.GetPendingRegistrations(serverUrl));
        });
    }

    if (app.ports.approveRegistration) {
        app.ports.approveRegistration.subscribe(async (data) => {
            callGoWithContext(app.ports.approveRegistrationResult, data.serverUrl,
                window.go.main.App.ApprovePendingRegistration(data.serverUrl, data.userId));
        });
    }

    if (app.ports.rejectRegistration) {
        app.ports.rejectRegistration.subscribe(async (data) => {
            callGoWithContext(app.ports.rejectRegistrationResult, data.serverUrl,
                window.go.main.App.RejectPendingRegistration(data.serverUrl, data.userId));
        });
    }

    // =========================================================================
    // Sessions
    // =========================================================================

    if (app.ports.getSessions) {
        app.ports.getSessions.subscribe(async (serverUrl) => {
            callGoWithContext(app.ports.sessionsReceived, serverUrl,
                window.go.main.App.GetSessions(serverUrl));
        });
    }

    if (app.ports.getSessionsIncludeArchived) {
        app.ports.getSessionsIncludeArchived.subscribe(async (serverUrl) => {
            callGoWithContext(app.ports.archivedSessionsReceived, serverUrl,
                window.go.main.App.GetSessionsIncludeArchived(serverUrl));
        });
    }

    if (app.ports.getSession) {
        app.ports.getSession.subscribe(async (data) => {
            callGoWithContext(app.ports.sessionReceived, data.serverUrl,
                window.go.main.App.GetSession(data.serverUrl, data.sessionId));
        });
    }

    if (app.ports.createSession) {
        app.ports.createSession.subscribe(async (data) => {
            callGoWithContext(app.ports.sessionCreated, data.serverUrl,
                window.go.main.App.CreateSession(data.serverUrl, data.name, data.isPublic));
        });
    }

    if (app.ports.joinSession) {
        app.ports.joinSession.subscribe(async (data) => {
            callGoWithContext(app.ports.sessionJoined, data.serverUrl,
                window.go.main.App.JoinSession(data.serverUrl, data.sessionId));
        });
    }

    if (app.ports.deleteSession) {
        app.ports.deleteSession.subscribe(async (data) => {
            callGoWithContext(app.ports.sessionDeleted, data.serverUrl,
                window.go.main.App.DeleteSession(data.serverUrl, data.sessionId));
        });
    }

    if (app.ports.quitSession) {
        app.ports.quitSession.subscribe(async (data) => {
            callGoWithContext(app.ports.sessionQuit, data.serverUrl,
                window.go.main.App.QuitSession(data.serverUrl, data.sessionId));
        });
    }

    if (app.ports.promoteMember) {
        app.ports.promoteMember.subscribe(async (data) => {
            callGoWithContext(app.ports.memberPromoted, data.serverUrl,
                window.go.main.App.PromoteMember(data.serverUrl, data.sessionId, data.memberId));
        });
    }

    if (app.ports.archiveSession) {
        app.ports.archiveSession.subscribe(async (data) => {
            callGoWithContext(app.ports.sessionArchived, data.serverUrl,
                window.go.main.App.ArchiveSession(data.serverUrl, data.sessionId));
        });
    }

    if (app.ports.reorderPlayers) {
        app.ports.reorderPlayers.subscribe(async (data) => {
            callGoWithContext(app.ports.playersReordered, data.serverUrl,
                window.go.main.App.ReorderPlayers(data.serverUrl, data.sessionId, data.playerOrders));
        });
    }

    // =========================================================================
    // User Profiles & Invitations
    // =========================================================================

    if (app.ports.getUserProfiles) {
        app.ports.getUserProfiles.subscribe(async (serverUrl) => {
            callGoWithContext(app.ports.userProfilesReceived, serverUrl,
                window.go.main.App.GetUserProfiles(serverUrl));
        });
    }

    if (app.ports.inviteUser) {
        app.ports.inviteUser.subscribe(async (data) => {
            callGoWithContext(app.ports.inviteResult, data.serverUrl,
                window.go.main.App.InviteUser(data.serverUrl, data.sessionId, data.userProfileId));
        });
    }

    if (app.ports.getInvitations) {
        app.ports.getInvitations.subscribe(async (serverUrl) => {
            callGoWithContext(app.ports.invitationsReceived, serverUrl,
                window.go.main.App.GetInvitations(serverUrl));
        });
    }

    if (app.ports.getSentInvitations) {
        app.ports.getSentInvitations.subscribe(async (serverUrl) => {
            callGoWithContext(app.ports.sentInvitationsReceived, serverUrl,
                window.go.main.App.GetSentInvitations(serverUrl));
        });
    }

    if (app.ports.acceptInvitation) {
        app.ports.acceptInvitation.subscribe(async (data) => {
            callGoWithContext(app.ports.invitationAccepted, data.serverUrl,
                window.go.main.App.AcceptInvitation(data.serverUrl, data.invitationId));
        });
    }

    if (app.ports.declineInvitation) {
        app.ports.declineInvitation.subscribe(async (data) => {
            callGoWithContext(app.ports.invitationDeclined, data.serverUrl,
                window.go.main.App.DeclineInvitation(data.serverUrl, data.invitationId));
        });
    }

    if (app.ports.cancelSentInvitation) {
        app.ports.cancelSentInvitation.subscribe(async (data) => {
            callGoWithContext(app.ports.sentInvitationCanceled, data.serverUrl,
                window.go.main.App.DeclineInvitation(data.serverUrl, data.invitationId));
        });
    }

    if (app.ports.resetUserApikey) {
        app.ports.resetUserApikey.subscribe(async (data) => {
            callGo(app.ports.resetApikeyResult,
                window.go.main.App.ResetUserApikey(data.serverUrl, data.userId));
        });
    }

    if (app.ports.changeMyApikey) {
        app.ports.changeMyApikey.subscribe(async (serverUrl) => {
            callGo(app.ports.changeApikeyResult,
                window.go.main.App.ChangeMyApikey(serverUrl));
        });
    }

    if (app.ports.getApiKey) {
        app.ports.getApiKey.subscribe(async (serverUrl) => {
            callGoWithContext(app.ports.apiKeyReceived, serverUrl,
                window.go.main.App.GetCurrentAPIKey(serverUrl));
        });
    }

    // =========================================================================
    // Races
    // =========================================================================

    if (app.ports.getRaces) {
        app.ports.getRaces.subscribe(async (serverUrl) => {
            callGoWithContext(app.ports.racesReceived, serverUrl,
                window.go.main.App.GetMyRaces(serverUrl));
        });
    }

    if (app.ports.uploadRace) {
        app.ports.uploadRace.subscribe(async (data) => {
            createFileInput('.r1', async (file) => {
                try {
                    const base64Data = await readFileAsBase64(file);
                    callGoWithContext(app.ports.raceUploaded, data.serverUrl,
                        window.go.main.App.UploadRace(data.serverUrl, base64Data));
                } catch (err) {
                    app.ports.raceUploaded.send({
                        serverUrl: data.serverUrl,
                        error: err.message || String(err)
                    });
                }
            });
        });
    }

    if (app.ports.downloadRace) {
        app.ports.downloadRace.subscribe(async (data) => {
            try {
                const base64Data = await window.go.main.App.DownloadRace(data.serverUrl, data.raceId);
                const binaryString = atob(base64Data);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                const blob = new Blob([bytes], { type: 'application/octet-stream' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'race_' + data.raceId + '.r1';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                app.ports.raceDownloaded.send({ ok: null });
            } catch (err) {
                app.ports.raceDownloaded.send({ error: err.message || String(err) });
            }
        });
    }

    if (app.ports.deleteRace) {
        app.ports.deleteRace.subscribe(async (data) => {
            callGoWithContext(app.ports.raceDeleted, data.serverUrl,
                window.go.main.App.DeleteRace(data.serverUrl, data.raceId));
        });
    }

    if (app.ports.setSessionRace) {
        app.ports.setSessionRace.subscribe(async (data) => {
            callGoWithContext(app.ports.sessionRaceSet, data.serverUrl,
                window.go.main.App.SetSessionRace(data.serverUrl, data.sessionId, data.raceId));
        });
    }

    if (app.ports.setPlayerReady) {
        app.ports.setPlayerReady.subscribe(async (data) => {
            try {
                const result = await window.go.main.App.SetPlayerReady(data.serverUrl, data.sessionId, data.ready);
                app.ports.playerReadyResult.send({ serverUrl: data.serverUrl, ok: result });
            } catch (err) {
                app.ports.playerReadyResult.send({
                    serverUrl: data.serverUrl,
                    error: err.message || String(err)
                });
            }
        });
    }

    if (app.ports.getSessionPlayerRace) {
        app.ports.getSessionPlayerRace.subscribe(async (data) => {
            try {
                const result = await window.go.main.App.GetSessionPlayerRace(data.serverUrl, data.sessionId);
                app.ports.sessionPlayerRaceReceived.send({
                    serverUrl: data.serverUrl,
                    sessionId: data.sessionId,
                    ok: result
                });
            } catch (err) {
                app.ports.sessionPlayerRaceReceived.send({
                    serverUrl: data.serverUrl,
                    sessionId: data.sessionId,
                    error: err.message || String(err)
                });
            }
        });
    }

    if (app.ports.uploadAndSetSessionRace) {
        app.ports.uploadAndSetSessionRace.subscribe(async (data) => {
            createFileInput('.r1', async (file) => {
                try {
                    const base64Data = await readFileAsBase64(file);
                    const race = await window.go.main.App.UploadRace(data.serverUrl, base64Data);
                    await window.go.main.App.SetSessionRace(data.serverUrl, data.sessionId, race.id);
                    app.ports.uploadAndSetSessionRaceResult.send({
                        serverUrl: data.serverUrl,
                        ok: null
                    });
                } catch (err) {
                    app.ports.uploadAndSetSessionRaceResult.send({
                        serverUrl: data.serverUrl,
                        error: err.message || String(err)
                    });
                }
            });
        });
    }

    // =========================================================================
    // Race Builder
    // =========================================================================

    if (app.ports.validateRaceConfig) {
        app.ports.validateRaceConfig.subscribe(async (data) => {
            try {
                const result = await window.go.main.App.ValidateRaceConfig(data.config);
                app.ports.raceBuilderValidation.send({
                    serverUrl: data.serverUrl,
                    ok: result
                });
            } catch (err) {
                app.ports.raceBuilderValidation.send({
                    serverUrl: data.serverUrl,
                    error: err.message || String(err)
                });
            }
        });
    }

    if (app.ports.getRaceTemplate) {
        app.ports.getRaceTemplate.subscribe(async (data) => {
            try {
                const result = await window.go.main.App.GetRaceTemplate(data.templateName);
                app.ports.raceTemplateReceived.send({
                    serverUrl: data.serverUrl,
                    ok: result
                });
            } catch (err) {
                app.ports.raceTemplateReceived.send({
                    serverUrl: data.serverUrl,
                    error: err.message || String(err)
                });
            }
        });
    }

    if (app.ports.buildAndSaveRace) {
        app.ports.buildAndSaveRace.subscribe(async (data) => {
            try {
                const sessionId = data.sessionId || "";
                const result = await window.go.main.App.BuildAndSaveRace(data.serverUrl, data.config, sessionId);
                app.ports.raceBuilderSaved.send({
                    serverUrl: data.serverUrl,
                    ok: result
                });
            } catch (err) {
                app.ports.raceBuilderSaved.send({
                    serverUrl: data.serverUrl,
                    error: err.message || String(err)
                });
            }
        });
    }

    if (app.ports.loadRaceFileConfig) {
        app.ports.loadRaceFileConfig.subscribe(async (data) => {
            try {
                const result = await window.go.main.App.LoadRaceFileConfig(data.serverUrl, data.raceId);
                app.ports.raceFileConfigLoaded.send({
                    serverUrl: data.serverUrl,
                    ok: result
                });
            } catch (err) {
                app.ports.raceFileConfigLoaded.send({
                    serverUrl: data.serverUrl,
                    error: err.message || String(err)
                });
            }
        });
    }

    // =========================================================================
    // Rules & Game
    // =========================================================================

    if (app.ports.getRules) {
        app.ports.getRules.subscribe(async (data) => {
            callGoWithServerAndSessionContext(app.ports.rulesReceived, data.serverUrl, data.sessionId,
                window.go.main.App.GetRules(data.serverUrl, data.sessionId));
        });
    }

    if (app.ports.setRules) {
        app.ports.setRules.subscribe(async (data) => {
            callGoWithContext(app.ports.rulesSet, data.serverUrl,
                window.go.main.App.SetRules(data.serverUrl, data.sessionId, data.rules));
        });
    }

    if (app.ports.startGame) {
        app.ports.startGame.subscribe(async (data) => {
            callGoWithContext(app.ports.gameStarted, data.serverUrl,
                window.go.main.App.StartGame(data.serverUrl, data.sessionId));
        });
    }

    // =========================================================================
    // Turns & Game Files
    // =========================================================================

    if (app.ports.getTurn) {
        app.ports.getTurn.subscribe(async (data) => {
            callGoWithContext(app.ports.turnReceived, data.serverUrl,
                window.go.main.App.GetTurn(data.serverUrl, data.sessionId, data.year, data.saveToGameDir));
        });
    }

    if (app.ports.getLatestTurn) {
        app.ports.getLatestTurn.subscribe(async (data) => {
            callGoWithContext(app.ports.latestTurnReceived, data.serverUrl,
                window.go.main.App.GetLatestTurn(data.serverUrl, data.sessionId));
        });
    }

    if (app.ports.getOrdersStatus) {
        app.ports.getOrdersStatus.subscribe(async (data) => {
            callGoWithContext(app.ports.ordersStatusReceived, data.serverUrl,
                window.go.main.App.GetOrdersStatus(data.serverUrl, data.sessionId));
        });
    }

    if (app.ports.openGameDir) {
        app.ports.openGameDir.subscribe(async (data) => {
            try {
                await window.go.main.App.OpenGameDir(data.serverUrl, data.sessionId);
            } catch (err) {
                console.error("Failed to open game directory:", err);
            }
        });
    }

    if (app.ports.launchStars) {
        app.ports.launchStars.subscribe(async (data) => {
            callGo(app.ports.launchStarsResult,
                window.go.main.App.LaunchStars(data.serverUrl, data.sessionId));
        });
    }

    if (app.ports.checkHasStarsExe) {
        app.ports.checkHasStarsExe.subscribe(async (data) => {
            try {
                const hasStarsExe = await window.go.main.App.HasStarsExe(data.serverUrl, data.sessionId);
                app.ports.hasStarsExeResult.send({
                    ok: {
                        serverUrl: data.serverUrl,
                        sessionId: data.sessionId,
                        hasStarsExe: hasStarsExe
                    }
                });
            } catch (err) {
                app.ports.hasStarsExeResult.send({ error: err.toString() });
            }
        });
    }

    if (app.ports.downloadSessionBackup) {
        app.ports.downloadSessionBackup.subscribe(async (data) => {
            callGoWithContext(app.ports.sessionBackupDownloaded, data.serverUrl,
                window.go.main.App.DownloadSessionBackup(data.serverUrl, data.sessionId));
        });
    }

    if (app.ports.downloadHistoricBackup) {
        app.ports.downloadHistoricBackup.subscribe(async (data) => {
            callGoWithContext(app.ports.historicBackupDownloaded, data.serverUrl,
                window.go.main.App.DownloadHistoricBackup(data.serverUrl, data.sessionId));
        });
    }

    // =========================================================================
    // App Settings
    // =========================================================================

    if (app.ports.getAppSettings) {
        app.ports.getAppSettings.subscribe(async () => {
            try {
                const settings = await window.go.main.App.GetAppSettings();
                if (settings && settings.zoomLevel) {
                    document.documentElement.style.setProperty('--zoom-level', settings.zoomLevel);
                }
                app.ports.appSettingsReceived.send({ ok: settings });
            } catch (err) {
                app.ports.appSettingsReceived.send({ error: err.message || String(err) });
            }
        });
    }

    if (app.ports.selectServersDir) {
        app.ports.selectServersDir.subscribe(async () => {
            callGo(app.ports.serversDirSelected,
                window.go.main.App.SelectServersDir());
        });
    }

    if (app.ports.setAutoDownloadStars) {
        app.ports.setAutoDownloadStars.subscribe(async (enabled) => {
            callGo(app.ports.autoDownloadStarsSet,
                window.go.main.App.SetAutoDownloadStars(enabled));
        });
    }

    if (app.ports.setZoomLevel) {
        app.ports.setZoomLevel.subscribe(async (level) => {
            document.documentElement.style.setProperty('--zoom-level', level);
            callGo(app.ports.zoomLevelSet,
                window.go.main.App.SetZoomLevel(level));
        });
    }

    if (app.ports.setUseWine) {
        app.ports.setUseWine.subscribe(async (enabled) => {
            callGo(app.ports.useWineSet,
                window.go.main.App.SetUseWine(enabled));
        });
    }

    if (app.ports.selectWinePrefixesDir) {
        app.ports.selectWinePrefixesDir.subscribe(async () => {
            callGo(app.ports.winePrefixesDirSelected,
                window.go.main.App.SelectWinePrefixesDir());
        });
    }

    if (app.ports.checkWineInstall) {
        app.ports.checkWineInstall.subscribe(async () => {
            callGo(app.ports.wineInstallChecked,
                window.go.main.App.CheckWine32Support());
        });
    }

    if (app.ports.checkNtvdmSupport) {
        app.ports.checkNtvdmSupport.subscribe(async () => {
            callGo(app.ports.ntvdmChecked,
                window.go.main.App.CheckNtvdmSupport());
        });
    }

    if (app.ports.setEnableBrowserStars) {
        app.ports.setEnableBrowserStars.subscribe(async (enabled) => {
            callGo(app.ports.enableBrowserStarsSet,
                window.go.main.App.SetEnableBrowserStars(enabled));
        });
    }

    // Map Viewer
    if (app.ports.generateMap) {
        app.ports.generateMap.subscribe(async (data) => {
            callGo(app.ports.mapGenerated,
                window.go.main.App.GenerateMap(data));
        });
    }

    if (app.ports.saveMap) {
        app.ports.saveMap.subscribe(async (data) => {
            callGo(app.ports.mapSaved,
                window.go.main.App.SaveMap(data));
        });
    }

    if (app.ports.generateAnimatedMap) {
        app.ports.generateAnimatedMap.subscribe(async (data) => {
            callGo(app.ports.animatedMapGenerated,
                window.go.main.App.GenerateAnimatedMap(data));
        });
    }

    if (app.ports.saveGif) {
        app.ports.saveGif.subscribe(async (data) => {
            callGo(app.ports.gifSaved,
                window.go.main.App.SaveGif(data));
        });
    }

    if (app.ports.requestFullscreen) {
        app.ports.requestFullscreen.subscribe((elementId) => {
            const element = document.getElementById(elementId);
            if (element) {
                if (element.requestFullscreen) {
                    element.requestFullscreen();
                } else if (element.webkitRequestFullscreen) {
                    element.webkitRequestFullscreen();
                } else if (element.mozRequestFullScreen) {
                    element.mozRequestFullScreen();
                }
            }
        });
    }

    // Open Stars! browser by navigating the main window
    // (popups are blocked in Wails webview, so we navigate instead)
    if (app.ports.openStarsBrowserWindow) {
        app.ports.openStarsBrowserWindow.subscribe((data) => {
            const sessionKey = data.serverUrl + '|' + data.sessionId;
            const encodedKey = encodeURIComponent(sessionKey);

            // Get window dimensions
            const width = window.innerWidth || 1280;
            const height = window.innerHeight || 800;

            // Build URL with parameters
            const url = `stars-browser/stars.html?session=${encodedKey}&width=${width}&height=${height}&embedded=true`;

            // Navigate the main window to Stars browser
            // Store the current URL so we can navigate back
            sessionStorage.setItem('astrum_return_url', window.location.href);
            window.location.href = url;
        });
    }
}

// =============================================================================
// Wails Runtime Events
// =============================================================================

/**
 * Initialize Wails runtime event listeners.
 * @param {Object} app - The Elm application instance
 */
function initWailsEvents(app) {
    if (!window.runtime || !window.runtime.EventsOn) {
        return;
    }

    // Session updates
    window.runtime.EventsOn("sessions:updated", (serverUrl) => {
        if (app.ports.sessionsUpdated) {
            app.ports.sessionsUpdated.send(serverUrl);
        }
    });

    // Connection state changes
    window.runtime.EventsOn("connection:changed", (serverUrl, connected) => {
        if (app.ports.connectionChanged) {
            app.ports.connectionChanged.send({ serverUrl: serverUrl, connected: connected });
        }
    });

    // Order conflict (local file modified after upload)
    window.runtime.EventsOn("order:conflict", (serverUrl, sessionId, year) => {
        if (app.ports.orderConflictReceived) {
            app.ports.orderConflictReceived.send({
                serverUrl: serverUrl,
                sessionId: sessionId,
                year: year
            });
        }
    });

    // Stars.exe downloaded (auto-download completed)
    window.runtime.EventsOn("starsExe:downloaded", (serverUrl, sessionId) => {
        if (app.ports.hasStarsExeResult) {
            app.ports.hasStarsExeResult.send({
                ok: {
                    serverUrl: serverUrl,
                    sessionId: sessionId,
                    hasStarsExe: true
                }
            });
        }
    });

    // WebSocket notification events
    const notificationTypes = [
        { event: "session", port: "notificationSession" },
        { event: "invitation", port: "notificationInvitation" },
        { event: "race", port: "notificationRace" },
        { event: "ruleset", port: "notificationRuleset" },
        { event: "session_player_race", port: "notificationPlayerRace" },
        { event: "order_status", port: "notificationOrderStatus" }
    ];

    const actions = ["created", "updated", "deleted"];

    notificationTypes.forEach(({ event, port }) => {
        actions.forEach(action => {
            const eventName = `notification:${event}:${action}`;
            window.runtime.EventsOn(eventName, (serverUrl, id) => {
                if (app.ports[port]) {
                    app.ports[port].send({ serverUrl: serverUrl, id: id, action: action });
                }
            });
        });
    });

    // Session turn notifications (includes "ready" action)
    const turnActions = [...actions, "ready"];
    turnActions.forEach(action => {
        const eventName = `notification:session_turn:${action}`;
        window.runtime.EventsOn(eventName, (serverUrl, sessionId, metadata) => {
            if (app.ports.notificationSessionTurn) {
                const year = metadata && metadata.year ? metadata.year : null;
                app.ports.notificationSessionTurn.send({
                    serverUrl: serverUrl,
                    sessionId: sessionId,
                    action: action,
                    year: year
                });
            }
        });
    });

    // Pending registration notifications (for global managers and approved users)
    const pendingActions = ["created", "approved", "rejected"];
    pendingActions.forEach(action => {
        const eventName = `notification:pending_registration:${action}`;
        window.runtime.EventsOn(eventName, (serverUrl, id, metadata) => {
            if (app.ports.notificationPendingRegistration) {
                // For approved/rejected, include metadata (user_profile_id, nickname)
                const userProfileId = metadata && metadata.user_profile_id ? metadata.user_profile_id : null;
                const nickname = metadata && metadata.nickname ? metadata.nickname : null;
                app.ports.notificationPendingRegistration.send({
                    serverUrl: serverUrl,
                    id: id,
                    action: action,
                    userProfileId: userProfileId,
                    nickname: nickname
                });
            }
        });
    });
}

// =============================================================================
// Global Event Handlers
// =============================================================================

/**
 * Initialize global DOM event handlers.
 * @param {Object} app - The Elm application instance
 */
function initGlobalEvents(app) {
    // Check if Stars browser iframe is active (has focus or is visible)
    function isStarsBrowserActive() {
        const iframe = document.getElementById('stars-browser-iframe');
        if (!iframe) return false;
        // Check if iframe or its parent dialog is visible
        const dialog = iframe.closest('.stars-browser-dialog');
        return dialog !== null;
    }

    // Escape key handler
    document.addEventListener('keydown', (event) => {
        // When Stars browser is active, use Ctrl+Q to close (not Escape)
        if (isStarsBrowserActive()) {
            if (event.ctrlKey && event.key === 'q') {
                event.preventDefault();
                if (app.ports.escapePressed) {
                    app.ports.escapePressed.send(null);
                }
            }
            // Let all other keys pass through to the iframe
            return;
        }

        if (event.key === 'Escape') {
            if (app.ports.escapePressed) {
                app.ports.escapePressed.send(null);
            }
        }

        // Zoom keyboard shortcuts (Ctrl+/-, Ctrl+0)
        if (event.ctrlKey && !event.shiftKey && !event.altKey) {
            if (event.key === '+' || event.key === '=') {
                event.preventDefault();
                if (app.ports.zoomKeyPressed) {
                    app.ports.zoomKeyPressed.send('in');
                }
            } else if (event.key === '-') {
                event.preventDefault();
                if (app.ports.zoomKeyPressed) {
                    app.ports.zoomKeyPressed.send('out');
                }
            } else if (event.key === '0') {
                event.preventDefault();
                if (app.ports.zoomKeyPressed) {
                    app.ports.zoomKeyPressed.send('reset');
                }
            }
        }
    });

    // Zoom with Ctrl+scroll
    document.addEventListener('wheel', (event) => {
        if (event.ctrlKey) {
            event.preventDefault();
            if (app.ports.zoomKeyPressed) {
                if (event.deltaY < 0) {
                    app.ports.zoomKeyPressed.send('in');
                } else if (event.deltaY > 0) {
                    app.ports.zoomKeyPressed.send('out');
                }
            }
        }
    }, { passive: false });

    // Prevent context menu (we handle it ourselves)
    document.addEventListener('contextmenu', (event) => {
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
            return;
        }
        event.preventDefault();
    });
}

// =============================================================================
// Public API
// =============================================================================

/**
 * Initialize all ports and event handlers.
 * @param {Object} app - The Elm application instance
 */
function init(app) {
    initPorts(app);
    initWailsEvents(app);
    initGlobalEvents(app);
}

// Export for use in index.html
window.AstrumPorts = { init };
