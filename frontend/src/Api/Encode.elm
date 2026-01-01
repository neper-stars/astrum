module Api.Encode exposing
    ( acceptInvitation
    , addServer
    , approveRegistration
    , buildAndSaveRace
    , cancelSentInvitation
    , checkHasStarsExe
    , connect
    , createSession
    , createUser
    , deleteUser
    , declineInvitation
    , encodeRaceConfig
    , getRaceTemplate
    , loadRaceFileConfig
    , rejectRegistration
    , getLatestTurn
    , getOrdersStatus
    , getRules
    , getSession
    , getSessionPlayerRace
    , getTurn
    , joinSession
    , openGameDir
    , launchStars
    , register
    , setRules
    , updateServer
    , validateRaceConfig
    , generateMap
    , saveMap
    )

{-| JSON encoders for API requests.

These encoders create the JSON payloads sent to the Go backend.

-}

import Api.Rules exposing (Rules)
import Api.TurnFiles exposing (TurnFiles)
import Json.Encode as E
import Model exposing (MapOptions, RaceConfig)



-- =============================================================================
-- SERVER ENCODERS
-- =============================================================================


{-| Encode add server request.
-}
addServer : String -> String -> E.Value
addServer name url =
    E.object
        [ ( "name", E.string name )
        , ( "url", E.string url )
        ]


{-| Encode update server request.
-}
updateServer : String -> String -> String -> E.Value
updateServer oldUrl name newUrl =
    E.object
        [ ( "oldUrl", E.string oldUrl )
        , ( "name", E.string name )
        , ( "url", E.string newUrl )
        ]



-- =============================================================================
-- AUTH ENCODERS
-- =============================================================================


{-| Encode connect request.
-}
connect : String -> String -> String -> E.Value
connect serverUrl username password =
    E.object
        [ ( "serverUrl", E.string serverUrl )
        , ( "username", E.string username )
        , ( "password", E.string password )
        ]


{-| Encode register request.
-}
register : String -> String -> String -> String -> E.Value
register serverUrl nickname email message =
    E.object
        [ ( "serverUrl", E.string serverUrl )
        , ( "nickname", E.string nickname )
        , ( "email", E.string email )
        , ( "message", E.string message )
        ]


{-| Encode create user request (admin).
-}
createUser : String -> String -> String -> E.Value
createUser serverUrl nickname email =
    E.object
        [ ( "serverUrl", E.string serverUrl )
        , ( "nickname", E.string nickname )
        , ( "email", E.string email )
        ]


{-| Encode delete user request (admin).
-}
deleteUser : String -> String -> E.Value
deleteUser serverUrl userId =
    E.object
        [ ( "serverUrl", E.string serverUrl )
        , ( "userId", E.string userId )
        ]


{-| Encode approve registration request (admin).
-}
approveRegistration : String -> String -> E.Value
approveRegistration serverUrl userId =
    E.object
        [ ( "serverUrl", E.string serverUrl )
        , ( "userId", E.string userId )
        ]


{-| Encode reject registration request (admin).
-}
rejectRegistration : String -> String -> E.Value
rejectRegistration serverUrl userId =
    E.object
        [ ( "serverUrl", E.string serverUrl )
        , ( "userId", E.string userId )
        ]



-- =============================================================================
-- SESSION ENCODERS
-- =============================================================================


{-| Encode create session request.
-}
createSession : String -> String -> Bool -> E.Value
createSession serverUrl name isPublic =
    E.object
        [ ( "serverUrl", E.string serverUrl )
        , ( "name", E.string name )
        , ( "isPublic", E.bool isPublic )
        ]


{-| Encode join session request.
-}
joinSession : String -> String -> E.Value
joinSession serverUrl sessionId =
    E.object
        [ ( "serverUrl", E.string serverUrl )
        , ( "sessionId", E.string sessionId )
        ]


{-| Encode get session request.
-}
getSession : String -> String -> E.Value
getSession serverUrl sessionId =
    E.object
        [ ( "serverUrl", E.string serverUrl )
        , ( "sessionId", E.string sessionId )
        ]


