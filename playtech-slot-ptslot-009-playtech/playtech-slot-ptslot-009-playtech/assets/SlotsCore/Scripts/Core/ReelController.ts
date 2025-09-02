import { _decorator, Component, Node, sp } from 'cc';
import { Reel } from './Reel';
import { GameSpinType, GameState, GameStateAction, GameStateEvent } from '../Model/GameStateData';
import GameData, { GameStateInfo } from '../Model/GameData';
import Utils from '../Util/Utils';
import { Symbol } from './Symbol';
const { ccclass, property } = _decorator;

@ccclass('ReelOptions')
class ReelOptions {
    @property(Number) startDelaySecond : number = 0;
    @property(Number) stopDelaySecond : number = 0;
    @property(Number) stopDurationSecond : number = 0.1;
    @property(Number) stopBounceSecond : number = 0.1;
    @property(Number) stopSpeed : number = 500;
}

@ccclass('ScatterReelOptions')
class ScatterReelOptions {
    @property(Number) scatterReelEffectStartCount : number = 3;
    @property(Number) slowDurationSecond : number = 2;
    @property(Number) slowSpeedInitialMultiplier : number = 1;
    @property(Number) slowSpeedFinalMultiplier : number = 0.5;
    @property(Number) stopDurationSecond : number = 0.2;
    @property(Number) stopBounceSecond : number = 0.1;
    @property(Number) stopSpeed : number = 500;
    @property(Boolean) instantStopOnTurboSpin : boolean = true;
}

@ccclass('ReelController')
export class ReelController extends Component {

    public static instance: ReelController = null;

    @property(Reel) reelNormals : Reel [] = [];
    @property(ReelOptions) normalSpinOptions : ReelOptions = null;
    @property(ReelOptions) turboSpinOptions : ReelOptions = null;
    @property(ScatterReelOptions) scatterReelOptions : ScatterReelOptions = null;
    @property(Node) scatterVfx = null;

    protected initializedReels: number[] = [];
    protected spinStartedReels: number[] = [];
    protected stopCompletedReels: number[] = [];
    public scatterReelCount: number = 0;
    protected isPlayingScatterVfx : boolean = false;
    public delayStartSpinTime = 0;
    protected isStop = false;
    public isAnimationTrigger = false;
    public fakeData = false;

    
    protected onLoad(): void {
        if (ReelController.instance == null) {
            ReelController.instance = this;
        }

        addEventListener(GameStateEvent.game_initialize, this.InitReels.bind(this));
        addEventListener(GameStateEvent.game_state_changed, this.OnGameStateChanged.bind(this));
    }
    
    // ==============================================
    // Spin functions
    // ==============================================

    OnGameStateChanged(customEvent: CustomEvent){
        let eventDetail = customEvent.detail as GameStateInfo;
        if(Utils.CheckCurrentGameState(GameStateAction.enter , GameState.idle, eventDetail)){
            GameData.instance.ResetScatterCount();
            this.isPlayingScatterVfx = false;
        }
    }

    InitReels () {
        for(let i = 0; i < this.reelNormals.length; i++){
            this.reelNormals[i].InitReel(this.ReelInitCallback.bind(this));
        }
    }
    
    ReelInitCallback (reelIndex: number) {
        this.initializedReels.push(reelIndex);
        this.stopCompletedReels.push(reelIndex);
    }

    StartSpin () {
        this.spinStartedReels = [];
        this.scatterReelCount = 0;

        let spinStartSecond = 0;
        let stopSpeed = 0;
        this.delayStartSpinTime = 0;

        if (GameData.instance.GetGameSpinType() == GameSpinType.normal_spin || GameData.instance.GetGameSpinType() == GameSpinType.auto_normal_spin) {
            spinStartSecond = this.normalSpinOptions.startDelaySecond;
            stopSpeed = this.normalSpinOptions.stopSpeed;
        } else if (GameData.instance.GetGameSpinType() == GameSpinType.turbo_spin || GameData.instance.GetGameSpinType() == GameSpinType.auto_turbo_spin) {
            spinStartSecond = this.turboSpinOptions.startDelaySecond;
            stopSpeed = this.turboSpinOptions.stopSpeed;
        }

        for(let i = 0; i < this.reelNormals.length ; i++){
            let delaySecond = (i * spinStartSecond);
            if (delaySecond <= 0) { // purposely check for delay <= 0 because waiting 0 seconds will also have a slight delay
                this.reelNormals[i].StartSpin(i, this.reelNormals.length , this.ReelStartedCallback.bind(this) , stopSpeed);
            } else {
                Utils.WaitForSeconds(delaySecond).then(() => {
                    this.reelNormals[i].StartSpin(i, this.reelNormals.length , this.ReelStartedCallback.bind(this) , stopSpeed);
                });
            }
        }
    }

