import { _decorator, Component, Enum, Node } from 'cc';
import PresenterPrototype, { PresenterOption } from './PresenterPrototype';
import GameData, { GameStateInfo } from '../Model/GameData';
import { GameStateAction, GameState, GameType } from '../Model/GameStateData';
import { PresenterDictionary } from '../Model/PresenterDictionary';
import Utils from '../Util/Utils';
import { DelayPresenter } from './DelayPresenter';
const { ccclass, property } = _decorator;

@ccclass('DelayOnAutoSpinPresenter')
export class DelayOnAutoSpinPresenter extends PresenterPrototype {
    // override parent presenterOption and use custom option
    @property({visible: false}) presenterOption: PresenterOption = null;

    @property(Number) presenterIndex: number = 0;
    @property(Boolean) isGameTypeTransitionDelay = false;

    @property({type: Enum(GameStateAction), readonly: true, visible:function(this:DelayPresenter) {return this.isGameTypeTransitionDelay;}}) 
    transitionGameStateAction: GameStateAction = GameStateAction.enter;
    @property({type: Enum(GameState), readonly: true, visible:function(this:DelayPresenter) {return this.isGameTypeTransitionDelay;}}) 
    transitionGameState: GameState = GameState.idle;

    @property({type: Enum(GameType), visible:function(this:DelayPresenter) {return this.isGameTypeTransitionDelay;}}) 
    fromGameType: GameType = GameType.normal_game;
    @property({type: Enum(GameType), visible:function(this:DelayPresenter) {return this.isGameTypeTransitionDelay;}})
    toGameType: GameType = GameType.free_game;

    @property({type: Enum(GameStateAction), visible:function(this:DelayPresenter) {return !this.isGameTypeTransitionDelay;}}) 
    gameStateAction: GameStateAction = GameStateAction.enter;
    @property({type: Enum(GameState), visible:function(this:DelayPresenter) {return !this.isGameTypeTransitionDelay;}}) 
    gameState: GameState = GameState.idle;

    @property(Number) delaySecond: number = 1;

    // override parent AddPresenterToDictionary to do additional check and add presenter accordingly
    override AddPresenterToDictionary () {
        if (this.isGameTypeTransitionDelay) {
            PresenterDictionary.instance.AddPresenter(this.transitionGameStateAction, this.transitionGameState, this.presenterIndex, this);
        } else {
            PresenterDictionary.instance.AddPresenter(this.gameStateAction, this.gameState, this.presenterIndex, this);
        }
    }

    override CheckTriggerCondition(gameStateInfo: GameStateInfo): boolean {
        if (GameData.instance.IsAutoSpin() || GameData.instance.IsFreeSpinOn() && GameData.instance.GetResult() != null && GameData.instance.GetResult().data?.length > 0) {
            return true;
        } else {
            return false;
        }
    }

    override async RunPresenter () {
        await Utils.WaitForSeconds(this.GetGameStateDelaySecond());
        return;
    }

    private GetGameStateDelaySecond () {
        let delaySecond = 0;

        delaySecond = this.delaySecond;

        return delaySecond;
    }
}


