import { _decorator, Component, sp, SpriteFrame, Node } from 'cc';
import { GameSpinType, GameState, GameStateAction, GameType } from './GameStateData';
const { ccclass, property } = _decorator;


@ccclass('GameStateInfo')
export class GameStateInfo {
    previousGameStateAction: GameStateAction = GameStateAction.enter;
    previousGameState: GameState = GameState.pre_initialize;
    previousGameType: GameType = GameType.normal_game;

    currentGameStateAction: GameStateAction = GameStateAction.enter;
    currentGameState: GameState = GameState.pre_initialize;
    currentGameType: GameType = GameType.normal_game;
    gameSpinType: GameSpinType = GameSpinType.normal_spin;

    currentGameCycle: number = 0;
    completedGameCycle: number = -1;

    private data: any = null;

    constructor (data: any = null) {
        this.previousGameStateAction = GameData.instance.GetPreviousGameStateAction();
        this.previousGameState = GameData.instance.GetPreviousGameState();
        this.previousGameType = GameData.instance.GetPreviousGameType();

        this.currentGameStateAction = GameData.instance.GetCurrentGameStateAction();
        this.currentGameState = GameData.instance.GetCurrentGameState();
        this.currentGameType = GameData.instance.GetCurrentGameType();
        this.gameSpinType = GameData.instance.GetGameSpinType();

        this.currentGameCycle = GameData.instance.GetCurrentGameCycle();
        this.completedGameCycle = GameData.instance.GetCompletedGameCycle();

        this.data = data; // data should be set by the place that construct this
    }

    SetData (data: any) {
        this.data = data;
    }

    GetData () {
        return this.data;
    }

    ToString () {
        return "previous:[" + GameStateAction[this.previousGameStateAction]
                + "|" + GameState[this.previousGameState]
                + "|" + GameType[this.previousGameType] + "]"
                + " current:[" + GameStateAction[this.currentGameStateAction]
                + "|" + GameState[this.currentGameState]
                + "|" + GameType[this.currentGameType] + "]"
                + " data:" + (this.data == null? "null" : this.data);

        // return "cycle:[" + this.currentGameCycle + "|" + this.completedGameCycle + "]"
        //         + " previous:[" + GameStateAction[this.previousGameStateAction]
        //         + "|" + GameState[this.previousGameState]
        //         + "|" + GameType[this.previousGameType] + "]"
        //         + " current:[" + GameStateAction[this.currentGameStateAction]
        //         + "|" + GameState[this.currentGameState]
        //         + "|" + GameType[this.currentGameType] + "]"
        //         + " data:" + (this.data == null? "null" : this.data);
    }
}


@ccclass('GameData')
export default class GameData extends Component {

    // =====================================================================
    // Static instance
    // =====================================================================
    public static instance: GameData = null;


    // =====================================================================
    // Game State
    // #region
    // =====================================================================

    private isLoggedIn: boolean = false;
    private isInitialized: boolean = false;

    private previousGameStateAction: GameStateAction = GameStateAction.enter;
    private previousGameState: GameState = GameState.pre_initialize;
    private previousGameType: GameType = GameType.normal_game;

    private currentGameStateAction: GameStateAction = GameStateAction.enter;
    private currentGameState: GameState = GameState.pre_initialize;
    private currentGameType: GameType = GameType.normal_game;

    private gameSpinType: GameSpinType = GameSpinType.normal_spin;

    private currentGameCycle: number = 0;
    private completedGameCycle: number = -1;
    
    // #endregion
    // =====================================================================

    
    // =====================================================================
    // Game variables
    // #region
    // =====================================================================

    private autoSpinRemaining: number = 0;

    private spinRequestData: string = null;
	private result = null;
    private jackpot = null;

    private spinStartTimeMillis: number = 0;

	private line = 5;
	private maxLine = 5;
	private lineBetIndex = 0;
	private lineBetList = [0.1, 0.2, 0.5, 1];
	private buyFreeSpinMultiplier = 100;
	private buyFreeSpinLineBetIndex = 0;
	private balance = 10000;
    private totalWinAmount = 0;
    private scatterCount = 0;
    private isAllOfAKind = false;
    
    private sound = true;
    
	private scatterType = "PS";
	private wildType = "PW";

    private buyFreeSpin: boolean = false;
    private freeSpinOn: boolean = false;
    private freeSpinRemaining: number = 0;
    private currentFreeSpin: number = 0;
    private totalFreeSpinWin: number = 0;
    private freeSpinRetrigger: boolean = false;
	private nextSpinGameType: GameType = GameType.normal_game;

