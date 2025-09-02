import { _decorator, Component, game, MissingScript, Node, Skeleton, sp, v3, Vec3} from 'cc';
import { ReelSpinPrototype } from './ReelSpinPrototype';
import Utils from '../Util/Utils';
import { Symbol, SymbolValue } from './Symbol';
import AudioManager from './AudioManager';
import GameData from '../Model/GameData';
import { ReelController } from './ReelController';
import { GameType } from '../Model/GameStateData';
import { GalacticColoniesConfig } from '../../../artAssets/ptSlot-009Tech/Script/GalacticColoniesConfig';
import { CacasdingReelController } from 'db://assets/artAssets/ptSlot-009Tech/Script/CacasdingReelController';

const { ccclass, property } = _decorator;

@ccclass('ReelStopOptions') 
export class ReelStopOptions {
    reelResult: string[] = [];
    stopDelaySeconds: number = 0.3;
    stopDuration: number = 0.1;
    stopBounceDuration : number = 0.1;
    scatterSlowDurationSeconds: number = 1;
    scatterSlowInitialSpeed: number = 1;
    scatterSlowFinalSpeed: number = 0.5;
    stopSpeed : number = 500;
    stopCompletedCallback: (reelIndex: number) => void = null;

    constructor (options: ReelStopOptions, newCallback: (reelIndex: number) => void) {
        this.reelResult = options.reelResult;
        this.stopDelaySeconds = options.stopDelaySeconds;
        this.stopDuration = options.stopDuration;
        this.stopBounceDuration = options.stopBounceDuration;
        this.scatterSlowDurationSeconds = options.scatterSlowDurationSeconds;
        this.scatterSlowInitialSpeed = options.scatterSlowInitialSpeed;
        this.scatterSlowFinalSpeed = options.scatterSlowFinalSpeed;
        this.stopSpeed = options.stopSpeed;
        this.stopCompletedCallback = newCallback;
    }
}

@ccclass('Reel')
export class Reel extends Component {

    @property([Node]) reelScatterNodes: Node[] = [];

    // @property ({type: ReelSpinPrototype, tooltip: "If left empty in editor will auto search for any component that extends ReelSpinPrototype in this node"}) 
    protected reelSpinPrototype: ReelSpinPrototype = null; 
    protected reelControllerStartCallback: (reelIndex: number) => void = null;
    protected reelControllerStopCallback: (reelIndex: number) => void = null;

    public instantStop: boolean = false;
    protected isReelSpinning: boolean = false;
    protected reelStopOptions: ReelStopOptions = null;

    protected onLoad () : void {
        if (this.reelSpinPrototype == null) {
            this.reelSpinPrototype = this.node.getComponent("ReelSpinPrototype") as ReelSpinPrototype;

            if (!this.reelSpinPrototype) {
                console.error("{ Reel } - Missing reel spin controller in this node: " + this.node.name);
            }
        }

        
    }

    InitReel (callback: (reelIndex: number) => void) {

        let reelIndex = this.node.getSiblingIndex();
        this.reelSpinPrototype.InitReel((() => {
            let childrenSymbols = this.GetAllSymbols();
            for(let i = 0; i < childrenSymbols.length; i++){
                childrenSymbols[i].LoadIdleAnimation();

            }
            callback(reelIndex);
        }).bind(this));
    }

    async StartSpin (reelIndex: number, totalReels: number , callback: (reelIndex: number) => void , speed : number) {
        this.reelControllerStartCallback = callback || null;
        ReelController.instance.delayStartSpinTime = ReelController.instance.delayStartSpinTime + 0.05;
        await Utils.WaitForSeconds(ReelController.instance.delayStartSpinTime);
        this.reelSpinPrototype.StartSpin(reelIndex, totalReels , this.SpinStartedCallback.bind(this) , speed);
        this.isReelSpinning = true;
        this.instantStop = false;
    }

