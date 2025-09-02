import { _decorator, AudioSource, Button, Component, Label, Node, sp } from 'cc';
import PresenterPrototype from './PresenterPrototype';
import { PresenterDictionary } from '../Model/PresenterDictionary';
import { GameState, GameStateAction, GameStateEvent, GameType } from '../Model/GameStateData';
import GameData, { GameStateInfo } from '../Model/GameData';
import { WinController } from '../Core/WinController';
import Utils from '../Util/Utils';
import RollingNumber from '../UI/RollingNumber';
import AudioManager from '../Core/AudioManager';
import { GalacticColoniesConfig } from '../../../artAssets/ptSlot-009Tech/Script/GalacticColoniesConfig';
const { ccclass, property } = _decorator;

@ccclass('FreeSpinTotalWinPresenter')
export class FreeSpinTotalWinPresenter extends PresenterPrototype {

    @property(Number) presenterIndex : number = 3;
    @property(Number) startDelaySecond : number = 0.5;
    @property(Node) totalWinNode : Node = null;
    @property(sp.Skeleton) totalWinSpine : sp.Skeleton = null;
    @property(String) introAnimationName : string = "intro";
    @property(String) loopAnimationName : string = "loop";
    @property(String) exitAnimationName : string = "outro";
    @property(Number) winAmountDurationSecond : number = 5;
    @property(RollingNumber) winAmountRollingNumber : RollingNumber = null;
    @property(String) FreeSpinTotalWinTransition : string = "transition_sound";

    private overlayButton: Button = null;
    private isClick = false;
    private endCoinSoundPlay = false;
    
    protected onLoad (): void {
        PresenterDictionary.instance.AddPresenter( GameStateAction.enter , GameState.result, this.presenterIndex, this);

        this.overlayButton = this.totalWinNode.getComponent(Button);
        this.totalWinNode.on("click", this.ClickEvent.bind(this));
        
        addEventListener(GameStateEvent.game_initialize, this.Initialize.bind(this));
    }

    protected Initialize () {
        this.Reset();
    }

    Reset () {
        this.totalWinNode.active = false;
        this.overlayButton.interactable = false;
        this.totalWinSpine.setCompleteListener(() => {});
        this.winAmountRollingNumber.node.active = false;
        this.winAmountRollingNumber.SetImmediate(0);
        this.isClick = false;
    }

    override CheckTriggerCondition (gameStateInfo: GameStateInfo): boolean {
        // check if exiting free spin 
        if (GameData.instance.GetCurrentGameType() == GameType.free_game && GameData.instance.GetNextSpinGameType() == GameType.normal_game) {
            return true;
        } else {
            return false;
        }
    }

    override async RunPresenter () {
        this.endCoinSoundPlay = false;

        if (this.startDelaySecond > 0) await Utils.WaitForSeconds(this.startDelaySecond);
        if (this.totalWinNode != null) this.totalWinNode.active = true;

        AudioManager.instance?.PlayFreeSpinTotalWinSfx();
        AudioManager.instance?.PlayCoinCollectSound();

        if (this.totalWinSpine != null) {
            let resumePresenter = false;
            // Intro
            this.totalWinSpine.loop = false;
            this.totalWinSpine.animation = this.introAnimationName;
            this.totalWinSpine.setCompleteListener((function(data) {
                if (data.animation.name == this.introAnimationName) {
                    this.totalWinSpine.loop = true;
                    this.totalWinSpine.setCompleteListener(()=>{});
                    this.totalWinSpine.animation = this.loopAnimationName;
                }
            }).bind(this));
            
            dispatchEvent(new CustomEvent(GameStateEvent.game_free_spin_transition_exit));
            let winAmount = GameData.instance.GetTotalFreeSpinWin();
            this.winAmountRollingNumber.SetImmediate(0);
            this.winAmountRollingNumber.node.active = true;
            if(winAmount > 0) {
                AudioManager.instance.PlayEventSound(GalacticColoniesConfig.instance.sound.coinCountLoop);
                this.winAmountRollingNumber.SetTarget(winAmount, this.winAmountDurationSecond, 0, () => { 
                    resumePresenter = true; 
                    AudioManager.instance.StopEventSound(GalacticColoniesConfig.instance.sound.coinCountLoop);
                    AudioManager.instance.PlayEventSound(GalacticColoniesConfig.instance.sound.coinCountLoopEnd);
                    this.endCoinSoundPlay = true;
                });
            }
            this.overlayButton.interactable = true;

            AudioManager.instance?.StopCoinCollectSound();

            this.isClick = false;
            this.overlayButton.interactable = true;
            await Utils.WaitForCondition((() => this.isClick).bind(this));
            
            this.winAmountRollingNumber.getComponent(RollingNumber).SetImmediate(winAmount);
            if(winAmount > 0 && !this.endCoinSoundPlay) {
                AudioManager.instance.StopEventSound(GalacticColoniesConfig.instance.sound.coinCountLoop);
                AudioManager.instance.PlayEventSound(GalacticColoniesConfig.instance.sound.coinCountLoopEnd);
            }

            // Exit
            this.totalWinSpine.setCompleteListener(()=>{
                resumePresenter = true;
            });
            // this.winAmountRollingNumber.node.active = false;
            this.totalWinSpine.loop = false;
            this.totalWinSpine.animation = this.exitAnimationName;
            AudioManager.instance?.StopFreeSpinTotalWinSfx();
            AudioManager.instance.PlayEventSound(GalacticColoniesConfig.instance.sound.totalWinLoopEnd);
            resumePresenter = false;
            await Utils.WaitForCondition(() => resumePresenter);
            resumePresenter = false;

            GalacticColoniesConfig.instance.backGroundGroup.backgroundH.getComponent(sp.Skeleton).animation = 'feature_toNormal';
            GalacticColoniesConfig.instance.backGroundGroup.backgroundV.getComponent(sp.Skeleton).animation = 'feature_toNormal';
            GalacticColoniesConfig.instance.backGroundGroup.backgroundV.getComponent(sp.Skeleton).setCompleteListener((function(data) {
                if(data.animation.name == 'feature_toNormal') {
                    GalacticColoniesConfig.instance.backGroundGroup.rockGroup.active = false;
                    GalacticColoniesConfig.instance.backGroundGroup.backgroundH.getComponent(sp.Skeleton).animation = 'normal_idle';
                    GalacticColoniesConfig.instance.backGroundGroup.backgroundV.getComponent(sp.Skeleton).animation = 'normal_idle';
                    resumePresenter = true;
                }
            }).bind(this));

            await Utils.WaitForCondition(() => resumePresenter);

            this.Reset();
        }

        return;
    }

    ClickEvent () {
        this.overlayButton.interactable = false;
        this.isClick = true;
    }
}


