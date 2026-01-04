module Api.Decode exposing
    ( appSettings
    , invitationList
    , ntvdmCheckResult
    , ordersStatus
    , race
    , raceConfig
    , raceList
    , raceValidation
    , rules
    , server
    , serverList
    , session
    , sessionList
    , turnFiles
    , userProfileList
    , wineCheckResult
    )

{-| JSON decoders for API types.

These decoders handle the JSON responses from the Go backend.

-}

import Api.Invitation exposing (Invitation)
import Api.OrdersStatus exposing (OrdersStatus, PlayerOrderStatus)
import Api.Race exposing (Race)
import Api.Rules exposing (Rules)
import Api.Server exposing (Server)
import Api.Session exposing (Session, SessionPlayer, SessionState(..))
import Api.TurnFiles exposing (TurnFiles)
import Api.UserProfile exposing (UserProfile)
import Json.Decode as D exposing (Decoder)
import Json.Decode.Pipeline exposing (optional, required)
import Model exposing (HabitabilityDisplay, LRTInfo, PRTInfo, RaceConfig, RaceValidation, RaceValidationError)



-- =============================================================================
-- SERVER DECODERS
-- =============================================================================


{-| Decode a single server.
-}
server : Decoder Server
server =
    D.succeed Server
        |> required "url" D.string
        |> required "name" D.string
        |> optional "iconUrl" (D.maybe D.string) Nothing
        |> required "hasCredentials" D.bool
        |> optional "defaultUsername" (D.maybe D.string) Nothing
        |> required "isConnected" D.bool
        |> optional "order" D.int 0


{-| Decode a list of servers.
-}
serverList : Decoder (List Server)
serverList =
    D.oneOf
        [ D.list server
        , D.null []
        ]



-- =============================================================================
-- SESSION DECODERS
-- =============================================================================


{-| Decode session state.
-}
sessionState : Decoder SessionState
sessionState =
    D.string
        |> D.andThen
            (\str ->
                case str of
                    "pending" ->
                        D.succeed Pending

                    "started" ->
                        D.succeed Started

                    "archived" ->
                        D.succeed Archived

                    _ ->
                        D.succeed Pending
            )


{-| Decode a single session.
-}
session : Decoder Session
session =
    D.succeed Session
        |> required "id" D.string
        |> required "name" D.string
        |> required "isPublic" D.bool
        |> optional "members" (D.list D.string) []
        |> optional "managers" (D.list D.string) []
        |> optional "state" sessionState Pending
        |> optional "rulesIsSet" D.bool False
        |> optional "players" (D.list sessionPlayer) []
        |> optional "pending_invitation" D.bool False


{-| Decode a list of sessions.
-}
sessionList : Decoder (List Session)
sessionList =
    D.oneOf
        [ D.list session
        , D.null []
        ]


{-| Decode a session player.
-}
sessionPlayer : Decoder SessionPlayer
sessionPlayer =
    D.map3 SessionPlayer
        (D.field "userProfileId" D.string)
        (D.oneOf [ D.field "ready" D.bool, D.succeed False ])
        (D.oneOf [ D.field "playerOrder" D.int, D.succeed 0 ])



-- =============================================================================
-- USER PROFILE DECODERS
-- =============================================================================


{-| Decode a single user profile.
-}
userProfile : Decoder UserProfile
userProfile =
    D.succeed UserProfile
        |> required "id" D.string
        |> required "nickname" D.string
        |> required "email" D.string
        |> optional "isActive" D.bool True
        |> optional "isManager" D.bool False
        |> optional "pending" D.bool False
        |> optional "message" (D.maybe D.string) Nothing


{-| Decode a list of user profiles.
-}
userProfileList : Decoder (List UserProfile)
userProfileList =
    D.oneOf
        [ D.list userProfile
        , D.null []
        ]



-- =============================================================================
-- INVITATION DECODERS
-- =============================================================================


{-| Decode a single invitation.
-}
invitation : Decoder Invitation
invitation =
    D.succeed Invitation
        |> required "id" D.string
        |> required "sessionId" D.string
        |> required "sessionName" D.string
        |> required "userProfileId" D.string
        |> required "inviterId" D.string
        |> required "inviterNickname" D.string
        |> required "inviteeNickname" D.string


{-| Decode a list of invitations.
-}
invitationList : Decoder (List Invitation)
invitationList =
    D.oneOf
        [ D.list invitation
        , D.null []
        ]



-- =============================================================================
-- RACE DECODERS
-- =============================================================================