    StopSpin (reelsResultArray: string[][]) {
        let stopDelaySeconds = 0;
        let stopDuration = 0;
        let stopBounceDuration = 0;
        let stopSpeed = 0;

        if (GameData.instance.GetGameSpinType() == GameSpinType.turbo_spin || GameData.instance.GetGameSpinType() == GameSpinType.auto_turbo_spin) {
            stopDelaySeconds = this.turboSpinOptions.stopDelaySecond;
            stopDuration = this.turboSpinOptions.stopDurationSecond;
            stopBounceDuration = this.turboSpinOptions.stopBounceSecond;
            stopSpeed = this.turboSpinOptions.stopSpeed;
        } else {
            stopDelaySeconds = this.normalSpinOptions.stopDelaySecond;
            stopDuration = this.normalSpinOptions.stopDurationSecond;
            stopBounceDuration = this.normalSpinOptions.stopBounceSecond;
            stopSpeed = this.normalSpinOptions.stopSpeed;
        }
        
        let accumulateStopDelaySeconds = 0;

        for(let i = 0; i < reelsResultArray.length ; i++) {
            accumulateStopDelaySeconds += stopDelaySeconds;
            let scatterSlowDuration = 0;
            
            if (GameData.instance.IsTurboSpin() && this.scatterReelOptions.instantStopOnTurboSpin) {
                scatterSlowDuration = 0;
            } else if (this.scatterReelCount >= this.scatterReelOptions.scatterReelEffectStartCount) {
                scatterSlowDuration = this.scatterReelOptions.slowDurationSecond;
            }

            if (scatterSlowDuration > 0) {
                stopDuration = this.scatterReelOptions.stopDurationSecond;
                stopBounceDuration = this.scatterReelOptions.stopBounceSecond;
                stopSpeed = this.scatterReelOptions.stopSpeed;
            }
            this.reelNormals[i].StopSpin({
                reelResult: reelsResultArray[i],
                stopDelaySeconds: accumulateStopDelaySeconds,
                stopDuration: stopDuration,
                stopBounceDuration: stopBounceDuration,
                scatterSlowDurationSeconds: scatterSlowDuration,
                scatterSlowInitialSpeed: this.scatterReelOptions.slowSpeedInitialMultiplier,
                scatterSlowFinalSpeed: this.scatterReelOptions.slowSpeedFinalMultiplier,
                stopSpeed : stopSpeed,
                stopCompletedCallback: this.StopCompletedCallback.bind(this)
            });

            let stopDurationDelay = GameData.instance.IsTurboSpin()? 0 : stopDuration;
            accumulateStopDelaySeconds += scatterSlowDuration + stopDurationDelay;
            this.scatterReelCount += (this.GetScatterSymbolCount(reelsResultArray[i]) > 0? 1 : 0);
        }
    }

