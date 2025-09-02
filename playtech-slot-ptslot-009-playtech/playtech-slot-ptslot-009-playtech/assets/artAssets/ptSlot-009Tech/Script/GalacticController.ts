import { _decorator, Component, instantiate, Label, Node, sp, Tween, tween, v3} from 'cc';
import Utils from '../../../SlotsCore/Scripts/Util/Utils';
import { GalacticColoniesConfig } from './GalacticColoniesConfig';
import { ReelController } from '../../../SlotsCore/Scripts/Core/ReelController';
import { GalacticReelDropController } from './GalacticReelDropController';
import { GameNetworkResponseEvent, GameState, GameStateAction, GameStateEvent, GameType } from '../../../SlotsCore/Scripts/Model/GameStateData';
import RollingNumber from '../../../SlotsCore/Scripts/UI/RollingNumber';
import GameData from '../../../SlotsCore/Scripts/Model/GameData';
import { Symbol } from '../../../SlotsCore/Scripts/Core/Symbol';
import { CacasdingSymbol } from './CacasdingSymbol';
import AudioManager from 'db://assets/SlotsCore/Scripts/Core/AudioManager';
import TweenUtils from 'db://assets/SlotsCore/Scripts/Util/TweenUtils';
const { ccclass, property } = _decorator;

export enum Direction {
    Up,
    Down,
    Left,
    Right
}

@ccclass('GalacticController')
export class GalacticController extends Component {
    public static instance : GalacticController = null;
    private resumePresenter = false;
    private isMultiply = false;
    private numberOfMultiply = 0;
    private totalNumberOfMultiply = 0;
    private isMultiplierMoving = false;
    private allReelStopSpin = false;

    private leftCharacter = null;
    private rightCharacter = null;

    protected onLoad(): void {
        if(GalacticController.instance == null) {
            GalacticController.instance = this;
        }

        addEventListener('multiplier' , this.Mutliplier.bind(this));
        addEventListener(GameStateEvent.game_state_changed, this.OnGameStateChanged.bind(this));
        addEventListener(GameNetworkResponseEvent.on_Custom_Feature_Data , this.UpdateWildChance.bind(this));
        addEventListener(GameStateEvent.game_initialize , this.SetEventOfCharacter.bind(this));
        addEventListener(GameStateEvent.all_reel_stopped_spin , this.AllReelStopSpin.bind(this));
    }

    AllReelStopSpin() {
        let reelsScatter = ReelController.instance.reelNormals;
        this.allReelStopSpin = true;

        for(let i = 0; i < reelsScatter.length; i++) {
            if(reelsScatter[i].reelScatterNodes.length != 0) {
                for(let j = 0 ; j < reelsScatter[i].reelScatterNodes.length; j++) {
                    if(reelsScatter[i].reelScatterNodes[j].active) {
                        reelsScatter[i].reelScatterNodes[j].getComponent(sp.Skeleton).animation = 'outro';
                    }
                }
            }
        }
    }

    SetEventOfCharacter() {
        this.leftCharacter = GalacticColoniesConfig.instance.characterGroup.leftCharacter.getComponent(sp.Skeleton);
        this.rightCharacter = GalacticColoniesConfig.instance.characterGroup.rightCharacter.getComponent(sp.Skeleton);
        GalacticColoniesConfig.instance.characterGroup.leftCharacter.getComponent(sp.Skeleton).setEventListener((function(data , name) {
            if(name.data.name == 'SFX_Character1') {
                AudioManager.instance.PlayEventSound(GalacticColoniesConfig.instance.sound.CharacterOne);
            }
        }).bind(this))

        GalacticColoniesConfig.instance.characterGroup.rightCharacter.getComponent(sp.Skeleton).setEventListener((function(data , name) {
            if(name.data.name == 'SFX_Character2') {
                AudioManager.instance.PlayEventSound(GalacticColoniesConfig.instance.sound.CharacterTwo);
            }
        }).bind(this))

        this.leftCharacter.setCompleteListener((function(data){
            if(data.animation.name == 'scatter_hit') {
                this.leftCharacter.animation = 'scatter_hit_loop';
                this.rightCharacter.animation = 'scatter_hit_loop';
            } else if(data.animation.name == 'scatter_trigger') {
                this.leftCharacter.animation = 'idle';
                this.rightCharacter.animation = 'idle';
            } else if(data.animation.name == 'scatter_failed') {
                this.leftCharacter.animation = 'idle';
                this.rightCharacter.animation = 'idle';
            } else if(data.animation.name == 'winning') {
                this.leftCharacter.animation = 'idle';
                this.rightCharacter.animation = 'idle';
            }
        }).bind(this))
    }