    async StopSpin (reelStopOptions: ReelStopOptions) {
        this.reelControllerStopCallback = reelStopOptions.stopCompletedCallback || null;

        // Replace callback with reel callback
        let newReelStopOptions = new ReelStopOptions(reelStopOptions, this.StopSpinCompletedCallback.bind(this));
        this.reelStopOptions = newReelStopOptions;

        let stopDelaySeconds = this.reelStopOptions.stopDelaySeconds;
        let resumeStop = false;
        Utils.WaitForSeconds(stopDelaySeconds).then(() => {resumeStop = true;});

        await Utils.WaitForCondition(() => {return this.instantStop || resumeStop;});

        let scatterSlowDurationSeconds = this.reelStopOptions.scatterSlowDurationSeconds;
        if (GameData.instance.isGameHaveRetrigger) {
            if (scatterSlowDurationSeconds > 0 && this.reelScatterNodes != null && !this.instantStop) {
                for (let i = 0; i < this.reelScatterNodes.length; i++) {
                    if (this.reelScatterNodes[i] != null) {
                        this.reelScatterNodes[i].active = true;
                        this.reelScatterNodes[i].getComponent(sp.Skeleton).animation = 'intro';
                        this.reelScatterNodes[i].getComponent(sp.Skeleton).setCompleteListener((function (data) {
                            if (data.animation.name == 'intro') {
                                this.reelScatterNodes[i].getComponent(sp.Skeleton).animation = 'loop';
                            }
                        }).bind(this));
                    }
                }
                
                ReelController.instance?.ShowScatterVfx();
                AudioManager.instance?.PlayScatterReelSound();
                this.reelSpinPrototype.SlowSpin(this.reelStopOptions.scatterSlowInitialSpeed, this.reelStopOptions.scatterSlowFinalSpeed, scatterSlowDurationSeconds);

                resumeStop = false;
                

                Utils.WaitForSeconds(scatterSlowDurationSeconds).then(() => { resumeStop = true; });
                await Utils.WaitForCondition(() => { return this.instantStop || resumeStop; });
                AudioManager.instance?.StopScatterReelSound();
            }
        } else {
            if (scatterSlowDurationSeconds > 0 && this.reelScatterNodes != null && !this.instantStop && GameData.instance.GetCurrentGameType() == GameType.normal_game) {
                for (let i = 0; i < this.reelScatterNodes.length; i++) {
                    if (this.reelScatterNodes[i] != null) {
                        this.reelScatterNodes[i].active = true;
                        this.reelScatterNodes[i].getComponent(sp.Skeleton).animation = 'intro';
                        this.reelScatterNodes[i].getComponent(sp.Skeleton).setCompleteListener((function (data) {
                            if (data.animation.name == 'intro') {
                                this.reelScatterNodes[i].getComponent(sp.Skeleton).animation = 'loop';
                            }
                        }).bind(this));
                    }
                }
                if(GalacticColoniesConfig.instance.characterGroup.leftCharacter.getComponent(sp.Skeleton).animation == 'idle' && !ReelController.instance.isAnimationTrigger) {
                    GalacticColoniesConfig.instance.characterGroup.leftCharacter.getComponent(sp.Skeleton).animation = 'scatter_hit';
                    GalacticColoniesConfig.instance.characterGroup.rightCharacter.getComponent(sp.Skeleton).animation = 'scatter_hit';
                    // GalacticColoniesConfig.instance.characterGroup.rightCharacter.getComponent(sp.Skeleton).setCompleteListener((function(data) {
                        // if(data.animation.name == 'scatter_hit') {
                            // GalacticColoniesConfig.instance.characterGroup.leftCharacter.getComponent(sp.Skeleton).animation = 'scatter_hit_loop';
                            // GalacticColoniesConfig.instance.characterGroup.rightCharacter.getComponent(sp.Skeleton).animation = 'scatter_hit_loop';
            
                        // }
                    // }).bind(this));
                }
                ReelController.instance?.ShowScatterVfx();
                AudioManager.instance?.PlayScatterReelSound();
                this.reelSpinPrototype.SlowSpin(this.reelStopOptions.scatterSlowInitialSpeed, this.reelStopOptions.scatterSlowFinalSpeed, scatterSlowDurationSeconds);

                resumeStop = false;

                Utils.WaitForSeconds(scatterSlowDurationSeconds).then(() => { resumeStop = true; });

                await Utils.WaitForCondition(() => { return this.instantStop || resumeStop; });
                AudioManager.instance?.StopScatterReelSound();
            }
        }
        this.CallReelSpinPrototypeStopSpin();
    }

    protected CallReelSpinPrototypeStopSpin () {
        this.isReelSpinning = false;
        this.reelSpinPrototype.StopSpin(this.reelStopOptions);
    }

