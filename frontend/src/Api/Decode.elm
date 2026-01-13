module Api.Decode exposing
    ( appSettings
    , invitationList
    , ntvdmCheckResult
    , ordersStatus
    , playerControlStatusList
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

import Api.Density as Density exposing (Density)
import Api.Invitation exposing (Invitation)
import Api.LRT as LRT exposing (LRT)
import Api.LeftoverPointsOption as LeftoverPointsOption exposing (LeftoverPointsOption)
import Api.OrdersStatus exposing (OrdersStatus, PlayerOrderStatus)
import Api.PRT as PRT exposing (PRT)
import Api.PlayerControl exposing (ControlStatus(..), PlayerControlStatus, controlStatusFromString)
import Api.Race exposing (Race)
import Api.ResearchLevel as ResearchLevel exposing (ResearchLevel)
import Api.Rules exposing (Rules)
import Api.Server exposing (Server)
import Api.Session exposing (Session, SessionPlayer, SessionState(..))
import Api.StartingDistance as StartingDistance exposing (StartingDistance)
import Api.TurnFiles exposing (TurnFiles)
import Api.UniverseSize as UniverseSize exposing (UniverseSize)
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
    D.succeed SessionPlayer
        |> required "id" D.string
        |> required "userProfileId" D.string
        |> optional "ready" D.bool False
        |> optional "playerOrder" D.int 0
        |> optional "isBot" D.bool False
        |> optional "botRaceName" (D.maybe D.string) Nothing



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
    D.succeed Race
        |> required "id" D.string
        |> required "userId" D.string
        |> required "nameSingular" D.string
        |> required "namePlural" D.string


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


{-| Decode a UniverseSize from an integer.
-}
universeSizeDecoder : Decoder UniverseSize
universeSizeDecoder =
    D.int
        |> D.andThen
            (\n ->
                case UniverseSize.fromInt n of
                    Just size ->
                        D.succeed size

                    Nothing ->
                        D.fail ("Invalid universe size: " ++ String.fromInt n)
            )


{-| Decode a Density from an integer.
-}
densityDecoder : Decoder Density
densityDecoder =
    D.int
        |> D.andThen
            (\n ->
                case Density.fromInt n of
                    Just d ->
                        D.succeed d

                    Nothing ->
                        D.fail ("Invalid density: " ++ String.fromInt n)
            )


{-| Decode a StartingDistance from an integer.
-}
startingDistanceDecoder : Decoder StartingDistance
startingDistanceDecoder =
    D.int
        |> D.andThen
            (\n ->
                case StartingDistance.fromInt n of
                    Just d ->
                        D.succeed d

                    Nothing ->
                        D.fail ("Invalid starting distance: " ++ String.fromInt n)
            )


{-| Decode game rules/ruleset.
-}
rules : Decoder Rules
rules =
    D.succeed Rules
        -- Universe Configuration
        |> optional "universeSize" universeSizeDecoder UniverseSize.Small
        |> optional "density" densityDecoder Density.Normal
        |> optional "startingDistance" startingDistanceDecoder StartingDistance.Moderate
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
    D.succeed TurnFiles
        |> required "sessionId" D.string
        |> required "year" D.int
        |> required "universe" D.string
        |> required "turn" D.string



-- =============================================================================
-- APP SETTINGS DECODERS
-- =============================================================================


{-| Decoder for app settings response.
-}
appSettings : Decoder { serversDir : String, autoDownloadStars : Bool, zoomLevel : Int, useWine : Bool, winePrefixesDir : String, validWineInstall : Bool, enableBrowserStars : Bool }
appSettings =
    D.succeed
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
        |> required "serversDir" D.string
        |> required "autoDownloadStars" D.bool
        |> optional "zoomLevel" D.int 100
        |> optional "useWine" D.bool False
        |> optional "winePrefixesDir" D.string "~/.config/astrum/wine_prefixes"
        |> optional "validWineInstall" D.bool False
        |> optional "enableBrowserStars" D.bool False


{-| Decoder for Wine check result.
-}
wineCheckResult : Decoder { valid : Bool, message : String }
wineCheckResult =
    D.succeed (\v m -> { valid = v, message = m })
        |> required "valid" D.bool
        |> required "message" D.string


{-| Decoder for NTVDM check result.
-}
ntvdmCheckResult : Decoder { available : Bool, is64Bit : Bool, message : String, helpUrl : Maybe String }
ntvdmCheckResult =
    D.succeed (\a i m h -> { available = a, is64Bit = i, message = m, helpUrl = h })
        |> required "available" D.bool
        |> required "is64Bit" D.bool
        |> required "message" D.string
        |> optional "helpUrl" (D.maybe D.string) Nothing



-- =============================================================================
-- ORDERS STATUS DECODERS
-- =============================================================================


{-| Decode orders status for a session's pending turn.
-}
ordersStatus : Decoder OrdersStatus
ordersStatus =
    D.succeed OrdersStatus
        |> required "sessionId" D.string
        |> required "pendingYear" D.int
        |> required "players" (D.list playerOrderStatus)


{-| Decode a single player's order status.
-}
playerOrderStatus : Decoder PlayerOrderStatus
playerOrderStatus =
    D.succeed PlayerOrderStatus
        |> required "playerOrder" D.int
        |> required "nickname" D.string
        |> required "isBot" D.bool
        |> required "submitted" D.bool



-- =============================================================================
-- PLAYER CONTROL DECODERS
-- =============================================================================


{-| Decode a list of player control statuses.
-}
playerControlStatusList : Decoder (List PlayerControlStatus)
playerControlStatusList =
    D.list playerControlStatus


{-| Decode a single player's control status.
-}
playerControlStatus : Decoder PlayerControlStatus
playerControlStatus =
    D.succeed PlayerControlStatus
        |> required "playerOrder" D.int
        |> required "userProfileId" D.string
        |> required "nickname" D.string
        |> required "isBot" D.bool
        |> optional "aiControlType" (D.maybe D.string) Nothing
        |> required "controlStatus" controlStatusDecoder


{-| Decode control status from string.
-}
controlStatusDecoder : Decoder ControlStatus
controlStatusDecoder =
    D.string
        |> D.map controlStatusFromString



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
    D.succeed RaceValidationError
        |> required "field" D.string
        |> required "message" D.string


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


{-| Decode a PRT from an integer.
-}
prtDecoder : Decoder PRT
prtDecoder =
    D.int
        |> D.andThen
            (\n ->
                case PRT.fromInt n of
                    Just prt ->
                        D.succeed prt

                    Nothing ->
                        D.fail ("Invalid PRT index: " ++ String.fromInt n)
            )


{-| Decode an LRT from an integer.
-}
lrtDecoder : Decoder LRT
lrtDecoder =
    D.int
        |> D.andThen
            (\n ->
                case LRT.fromInt n of
                    Just lrt ->
                        D.succeed lrt

                    Nothing ->
                        D.fail ("Invalid LRT index: " ++ String.fromInt n)
            )


{-| Decode a ResearchLevel from an integer.
-}
researchLevelDecoder : Decoder ResearchLevel
researchLevelDecoder =
    D.int
        |> D.andThen
            (\n ->
                case ResearchLevel.fromInt n of
                    Just level ->
                        D.succeed level

                    Nothing ->
                        D.fail ("Invalid research level: " ++ String.fromInt n)
            )


{-| Decode a LeftoverPointsOption from an integer.
-}
leftoverPointsOptionDecoder : Decoder LeftoverPointsOption
leftoverPointsOptionDecoder =
    D.int
        |> D.andThen
            (\n ->
                case LeftoverPointsOption.fromInt n of
                    Just opt ->
                        D.succeed opt

                    Nothing ->
                        D.fail ("Invalid leftover points option: " ++ String.fromInt n)
            )


{-| Decode race config (for templates).
-}
raceConfig : Decoder RaceConfig
raceConfig =
    D.succeed RaceConfig
        |> required "singularName" D.string
        |> required "pluralName" D.string
        |> optional "password" D.string ""
        |> required "icon" D.int
        |> required "prt" prtDecoder
        |> optional "lrt" (D.list lrtDecoder) []
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
        |> required "researchEnergy" researchLevelDecoder
        |> required "researchWeapons" researchLevelDecoder
        |> required "researchPropulsion" researchLevelDecoder
        |> required "researchConstruction" researchLevelDecoder
        |> required "researchElectronics" researchLevelDecoder
        |> required "researchBiotech" researchLevelDecoder
        |> required "techsStartHigh" D.bool
        |> required "leftoverPointsOn" leftoverPointsOptionDecoder