    UpdateWildChance(customEvent : CustomEvent) {
        let eventDetail = customEvent.detail;
        GalacticColoniesConfig.instance.extraFeature.percentageNode.getComponent(Label).string = eventDetail.featureData.currentChance + '%';
        
        if(eventDetail.featureData.p01MultiplierCount > 0 && eventDetail.featureData.p01MultiplierCount != null) {
            GalacticColoniesConfig.instance.extraFeature.multiplyNumber = eventDetail.featureData.p01MultiplierCount;
            let number = (2*GalacticColoniesConfig.instance.extraFeature.multiplyNumber);
            GalacticColoniesConfig.instance.extraFeature.multiplierBarHolder.getComponentInChildren(Label).string = 'X' + number;
        }
    }

    OnGameStateChanged () {
        if (Utils.CheckCurrentGameState(GameStateAction.enter, GameState.spin)) {
            GalacticColoniesConfig.instance.scatterCount = 0;
            GalacticColoniesConfig.instance.currentWayNumber = 0;
            GalacticColoniesConfig.instance.currentRound = 0;
            this.allReelStopSpin = false;
            TweenUtils.FadeUIOpacity(GalacticColoniesConfig.instance.winningNode.lineWinNode , 0.125 , 0).then((()=>{
                GalacticColoniesConfig.instance.winningNode.lineWinNode.getComponentInChildren(RollingNumber).SetImmediate(0);
                GalacticColoniesConfig.instance.winningNode.lineWinNode.active = false;
            }).bind(this))
        } else if(Utils.CheckCurrentGameState(GameStateAction.enter, GameState.result)) {
            if(GameData.instance.GetNextSpinGameType() == GameType.free_game && GameData.instance.GetCurrentGameType() == GameType.normal_game) {
                AudioManager.instance.PlayEventSound(GalacticColoniesConfig.instance.sound.scatterTrigger);
                for(let i = 0; i < ReelController.instance.reelNormals.length; i++) {
                    for(let j = 0; j < ReelController.instance.reelNormals[i].node.children.length; j++) {
                        if(ReelController.instance.reelNormals[i].node.children[j].getComponent(Symbol).symbolID == "PS") {
                            ReelController.instance.reelNormals[i].node.children[j].getComponent(CacasdingSymbol).PlayAnimation('PS');
                        }
                    }
                }
            } else {
                for(let i = 0; i < ReelController.instance.reelNormals.length; i++) {
                    for(let j = 0; j < ReelController.instance.reelNormals[i].node.children.length; j++) {
                        if(ReelController.instance.reelNormals[i].node.children[j].getComponent(Symbol).symbolID == "PS") {
                            ReelController.instance.reelNormals[i].node.children[j].getComponent(Symbol).LoadIdleAnimation();
                        }
                    }
                }
            }
        } else if(Utils.CheckCurrentGameState(GameStateAction.exit, GameState.spin)) {
            // GalacticColoniesConfig.instance.winningNode.wayNumberNode.getComponent(RollingNumber).SetTarget(GameData.instance.GetResult().data[0].ways , 1);
        }
    }

