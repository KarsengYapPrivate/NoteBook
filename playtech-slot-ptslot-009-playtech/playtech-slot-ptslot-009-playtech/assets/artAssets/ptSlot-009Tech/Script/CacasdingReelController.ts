import { _decorator, Component, director, Node, sp } from 'cc';
import { ReelController } from '../../../SlotsCore/Scripts/Core/ReelController';
import GameData from '../../../SlotsCore/Scripts/Model/GameData';
import { GameSpinType, GameStateEvent, UIButtonEvent } from '../../../SlotsCore/Scripts/Model/GameStateData';
import { Symbol } from '../../../SlotsCore/Scripts/Core/Symbol';
import { GalacticColoniesConfig } from './GalacticColoniesConfig';
import RollingNumber from 'db://assets/SlotsCore/Scripts/UI/RollingNumber';
import AudioManager from 'db://assets/SlotsCore/Scripts/Core/AudioManager';
import Utils from 'db://assets/SlotsCore/Scripts/Util/Utils';
const { ccclass, property } = _decorator;

@ccclass('CacasdingReelController')
export class CacasdingReelController extends ReelController {

    private reelDoneNumber = 0;

    private isForceStop = false;

    private indexReel = 0;

    protected onLoad(): void {
        super.onLoad();
        addEventListener('ReelDone' , this.ReelDone.bind(this));
        addEventListener(UIButtonEvent[UIButtonEvent.spin_stop_clicked], this.ForceStop.bind(this));
    }
    

    override async StopSpin(reelsResultArray: string[][]) {
        this.fakeData = true;
        let stopDelaySeconds = 0;
        let stopDuration = 0;
        let stopBounceDuration = 0;
        let stopSpeed = 0;
        this.isAnimationTrigger = false;
        this.reelDoneNumber = 0;
        this.isForceStop = false;

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

        for(let i = 0; i < reelsResultArray[0].length ; i++) {
            accumulateStopDelaySeconds += stopDelaySeconds;
            let scatterSlowDuration = 0;
            
            if (GameData.instance.IsTurboSpin() && this.scatterReelOptions.instantStopOnTurboSpin) {
                scatterSlowDuration = 0;
            } else if (this.scatterReelCount >= this.scatterReelOptions.scatterReelEffectStartCount) {
                //scatterSlowDuration = 0.5 * (reelsResultArray[0][i].length + 1);
                scatterSlowDuration = 0.1;
                this.isStop = false;
                this.indexReel = i;
                await Utils.WaitForCondition((()=>this.isStop || this.isForceStop).bind(this));
                //scatterSlowDuration = this.scatterReelOptions.slowDurationSecond;
            }

            if (scatterSlowDuration > 0) {
                stopDuration = this.scatterReelOptions.stopDurationSecond;
                stopBounceDuration = this.scatterReelOptions.stopBounceSecond;
                stopSpeed = this.scatterReelOptions.stopSpeed;
            }
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

            let stopDurationDelay = GameData.instance.IsTurboSpin()? 0 : stopDuration;
            accumulateStopDelaySeconds += scatterSlowDuration + stopDurationDelay;
            this.scatterReelCount += (this.GetScatterSymbolCount(reelsResultArray[0][i]) > 0? 1 : 0);
        }
    }

    override GetScatterSymbolCount (reelResult) {
        let scatterSymbolCount = 0;

        for (let i = 0; i < reelResult.length; i++) {
            if (reelResult[i] == GameData.instance.GetScatterType()) {
                scatterSymbolCount += 1;
            }
        }
        return scatterSymbolCount;
    }

    override StopCompletedCallback (reelIndex: number) {
        this.stopCompletedReels.push(reelIndex);

        dispatchEvent(new CustomEvent(GameStateEvent.reel_stopped_spin, {detail: { reelIndex: reelIndex }}));

        let leftCharacter = GalacticColoniesConfig.instance.characterGroup.leftCharacter.getComponent(sp.Skeleton);
        let rightCharacter = GalacticColoniesConfig.instance.characterGroup.rightCharacter.getComponent(sp.Skeleton);

        if (this.stopCompletedReels.length == this.reelNormals.length) {
            dispatchEvent(new CustomEvent(GameStateEvent.all_reel_stopped_spin));
            // GalacticColoniesConfig.instance.winningNode.wayNumberNode.getComponent(RollingNumber).SetTarget(GameData.instance.GetResult().data[0].ways , 0.1);
            GameData.instance.ResetScatterCount();
            for(let i = 0;  i < this.reelNormals.length; i++) { 
                for(let j = 0; j < this.reelNormals[i].node.children.length; j++) {
                    if(this.reelNormals[i].node.children[j].getComponent(Symbol).symbolID == 'PS') {
                        GameData.instance.IncrementScatterCount();
                    }
                }
            }

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
            if(GameData.instance.GetScatterCount()< 4) {
                if(leftCharacter.animation == 'scatter_hit_loop' || leftCharacter.animation == 'scatter_trigger' || leftCharacter.animation == 'scatter_hit') {
                    leftCharacter.animation = 'scatter_failed';
                    rightCharacter.animation = 'scatter_failed';
                    AudioManager.instance.PlayEventSound(GalacticColoniesConfig.instance.sound.nearMissFail);
                    AudioManager.instance.StopEventSound(GalacticColoniesConfig.instance.sound.nearMissAppear);
                }
            }

            if(GameData.instance.GetScatterCount()>= 4 && this.isAnimationTrigger == false) {
                leftCharacter.animation = 'scatter_trigger';
                rightCharacter.animation = 'scatter_trigger';
                AudioManager.instance.PlayEventSound(GalacticColoniesConfig.instance.sound.nearMissSuccess);
                AudioManager.instance.StopEventSound(GalacticColoniesConfig.instance.sound.nearMissAppear);
                this.isAnimationTrigger = true;
            }

            // leftCharacter.setCompleteListener((function(data){
            //     if(data.animation.name == 'scatter_trigger' || data.animation.name == 'scatter_failed'){
            //         leftCharacter.animation = 'idle';
            //         rightCharacter.animation = 'idle';
            //     }
            // }).bind(this))
        }


        
    }

    override ShowScatterVfx () {
        if (this.scatterVfx != null) {
            if (this.isPlayingScatterVfx == false) {
                this.isPlayingScatterVfx = true;
                AudioManager.instance.PlayEventSound(GalacticColoniesConfig.instance.sound.nearMissAppear);
                this.scatterVfx.getComponent(sp.Skeleton).animation = 'intro';
                this.scatterVfx.getComponent(sp.Skeleton).setCompleteListener((function (data) {
                    if (data.animation.name == 'intro') {
                        this.scatterVfx.getComponent(sp.Skeleton).animation = 'loop';
                    }
                }).bind(this))
            }
        }
    }

    override HideScatterVfx () {
        if (this.scatterVfx != null) {
            if (this.scatterVfx.active) {
                if (this.scatterVfx.getComponent(sp.Skeleton).animation == 'loop' || this.scatterVfx.getComponent(sp.Skeleton).animation == 'intro') {
                    this.scatterVfx.getComponent(sp.Skeleton).animation = 'outro';
                    this.scatterVfx.getComponent(sp.Skeleton).setCompleteListener((function (data) {
                        if (data.animation.name == 'outro') {
                            this.scatterVfx.getComponent(sp.Skeleton).animation = 'idle';
                        }
                    }).bind(this))
                }
            }
        }
    }

    ReelDone() {
        this.reelDoneNumber++;
        if(this.reelDoneNumber >= this.indexReel) {
            this.isStop = true;
        }
    }

    ForceStop() {
        this.isForceStop = true;
    }
}


