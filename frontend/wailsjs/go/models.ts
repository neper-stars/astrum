export namespace main {
	
	export class AppSettingsInfo {
	    serversDir: string;
	    autoDownloadStars: boolean;
	    zoomLevel: number;
	    useWine: boolean;
	    winePrefixesDir: string;
	    validWineInstall: boolean;
	
	    static createFrom(source: any = {}) {
	        return new AppSettingsInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.serversDir = source["serversDir"];
	        this.autoDownloadStars = source["autoDownloadStars"];
	        this.zoomLevel = source["zoomLevel"];
	        this.useWine = source["useWine"];
	        this.winePrefixesDir = source["winePrefixesDir"];
	        this.validWineInstall = source["validWineInstall"];
	    }
	}
	export class ConnectResult {
	    username: string;
	    userId: string;
	    isManager: boolean;
	    serialKey?: string;
	
	    static createFrom(source: any = {}) {
	        return new ConnectResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.username = source["username"];
	        this.userId = source["userId"];
	        this.isManager = source["isManager"];
	        this.serialKey = source["serialKey"];
	    }
	}
	export class ConnectionState {
	    connected: boolean;
	    username: string;
	    userId: string;
	    error?: string;
	    // Go type: time
	    since?: any;
	
	    static createFrom(source: any = {}) {
	        return new ConnectionState(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.connected = source["connected"];
	        this.username = source["username"];
	        this.userId = source["userId"];
	        this.error = source["error"];
	        this.since = this.convertValues(source["since"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class HabitabilityDisplayInfo {
	    gravityMin: string;
	    gravityMax: string;
	    gravityRange: string;
	    gravityImmune: boolean;
	    temperatureMin: string;
	    temperatureMax: string;
	    temperatureRange: string;
	    temperatureImmune: boolean;
	    radiationMin: string;
	    radiationMax: string;
	    radiationRange: string;
	    radiationImmune: boolean;
	
	    static createFrom(source: any = {}) {
	        return new HabitabilityDisplayInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.gravityMin = source["gravityMin"];
	        this.gravityMax = source["gravityMax"];
	        this.gravityRange = source["gravityRange"];
	        this.gravityImmune = source["gravityImmune"];
	        this.temperatureMin = source["temperatureMin"];
	        this.temperatureMax = source["temperatureMax"];
	        this.temperatureRange = source["temperatureRange"];
	        this.temperatureImmune = source["temperatureImmune"];
	        this.radiationMin = source["radiationMin"];
	        this.radiationMax = source["radiationMax"];
	        this.radiationRange = source["radiationRange"];
	        this.radiationImmune = source["radiationImmune"];
	    }
	}
	export class InvitationInfo {
	    id: string;
	    sessionId: string;
	    sessionName: string;
	    userProfileId: string;
	    inviterId: string;
	    inviterNickname: string;
	    inviteeNickname?: string;
	
	    static createFrom(source: any = {}) {
	        return new InvitationInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.sessionId = source["sessionId"];
	        this.sessionName = source["sessionName"];
	        this.userProfileId = source["userProfileId"];
	        this.inviterId = source["inviterId"];
	        this.inviterNickname = source["inviterNickname"];
	        this.inviteeNickname = source["inviteeNickname"];
	    }
	}
	export class LRTInfo {
	    index: number;
	    code: string;
	    name: string;
	    desc: string;
	    pointCost: number;
	
	    static createFrom(source: any = {}) {
	        return new LRTInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.index = source["index"];
	        this.code = source["code"];
	        this.name = source["name"];
	        this.desc = source["desc"];
	        this.pointCost = source["pointCost"];
	    }
	}
	export class MapOptions {
	    width: number;
	    height: number;
	    showNames: boolean;
	    showFleets: boolean;
	    showFleetPaths: number;
	    showMines: boolean;
	    showWormholes: boolean;
	    showLegend: boolean;
	    showScannerCoverage: boolean;
	
	    static createFrom(source: any = {}) {
	        return new MapOptions(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.width = source["width"];
	        this.height = source["height"];
	        this.showNames = source["showNames"];
	        this.showFleets = source["showFleets"];
	        this.showFleetPaths = source["showFleetPaths"];
	        this.showMines = source["showMines"];
	        this.showWormholes = source["showWormholes"];
	        this.showLegend = source["showLegend"];
	        this.showScannerCoverage = source["showScannerCoverage"];
	    }
	}
	export class MapGenerateRequest {
	    serverUrl: string;
	    sessionId: string;
	    year: number;
	    options: MapOptions;
	    universeB64: string;
	    turnB64: string;
	
	    static createFrom(source: any = {}) {
	        return new MapGenerateRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.serverUrl = source["serverUrl"];
	        this.sessionId = source["sessionId"];
	        this.year = source["year"];
	        this.options = this.convertValues(source["options"], MapOptions);
	        this.universeB64 = source["universeB64"];
	        this.turnB64 = source["turnB64"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class MapSaveRequest {
	    serverUrl: string;
	    sessionId: string;
	    year: number;
	    raceName: string;
	    playerNumber: number;
	    svgContent: string;
	
	    static createFrom(source: any = {}) {
	        return new MapSaveRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.serverUrl = source["serverUrl"];
	        this.sessionId = source["sessionId"];
	        this.year = source["year"];
	        this.raceName = source["raceName"];
	        this.playerNumber = source["playerNumber"];
	        this.svgContent = source["svgContent"];
	    }
	}
	export class NtvdmCheckResult {
	    available: boolean;
	    is64Bit: boolean;
	    message: string;
	    helpUrl?: string;
	
	    static createFrom(source: any = {}) {
	        return new NtvdmCheckResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.available = source["available"];
	        this.is64Bit = source["is64Bit"];
	        this.message = source["message"];
	        this.helpUrl = source["helpUrl"];
	    }
	}
	export class PlayerOrderStatusInfo {
	    playerOrder: number;
	    nickname: string;
	    isBot: boolean;
	    submitted: boolean;
	
	    static createFrom(source: any = {}) {
	        return new PlayerOrderStatusInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.playerOrder = source["playerOrder"];
	        this.nickname = source["nickname"];
	        this.isBot = source["isBot"];
	        this.submitted = source["submitted"];
	    }
	}
	export class OrdersStatusInfo {
	    sessionId: string;
	    pendingYear: number;
	    players: PlayerOrderStatusInfo[];
	
	    static createFrom(source: any = {}) {
	        return new OrdersStatusInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.sessionId = source["sessionId"];
	        this.pendingYear = source["pendingYear"];
	        this.players = this.convertValues(source["players"], PlayerOrderStatusInfo);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class PRTInfo {
	    index: number;
	    code: string;
	    name: string;
	    desc: string;
	    pointCost: number;
	
	    static createFrom(source: any = {}) {
	        return new PRTInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.index = source["index"];
	        this.code = source["code"];
	        this.name = source["name"];
	        this.desc = source["desc"];
	        this.pointCost = source["pointCost"];
	    }
	}
	
	export class RaceConfig {
	    singularName: string;
	    pluralName: string;
	    password: string;
	    icon: number;
	    prt: number;
	    lrt: number[];
	    gravityCenter: number;
	    gravityWidth: number;
	    gravityImmune: boolean;
	    temperatureCenter: number;
	    temperatureWidth: number;
	    temperatureImmune: boolean;
	    radiationCenter: number;
	    radiationWidth: number;
	    radiationImmune: boolean;
	    growthRate: number;
	    colonistsPerResource: number;
	    factoryOutput: number;
	    factoryCost: number;
	    factoryCount: number;
	    factoriesUseLessGerm: boolean;
	    mineOutput: number;
	    mineCost: number;
	    mineCount: number;
	    researchEnergy: number;
	    researchWeapons: number;
	    researchPropulsion: number;
	    researchConstruction: number;
	    researchElectronics: number;
	    researchBiotech: number;
	    techsStartHigh: boolean;
	    leftoverPointsOn: number;
	
	    static createFrom(source: any = {}) {
	        return new RaceConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.singularName = source["singularName"];
	        this.pluralName = source["pluralName"];
	        this.password = source["password"];
	        this.icon = source["icon"];
	        this.prt = source["prt"];
	        this.lrt = source["lrt"];
	        this.gravityCenter = source["gravityCenter"];
	        this.gravityWidth = source["gravityWidth"];
	        this.gravityImmune = source["gravityImmune"];
	        this.temperatureCenter = source["temperatureCenter"];
	        this.temperatureWidth = source["temperatureWidth"];
	        this.temperatureImmune = source["temperatureImmune"];
	        this.radiationCenter = source["radiationCenter"];
	        this.radiationWidth = source["radiationWidth"];
	        this.radiationImmune = source["radiationImmune"];
	        this.growthRate = source["growthRate"];
	        this.colonistsPerResource = source["colonistsPerResource"];
	        this.factoryOutput = source["factoryOutput"];
	        this.factoryCost = source["factoryCost"];
	        this.factoryCount = source["factoryCount"];
	        this.factoriesUseLessGerm = source["factoriesUseLessGerm"];
	        this.mineOutput = source["mineOutput"];
	        this.mineCost = source["mineCost"];
	        this.mineCount = source["mineCount"];
	        this.researchEnergy = source["researchEnergy"];
	        this.researchWeapons = source["researchWeapons"];
	        this.researchPropulsion = source["researchPropulsion"];
	        this.researchConstruction = source["researchConstruction"];
	        this.researchElectronics = source["researchElectronics"];
	        this.researchBiotech = source["researchBiotech"];
	        this.techsStartHigh = source["techsStartHigh"];
	        this.leftoverPointsOn = source["leftoverPointsOn"];
	    }
	}
	export class RaceInfo {
	    id: string;
	    userId: string;
	    nameSingular: string;
	    namePlural: string;
	
	    static createFrom(source: any = {}) {
	        return new RaceInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.userId = source["userId"];
	        this.nameSingular = source["nameSingular"];
	        this.namePlural = source["namePlural"];
	    }
	}
	export class ValidationErrorInfo {
	    field: string;
	    message: string;
	
	    static createFrom(source: any = {}) {
	        return new ValidationErrorInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.field = source["field"];
	        this.message = source["message"];
	    }
	}
	export class RaceValidationResult {
	    points: number;
	    isValid: boolean;
	    errors: ValidationErrorInfo[];
	    warnings: string[];
	    habitability: HabitabilityDisplayInfo;
	    prtInfos: PRTInfo[];
	    lrtInfos: LRTInfo[];
	
	    static createFrom(source: any = {}) {
	        return new RaceValidationResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.points = source["points"];
	        this.isValid = source["isValid"];
	        this.errors = this.convertValues(source["errors"], ValidationErrorInfo);
	        this.warnings = source["warnings"];
	        this.habitability = this.convertValues(source["habitability"], HabitabilityDisplayInfo);
	        this.prtInfos = this.convertValues(source["prtInfos"], PRTInfo);
	        this.lrtInfos = this.convertValues(source["lrtInfos"], LRTInfo);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class RulesInfo {
	    universeSize: number;
	    density: number;
	    startingDistance: number;
	    randomSeed?: number;
	    maximumMinerals: boolean;
	    slowerTechAdvances: boolean;
	    acceleratedBbsPlay: boolean;
	    noRandomEvents: boolean;
	    computerPlayersFormAlliances: boolean;
	    publicPlayerScores: boolean;
	    galaxyClumping: boolean;
	    vcOwnsPercentOfPlanets: boolean;
	    vcOwnsPercentOfPlanetsValue: number;
	    vcAttainTechInFields: boolean;
	    vcAttainTechInFieldsTechValue: number;
	    vcAttainTechInFieldsFieldsValue: number;
	    vcExceedScoreOf: boolean;
	    vcExceedScoreOfValue: number;
	    vcExceedNextPlayerScoreBy: boolean;
	    vcExceedNextPlayerScoreByValue: number;
	    vcHasProductionCapacityOf: boolean;
	    vcHasProductionCapacityOfValue: number;
	    vcOwnsCapitalShips: boolean;
	    vcOwnsCapitalShipsValue: number;
	    vcHaveHighestScoreAfterYears: boolean;
	    vcHaveHighestScoreAfterYearsValue: number;
	    vcWinnerMustMeet: number;
	    vcMinYearsBeforeWinner: number;
	
	    static createFrom(source: any = {}) {
	        return new RulesInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.universeSize = source["universeSize"];
	        this.density = source["density"];
	        this.startingDistance = source["startingDistance"];
	        this.randomSeed = source["randomSeed"];
	        this.maximumMinerals = source["maximumMinerals"];
	        this.slowerTechAdvances = source["slowerTechAdvances"];
	        this.acceleratedBbsPlay = source["acceleratedBbsPlay"];
	        this.noRandomEvents = source["noRandomEvents"];
	        this.computerPlayersFormAlliances = source["computerPlayersFormAlliances"];
	        this.publicPlayerScores = source["publicPlayerScores"];
	        this.galaxyClumping = source["galaxyClumping"];
	        this.vcOwnsPercentOfPlanets = source["vcOwnsPercentOfPlanets"];
	        this.vcOwnsPercentOfPlanetsValue = source["vcOwnsPercentOfPlanetsValue"];
	        this.vcAttainTechInFields = source["vcAttainTechInFields"];
	        this.vcAttainTechInFieldsTechValue = source["vcAttainTechInFieldsTechValue"];
	        this.vcAttainTechInFieldsFieldsValue = source["vcAttainTechInFieldsFieldsValue"];
	        this.vcExceedScoreOf = source["vcExceedScoreOf"];
	        this.vcExceedScoreOfValue = source["vcExceedScoreOfValue"];
	        this.vcExceedNextPlayerScoreBy = source["vcExceedNextPlayerScoreBy"];
	        this.vcExceedNextPlayerScoreByValue = source["vcExceedNextPlayerScoreByValue"];
	        this.vcHasProductionCapacityOf = source["vcHasProductionCapacityOf"];
	        this.vcHasProductionCapacityOfValue = source["vcHasProductionCapacityOfValue"];
	        this.vcOwnsCapitalShips = source["vcOwnsCapitalShips"];
	        this.vcOwnsCapitalShipsValue = source["vcOwnsCapitalShipsValue"];
	        this.vcHaveHighestScoreAfterYears = source["vcHaveHighestScoreAfterYears"];
	        this.vcHaveHighestScoreAfterYearsValue = source["vcHaveHighestScoreAfterYearsValue"];
	        this.vcWinnerMustMeet = source["vcWinnerMustMeet"];
	        this.vcMinYearsBeforeWinner = source["vcMinYearsBeforeWinner"];
	    }
	}
	export class ServerInfo {
	    url: string;
	    name: string;
	    iconUrl?: string;
	    hasCredentials: boolean;
	    defaultUsername?: string;
	    isConnected: boolean;
	    order: number;
	
	    static createFrom(source: any = {}) {
	        return new ServerInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.url = source["url"];
	        this.name = source["name"];
	        this.iconUrl = source["iconUrl"];
	        this.hasCredentials = source["hasCredentials"];
	        this.defaultUsername = source["defaultUsername"];
	        this.isConnected = source["isConnected"];
	        this.order = source["order"];
	    }
	}
	export class ServerOrder {
	    url: string;
	    order: number;
	
	    static createFrom(source: any = {}) {
	        return new ServerOrder(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.url = source["url"];
	        this.order = source["order"];
	    }
	}
	export class SessionPlayerInfo {
	    userProfileId: string;
	    ready: boolean;
	    playerOrder: number;
	
	    static createFrom(source: any = {}) {
	        return new SessionPlayerInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.userProfileId = source["userProfileId"];
	        this.ready = source["ready"];
	        this.playerOrder = source["playerOrder"];
	    }
	}
	export class SessionInfo {
	    id: string;
	    name: string;
	    isPublic: boolean;
	    members: string[];
	    managers: string[];
	    started: boolean;
	    rulesIsSet: boolean;
	    players: SessionPlayerInfo[];
	    pending_invitation: boolean;
	
	    static createFrom(source: any = {}) {
	        return new SessionInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.isPublic = source["isPublic"];
	        this.members = source["members"];
	        this.managers = source["managers"];
	        this.started = source["started"];
	        this.rulesIsSet = source["rulesIsSet"];
	        this.players = this.convertValues(source["players"], SessionPlayerInfo);
	        this.pending_invitation = source["pending_invitation"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class TurnFilesInfo {
	    sessionId: string;
	    year: number;
	    universe: string;
	    turn: string;
	
	    static createFrom(source: any = {}) {
	        return new TurnFilesInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.sessionId = source["sessionId"];
	        this.year = source["year"];
	        this.universe = source["universe"];
	        this.turn = source["turn"];
	    }
	}
	export class UserProfileInfo {
	    id: string;
	    nickname: string;
	    email: string;
	    isActive: boolean;
	    isManager: boolean;
	    message?: string;
	
	    static createFrom(source: any = {}) {
	        return new UserProfileInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.nickname = source["nickname"];
	        this.email = source["email"];
	        this.isActive = source["isActive"];
	        this.isManager = source["isManager"];
	        this.message = source["message"];
	    }
	}
	
	export class WineCheckResult {
	    valid: boolean;
	    message: string;
	
	    static createFrom(source: any = {}) {
	        return new WineCheckResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.valid = source["valid"];
	        this.message = source["message"];
	    }
	}

}