    async Mutliplier(customEvent : CustomEvent) {
        let eventDetail = customEvent.detail;

        this.resumePresenter = false;

        this.isMultiply = false;

        this.totalNumberOfMultiply = 0;
        this.numberOfMultiply = 0;

        this.isMultiplierMoving = false;

        let playOneRoundSound = false;

        for(let i = 0; i < eventDetail.result.length; i++) {
            for (let j = 0; j < eventDetail.result[i].length; j++) {
                if(eventDetail.result[i][j] == 1) {
                    this.totalNumberOfMultiply++;
                    if(!playOneRoundSound) {
                        AudioManager.instance.PlayEventSound(GalacticColoniesConfig.instance.sound.sfxMultiplierAppear);
                        playOneRoundSound = true;
                    }
                }
            }
        }

        for(let i = 0; i < eventDetail.result.length; i++) {
            for (let j = 0; j < eventDetail.result[i].length; j++) {
                if(eventDetail.result[i][j] == 1) {
                    if(GalacticColoniesConfig.instance.extraFeature.multiplyNumber > 44) {
                        return;
                    }
                    this.MultiplierMoveAnimation(i , j , eventDetail.index);
                    await Utils.WaitForCondition((()=>this.isMultiplierMoving).bind(this))
                    this.isMultiplierMoving = false;
                    if(this.isMultiply == false) {
                        this.isMultiply = true;
                    }
                }
            }
        }


        if(this.isMultiply == false) {
            this.resumePresenter = true;
            dispatchEvent(new CustomEvent('resume'));
        }

        await Utils.WaitForCondition((()=>this.resumePresenter).bind(this))
        dispatchEvent(new CustomEvent('resume'));
        GalacticColoniesConfig.instance.currentRound++;
    }

