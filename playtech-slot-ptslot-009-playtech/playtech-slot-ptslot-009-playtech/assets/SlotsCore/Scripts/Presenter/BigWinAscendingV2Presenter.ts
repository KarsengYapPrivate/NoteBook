import { _decorator, Button, Component, Node, sp } from 'cc';
import PresenterPrototype from './PresenterPrototype';
import GameData, { GameStateInfo } from '../Model/GameData';
import Utils from '../Util/Utils';
import RollingNumber from '../UI/RollingNumber';
import AudioManager from '../Core/AudioManager';
import { GalacticColoniesConfig } from 'db://assets/artAssets/ptSlot-009Tech/Script/GalacticColoniesConfig';
const { ccclass, property } = _decorator;

@ccclass ('BigWinClip') 
class BigWinClip {
    @property(String) animationName : string = '';
    @property(Boolean) canSkipAnimationClip : boolean = false;
    @property(String) animationSound : string = '';
}

@ccclass ('BigWinClipObject')
class BigWinClipObject {
    @property([BigWinClip]) animationQueue : BigWinClip [] = [];
    @property({type : Number , visible : false}) rollingNumberDuration : number = 0;
}

@ccclass('BigWInAscendingV2Presenter')
export class BigWInAscendingV2Presenter extends PresenterPrototype {
    @property(Boolean) isAscendingBigWin : boolean = false;
    @property({type : [BigWinClipObject] , visible:function(this:BigWInAscendingV2Presenter){return this.isAscendingBigWin}}) bigWinTier : BigWinClipObject[] = [];
    @property(Boolean) skipToFinal : boolean = false;

    @property(Node) bigWinNode : Node = null;
    @property(Node) bigWinSpine : Node = null;
    @property(Node) bigWinNumber : Node = null;
    @property(Node) buttonCollectNode : Node = null;
    @property(Boolean) isNeedShow : boolean = false;

    private resumePresenter = false;
    private isCollectClicked = false;
    private level = 0;
    private animationCurrentLevel = 0;
    private maxI = 0;
    private currentMusic : string = '';
    private endCoinSoundPlay = false;

    protected onLoad(): void {
        this.buttonCollectNode.on('click' , this.CollectClicked.bind(this));
    }

    override CheckTriggerCondition(gameStateInfo: GameStateInfo): boolean {
        let trigger = false;

        if(GameData.instance.GetResult().total_win_amount >= GameData.instance.GetGameBet() * GameData.instance.bigWinLevel[0]){
            trigger = true;
        }

        return trigger;
    }