    StopSpinWithoutResult () {
        let stopDelaySeconds = 0;
        let stopDuration = 0;
        let stopBounceDuration = 0;
        let stopSpeed = 0;
        this.fakeData = true;

        let data = {
            "total_win_amount": 0,
            "array": [
                [
                    ["P03", "P02", "PS", "P02", "P08"],
                    ["P07", "P11", "P07"],
                    ["PS", "P04"],
                    ["P07", "PS", "P03", "P03", "P02"],
                    ["P05", "P01", "P01"],
                    ["P08", "P08", "P02", "P03", "P11"],
                    ["PW", "P09", "P11", "P03"]
                ]
            ],
            "sizeArray": [
                [
                    [1, 1, 1, 1, 1],
                    [1, 1, 1, 1, 1],
                    [1, 1, 1, 1, 1],
                    [1, 1, 1, 1, 1],
                    [1, 1, 1, 1, 1],
                    [1, 1, 1, 1, 1],
                    [1, 1, 1, 1]
                ]
            ],
            "data": [{
                "ways": 7200,
                "winnings": 0,
                "winningWays": 0,
                "tumbleMultiplier": 1,
                "allSymbolWinnings": {},
                "resultNewSpawnIndexes": [
                    [1, 1, 1, 1, 1],
                    [1, 1, 1, 1, 1],
                    [1, 1, 1, 1, 1],
                    [1, 1, 1, 1, 1],
                    [1, 1, 1, 1, 1],
                    [1, 1, 1, 1, 1],
                    [1, 1, 1, 1]
                ],
                "destroySymbolIndexes": [],
                "p01MultiplierArray": [
                    [0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0],
                    [0, 0, 0, 0]
                ],
                "p01MultiplierCount": 1
            }],
            "is_eclipse_bonus": false,
            "p01MultiplierCount": 1,
            "extraFeatureIsWildChance": false,
            "wildResultArray": [
                [0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0]
            ]
        }


        // force to use turbo spin stop (instant stop) for no result
        stopDelaySeconds = this.turboSpinOptions.stopDelaySecond;
        stopDuration = this.turboSpinOptions.stopDurationSecond;
        stopBounceDuration = this.turboSpinOptions.stopBounceSecond;
        stopSpeed = this.turboSpinOptions.stopSpeed;

        let accumulateStopDelaySeconds = 0;
        let reelsResultArray = [];
        let array = [];
        let availableReelSymbols = [];

        // Generate fake result to pass into reel stop
        // ---------------------------------------------------
        for (let i = 0; i < GameData.instance.spriteDatas.length; i++) {
            let symbol =  GameData.instance.spriteDatas[i];
            let symbolName = GameData.instance.spriteDatas[i].name.split('_')[0];
            if (symbolName != 'PW' && symbolName != 'PS') { // will not spawn wild or scatter
                if(availableReelSymbols.indexOf(symbolName) == -1) {
                    availableReelSymbols.push(symbolName);
                }
            }
        }

        for (let i = 0; i < this.reelNormals.length; i++) {
            let reelSymbols = [];

            if (i == 0) {
                let symbolIndex = Utils.RandomValueInt(0, availableReelSymbols.length);
                let symbol = availableReelSymbols[symbolIndex];
                availableReelSymbols.splice(symbolIndex, 1); // remove it from the list to force 0 matching symbols  

                for (let j = 0; j < GameData.instance.reelsSize[i]; j++) {
                    reelSymbols.push(symbol);
                }

            } else {
                let number = 0;
                if(GameData.instance.GetResult() == null) {
                    number = GameData.instance.reelsSize[i];
                } else {
                    number = GameData.instance.GetResult().sizeArray[0][i].length;
                }
                for (let j = 0; j < number; j++) {
                    let symbolIndex = Utils.RandomValueInt(0, availableReelSymbols.length);
                    reelSymbols.push(availableReelSymbols[symbolIndex]);
                }
            }

            array.push(reelSymbols);
        }

        data.array = array;
        GameData.instance.SetResult(data);

        reelsResultArray.push(array);

        // ---------------------------------------------------
        
        // calls each reel to stop as usual
        for(let i = 0; i < this.reelNormals.length; i++) {
            accumulateStopDelaySeconds += stopDelaySeconds;
            let scatterSlowDuration = 0; // no scatter slow for no result

            this.reelNormals[i].StopSpin({
                reelResult: reelsResultArray[0],
                stopDelaySeconds: accumulateStopDelaySeconds,
                stopDuration: stopDuration,
                stopBounceDuration: stopBounceDuration,
                scatterSlowDurationSeconds: scatterSlowDuration,
                scatterSlowInitialSpeed: this.scatterReelOptions.slowSpeedInitialMultiplier,
                scatterSlowFinalSpeed: this.scatterReelOptions.slowSpeedFinalMultiplier,
                stopSpeed : stopSpeed,
                stopCompletedCallback: this.StopCompletedCallback.bind(this)
            });

            let stopDurationDelay = 0;
            accumulateStopDelaySeconds += scatterSlowDuration + stopDurationDelay;
        }
    }

    InstantStopRemainingReels () {
        for (let i = 0; i < this.reelNormals.length; i++) {
            this.reelNormals[i].InstantStopReel();
        }
    }

