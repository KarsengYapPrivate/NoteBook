import { _decorator, Component, Node } from 'cc';
import PresenterPrototype from './PresenterPrototype';
import { UIController } from '../UI/UIController';
import GameData, { GameStateInfo } from '../Model/GameData';
import { GameStateAction, GameState, GameType } from '../Model/GameStateData';
import { PresenterDictionary } from '../Model/PresenterDictionary';
const { ccclass, property } = _decorator;

@ccclass('FreeSpinUIControlPresenter')
export class FreeSpinUIControlPresenter extends PresenterPrototype {
    @property(Number) presenterIndex : number = 1;

    onLoad(){
        PresenterDictionary.instance.AddPresenter(GameStateAction.enter , GameState.spin, this.presenterIndex, this);
    }

    public CheckTriggerCondition(gameStateInfo: GameStateInfo): boolean {
        let gameData = GameData.instance.GetResult()
        let trigger = false;
        if(GameData.instance.GetCurrentGameType() == GameType.free_game){
        //if(gameData?.is_FreeSpin){
            trigger = true;
        }
        return trigger;
    }

    public async RunPresenter(): Promise<void> {
        let remainSpin = GameData.instance.GetFreeSpinRemaining() - 1;
        UIController.instance.remainSpinCount.string = (remainSpin).toString();

        return;
    }
}