    private loginResponseData: any = null;
    private resumeFreeSpinReelData: any = null;
    
    private gameErrorCode: string = null;
    private gameErrorAllowContinue: boolean = false;

    
    //playtech Integration
    private pauseGame = false;
    
    // #endregion
    // =====================================================================



    // =====================================================================
    // properties
    // #region
    // =====================================================================
    @property([Number]) reelsSize : number [] = [];

    @property(sp.SkeletonData) spineDatas : sp.SkeletonData [] = [];
    @property(SpriteFrame) spriteDatas : SpriteFrame [] = [];
    @property(SpriteFrame) spriteBlurDatas : SpriteFrame [] = [];

	@property(Number) bigWinLevel : number[] = [];
    @property(Number) autoSpinSelection : number[] = [];

    @property(String) specSymbol : string [] = [];
    @property(String) highSymbol : string [] = [];
    @property(String) lowSymbol : string [] = [];

    @property(Node) specSymbolLayer : Node = null;
    @property(Node) highSymbolLayer : Node = null;

    @property(sp.SkeletonData) symbolWinFrames : sp.SkeletonData [] = [];

    @property(Boolean) isGameHaveRetrigger : boolean = false;

    // #endregion
    // =====================================================================


    protected onLoad(): void {
        if (GameData.instance == null) {
            GameData.instance = this;
        }
    }

    SetIsLoggedIn (isLoggedIn: boolean = false) {
        this.isLoggedIn = isLoggedIn;
    }

    GetIsLoggedIn () {
        return this.isLoggedIn;
    }

    SetIsInitialized (isInitialized: boolean = false) {
        this.isInitialized = isInitialized;
    }

    IsInitialized () {
        return this.isInitialized;
    }

    UpdateGameState (gameStateAction: GameStateAction, gameState: GameState, gameType: GameType = null) {
        this.previousGameStateAction = this.currentGameStateAction;
        this.previousGameState = this.currentGameState;

        this.currentGameStateAction = gameStateAction;
        this.currentGameState = gameState;

        if (gameType != null) {
            this.previousGameType = this.currentGameType;
            this.currentGameType = gameType;
        }
    }

    GetCurrentGameStateAction () {
        return this.currentGameStateAction;
    }

    GetCurrentGameState () {
        return this.currentGameState;
    }

    GetPreviousGameStateAction () {
        return this.previousGameStateAction;
    }

    GetPreviousGameState () {
        return this.previousGameState;
    }

    GetCurrentGameStateString () {
        return GameState[this.currentGameState];
    }

    GetPreviousGameStateString () {
        return GameState[this.previousGameState];
    }

    GetCurrentGameType () {
        return this.currentGameType;
    }

    GetPreviousGameType () {
        return this.previousGameType;
    }

    GetGameStateInfo () : GameStateInfo {
        return new GameStateInfo();
    }

    IsAutoSpin () {
        return this.gameSpinType == GameSpinType.auto_normal_spin || this.gameSpinType == GameSpinType.auto_turbo_spin;
    }

    SetSoundOn(sound : boolean){
        this.sound = sound;
    }

    IsSoundOn(){
        return this.sound;
    }

    SetAutoSpinRemaining (value: number) {
        this.autoSpinRemaining = value;
    }

    DecrementAutoSpinRemaining () {
        this.autoSpinRemaining -= 1;
    }

    GetAutoSpinRemaining () {
        return this.autoSpinRemaining;
    }

    GetSpinRequestDataJson (data: any = null) {
        if (data != null) {
            if (typeof data !== 'string') data = JSON.stringify(data);
            this.spinRequestData = data;
        }
        return this.spinRequestData; 
    }

    GetResult () {
        return this.result;
    }

    SetResult (result: any) {
        this.result = result;
    }

    IsResultContainWild () {
        let result = this.GetResult();
        if (result == null) return false;

        let wildPositions = result["wild_position"];
        if (wildPositions == null || wildPositions.length < 0) return false;

        for (let i = 0; i < wildPositions.length; i++) {
            if (wildPositions[i] != 0) {
                return true;
            }
        }

        return false;
    }

    SetAutoSpin (autoSpin: boolean) {
        if (autoSpin) {
            this.gameSpinType = this.gameSpinType == GameSpinType.normal_spin? GameSpinType.auto_normal_spin 
                                    : this.gameSpinType == GameSpinType.turbo_spin? GameSpinType.auto_turbo_spin
                                    : this.gameSpinType;
        } else {
            this.gameSpinType = this.gameSpinType == GameSpinType.auto_normal_spin? GameSpinType.normal_spin 
                                    : this.gameSpinType == GameSpinType.auto_turbo_spin? GameSpinType.turbo_spin
                                    : this.gameSpinType;
        }
    }