{-| Decode a single race.
-}
race : Decoder Race
race =
    D.map4 Race
        (D.field "id" D.string)
        (D.field "userId" D.string)
        (D.field "nameSingular" D.string)
        (D.field "namePlural" D.string)


{-| Decode a list of races.
-}
raceList : Decoder (List Race)
raceList =
    D.oneOf
        [ D.list race
        , D.null []
        ]



-- =============================================================================
-- RULES DECODERS
-- =============================================================================


{-| Decode game rules/ruleset.
-}
rules : Decoder Rules
rules =
    D.succeed Rules
        -- Universe Configuration
        |> optional "universeSize" D.int 1
        |> optional "density" D.int 1
        |> optional "startingDistance" D.int 1
        |> optional "randomSeed" (D.maybe D.int) Nothing
        -- Game Options
        |> optional "maximumMinerals" D.bool False
        |> optional "slowerTechAdvances" D.bool False
        |> optional "acceleratedBbsPlay" D.bool False
        |> optional "noRandomEvents" D.bool False
        |> optional "computerPlayersFormAlliances" D.bool False
        |> optional "publicPlayerScores" D.bool False
        |> optional "galaxyClumping" D.bool False
        -- Victory Conditions
        |> optional "vcOwnsPercentOfPlanets" D.bool True
        |> optional "vcOwnsPercentOfPlanetsValue" D.int 60
        |> optional "vcAttainTechInFields" D.bool True
        |> optional "vcAttainTechInFieldsTechValue" D.int 22
        |> optional "vcAttainTechInFieldsFieldsValue" D.int 4
        |> optional "vcExceedScoreOf" D.bool False
        |> optional "vcExceedScoreOfValue" D.int 11000
        |> optional "vcExceedNextPlayerScoreBy" D.bool True
        |> optional "vcExceedNextPlayerScoreByValue" D.int 100
        |> optional "vcHasProductionCapacityOf" D.bool False
        |> optional "vcHasProductionCapacityOfValue" D.int 100
        |> optional "vcOwnsCapitalShips" D.bool False
        |> optional "vcOwnsCapitalShipsValue" D.int 100
        |> optional "vcHaveHighestScoreAfterYears" D.bool False
        |> optional "vcHaveHighestScoreAfterYearsValue" D.int 100
        -- Victory Condition Meta
        |> optional "vcWinnerMustMeet" D.int 1
        |> optional "vcMinYearsBeforeWinner" D.int 50



-- =============================================================================
-- TURN FILES DECODERS
-- =============================================================================


{-| Decode turn files.
-}
turnFiles : Decoder TurnFiles
turnFiles =
    D.map4 TurnFiles
        (D.field "sessionId" D.string)
        (D.field "year" D.int)
        (D.field "universe" D.string)
        (D.field "turn" D.string)



-- =============================================================================
-- APP SETTINGS DECODERS
-- =============================================================================


{-| Decoder for app settings response.
Returns a record with serversDir, autoDownloadStars, zoomLevel, useWine, winePrefixesDir, validWineInstall, and enableBrowserStars.
-}
appSettings : Decoder { serversDir : String, autoDownloadStars : Bool, zoomLevel : Int, useWine : Bool, winePrefixesDir : String, validWineInstall : Bool, enableBrowserStars : Bool }
appSettings =
    D.map7
        (\sd ads zl uw wpd vwi ebs ->
            { serversDir = sd
            , autoDownloadStars = ads
            , zoomLevel = zl
            , useWine = uw
            , winePrefixesDir = wpd
            , validWineInstall = vwi
            , enableBrowserStars = ebs
            }
        )
        (D.field "serversDir" D.string)
        (D.field "autoDownloadStars" D.bool)
        (D.oneOf [ D.field "zoomLevel" D.int, D.succeed 100 ])
        (D.oneOf [ D.field "useWine" D.bool, D.succeed False ])
        (D.oneOf [ D.field "winePrefixesDir" D.string, D.succeed "~/.config/astrum/wine_prefixes" ])
        (D.oneOf [ D.field "validWineInstall" D.bool, D.succeed False ])
        (D.oneOf [ D.field "enableBrowserStars" D.bool, D.succeed False ])


{-| Decoder for Wine check result.
-}
wineCheckResult : Decoder { valid : Bool, message : String }
wineCheckResult =
    D.map2
        (\v m -> { valid = v, message = m })
        (D.field "valid" D.bool)
        (D.field "message" D.string)