    MultiplierMoveAnimation(indexI , indexJ , index) {

        let muiltiplierPrefab = instantiate(GalacticColoniesConfig.instance.extraFeature.multiplyPrefab);
        let muiltiplierLabelPrefab = instantiate(GalacticColoniesConfig.instance.extraFeature.multiplyLabelPrefab);

        switch(ReelController.instance.reelNormals[indexI].getComponent(GalacticReelDropController).direction) {
            case Direction.Down :
                muiltiplierPrefab.setParent(GalacticColoniesConfig.instance.extraFeature.multiplyNodeLayer);   
                muiltiplierPrefab.setPosition(v3(ReelController.instance.reelNormals[indexI].node.position.x , ReelController.instance.reelNormals[indexI].node.children[indexJ].position.y , 0))
                muiltiplierLabelPrefab.setParent(GalacticColoniesConfig.instance.extraFeature.multiplyNodeLayer);   
                muiltiplierLabelPrefab.setPosition(v3(ReelController.instance.reelNormals[indexI].node.position.x , ReelController.instance.reelNormals[indexI].node.children[indexJ].position.y , 0))
            break;

            case Direction.Left:
                muiltiplierPrefab.setParent(GalacticColoniesConfig.instance.extraFeature.multiplyNodeTopLayer);
                muiltiplierPrefab.setPosition(v3(ReelController.instance.reelNormals[indexI].node.children[indexJ].position.x , 0 , 0))
                muiltiplierLabelPrefab.setParent(GalacticColoniesConfig.instance.extraFeature.multiplyNodeTopLayer);
                muiltiplierLabelPrefab.setPosition(v3(ReelController.instance.reelNormals[indexI].node.children[indexJ].position.x , 0 , 0))
            break;
        }
        
        muiltiplierLabelPrefab.getComponent(sp.Skeleton).skeletonData = GalacticColoniesConfig.instance.extraFeature.multiplyLabel[GameData.instance.GetResult().sizeArray[index][indexI][indexJ] - 1]
        muiltiplierLabelPrefab.getComponent(sp.Skeleton).loop = false;
        muiltiplierLabelPrefab.getComponent(sp.Skeleton).animation = 'animation';
        muiltiplierLabelPrefab.getComponent(sp.Skeleton).setCompleteListener((function(data) {
            if(data.animation.name == 'animation') {
                muiltiplierLabelPrefab.destroy();
            } 
        }).bind(this));
        muiltiplierLabelPrefab.getComponent(sp.Skeleton).setEventListener((function(data , name) {
            if(name.data.name == 'pop') {
                ReelController.instance.reelNormals[indexI].node.children[indexJ].getComponent(CacasdingSymbol).spineNode.getComponent(sp.Skeleton).animation = 'P01_charged_transition';
                muiltiplierPrefab.getComponent(sp.Skeleton).animation = 'intro';
            }
        }).bind(this))

        ReelController.instance.reelNormals[indexI].node.children[indexJ].getComponent(CacasdingSymbol).spineNode.getComponent(sp.Skeleton).setCompleteListener((function(data) {
            if(data.animation.name == 'P01_charged_transition') {
                ReelController.instance.reelNormals[indexI].node.children[indexJ].getComponent(CacasdingSymbol).spineNode.getComponent(sp.Skeleton).animation = 'P01_idle';
            }
        }).bind(this))

        let prefabWorldPosition = muiltiplierPrefab.worldPosition.clone();
        let multiplierBarHolderWorldPosition = GalacticColoniesConfig.instance.extraFeature.multiplierBarHolder.worldPosition.clone();
        let time = this.getDistance(prefabWorldPosition.x , prefabWorldPosition.y , multiplierBarHolderWorldPosition.x,multiplierBarHolderWorldPosition.y) / 1250;

        setTimeout(() => {
            this.isMultiplierMoving = true;
        }, 500);
        muiltiplierPrefab.getComponent(sp.Skeleton).setCompleteListener((function(data) {
            if(data.animation.name == 'intro') {
                muiltiplierPrefab.getComponent(sp.Skeleton).animation = 'loop';
                
                tween(muiltiplierPrefab)
                .call((()=>{
                    muiltiplierPrefab.setParent(GalacticColoniesConfig.instance.extraFeature.multiplierBarHolder) ,
                    muiltiplierPrefab.setWorldPosition(prefabWorldPosition)
                }).bind(this))
                .to(time, {position : v3(0 , 0 , 0)})
                .call((()=>{
                    muiltiplierPrefab.getComponent(sp.Skeleton).animation = 'outro';
                }).bind(this))
                .start();
            } else if(data.animation.name == 'outro') {
                AudioManager.instance.PlayEventSound(GalacticColoniesConfig.instance.sound.sfxMultiplierHit);
                muiltiplierPrefab.destroy();
                this.AddMultiplier()
            }
        }).bind(this))
    }

    AddMultiplier() {
        if(GalacticColoniesConfig.instance.extraFeature.multiplyNumber == 0) {
            GalacticColoniesConfig.instance.extraFeature.multiplierBarHolder.getComponentInChildren(Label).string = 'X2';
            GalacticColoniesConfig.instance.extraFeature.multiplyNumber++;
            this.numberOfMultiply++;
        } else {
            GalacticColoniesConfig.instance.extraFeature.multiplyNumber++;
            let number = (2*GalacticColoniesConfig.instance.extraFeature.multiplyNumber);
            GalacticColoniesConfig.instance.extraFeature.multiplierBarHolder.getComponentInChildren(Label).string = 'X' + number;
            this.numberOfMultiply++;
        }

        if(this.numberOfMultiply == this.totalNumberOfMultiply) {
            this.resumePresenter = true;
        }
    }

    getDistance(x1: number, y1: number, x2: number, y2: number): number {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }

    ResetSizeArray() {
        GalacticColoniesConfig.instance.sizeArray = [[1,1,1,1,1], [1,1,1,1,1], [1,1,1,1,1], [1,1,1,1,1], [1,1,1,1,1], [1,1,1,1,1], [1,1,1,1]];
    }

}


