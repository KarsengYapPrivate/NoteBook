import { _decorator, Enum } from 'cc';
import PresenterPrototype, { PresenterOption } from './PresenterPrototype';
import { PresenterDictionary } from '../Model/PresenterDictionary';
import Utils from '../Util/Utils';
import { GameState, GameStateAction, GameType } from '../Model/GameStateData';
import GameData, { GameStateInfo } from '../Model/GameData';
const { ccclass, property } = _decorator;

@ccclass('DelayPresenter')
export class DelayPresenter extends PresenterPrototype {

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

    @property({type: Boolean, visible:function(this:DelayPresenter) {return !this.isGameTypeTransitionDelay;}})
    skipIfNoWinnings: boolean = true;
    @property({type: Boolean, visible:function(this:DelayPresenter) {return !this.isGameTypeTransitionDelay;}})
    skipIfTurboSpin: boolean = true;

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
        if (this.isGameTypeTransitionDelay) {
            return Utils.CheckGameTypeTransition(this.fromGameType, this.toGameType, gameStateInfo);

        } else if (this.skipIfTurboSpin && GameData.instance.IsTurboSpin()) {
            return false;

        } else if (this.skipIfNoWinnings && GameData.instance.GetTotalWinAmount() <= 0) {
            return false;
        }

        return true;
    }

    override async RunPresenter () {
        await Utils.WaitForSeconds(this.GetGameStateDelaySecond());
        return;
    }

    private GetGameStateDelaySecond () {
        let delaySecond = 0;

        if (this.isGameTypeTransitionDelay) {
            delaySecond = Utils.CheckGameTypeTransition(this.fromGameType, this.toGameType, GameData.instance.GetGameStateInfo())?
                            this.delaySecond 
                            : 0;
        } else {
            delaySecond = (this.skipIfTurboSpin && GameData.instance.IsTurboSpin())?
                            0
                            : (this.skipIfNoWinnings && GameData.instance.GetTotalWinAmount() <= 0)?
                                0
                                :this.delaySecond;
        }

        return delaySecond;
    }
}


