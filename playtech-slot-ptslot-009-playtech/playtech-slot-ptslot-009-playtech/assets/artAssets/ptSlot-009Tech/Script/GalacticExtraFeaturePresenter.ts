import { _decorator, Component, Details, Label, Node, sp } from 'cc';
import PresenterPrototype from '../../../SlotsCore/Scripts/Presenter/PresenterPrototype';
import GameData, { GameStateInfo } from '../../../SlotsCore/Scripts/Model/GameData';
import { GalacticColoniesConfig } from './GalacticColoniesConfig';
import Utils from '../../../SlotsCore/Scripts/Util/Utils';
import AudioManager from 'db://assets/SlotsCore/Scripts/Core/AudioManager';
const { ccclass, property } = _decorator;

@ccclass('GalacticExtraFeaturePresenter')
export class GalacticExtraFeaturePresenter extends PresenterPrototype {

    private resumePresenter = false;
    private currentNumber = 0;

    protected onLoad(): void {
        addEventListener('resume', this.ResumePresenter.bind(this));
    }
    override CheckTriggerCondition(gameStateInfo: GameStateInfo): boolean {
        return true;
    }

    override async RunPresenter(): Promise<void> {
        this.resumePresenter = false;
        let result = GameData.instance.GetResult();

        GalacticColoniesConfig.instance.extraFeature.percentageNode.getComponent(Label).string = result.extraFeatureWildChance + '%';
        if (this.currentNumber != result.extraFeatureWildChance) {
            this.currentNumber = result.extraFeatureWildChance;
            GalacticColoniesConfig.instance.extraFeature.percentageNodeAnimation.active = true;
            GalacticColoniesConfig.instance.extraFeature.percentageNodeAnimation.getComponent(sp.Skeleton).animation = 'animation';
            AudioManager.instance.PlayEventSound(GalacticColoniesConfig.instance.sound.consolationIncrease);
            GalacticColoniesConfig.instance.extraFeature.percentageNodeAnimation.getComponent(sp.Skeleton).setCompleteListener((function (data) {
                if (data.animation.name == 'animation') {
                    GalacticColoniesConfig.instance.extraFeature.percentageNodeAnimation.active = false;
                }
            }).bind(this));
        }
        let detail = {
            index: 0,
            result: result.data[0].p01MultiplierArray
        }
        dispatchEvent(new CustomEvent('multiplier', { detail: detail }))

        await Utils.WaitForCondition((() => this.resumePresenter).bind(this))

        return;
    }

    ResumePresenter() {
        this.resumePresenter = true;
    }
}


