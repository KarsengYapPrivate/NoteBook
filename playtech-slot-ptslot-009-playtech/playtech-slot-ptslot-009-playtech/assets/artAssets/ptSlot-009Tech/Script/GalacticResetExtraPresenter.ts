import { _decorator, Component, Label, Node } from 'cc';
import PresenterPrototype from '../../../SlotsCore/Scripts/Presenter/PresenterPrototype';
import GameData, { GameStateInfo } from '../../../SlotsCore/Scripts/Model/GameData';
import { GalacticColoniesConfig } from './GalacticColoniesConfig';
import { GameType } from '../../../SlotsCore/Scripts/Model/GameStateData';
const { ccclass, property } = _decorator;

@ccclass('GalacticResetExtraPresenter')
export class GalacticResetExtraPresenter extends PresenterPrototype {
    override CheckTriggerCondition(gameStateInfo: GameStateInfo): boolean {
        let trigger = false;
        if(GameData.instance.GetCurrentGameType() == GameType.normal_game) {
            trigger = true;
        }

        return trigger;
    }

    override async RunPresenter(): Promise<void> {
        GalacticColoniesConfig.instance.extraFeature.multiplierBarHolder.getComponentInChildren(Label).string = "X1";
        GalacticColoniesConfig.instance.extraFeature.multiplyNumber = 0;
        // GalacticColoniesConfig.instance.winningNode.wayNumberNode.getComponent(Label).string = "0";

        return;
    }
}


