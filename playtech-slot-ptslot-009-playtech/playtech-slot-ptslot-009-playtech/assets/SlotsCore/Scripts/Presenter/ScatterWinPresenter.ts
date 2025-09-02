import { _decorator, Button, Component, Label, Node, sp } from 'cc';
import PresenterPrototype from './PresenterPrototype';
import { PresenterDictionary } from '../Model/PresenterDictionary';
import { GameState, GameStateAction, GameStateEvent, GameType } from '../Model/GameStateData';
import GameData, { GameStateInfo } from '../Model/GameData';
import { WinController } from '../Core/WinController';
import Utils from '../Util/Utils';
import { GalacticColoniesConfig } from '../../../artAssets/ptSlot-009Tech/Script/GalacticColoniesConfig';
import { ReelController } from '../Core/ReelController';
import AudioManager from '../Core/AudioManager';
const { ccclass, property } = _decorator;

@ccclass('ScatterWinPresenter')
export class ScatterWinPresenter extends PresenterPrototype {

    @property(Number) presenterIndex : number = 3;
    @property(Number) scatterWinDelaySecond : number = 2;
    @property(Node) featureNode : Node = null;
    @property(sp.Skeleton) featureSpine : sp.Skeleton = null;
    @property(String) featureIntroName : string = "intro";
    @property(String) featureLoopName : string = "loop";
    @property(String) featureExitName : string = "outro";

    private featureOverlayButton: Button = null;
    private isClick = false;
    
    protected onLoad (): void {
        PresenterDictionary.instance.AddPresenter( GameStateAction.enter , GameState.result, this.presenterIndex, this);

        this.featureOverlayButton = this.featureNode.getComponent(Button);
        this.featureNode.on("click", this.ClickEvent.bind(this));

        addEventListener(GameStateEvent.game_initialize, this.Initialize.bind(this));
    }

    protected Initialize () {
        this.Reset();
    }

    Reset () {
        this.featureNode.active = false;
        this.featureOverlayButton.interactable = false;
        if(this.featureSpine){
            this.featureSpine.setCompleteListener(() => {});
        }
        this.isClick = false;
    }

    override CheckTriggerCondition (gameStateInfo: GameStateInfo): boolean {
        // check if entering free spin 
        if (GameData.instance.GetCurrentGameType() == GameType.normal_game && GameData.instance.GetNextSpinGameType() == GameType.free_game) {
            return true;
        } else {
            return false;
        }
    }

    override async RunPresenter () {
        // WinController.instance.ShowScatterWin();
        await Utils.WaitForSeconds(this.scatterWinDelaySecond);

        if (this.featureNode != null) this.featureNode.active = true;

        if (this.featureSpine != null) {
            ReelController.instance.HideScatterVfx();
            AudioManager.instance.PlayEventSound(GalacticColoniesConfig.instance.sound.freespinTransition);
            let resumePresenter = false;
            this.featureOverlayButton.interactable = true;

            // Intro
            this.featureSpine.loop = false;
            this.featureSpine.setCompleteListener((function(data) {
                // set resume presenter to true
                resumePresenter = true;
            }).bind(this));
            this.featureSpine.animation = this.featureIntroName;

            await Utils.WaitForCondition(() => resumePresenter );

            // Loop
            // this.featureSpine.loop = true;
            resumePresenter = false;
            this.featureSpine.animation = this.featureLoopName;
            this.featureSpine.setCompleteListener((function(data) {
                if(data.animation.name == this.featureLoopName)
                resumePresenter = true;
            }).bind(this));
            // this.featureOverlayButton.interactable = true;
            // this.isClick = false;
            await Utils.WaitForCondition((() =>resumePresenter).bind(this));

            // Exit
            this.featureSpine.loop = false;
            resumePresenter = false;

            this.featureSpine.animation = this.featureExitName;
            this.featureSpine.setCompleteListener((function(data) {
                if(data.animation.name == this.featureExitName)
                resumePresenter = true;
            }).bind(this));
            await Utils.WaitForCondition(() => resumePresenter);
            resumePresenter = false;
            GalacticColoniesConfig.instance.extraFeature.multiplierBarHolder.getComponentInChildren(Label).string = "X1";
            GalacticColoniesConfig.instance.extraFeature.multiplyNumber = 0;
            GalacticColoniesConfig.instance.backGroundGroup.backgroundH.getComponent(sp.Skeleton).animation = 'normal_toFeature';
            GalacticColoniesConfig.instance.backGroundGroup.backgroundV.getComponent(sp.Skeleton).animation = 'normal_toFeature';
            AudioManager.instance.PlayEventSound(GalacticColoniesConfig.instance.sound.rockTransition);
            GalacticColoniesConfig.instance.backGroundGroup.backgroundV.getComponent(sp.Skeleton).setCompleteListener((function(data) {
                if(data.animation.name == 'normal_toFeature') {
                    GalacticColoniesConfig.instance.backGroundGroup.rockGroup.active = true;
                    for(let i = 0; i < GalacticColoniesConfig.instance.backGroundGroup.rockGroup.children.length; i++) {
                        GalacticColoniesConfig.instance.backGroundGroup.rockGroup.children[i].getComponent(sp.Skeleton).animation = 'animation';
                    }
                    GalacticColoniesConfig.instance.backGroundGroup.backgroundH.getComponent(sp.Skeleton).animation = 'feature_idle';
                    GalacticColoniesConfig.instance.backGroundGroup.backgroundV.getComponent(sp.Skeleton).animation = 'feature_idle';
                    resumePresenter = true;
                }
            }).bind(this));
            this.Reset();

            await Utils.WaitForCondition(() => resumePresenter);

        }
        else{
            if (this.featureNode != null) this.featureNode.active = false;
        }

        return;
    }

    ClickEvent () {
        this.featureOverlayButton.interactable = false;
        this.isClick = true;
    }
}