    ReelStartedCallback (reelIndex: number) {
        this.spinStartedReels.push(reelIndex);
        this.stopCompletedReels = this.stopCompletedReels.filter((completedReel) => completedReel != reelIndex);
        
        dispatchEvent(new CustomEvent(GameStateEvent.reel_started_spin, {detail: { reelIndex: reelIndex }}));

        if(this.spinStartedReels.length == this.reelNormals.length){
            dispatchEvent(new CustomEvent(GameStateEvent.all_reel_started_spin));
        }
    }

    StopCompletedCallback (reelIndex: number) {
        
        this.stopCompletedReels.push(reelIndex);

        dispatchEvent(new CustomEvent(GameStateEvent.reel_stopped_spin, {detail: { reelIndex: reelIndex }}));

        if (this.stopCompletedReels.length == this.reelNormals.length) {
            dispatchEvent(new CustomEvent(GameStateEvent.all_reel_stopped_spin));
            if(GameData.instance.GetScatterCount() == 3){
                this.HideScatterVfx();
                for(let i = 0; i < ReelController.instance.reelNormals.length; i++){
                    for(let j = 0; j < ReelController.instance.reelNormals[i].node.children.length; j++){
                        if(ReelController.instance.reelNormals[i].node.children[j].getComponent(Symbol).GetSymbolID() == 'PS'){
                            ReelController.instance.reelNormals[i].node.children[j].getComponent(Symbol).LoadIdleAnimation();
                        }
                    }
                }
            }
        }
    }

    IsReelSpinning () {
        return this.stopCompletedReels.length < this.reelNormals.length;
    }

    IsAllReelSpinning () {
        return this.stopCompletedReels.length == 0;
    }

    GetAllReels (): Reel[] {
        return this.reelNormals;
    }

    GetAllSymbols (): Symbol[] {
        let symbols: Symbol[] = [];
        for (let i = 0; i < this.reelNormals.length; i++) {
            symbols.push(...this.reelNormals[i].GetAllSymbols());
        }

        return symbols;
    }

    GetAllSymbolIDs (): string[] {
        let symbolIDs: string[] = [];
        let allSymbols = this.GetAllSymbols();
        
        for (let i = 0; i < allSymbols.length; i++) {
            symbolIDs.push(allSymbols[i].GetSymbolID());
        }

        return symbolIDs;
    }

    GetUniqueSymbolIDs (): string[] {
        return Array.from(new Set(this.GetAllSymbolIDs()));
    }

    ShowScatterVfx () {
        if (this.scatterVfx != null) {
            if (GameData.instance.isGameHaveRetrigger) {
                this.scatterVfx.active = true;
                if (this.isPlayingScatterVfx == false) {
                    this.isPlayingScatterVfx = true;
                    this.scatterVfx.getComponent(sp.Skeleton).animation = 'intro';
                    this.scatterVfx.getComponent(sp.Skeleton).setCompleteListener((function (data) {
                        if (data.animation.name == 'intro') {
                            this.scatterVfx.getComponent(sp.Skeleton).animation = 'loop';
                        }
                    }).bind(this))
                }
            } else {
                if(GameData.instance.IsFreeSpinOn()) {
                    return;
                }
                this.scatterVfx.active = true;
                if (this.isPlayingScatterVfx == false) {
                    this.isPlayingScatterVfx = true;
                    this.scatterVfx.getComponent(sp.Skeleton).animation = 'intro';
                    this.scatterVfx.getComponent(sp.Skeleton).setCompleteListener((function (data) {
                        if (data.animation.name == 'intro') {
                            this.scatterVfx.getComponent(sp.Skeleton).animation = 'loop';
                        }
                    }).bind(this))
                }
            }

        }
    }

    HideScatterVfx () {
        if (this.scatterVfx != null) {
            if(this.scatterVfx.active) {
                this.scatterVfx.getComponent(sp.Skeleton).animation = 'outro';
                this.scatterVfx.getComponent(sp.Skeleton).setCompleteListener((function(data) {
                    if(data.animation.name == 'outro') {
                        this.scatterVfx.active = false;
                    }
                }).bind(this))
            }
        }
    }

    // ==============================================
    // internal functions
    // ==============================================

    protected GetScatterSymbolCount (reelResult: string[]) {
        let scatterSymbolCount = 0;

        for (let i = 0; i < reelResult.length; i++) {
            if (reelResult[i] == GameData.instance.GetScatterType()) {
                scatterSymbolCount += 1;
            }
        }
        return scatterSymbolCount;
    }
}