{-| Encode get turn files request.
saveToGameDir should be true only for the latest year.
-}
getTurn : String -> String -> Int -> Bool -> E.Value
getTurn serverUrl sessionId year saveToGameDir =
    E.object
        [ ( "serverUrl", E.string serverUrl )
        , ( "sessionId", E.string sessionId )
        , ( "year", E.int year )
        , ( "saveToGameDir", E.bool saveToGameDir )
        ]


{-| Encode get latest turn files request.
-}
getLatestTurn : String -> String -> E.Value
getLatestTurn serverUrl sessionId =
    E.object
        [ ( "serverUrl", E.string serverUrl )
        , ( "sessionId", E.string sessionId )
        ]


{-| Encode get orders status request.
-}
getOrdersStatus : String -> String -> E.Value
getOrdersStatus serverUrl sessionId =
    E.object
        [ ( "serverUrl", E.string serverUrl )
        , ( "sessionId", E.string sessionId )
        ]


{-| Encode open game directory request.
-}
openGameDir : String -> String -> E.Value
openGameDir serverUrl sessionId =
    E.object
        [ ( "serverUrl", E.string serverUrl )
        , ( "sessionId", E.string sessionId )
        ]


{-| Encode launch stars request.
-}
launchStars : String -> String -> E.Value
launchStars serverUrl sessionId =
    E.object
        [ ( "serverUrl", E.string serverUrl )
        , ( "sessionId", E.string sessionId )
        ]


{-| Encode check has stars.exe request.
-}
checkHasStarsExe : String -> String -> E.Value
checkHasStarsExe serverUrl sessionId =
    E.object
        [ ( "serverUrl", E.string serverUrl )
        , ( "sessionId", E.string sessionId )
        ]


{-| Encode get session player race request.
-}
getSessionPlayerRace : String -> String -> E.Value
getSessionPlayerRace serverUrl sessionId =
    E.object
        [ ( "serverUrl", E.string serverUrl )
        , ( "sessionId", E.string sessionId )
        ]



-- =============================================================================
-- INVITATION ENCODERS
-- =============================================================================


{-| Encode accept invitation request.
-}
acceptInvitation : String -> String -> E.Value
acceptInvitation serverUrl invitationId =
    E.object
        [ ( "serverUrl", E.string serverUrl )
        , ( "invitationId", E.string invitationId )
        ]


{-| Encode decline invitation request.
-}
declineInvitation : String -> String -> E.Value
declineInvitation serverUrl invitationId =
    E.object
        [ ( "serverUrl", E.string serverUrl )
        , ( "invitationId", E.string invitationId )
        ]


{-| Encode cancel sent invitation request.
-}
cancelSentInvitation : String -> String -> E.Value
cancelSentInvitation serverUrl invitationId =
    E.object
        [ ( "serverUrl", E.string serverUrl )
        , ( "invitationId", E.string invitationId )
        ]



-- =============================================================================
-- RULES ENCODERS
-- =============================================================================


{-| Encode get rules request.
-}
getRules : String -> String -> E.Value
getRules serverUrl sessionId =
    E.object
        [ ( "serverUrl", E.string serverUrl )
        , ( "sessionId", E.string sessionId )
        ]


{-| Encode set rules request (for managers).
-}
setRules : String -> String -> Rules -> E.Value
setRules serverUrl sessionId rulesData =
    E.object
        [ ( "serverUrl", E.string serverUrl )
        , ( "sessionId", E.string sessionId )
        , ( "rules", encodeRules rulesData )
        ]