    override async RunPresenter(): Promise<void> {

        this.resumePresenter = false;
        this.endCoinSoundPlay = false;
        let winAmount = GameData.instance.GetResult().total_win_amount;
        this.level = 0;
        this.animationCurrentLevel = 0;
        let i = 0;
        this.currentMusic = '';

        for(let i = 0; i < GameData.instance.bigWinLevel.length; i++) {
            if(winAmount >= GameData.instance.GetGameBet() * GameData.instance.bigWinLevel[i]) {
                this.level = i;
            }
        }
        // Ascending
        if (this.isAscendingBigWin) {

            // Intro and loop state

            this.maxI = this.bigWinTier[this.level].animationQueue.length;

            let animations = this.bigWinSpine.getComponent(sp.Skeleton).skeletonData.getRuntimeData().animations;
        
            for(let i = 0; i < this.bigWinTier[this.level].animationQueue.length; i++) {
                for(let j = 0; j < animations.length; j++) {
                    if(this.bigWinTier[this.level].animationQueue[i].animationName == animations[j].name) {
                        this.bigWinTier[this.level].rollingNumberDuration =  this.bigWinTier[this.level].rollingNumberDuration + animations[j].duration
                    }
                }
            }
            if(this.isNeedShow) {
                console.log('bigWin All Animation Amount Time' , this.bigWinTier[this.level].rollingNumberDuration);
            }

            this.bigWinNode.active = true;
            AudioManager.instance.PlayEventSound(GalacticColoniesConfig.instance.sound.coinCountLoop);
            this.bigWinNumber.getComponent(RollingNumber).SetTarget(winAmount, this.bigWinTier[this.level].rollingNumberDuration, 0, (() => {
                AudioManager.instance.StopEventSound(GalacticColoniesConfig.instance.sound.coinCountLoop);
                AudioManager.instance.PlayEventSound(GalacticColoniesConfig.instance.sound.coinCountLoopEnd);
                this.endCoinSoundPlay = true;
                this.resumePresenter = true;
            }).bind(this));

            this.bigWinSpine.getComponent(sp.Skeleton).animation = this.bigWinTier[this.level].animationQueue[this.animationCurrentLevel].animationName;
            if(this.bigWinTier[this.level].animationQueue[this.animationCurrentLevel].animationSound != '') {
                AudioManager.instance.PlayEventSound(this.bigWinTier[this.level].animationQueue[this.animationCurrentLevel].animationSound);
                this.currentMusic = this.bigWinTier[this.level].animationQueue[this.animationCurrentLevel].animationSound;
            }
            this.bigWinSpine.getComponent(sp.Skeleton).setCompleteListener((function (data) {
                if (data.animation.name == this.bigWinTier[this.level].animationQueue[this.animationCurrentLevel].animationName) {
                    if (this.animationCurrentLevel < this.maxI - 2) {
                        this.animationCurrentLevel++;
                        this.bigWinSpine.getComponent(sp.Skeleton).animation = this.bigWinTier[this.level].animationQueue[this.animationCurrentLevel].animationName;
                        if(this.bigWinTier[this.level].animationQueue[this.animationCurrentLevel].animationSound != '') {
                            AudioManager.instance.StopEventSound(this.currentMusic);
                            AudioManager.instance.PlayEventSound(this.bigWinTier[this.level].animationQueue[this.animationCurrentLevel].animationSound);
                            this.currentMusic = this.bigWinTier[this.level].animationQueue[this.animationCurrentLevel].animationSound;
                        }
                    }
                }
            }).bind(this))
        } else {
            this.bigWinNode.active = true;
            AudioManager.instance.PlayEventSound(GalacticColoniesConfig.instance.sound.coinCountLoop);
            this.bigWinNumber.getComponent(RollingNumber).SetTarget(winAmount, this.bigWinTier[this.level].rollingNumberDuration, 0, (() => {
                AudioManager.instance.PlayEventSound(GalacticColoniesConfig.instance.sound.coinCountLoopEnd);
                AudioManager.instance.StopEventSound(GalacticColoniesConfig.instance.sound.coinCountLoop);
                this.endCoinSoundPlay = true;
                this.resumePresenter = true;
            }).bind(this));

            switch(this.level) {
                case 0:
                    this.bigWinSpine.getComponent(sp.Skeleton).setAnimation(0 , 'bigWin1_intro' , false);
                    this.bigWinSpine.getComponent(sp.Skeleton).addAnimation(0 , 'bigWin1_loop' , true);
                break;

                case 1:
                    this.bigWinSpine.getComponent(sp.Skeleton).setAnimation(0 , 'bigWin2_intro' , false);
                    this.bigWinSpine.getComponent(sp.Skeleton).addAnimation(0 , 'bigWin2_loop' , true);
                break;

                case 2:
                    this.bigWinSpine.getComponent(sp.Skeleton).setAnimation(0 , 'bigWin3_intro' , false);
                    this.bigWinSpine.getComponent(sp.Skeleton).addAnimation(0 , 'bigWin3_loop' , true);
                break;
            }
        }

        await Utils.WaitForCondition((() => this.resumePresenter || this.isCollectClicked).bind(this));

        // Outro state
        this.resumePresenter = false;
        this.isCollectClicked = false;

        if(this.isAscendingBigWin) {
            this.bigWinNumber.getComponent(RollingNumber).SetImmediate(winAmount);
            if(!this.endCoinSoundPlay) {
                AudioManager.instance.PlayEventSound(GalacticColoniesConfig.instance.sound.coinCountLoopEnd);
                AudioManager.instance.StopEventSound(GalacticColoniesConfig.instance.sound.coinCountLoop);
            }

            this.bigWinSpine.getComponent(sp.Skeleton).animation = this.bigWinTier[this.level].animationQueue[this.maxI-1].animationName;
            if(this.bigWinTier[this.level].animationQueue[this.maxI-1].animationSound != '') {
                AudioManager.instance.StopEventSound(this.currentMusic);
                AudioManager.instance.PlayEventSound(this.bigWinTier[this.level].animationQueue[this.maxI-1].animationSound);
                this.currentMusic = this.bigWinTier[this.level].animationQueue[this.maxI-1].animationSound;
            }
            this.bigWinSpine.getComponent(sp.Skeleton).setCompleteListener((function(data) {
                if(data.animation.name == this.bigWinTier[this.level].animationQueue[this.maxI-1].animationName) {
                    this.Reset();
                    this.bigWinNode.active = false;
                    this.resumePresenter = true;
                    AudioManager.instance.StopEventSound(this.currentMusic);
                }
            }).bind(this))
        } else {
            this.bigWinNumber.getComponent(RollingNumber).SetImmediate(winAmount);
            if(!this.endCoinSoundPlay) {
                AudioManager.instance.PlayEventSound(GalacticColoniesConfig.instance.sound.coinCountLoopEnd);
                AudioManager.instance.StopEventSound(GalacticColoniesConfig.instance.sound.coinCountLoop);
            }

            switch(this.level) {
                case 0:
                    this.bigWinSpine.getComponent(sp.Skeleton).setAnimation(0 , 'bigWin1_outro' , false);
                break;

                case 1:
                    this.bigWinSpine.getComponent(sp.Skeleton).setAnimation(0 , 'bigWin2_outro' , false);
                break;

                case 2:
                    this.bigWinSpine.getComponent(sp.Skeleton).setAnimation(0 , 'bigWin3_outro' , false);
                break;
            }

            this.bigWinSpine.getComponent(sp.Skeleton).setCompleteListener((function(data) {
                if(data.animation.name == 'bigWin' + (this.level + 1).toString() + '_outro') {
                    this.Reset();
                    this.bigWinNode.active = false;
                    this.resumePresenter = true;
                }
            }).bind(this))
        }
        
        await Utils.WaitForCondition((() => this.resumePresenter).bind(this));
        AudioManager.instance.UnDimBGM();
        return;
    }