    protected SpinStartedCallback () {
        this.reelControllerStartCallback?.(this.node.getSiblingIndex());
    }

    public StopSpinCompletedCallback () {
        if (this.reelScatterNodes != null) {
            for(let i = 0; i < this.reelScatterNodes.length; i++) {
                if(this.reelScatterNodes[i] != null && this.reelScatterNodes[i].active == true) {
                    this.reelScatterNodes[i].getComponent(sp.Skeleton).animation = 'outro';
                    this.reelScatterNodes[i].getComponent(sp.Skeleton).setCompleteListener((function(data) {
                        if(data.animation.name == 'outro') {
                            this.reelScatterNodes[i].active = false;
                        }
                    }).bind(this));
                }
            }
        }
        let symbols = this.GetAllSymbols();
        for (var i = 0; i < symbols.length; i++) {
            if (symbols[i].GetSymbolID() == 'PS') {
                GameData.instance.IncrementScatterCount();
                    if (GameData.instance.GetScatterCount() > 0) {
                        // AudioManager.instance?.PlayReelScatterSound(GameData.instance.GetScatterCount() - 1);
                    }
                    if (GameData.instance.GetScatterCount() >= 2) {
                        for (let k = 0; k < ReelController.instance.reelNormals.length; k++) {
                            for (let j = 0; j < ReelController.instance.reelNormals[k].node.children.length; j++) {
                                if (ReelController.instance.reelNormals[k].node.children[j].getComponent(Symbol).GetSymbolID() == 'PS') {
                                    if (this.instantStop == false) {
                                        ReelController.instance.reelNormals[k].node.children[j].getComponent(Symbol).PlayHitAnimation();
                                    }
                                }
                            }
                        }
                    }
                    if (GameData.instance.GetScatterCount() >= 3) {
                        AudioManager.instance.PlayScatterReelHitSound();
                    }
            } else if (symbols[i].GetSymbolID() == 'PW') {
                // AudioManager.instance.PlayWildAppearSound()
            }
        }

        this.reelControllerStopCallback?.(this.node.getSiblingIndex());

        this.ChangeSymbolLayer();
    }

    GetAllSymbols (): Symbol[] {
        let childrenSymbols = this.node.getComponentsInChildren(Symbol);
        return childrenSymbols;
    }

    GetAllSymbolIDs (): string[] {
        let childrenSymbolIDs: string[] = [];
        let childrenSymbols = this.node.getComponentsInChildren(Symbol);
        for (let i = 0; i < childrenSymbols.length; i++) {
            let childSymbol = childrenSymbols[i];
            childrenSymbolIDs.push(childSymbol.GetSymbolID());
        }
        return childrenSymbolIDs;
    }

    IsReelSpinning () {
        return this.isReelSpinning;
    }

    InstantStopReel () {
        this.instantStop = true;
    }

    ChangeSymbolLayer(){
        let symbols = this.GetAllSymbols();
        let position = null;
        for(let i = 0; i < symbols.length; i++){
            switch(symbols[i].symbolValue){
                case SymbolValue.SpecSymbol:
                    position = v3(symbols[i].node.position.x , symbols[i].node.position.y , 0);
                    symbols[i].getComponent(Symbol).parentNode.setParent(GameData.instance.specSymbolLayer.children[this.node.getSiblingIndex()]);
                    symbols[i].getComponent(Symbol).parentNode.setPosition(position);
                break;

                case SymbolValue.HighSymbol:
                    position = v3(symbols[i].node.position.x , symbols[i].node.position.y , 0);
                    symbols[i].getComponent(Symbol).parentNode.setParent(GameData.instance.highSymbolLayer.children[this.node.getSiblingIndex()]);
                    symbols[i].getComponent(Symbol).parentNode.setPosition(position);
                break;
            }
        }
    }

    PlayScattreReelFrame() {
        for (let i = 0; i < this.reelScatterNodes.length; i++) {
            if (this.reelScatterNodes[i] != null) {
                this.reelScatterNodes[i].active = true;
                this.reelScatterNodes[i].getComponent(sp.Skeleton).animation = 'intro';
                this.reelScatterNodes[i].getComponent(sp.Skeleton).setCompleteListener((function (data) {
                    if (data.animation.name == 'intro') {
                        this.reelScatterNodes[i].getComponent(sp.Skeleton).animation = 'loop';
                    }
                }).bind(this));
            }
        }
    }
}