{-| Encode rules object.
-}
encodeRules : Rules -> E.Value
encodeRules r =
    E.object
        ([ -- Universe Configuration
           ( "universeSize", E.int r.universeSize )
         , ( "density", E.int r.density )
         , ( "startingDistance", E.int r.startingDistance )
         ]
            ++ encodeMaybeInt "randomSeed" r.randomSeed
            ++ [ -- Game Options
                 ( "maximumMinerals", E.bool r.maximumMinerals )
               , ( "slowerTechAdvances", E.bool r.slowerTechAdvances )
               , ( "acceleratedBbsPlay", E.bool r.acceleratedBbsPlay )
               , ( "noRandomEvents", E.bool r.noRandomEvents )
               , ( "computerPlayersFormAlliances", E.bool r.computerPlayersFormAlliances )
               , ( "publicPlayerScores", E.bool r.publicPlayerScores )
               , ( "galaxyClumping", E.bool r.galaxyClumping )

               -- Victory Conditions
               , ( "vcOwnsPercentOfPlanets", E.bool r.vcOwnsPercentOfPlanets )
               , ( "vcOwnsPercentOfPlanetsValue", E.int r.vcOwnsPercentOfPlanetsValue )
               , ( "vcAttainTechInFields", E.bool r.vcAttainTechInFields )
               , ( "vcAttainTechInFieldsTechValue", E.int r.vcAttainTechInFieldsTechValue )
               , ( "vcAttainTechInFieldsFieldsValue", E.int r.vcAttainTechInFieldsFieldsValue )
               , ( "vcExceedScoreOf", E.bool r.vcExceedScoreOf )
               , ( "vcExceedScoreOfValue", E.int r.vcExceedScoreOfValue )
               , ( "vcExceedNextPlayerScoreBy", E.bool r.vcExceedNextPlayerScoreBy )
               , ( "vcExceedNextPlayerScoreByValue", E.int r.vcExceedNextPlayerScoreByValue )
               , ( "vcHasProductionCapacityOf", E.bool r.vcHasProductionCapacityOf )
               , ( "vcHasProductionCapacityOfValue", E.int r.vcHasProductionCapacityOfValue )
               , ( "vcOwnsCapitalShips", E.bool r.vcOwnsCapitalShips )
               , ( "vcOwnsCapitalShipsValue", E.int r.vcOwnsCapitalShipsValue )
               , ( "vcHaveHighestScoreAfterYears", E.bool r.vcHaveHighestScoreAfterYears )
               , ( "vcHaveHighestScoreAfterYearsValue", E.int r.vcHaveHighestScoreAfterYearsValue )

               -- Victory Condition Meta
               , ( "vcWinnerMustMeet", E.int r.vcWinnerMustMeet )
               , ( "vcMinYearsBeforeWinner", E.int r.vcMinYearsBeforeWinner )
               ]
        )


{-| Helper to encode optional int field.
-}
encodeMaybeInt : String -> Maybe Int -> List ( String, E.Value )
encodeMaybeInt key maybeVal =
    case maybeVal of
        Just val ->
            [ ( key, E.int val ) ]

        Nothing ->
            []



-- =============================================================================
-- RACE BUILDER ENCODERS
-- =============================================================================


{-| Encode race config for validation.
-}
encodeRaceConfig : RaceConfig -> E.Value
encodeRaceConfig config =
    E.object
        [ ( "singularName", E.string config.singularName )
        , ( "pluralName", E.string config.pluralName )
        , ( "password", E.string config.password )
        , ( "icon", E.int config.icon )
        , ( "prt", E.int config.prt )
        , ( "lrt", E.list E.int config.lrt )
        , ( "gravityCenter", E.int config.gravityCenter )
        , ( "gravityWidth", E.int config.gravityWidth )
        , ( "gravityImmune", E.bool config.gravityImmune )
        , ( "temperatureCenter", E.int config.temperatureCenter )
        , ( "temperatureWidth", E.int config.temperatureWidth )
        , ( "temperatureImmune", E.bool config.temperatureImmune )
        , ( "radiationCenter", E.int config.radiationCenter )
        , ( "radiationWidth", E.int config.radiationWidth )
        , ( "radiationImmune", E.bool config.radiationImmune )
        , ( "growthRate", E.int config.growthRate )
        , ( "colonistsPerResource", E.int config.colonistsPerResource )
        , ( "factoryOutput", E.int config.factoryOutput )
        , ( "factoryCost", E.int config.factoryCost )
        , ( "factoryCount", E.int config.factoryCount )
        , ( "factoriesUseLessGerm", E.bool config.factoriesUseLessGerm )
        , ( "mineOutput", E.int config.mineOutput )
        , ( "mineCost", E.int config.mineCost )
        , ( "mineCount", E.int config.mineCount )
        , ( "researchEnergy", E.int config.researchEnergy )
        , ( "researchWeapons", E.int config.researchWeapons )
        , ( "researchPropulsion", E.int config.researchPropulsion )
        , ( "researchConstruction", E.int config.researchConstruction )
        , ( "researchElectronics", E.int config.researchElectronics )
        , ( "researchBiotech", E.int config.researchBiotech )
        , ( "techsStartHigh", E.bool config.techsStartHigh )
        , ( "leftoverPointsOn", E.int config.leftoverPointsOn )
        ]