    CollectClicked() {
        if(this.skipToFinal) {
            this.isCollectClicked = true;
            this.buttonCollectNode.getComponent(Button).interactable = false;
        } else if(this.bigWinTier[this.level].animationQueue[this.animationCurrentLevel].canSkipAnimationClip) {
            this.SkipOneAnimation();
        }
    }

    SkipOneAnimation() {
        if(this.animationCurrentLevel == this.maxI - 2) {
            this.isCollectClicked = true;
            this.buttonCollectNode.getComponent(Button).interactable = false;
            return;
        }
        else if(this.bigWinTier[this.level].animationQueue[this.animationCurrentLevel].canSkipAnimationClip) {
            this.animationCurrentLevel = this.animationCurrentLevel + 1;
            this.bigWinSpine.getComponent(sp.Skeleton).animation = this.bigWinTier[this.level].animationQueue[this.animationCurrentLevel].animationName;
            if(this.bigWinTier[this.level].animationQueue[this.animationCurrentLevel].animationSound != '') {
                AudioManager.instance.StopEventSound(this.currentMusic);
                AudioManager.instance.PlayEventSound(this.bigWinTier[this.level].animationQueue[this.animationCurrentLevel].animationSound);
                this.currentMusic = this.bigWinTier[this.level].animationQueue[this.animationCurrentLevel].animationSound;
            }
        }
    }

    Reset() {
        this.buttonCollectNode.getComponent(Button).interactable = true;
        this.bigWinNumber.getComponent(RollingNumber).SetImmediate(0);
    }
}


