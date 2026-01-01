module UpdateTest exposing (..)

{-| Tests for the Update module.

These tests verify that session updates are correctly applied to the right server
and don't affect other servers' data.

-}

import Api.OrdersStatus exposing (OrdersStatus, PlayerOrderStatus)
import Api.Session exposing (Session, SessionPlayer)
import Api.TurnFiles exposing (TurnFiles)
import Dict
import Expect
import Model exposing (..)
import Msg exposing (Msg(..))
import Test exposing (..)
import Time
import Update exposing (update)


{-| Test suite for update isolation between servers.
-}
suite : Test
suite =
    describe "Update Tests"
        [ sessionUpdateTests
        , turnFilesTests
        , ordersStatusTests
        , viewInvitedSessionTests
        ]


{-| Tests for session update isolation between servers.
-}
sessionUpdateTests : Test
sessionUpdateTests =
    describe "Session Updates"
        [ describe "GotFetchEndTime"
            [ test "updates sessions for the specified server only" <|
                \_ ->
                    let
                        -- Setup: model with two servers, each with different sessions
                        initialModel =
                            modelWithTwoServers

                        -- New sessions for serverA (removing session1, keeping session2)
                        newSessionsForServerA =
                            [ makeSession "session2" "Session Two" ]

                        -- Process GotFetchEndTime for serverA
                        ( updatedModel, _ ) =
                            update
                                (GotFetchEndTime "http://serverA" (Ok newSessionsForServerA) (Time.millisToPosix 1000))
                                initialModel

                        -- Get sessions for each server
                        serverAData =
                            getServerData "http://serverA" updatedModel.serverData

                        serverBData =
                            getServerData "http://serverB" updatedModel.serverData
                    in
                    Expect.all
                        [ -- ServerA should have the new sessions
                          \_ ->
                            Expect.equal
                                (List.map .id serverAData.sessions)
                                [ "session2" ]
                        , -- ServerB should still have its original sessions (unchanged)
                          \_ ->
                            Expect.equal
                                (List.map .id serverBData.sessions)
                                [ "session3", "session4" ]
                        ]
                        ()
            , test "does not affect other server when receiving sessions" <|
                \_ ->
                    let
                        initialModel =
                            modelWithTwoServers

                        -- Completely new sessions for serverB
                        newSessionsForServerB =
                            [ makeSession "session5" "New Session" ]

                        ( updatedModel, _ ) =
                            update
                                (GotFetchEndTime "http://serverB" (Ok newSessionsForServerB) (Time.millisToPosix 1000))
                                initialModel

                        serverAData =
                            getServerData "http://serverA" updatedModel.serverData

                        serverBData =
                            getServerData "http://serverB" updatedModel.serverData
                    in
                    Expect.all
                        [ -- ServerA should be completely unchanged
                          \_ ->
                            Expect.equal
                                (List.map .id serverAData.sessions)
                                [ "session1", "session2" ]
                        , -- ServerB should have the new sessions
                          \_ ->
                            Expect.equal
                                (List.map .id serverBData.sessions)
                                [ "session5" ]
                        ]
                        ()
            , test "handles session deletion via empty list" <|
                \_ ->
                    let
                        initialModel =
                            modelWithTwoServers

                        -- Empty sessions list (all deleted) for serverA
                        ( updatedModel, _ ) =
                            update
                                (GotFetchEndTime "http://serverA" (Ok []) (Time.millisToPosix 1000))
                                initialModel

                        serverAData =
                            getServerData "http://serverA" updatedModel.serverData

                        serverBData =
                            getServerData "http://serverB" updatedModel.serverData
                    in
                    Expect.all
                        [ -- ServerA should have no sessions
                          \_ ->
                            Expect.equal serverAData.sessions []
                        , -- ServerB should still have its sessions
                          \_ ->
                            Expect.equal
                                (List.map .id serverBData.sessions)
                                [ "session3", "session4" ]
                        ]
                        ()
            , test "updates fetch result for correct server" <|
                \_ ->
                    let
                        -- Setup model with fetch start time for serverA
                        initialModel =
                            { modelWithTwoServers
                                | serverData =
                                    updateServerData "http://serverA"
                                        (\sd -> { sd | fetchStartTime = Just 500 })
                                        modelWithTwoServers.serverData
                            }

                        newSessions =
                            [ makeSession "s1" "S1", makeSession "s2" "S2", makeSession "s3" "S3" ]

                        ( updatedModel, _ ) =
                            update
                                (GotFetchEndTime "http://serverA" (Ok newSessions) (Time.millisToPosix 1000))
                                initialModel

                        serverAData =
                            getServerData "http://serverA" updatedModel.serverData

                        serverBData =
                            getServerData "http://serverB" updatedModel.serverData
                    in
                    Expect.all
                        [ -- ServerA should have fetch result
                          \_ ->
                            Expect.equal
                                serverAData.lastFetchResult
                                (Just { sessionCount = 3, durationMs = 500 })
                        , -- ServerB should have no fetch result
                          \_ ->
                            Expect.equal serverBData.lastFetchResult Nothing
                        ]
                        ()
            ]
        , describe "GotSessions routing"
            [ test "GotSessions forwards to GotFetchEndTime with correct serverUrl" <|
                \_ ->
                    let
                        initialModel =
                            modelWithTwoServers

                        -- GotSessions should create a command (Task) but not update model directly
                        ( updatedModel, cmd ) =
                            update
                                (GotSessions "http://serverA" (Ok [ makeSession "new" "New" ]))
                                initialModel
                    in
                    -- Model should be unchanged (GotSessions just forwards via Task)
                    Expect.equal updatedModel initialModel
            ]
        , describe "Three connections to same server (different users)"
            [ test "private session update only affects connections that can see it" <|
                \_ ->
                    let
                        -- Scenario: 3 connections to same server, different users
                        -- - conn1 (userA): sees private session "private1"
                        -- - conn2 (userB): sees private session "private1"
                        -- - conn3 (userC): does NOT see "private1" (not a member)
                        initialModel =
                            modelWithThreeConnections

                        -- Private session is modified - only conn1 and conn2 receive updates
                        -- Simulate: conn1 receives updated sessions (private1 renamed)
                        ( afterConn1Update, _ ) =
                            update
                                (GotFetchEndTime "http://server:8080/userA"
                                    (Ok
                                        [ makeSession "public1" "Public Session"
                                        , makeSession "private1" "Private Session MODIFIED"
                                        ]
                                    )
                                    (Time.millisToPosix 1000)
                                )
                                initialModel

                        -- Simulate: conn2 receives updated sessions (private1 renamed)
                        ( afterConn2Update, _ ) =
                            update
                                (GotFetchEndTime "http://server:8080/userB"
                                    (Ok
                                        [ makeSession "public1" "Public Session"
                                        , makeSession "private1" "Private Session MODIFIED"
                                        ]
                                    )
                                    (Time.millisToPosix 1000)
                                )
                                afterConn1Update

                        -- conn3 receives NO update (user not member of private session)
                        -- So we don't call update for conn3

                        conn1Data =
                            getServerData "http://server:8080/userA" afterConn2Update.serverData

                        conn2Data =
                            getServerData "http://server:8080/userB" afterConn2Update.serverData

                        conn3Data =
                            getServerData "http://server:8080/userC" afterConn2Update.serverData
                    in
                    Expect.all
                        [ -- conn1 should see the modified private session
                          \_ ->
                            Expect.equal
                                (List.map .name conn1Data.sessions)
                                [ "Public Session", "Private Session MODIFIED" ]
                        , -- conn2 should also see the modified private session
                          \_ ->
                            Expect.equal
                                (List.map .name conn2Data.sessions)
                                [ "Public Session", "Private Session MODIFIED" ]
                        , -- conn3 should still have original sessions (no private1)
                          \_ ->
                            Expect.equal
                                (List.map .name conn3Data.sessions)
                                [ "Public Session" ]
                        ]
                        ()
            , test "private session deletion only affects connections that could see it" <|
                \_ ->
                    let
                        initialModel =
                            modelWithThreeConnections

                        -- Private session is deleted - only conn1 and conn2 receive updates
                        -- Simulate: conn1 receives sessions without private1
                        ( afterConn1Update, _ ) =
                            update
                                (GotFetchEndTime "http://server:8080/userA"
                                    (Ok [ makeSession "public1" "Public Session" ])
                                    (Time.millisToPosix 1000)
                                )
                                initialModel

                        -- Simulate: conn2 receives sessions without private1
                        ( afterConn2Update, _ ) =
                            update
                                (GotFetchEndTime "http://server:8080/userB"
                                    (Ok [ makeSession "public1" "Public Session" ])
                                    (Time.millisToPosix 1000)
                                )
                                afterConn1Update

                        -- conn3 receives NO notification (wasn't member, can't see deletion)

                        conn1Data =
                            getServerData "http://server:8080/userA" afterConn2Update.serverData

                        conn2Data =
                            getServerData "http://server:8080/userB" afterConn2Update.serverData

                        conn3Data =
                            getServerData "http://server:8080/userC" afterConn2Update.serverData
                    in
                    Expect.all
                        [ -- conn1 should no longer have the private session
                          \_ ->
                            Expect.equal
                                (List.map .id conn1Data.sessions)
                                [ "public1" ]
                        , -- conn2 should no longer have the private session
                          \_ ->
                            Expect.equal
                                (List.map .id conn2Data.sessions)
                                [ "public1" ]
                        , -- conn3 still has only public session (unchanged)
                          \_ ->
                            Expect.equal
                                (List.map .id conn3Data.sessions)
                                [ "public1" ]
                        ]
                        ()
            ]
        ]