{-| Decoder for NTVDM check result.
-}
ntvdmCheckResult : Decoder { available : Bool, is64Bit : Bool, message : String, helpUrl : Maybe String }
ntvdmCheckResult =
    D.map4
        (\a i m h -> { available = a, is64Bit = i, message = m, helpUrl = h })
        (D.field "available" D.bool)
        (D.field "is64Bit" D.bool)
        (D.field "message" D.string)
        (D.maybe (D.field "helpUrl" D.string))



-- =============================================================================
-- ORDERS STATUS DECODERS
-- =============================================================================


{-| Decode orders status for a session's pending turn.
-}
ordersStatus : Decoder OrdersStatus
ordersStatus =
    D.map3 OrdersStatus
        (D.field "sessionId" D.string)
        (D.field "pendingYear" D.int)
        (D.field "players" (D.list playerOrderStatus))


{-| Decode a single player's order status.
-}
playerOrderStatus : Decoder PlayerOrderStatus
playerOrderStatus =
    D.map4 PlayerOrderStatus
        (D.field "playerOrder" D.int)
        (D.field "nickname" D.string)
        (D.field "isBot" D.bool)
        (D.field "submitted" D.bool)



-- =============================================================================
-- RACE BUILDER DECODERS
-- =============================================================================


{-| Decode race validation result.
-}
raceValidation : Decoder RaceValidation
raceValidation =
    D.succeed RaceValidation
        |> required "points" D.int
        |> required "isValid" D.bool
        |> optional "errors" (D.list raceValidationError) []
        |> optional "warnings" (D.list D.string) []
        |> required "habitability" habitabilityDisplay
        |> optional "prtInfos" (D.list prtInfo) []
        |> optional "lrtInfos" (D.list lrtInfo) []


{-| Decode a single race validation error.
-}
raceValidationError : Decoder RaceValidationError
raceValidationError =
    D.map2 RaceValidationError
        (D.field "field" D.string)
        (D.field "message" D.string)


{-| Decode habitability display information.
-}
habitabilityDisplay : Decoder HabitabilityDisplay
habitabilityDisplay =
    D.succeed HabitabilityDisplay
        |> required "gravityMin" D.string
        |> required "gravityMax" D.string
        |> required "gravityRange" D.string
        |> required "gravityImmune" D.bool
        |> required "temperatureMin" D.string
        |> required "temperatureMax" D.string
        |> required "temperatureRange" D.string
        |> required "temperatureImmune" D.bool
        |> required "radiationMin" D.string
        |> required "radiationMax" D.string
        |> required "radiationRange" D.string
        |> required "radiationImmune" D.bool


{-| Decode a PRT info (Primary Racial Trait).
-}
prtInfo : Decoder PRTInfo
prtInfo =
    D.succeed PRTInfo
        |> required "index" D.int
        |> required "code" D.string
        |> required "name" D.string
        |> required "desc" D.string
        |> required "pointCost" D.int


{-| Decode an LRT info (Lesser Racial Trait).
-}
lrtInfo : Decoder LRTInfo
lrtInfo =
    D.succeed LRTInfo
        |> required "index" D.int
        |> required "code" D.string
        |> required "name" D.string
        |> required "desc" D.string
        |> required "pointCost" D.int


{-| Decode race config (for templates).
-}
raceConfig : Decoder RaceConfig
raceConfig =
    D.succeed RaceConfig
        |> required "singularName" D.string
        |> required "pluralName" D.string
        |> optional "password" D.string ""
        |> required "icon" D.int
        |> required "prt" D.int
        |> optional "lrt" (D.list D.int) []
        |> required "gravityCenter" D.int
        |> required "gravityWidth" D.int
        |> required "gravityImmune" D.bool
        |> required "temperatureCenter" D.int
        |> required "temperatureWidth" D.int
        |> required "temperatureImmune" D.bool
        |> required "radiationCenter" D.int
        |> required "radiationWidth" D.int
        |> required "radiationImmune" D.bool
        |> required "growthRate" D.int
        |> required "colonistsPerResource" D.int
        |> required "factoryOutput" D.int
        |> required "factoryCost" D.int
        |> required "factoryCount" D.int
        |> required "factoriesUseLessGerm" D.bool
        |> required "mineOutput" D.int
        |> required "mineCost" D.int
        |> required "mineCount" D.int
        |> required "researchEnergy" D.int
        |> required "researchWeapons" D.int
        |> required "researchPropulsion" D.int
        |> required "researchConstruction" D.int
        |> required "researchElectronics" D.int
        |> required "researchBiotech" D.int
        |> required "techsStartHigh" D.bool
        |> required "leftoverPointsOn" D.int