    SetTurboSpin (turboSpin: boolean) {
        if (turboSpin) {
            this.gameSpinType = this.gameSpinType == GameSpinType.normal_spin? GameSpinType.turbo_spin 
                                    : this.gameSpinType == GameSpinType.auto_normal_spin? GameSpinType.auto_turbo_spin
                                    : this.gameSpinType;
        } else {
            this.gameSpinType = this.gameSpinType == GameSpinType.turbo_spin? GameSpinType.normal_spin 
                                    : this.gameSpinType == GameSpinType.auto_turbo_spin? GameSpinType.auto_normal_spin
                                    : this.gameSpinType;
        }
    }

    GetGameSpinType () {
        return this.gameSpinType;
    }

    IncrementCurrentGameCycle () {
        this.currentGameCycle += 1;
    }

    GetCurrentGameCycle () {
        return this.currentGameCycle;
    }

    SetCurrentGameCycleCompleted () {
        this.completedGameCycle = this.currentGameCycle;
    }

    GetCompletedGameCycle () {
        return this.completedGameCycle;
    }

    IsCurrentGameCycleCompleted () {
        return this.currentGameCycle == this.completedGameCycle;
    }

    IsTurboSpin () {
        return this.gameSpinType == GameSpinType.turbo_spin || this.gameSpinType == GameSpinType.auto_turbo_spin;
    }

    SetBuyFreeSpin (buyFreeSpin: boolean) {
        this.buyFreeSpin = buyFreeSpin;
    }

    IsBuyFreeSpin () {
        return this.buyFreeSpin;
    }

    SetNextSpinGameType (nextSpinGameType: GameType) {
        this.nextSpinGameType = nextSpinGameType;
    }

    GetNextSpinGameType () {
        return this.nextSpinGameType;
    }

    SetFreeSpinOn (isFreeSpinOn: boolean) {
        this.freeSpinOn = isFreeSpinOn;
    }

    IsFreeSpinOn () {
        return this.freeSpinOn;
    }

    SetFreeSpinRemaining (freeSpinRemaining: number) {
        this.freeSpinRemaining = freeSpinRemaining;
    }

    GetFreeSpinRemaining () {
        return this.freeSpinRemaining;
    }

    SetCurrentFreeSpin (currentFreeSpin: number) {
        this.currentFreeSpin = currentFreeSpin;
    }

    GetCurrentFreeSpin () {
        return this.currentFreeSpin;
    }

    SetTotalFreeSpinWin (totalFreeSpinWin: number) {
        this.totalFreeSpinWin = totalFreeSpinWin;
    }

    GetTotalFreeSpinWin () {
        return this.totalFreeSpinWin;
    }

    SetFreeSpinRetrigger (freeSpinRetrigger: boolean) {
        this.freeSpinRetrigger = freeSpinRetrigger;
    }

    GetFreeSpinRetrigger () {
        return this.freeSpinRetrigger;
    }

    SetJackpot(jackpot : any) {
        this.jackpot = jackpot;
    }

    GetJackpot() {
        return this.jackpot;
    }

    SetSpinStartTimeToNow () {
        this.spinStartTimeMillis = Date.now();
    }

    GetSpinStartTime () {
        return this.spinStartTimeMillis;
    }

    SetLine (line: number) {
        this.line = line;
    }

    GetLine () {
        return this.line;
    }

    SetMaxLine (maxLine: number) {
        this.maxLine = maxLine;
    }

    GetMaxLine () {
        return this.maxLine;
    }

    SetLineBetList (multiplier: number[], denominator: number) {
        let lineBetList = [];

        for (let i = 0; i < multiplier.length; i++) {
            let lineBet = multiplier[i] * denominator;
            lineBetList.push(lineBet);
        }
        
        this.lineBetList = lineBetList;
    }

    GetLineBetList () {
        return this.lineBetList;
    }

    IncrementLineBet () {
        let lineBetIndex = this.lineBetIndex + 1;
        if (lineBetIndex < this.lineBetList.length) {
            this.lineBetIndex = lineBetIndex;
            this.buyFreeSpinLineBetIndex = this.lineBetIndex;
        }
    }

    DecrementLineBet () {
        let lineBetIndex = this.lineBetIndex - 1;
        if (lineBetIndex >= 0) {
            this.lineBetIndex = lineBetIndex;
            this.buyFreeSpinLineBetIndex = this.lineBetIndex;
        }
    }