{-| Tests for turn files update isolation between servers.
-}
turnFilesTests : Test
turnFilesTests =
    describe "Turn Files Updates"
        [ describe "GotTurnFiles"
            [ test "stores turn files for the specified server only" <|
                \_ ->
                    let
                        initialModel =
                            modelWithTwoServers

                        turnFiles =
                            makeTurnFiles "session1" 2400

                        ( updatedModel, _ ) =
                            update
                                (GotTurnFiles "http://serverA" (Ok turnFiles))
                                initialModel

                        serverAData =
                            getServerData "http://serverA" updatedModel.serverData

                        serverBData =
                            getServerData "http://serverB" updatedModel.serverData

                        serverATurns =
                            Dict.get "session1" serverAData.sessionTurns
                                |> Maybe.andThen (Dict.get 2400)

                        serverBTurns =
                            Dict.get "session1" serverBData.sessionTurns
                    in
                    Expect.all
                        [ -- ServerA should have the turn files cached
                          \_ ->
                            Expect.equal (Maybe.map .year serverATurns) (Just 2400)
                        , -- ServerB should have no turn files for this session
                          \_ ->
                            Expect.equal serverBTurns Nothing
                        ]
                        ()
            , test "stores turn files for non-selected server" <|
                \_ ->
                    let
                        initialModel =
                            modelWithTwoServers

                        turnFiles =
                            makeTurnFiles "session3" 2401

                        -- ServerB is NOT selected, but we receive turn files for it
                        ( updatedModel, _ ) =
                            update
                                (GotTurnFiles "http://serverB" (Ok turnFiles))
                                initialModel

                        serverBData =
                            getServerData "http://serverB" updatedModel.serverData

                        serverBTurns =
                            Dict.get "session3" serverBData.sessionTurns
                                |> Maybe.andThen (Dict.get 2401)
                    in
                    -- Should still store the turn files even though serverB is not selected
                    Expect.equal (Maybe.map .year serverBTurns) (Just 2401)
            ]
        , describe "GotLatestTurn"
            [ test "stores latest turn for the specified server only" <|
                \_ ->
                    let
                        initialModel =
                            modelWithTwoServers

                        turnFiles =
                            makeTurnFiles "session1" 2402

                        ( updatedModel, _ ) =
                            update
                                (GotLatestTurn "http://serverA" (Ok turnFiles))
                                initialModel

                        serverAData =
                            getServerData "http://serverA" updatedModel.serverData

                        serverBData =
                            getServerData "http://serverB" updatedModel.serverData

                        serverATurns =
                            Dict.get "session1" serverAData.sessionTurns
                                |> Maybe.andThen (Dict.get 2402)

                        serverBTurns =
                            Dict.get "session1" serverBData.sessionTurns
                    in
                    Expect.all
                        [ \_ -> Expect.equal (Maybe.map .year serverATurns) (Just 2402)
                        , \_ -> Expect.equal serverBTurns Nothing
                        ]
                        ()
            , test "stores latest turn for non-selected server" <|
                \_ ->
                    let
                        initialModel =
                            modelWithTwoServers

                        turnFiles =
                            makeTurnFiles "session3" 2403

                        ( updatedModel, _ ) =
                            update
                                (GotLatestTurn "http://serverB" (Ok turnFiles))
                                initialModel

                        serverBData =
                            getServerData "http://serverB" updatedModel.serverData

                        serverBTurns =
                            Dict.get "session3" serverBData.sessionTurns
                                |> Maybe.andThen (Dict.get 2403)
                    in
                    Expect.equal (Maybe.map .year serverBTurns) (Just 2403)
            ]
        ]


