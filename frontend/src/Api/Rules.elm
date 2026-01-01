module Api.Rules exposing (Rules, defaultRules)

{-| Game rules/ruleset type for Stars! sessions.

This defines the universe configuration, game options, and victory conditions.

-}


{-| Game rules configuration.
-}
type alias Rules =
    { -- Universe Configuration
      universeSize : Int -- 0=Tiny, 1=Small, 2=Medium, 3=Large, 4=Huge
    , density : Int -- 0=Sparse, 1=Normal, 2=Dense, 3=Packed
    , startingDistance : Int -- 0=Close, 1=Moderate, 2=Farther, 3=Distant
    , randomSeed : Maybe Int

    -- Game Options
    , maximumMinerals : Bool
    , slowerTechAdvances : Bool
    , acceleratedBbsPlay : Bool
    , noRandomEvents : Bool
    , computerPlayersFormAlliances : Bool
    , publicPlayerScores : Bool
    , galaxyClumping : Bool

    -- Victory Conditions
    , vcOwnsPercentOfPlanets : Bool
    , vcOwnsPercentOfPlanetsValue : Int -- 20-100
    , vcAttainTechInFields : Bool
    , vcAttainTechInFieldsTechValue : Int -- 8-26
    , vcAttainTechInFieldsFieldsValue : Int -- 2-6
    , vcExceedScoreOf : Bool
    , vcExceedScoreOfValue : Int -- 1000-20000
    , vcExceedNextPlayerScoreBy : Bool
    , vcExceedNextPlayerScoreByValue : Int -- 20-300
    , vcHasProductionCapacityOf : Bool
    , vcHasProductionCapacityOfValue : Int -- 10-500
    , vcOwnsCapitalShips : Bool
    , vcOwnsCapitalShipsValue : Int -- 10-300
    , vcHaveHighestScoreAfterYears : Bool
    , vcHaveHighestScoreAfterYearsValue : Int -- 30-900

    -- Victory Condition Meta
    , vcWinnerMustMeet : Int -- 0-7
    , vcMinYearsBeforeWinner : Int -- 30-500
    }


{-| Default rules matching Stars! defaults.
-}
defaultRules : Rules
defaultRules =
    { -- Universe Configuration
      universeSize = 1 -- Small
    , density = 1 -- Normal
    , startingDistance = 1 -- Moderate
    , randomSeed = Nothing

    -- Game Options
    , maximumMinerals = False
    , slowerTechAdvances = False
    , acceleratedBbsPlay = False
    , noRandomEvents = False
    , computerPlayersFormAlliances = False
    , publicPlayerScores = False
    , galaxyClumping = False

    -- Victory Conditions (Stars! defaults)
    , vcOwnsPercentOfPlanets = True
    , vcOwnsPercentOfPlanetsValue = 60
    , vcAttainTechInFields = True
    , vcAttainTechInFieldsTechValue = 22
    , vcAttainTechInFieldsFieldsValue = 4
    , vcExceedScoreOf = False
    , vcExceedScoreOfValue = 11000
    , vcExceedNextPlayerScoreBy = True
    , vcExceedNextPlayerScoreByValue = 100
    , vcHasProductionCapacityOf = False
    , vcHasProductionCapacityOfValue = 100
    , vcOwnsCapitalShips = False
    , vcOwnsCapitalShipsValue = 100
    , vcHaveHighestScoreAfterYears = False
    , vcHaveHighestScoreAfterYearsValue = 100

    -- Victory Condition Meta
    , vcWinnerMustMeet = 1
    , vcMinYearsBeforeWinner = 50
    }