    IncrementBuyFreeSpinLineBet () {
        let lineBetIndex = this.buyFreeSpinLineBetIndex + 1;
        if (lineBetIndex < this.lineBetList.length) {
            this.buyFreeSpinLineBetIndex = lineBetIndex;
        }
    }

    DecrementBuyFreeSpinLineBet () {
        let lineBetIndex = this.buyFreeSpinLineBetIndex - 1;
        if (lineBetIndex >= 0) {
            this.buyFreeSpinLineBetIndex = lineBetIndex;
        }
    }

    SetLineBet (lineBetValue: number) {
        let lineBetIndex = this.lineBetList.indexOf(lineBetValue);
        this.lineBetIndex = lineBetIndex >= 0? lineBetIndex : 0;
    }

    SetLineBetIndex (lineBetIndex: number) {
        return this.lineBetIndex = lineBetIndex;
    }

    GetLineBetIndex () {
        return this.lineBetIndex;
    }

    IsLineBetMaxLimitReached () {
        return this.lineBetIndex >= (this.lineBetList.length - 1);
    }

    IsLineBetMinLimitReached () {
        return this.lineBetIndex <= 0;
    }

    GetLineBet () {
        return this.lineBetList[this.lineBetIndex];
    }

    GetGameBet () {
        return parseFloat((this.GetLine() * this.GetLineBet()).toFixed(2));
    }

    GetBuyFreeSpinBet () {
        let buyFreeSpinLineBet = this.lineBetList[this.buyFreeSpinLineBetIndex];
        return parseFloat((this.GetLine() * buyFreeSpinLineBet).toFixed(2));
    }

    SetBuyFreeSpinLineBet (lineBetValue: number) {
        let lineBetIndex = this.lineBetList.indexOf(lineBetValue);
        this.buyFreeSpinLineBetIndex = lineBetIndex >= 0? lineBetIndex : 0;
    }

    GetBuyFreeSpinLineBetIndex () {
        return this.buyFreeSpinLineBetIndex;
    }

    IsBuyFreeSpinLineBetMaxLimitReached () {
        return this.buyFreeSpinLineBetIndex >= (this.lineBetList.length - 1);
    }

    IsBuyFreeSpinLineBetMinLimitReached () {
        return this.buyFreeSpinLineBetIndex <= 0;
    }

    GetBuyFreeSpinAmount () {
        return parseFloat((this.GetBuyFreeSpinBet() * this.buyFreeSpinMultiplier).toFixed(2));
    }

    GetScatterType () {
        return this.scatterType;
    }

    GetWildType () {
        return this.wildType;
    }

    SetTotalWinAmount (totalWinAmount: number) {
        this.totalWinAmount = totalWinAmount;
    }

    GetTotalWinAmount () {
        return this.totalWinAmount;
    }

    SetBalance (balance: number) {
        this.balance = balance;
    }

    GetBalance () {
        return this.balance;
    }

    IsSufficientBalanceForSpin () {
        return this.GetBalance() >= this.GetGameBet();
    }

    IsSufficientBalanceForBuyFreeSpin () {
        return this.GetBalance() >= this.GetBuyFreeSpinAmount();
    }

    GetBigWinLv () {
        return this.bigWinLevel;
    }

    SetAllOfAKind (value : boolean = false) {
        this.isAllOfAKind = value;
    }

    GetAllOfAKind () {
        return this.isAllOfAKind;
    }

    IncrementScatterCount(){
        this.scatterCount = this.scatterCount + 1;
    }

    ResetScatterCount(){
        this.scatterCount = 0;
    }

    GetScatterCount(){
        return this.scatterCount;
    }

    SetLoginResponseData (loginResponseData: any) {
        this.loginResponseData = loginResponseData;
    }

    GetLoginResponseData () {
        return this.loginResponseData
    }

    SetResumeFreeSpinReelData (reelData: any) {
        this.resumeFreeSpinReelData = reelData;
    }

    GetResumeFreeSpinReelData () {
        return this.resumeFreeSpinReelData;
    }

    SetGameErrorCode (gameErrorCode: string) {
        this.gameErrorCode = gameErrorCode;
    }

    GetGameErrorCode () {
        return this.gameErrorCode;
    }

    IsGameError () {
        return this.gameErrorCode != null && JSON.stringify(this.gameErrorCode).length > 0;
    }

    SetGameErrorAllowContinue (isAllowContinue: boolean) {
        this.gameErrorAllowContinue = isAllowContinue;
    }

    IsGameErrorAllowContinue () {
        return this.gameErrorAllowContinue;
    }

    //playtech integration
    SetPauseGameEvent(value : boolean = null) {
        this.pauseGame = value;
    }
    GetPauseGameEvent() {
        return this.pauseGame;
    }
}