{-| Tests for orders status update isolation between servers.
-}
ordersStatusTests : Test
ordersStatusTests =
    describe "Orders Status Updates"
        [ describe "GotOrdersStatus"
            [ test "stores orders status for the specified server only" <|
                \_ ->
                    let
                        initialModel =
                            modelWithTwoServers

                        ordersStatus =
                            makeOrdersStatus "session1" 2400

                        ( updatedModel, _ ) =
                            update
                                (GotOrdersStatus "http://serverA" (Ok ordersStatus))
                                initialModel

                        serverAData =
                            getServerData "http://serverA" updatedModel.serverData

                        serverBData =
                            getServerData "http://serverB" updatedModel.serverData

                        serverAOrders =
                            Dict.get "session1" serverAData.sessionOrdersStatus
                                |> Maybe.andThen (Dict.get 2400)

                        serverBOrders =
                            Dict.get "session1" serverBData.sessionOrdersStatus
                    in
                    Expect.all
                        [ -- ServerA should have the orders status cached
                          \_ ->
                            Expect.equal (Maybe.map .pendingYear serverAOrders) (Just 2400)
                        , -- ServerB should have no orders status for this session
                          \_ ->
                            Expect.equal serverBOrders Nothing
                        ]
                        ()
            , test "stores orders status for non-selected server" <|
                \_ ->
                    let
                        initialModel =
                            modelWithTwoServers

                        ordersStatus =
                            makeOrdersStatus "session3" 2401

                        -- ServerB is NOT selected, but we receive orders status for it
                        ( updatedModel, _ ) =
                            update
                                (GotOrdersStatus "http://serverB" (Ok ordersStatus))
                                initialModel

                        serverBData =
                            getServerData "http://serverB" updatedModel.serverData

                        serverBOrders =
                            Dict.get "session3" serverBData.sessionOrdersStatus
                                |> Maybe.andThen (Dict.get 2401)
                    in
                    -- Should still store the orders status even though serverB is not selected
                    Expect.equal (Maybe.map .pendingYear serverBOrders) (Just 2401)
            , test "three servers: turn notification updates correct server only" <|
                \_ ->
                    let
                        -- Simulate the bug scenario: 3 connections, turn ready notification
                        initialModel =
                            modelWithThreeConnections

                        ordersStatus =
                            makeOrdersStatus "session1" 2400

                        -- userA receives the orders status
                        ( afterUserA, _ ) =
                            update
                                (GotOrdersStatus "http://server:8080/userA" (Ok ordersStatus))
                                initialModel

                        -- userB receives the orders status
                        ( afterUserB, _ ) =
                            update
                                (GotOrdersStatus "http://server:8080/userB" (Ok ordersStatus))
                                afterUserA

                        conn1Data =
                            getServerData "http://server:8080/userA" afterUserB.serverData

                        conn2Data =
                            getServerData "http://server:8080/userB" afterUserB.serverData

                        conn3Data =
                            getServerData "http://server:8080/userC" afterUserB.serverData

                        conn1Orders =
                            Dict.get "session1" conn1Data.sessionOrdersStatus
                                |> Maybe.andThen (Dict.get 2400)

                        conn2Orders =
                            Dict.get "session1" conn2Data.sessionOrdersStatus
                                |> Maybe.andThen (Dict.get 2400)

                        conn3Orders =
                            Dict.get "session1" conn3Data.sessionOrdersStatus
                    in
                    Expect.all
                        [ -- conn1 (userA) should have orders status
                          \_ ->
                            Expect.equal (Maybe.map .pendingYear conn1Orders) (Just 2400)
                        , -- conn2 (userB) should have orders status
                          \_ ->
                            Expect.equal (Maybe.map .pendingYear conn2Orders) (Just 2400)
                        , -- conn3 (userC) should NOT have orders status (didn't receive notification)
                          \_ ->
                            Expect.equal conn3Orders Nothing
                        ]
                        ()
            ]
        ]


{-| Tests for ViewInvitedSession and GotSession upsert behavior.
-}
viewInvitedSessionTests : Test
viewInvitedSessionTests =
    describe "ViewInvitedSession and GotSession"
        [ describe "ViewInvitedSession"
            [ test "sets pendingViewSessionId and closes dialog" <|
                \_ ->
                    let
                        initialModel =
                            let
                                ( base, _ ) =
                                    init {}
                            in
                            { base
                                | selectedServerUrl = Just "http://serverA"
                                , dialog = Just InvitationsDialog
                            }

                        ( updatedModel, _ ) =
                            update (ViewInvitedSession "invited-session") initialModel
                    in
                    Expect.all
                        [ \_ -> Expect.equal updatedModel.pendingViewSessionId (Just "invited-session")
                        , \_ -> Expect.equal updatedModel.dialog Nothing
                        ]
                        ()
            , test "does nothing when no server selected" <|
                \_ ->
                    let
                        ( initialModel, _ ) =
                            init {}

                        modelWithDialog =
                            { initialModel | dialog = Just InvitationsDialog }

                        ( updatedModel, _ ) =
                            update (ViewInvitedSession "invited-session") modelWithDialog
                    in
                    Expect.all
                        [ \_ -> Expect.equal updatedModel.pendingViewSessionId Nothing
                        , \_ -> Expect.equal updatedModel.dialog (Just InvitationsDialog)
                        ]
                        ()
            ]
        , describe "GotSession upsert"
            [ test "updates existing session in list for correct server" <|
                \_ ->
                    let
                        initialModel =
                            modelWithTwoServers

                        -- Update session1 with new name
                        updatedSession =
                            makeSession "session1" "Updated Session One"

                        ( updatedModel, _ ) =
                            update (GotSession "http://serverA" (Ok updatedSession)) initialModel

                        serverAData =
                            getServerData "http://serverA" updatedModel.serverData

                        serverBData =
                            getServerData "http://serverB" updatedModel.serverData

                        session1 =
                            List.filter (\s -> s.id == "session1") serverAData.sessions
                                |> List.head
                    in
                    Expect.all
                        [ -- Session name should be updated
                          \_ -> Expect.equal (Maybe.map .name session1) (Just "Updated Session One")
                        , -- Session count should remain the same (2 sessions)
                          \_ -> Expect.equal (List.length serverAData.sessions) 2
                        , -- ServerB should be unchanged
                          \_ -> Expect.equal (List.length serverBData.sessions) 2
                        ]
                        ()
            , test "adds new session to list when not found" <|
                \_ ->
                    let
                        initialModel =
                            modelWithTwoServers

                        -- New session that doesn't exist
                        newSession =
                            makeSession "new-session" "Brand New Session"

                        ( updatedModel, _ ) =
                            update (GotSession "http://serverA" (Ok newSession)) initialModel

                        serverAData =
                            getServerData "http://serverA" updatedModel.serverData

                        hasNewSession =
                            List.any (\s -> s.id == "new-session") serverAData.sessions
                    in
                    Expect.all
                        [ -- New session should be added
                          \_ -> Expect.equal hasNewSession True
                        , -- Session count should increase (2 -> 3 sessions)
                          \_ -> Expect.equal (List.length serverAData.sessions) 3
                        ]
                        ()
            , test "adds session to correct server even when not selected" <|
                \_ ->
                    let
                        initialModel =
                            modelWithTwoServers

                        -- New session for serverB (not selected)
                        newSession =
                            makeSession "new-session" "Brand New Session"

                        ( updatedModel, _ ) =
                            update (GotSession "http://serverB" (Ok newSession)) initialModel

                        serverAData =
                            getServerData "http://serverA" updatedModel.serverData

                        serverBData =
                            getServerData "http://serverB" updatedModel.serverData
                    in
                    Expect.all
                        [ -- ServerA should be unchanged (still 2 sessions)
                          \_ -> Expect.equal (List.length serverAData.sessions) 2
                        , -- ServerB should have the new session (2 -> 3 sessions)
                          \_ -> Expect.equal (List.length serverBData.sessions) 3
                        , -- New session should be in serverB
                          \_ -> Expect.equal (List.any (\s -> s.id == "new-session") serverBData.sessions) True
                        ]
                        ()
            , test "opens session detail when pendingViewSessionId matches and server is selected" <|
                \_ ->
                    let
                        initialModel =
                            let
                                base =
                                    modelWithTwoServers
                            in
                            { base
                                | pendingViewSessionId = Just "new-session"
                                , sessionDetail = Nothing
                            }

                        newSession =
                            makeSession "new-session" "Fetched Session"

                        ( updatedModel, _ ) =
                            update (GotSession "http://serverA" (Ok newSession)) initialModel
                    in
                    Expect.all
                        [ -- Session detail should be opened (serverA is selected)
                          \_ ->
                            Expect.equal
                                (Maybe.map .sessionId updatedModel.sessionDetail)
                                (Just "new-session")
                        , -- pendingViewSessionId should be cleared
                          \_ -> Expect.equal updatedModel.pendingViewSessionId Nothing
                        ]
                        ()
            , test "does not open session detail when server is not selected" <|
                \_ ->
                    let
                        initialModel =
                            let
                                base =
                                    modelWithTwoServers
                            in
                            { base
                                | pendingViewSessionId = Just "new-session"
                                , sessionDetail = Nothing
                            }

                        newSession =
                            makeSession "new-session" "Fetched Session"

                        -- Session comes from serverB but serverA is selected
                        ( updatedModel, _ ) =
                            update (GotSession "http://serverB" (Ok newSession)) initialModel
                    in
                    Expect.all
                        [ -- Session detail should NOT be opened (wrong server)
                          \_ -> Expect.equal updatedModel.sessionDetail Nothing
                        , -- pendingViewSessionId should NOT be cleared (waiting for correct server)
                          \_ -> Expect.equal updatedModel.pendingViewSessionId (Just "new-session")
                        , -- Session should still be added to serverB
                          \_ ->
                            Expect.equal
                                (List.any (\s -> s.id == "new-session")
                                    (getServerData "http://serverB" updatedModel.serverData).sessions
                                )
                                True
                        ]
                        ()
            , test "does not open session detail when pendingViewSessionId doesn't match" <|
                \_ ->
                    let
                        initialModel =
                            let
                                base =
                                    modelWithTwoServers
                            in
                            { base
                                | pendingViewSessionId = Just "other-session"
                                , sessionDetail = Nothing
                            }

                        newSession =
                            makeSession "session1" "Updated Session"

                        ( updatedModel, _ ) =
                            update (GotSession "http://serverA" (Ok newSession)) initialModel
                    in
                    Expect.all
                        [ -- Session detail should NOT be opened
                          \_ -> Expect.equal updatedModel.sessionDetail Nothing
                        , -- pendingViewSessionId should NOT be cleared (different session)
                          \_ -> Expect.equal updatedModel.pendingViewSessionId (Just "other-session")
                        ]
                        ()
            , test "clears pendingViewSessionId on error" <|
                \_ ->
                    let
                        initialModel =
                            let
                                base =
                                    modelWithTwoServers
                            in
                            { base | pendingViewSessionId = Just "some-session" }

                        ( updatedModel, _ ) =
                            update (GotSession "http://serverA" (Err "Session not found")) initialModel
                    in
                    Expect.equal updatedModel.pendingViewSessionId Nothing
            ]
        ]



-- =============================================================================
-- TEST FIXTURES
-- =============================================================================


{-| Create a model with two servers, each having different sessions.
-}
modelWithTwoServers : Model
modelWithTwoServers =
    let
        ( baseModel, _ ) =
            init {}

        serverAData =
            { emptyServerData
                | sessions =
                    [ makeSession "session1" "Session One"
                    , makeSession "session2" "Session Two"
                    ]
                , connectionState = Connected { username = "userA", userId = "userA-id", isManager = False, serialKey = "" }
            }

        serverBData =
            { emptyServerData
                | sessions =
                    [ makeSession "session3" "Session Three"
                    , makeSession "session4" "Session Four"
                    ]
                , connectionState = Connected { username = "userB", userId = "userB-id", isManager = False, serialKey = "" }
            }
    in
    { baseModel
        | serverData =
            Dict.empty
                |> Dict.insert "http://serverA" serverAData
                |> Dict.insert "http://serverB" serverBData
        , selectedServerUrl = Just "http://serverA"
    }


{-| Create a model with three connections to the same server (different users).

Simulates:

  - conn1 (userA): sees public1 + private1
  - conn2 (userB): sees public1 + private1
  - conn3 (userC): sees only public1 (not member of private1)

-}
modelWithThreeConnections : Model
modelWithThreeConnections =
    let
        ( baseModel, _ ) =
            init {}

        -- userA and userB can see the private session
        conn1Data =
            { emptyServerData
                | sessions =
                    [ makeSession "public1" "Public Session"
                    , makeSession "private1" "Private Session"
                    ]
                , connectionState = Connected { username = "userA", userId = "userA-id", isManager = False, serialKey = "" }
            }

        conn2Data =
            { emptyServerData
                | sessions =
                    [ makeSession "public1" "Public Session"
                    , makeSession "private1" "Private Session"
                    ]
                , connectionState = Connected { username = "userB", userId = "userB-id", isManager = False, serialKey = "" }
            }

        -- userC cannot see the private session (not a member)
        conn3Data =
            { emptyServerData
                | sessions =
                    [ makeSession "public1" "Public Session"
                    ]
                , connectionState = Connected { username = "userC", userId = "userC-id", isManager = False, serialKey = "" }
            }
    in
    { baseModel
        | serverData =
            Dict.empty
                |> Dict.insert "http://server:8080/userA" conn1Data
                |> Dict.insert "http://server:8080/userB" conn2Data
                |> Dict.insert "http://server:8080/userC" conn3Data
        , selectedServerUrl = Just "http://server:8080/userA"
    }


{-| Create a minimal session for testing.
-}
makeSession : String -> String -> Session
makeSession id name =
    { id = id
    , name = name
    , isPublic = True
    , members = []
    , managers = []
    , started = False
    , rulesIsSet = False
    , players = []
    , pendingInvitation = False
    }


{-| Create a session with pending invitation for testing.
-}
makeInvitedSession : String -> String -> Session
makeInvitedSession id name =
    { id = id
    , name = name
    , isPublic = False
    , members = []
    , managers = []
    , started = False
    , rulesIsSet = False
    , players = []
    , pendingInvitation = True
    }


{-| Create minimal turn files for testing.
-}
makeTurnFiles : String -> Int -> TurnFiles
makeTurnFiles sessionId year =
    { sessionId = sessionId
    , year = year
    , universe = "universe-data"
    , turn = "turn-data"
    }


{-| Create minimal orders status for testing.
-}
makeOrdersStatus : String -> Int -> OrdersStatus
makeOrdersStatus sessionId year =
    { sessionId = sessionId
    , pendingYear = year
    , players = []
    }