{-| Encode validate race config request.
-}
validateRaceConfig : String -> RaceConfig -> E.Value
validateRaceConfig serverUrl config =
    E.object
        [ ( "serverUrl", E.string serverUrl )
        , ( "config", encodeRaceConfig config )
        ]


{-| Encode get race template request.
-}
getRaceTemplate : String -> String -> E.Value
getRaceTemplate serverUrl templateName =
    E.object
        [ ( "serverUrl", E.string serverUrl )
        , ( "templateName", E.string templateName )
        ]


{-| Encode build and save race request.
-}
buildAndSaveRace : String -> RaceConfig -> Maybe String -> E.Value
buildAndSaveRace serverUrl config maybeSessionId =
    E.object
        ([ ( "serverUrl", E.string serverUrl )
         , ( "config", encodeRaceConfig config )
         ]
            ++ (case maybeSessionId of
                    Just sessionId ->
                        [ ( "sessionId", E.string sessionId ) ]

                    Nothing ->
                        []
               )
        )


{-| Encode load race file config request.
-}
loadRaceFileConfig : String -> String -> E.Value
loadRaceFileConfig serverUrl raceId =
    E.object
        [ ( "serverUrl", E.string serverUrl )
        , ( "raceId", E.string raceId )
        ]



-- =============================================================================
-- MAP VIEWER ENCODERS
-- =============================================================================


{-| Encode map options.
-}
encodeMapOptions : MapOptions -> E.Value
encodeMapOptions options =
    E.object
        [ ( "width", E.int options.width )
        , ( "height", E.int options.height )
        , ( "showNames", E.bool options.showNames )
        , ( "showFleets", E.bool options.showFleets )
        , ( "showFleetPaths", E.int options.showFleetPaths )
        , ( "showMines", E.bool options.showMines )
        , ( "showWormholes", E.bool options.showWormholes )
        , ( "showLegend", E.bool options.showLegend )
        , ( "showScannerCoverage", E.bool options.showScannerCoverage )
        ]


{-| Encode generate map request.
-}
generateMap : String -> String -> Int -> MapOptions -> TurnFiles -> E.Value
generateMap serverUrl sessionId year options turnFiles =
    E.object
        [ ( "serverUrl", E.string serverUrl )
        , ( "sessionId", E.string sessionId )
        , ( "year", E.int year )
        , ( "options", encodeMapOptions options )
        , ( "universeB64", E.string turnFiles.universe )
        , ( "turnB64", E.string turnFiles.turn )
        ]


{-| Encode save map request.
-}
saveMap : String -> String -> Int -> String -> Int -> String -> E.Value
saveMap serverUrl sessionId year raceName playerNumber svgContent =
    E.object
        [ ( "serverUrl", E.string serverUrl )
        , ( "sessionId", E.string sessionId )
        , ( "year", E.int year )
        , ( "raceName", E.string raceName )
        , ( "playerNumber", E.int playerNumber )
        , ( "svgContent", E.string svgContent )
        ]

