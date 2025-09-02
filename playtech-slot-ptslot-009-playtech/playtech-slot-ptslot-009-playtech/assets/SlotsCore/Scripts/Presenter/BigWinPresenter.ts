import { _decorator, Button, Node, sp, UIOpacity } from 'cc';
import PresenterPrototype from './PresenterPrototype';
import { GameStateAction, GameState } from '../Model/GameStateData';
import { PresenterDictionary } from '../Model/PresenterDictionary';
import GameData, { GameStateInfo } from '../Model/GameData';
import RollingNumber from '../UI/RollingNumber';
import Utils from '../Util/Utils';
import TweenUtils from '../Util/TweenUtils';
const { ccclass, property } = _decorator;

@ccclass('BigWinPresenter')
export class BigWinPresenter extends PresenterPrototype {

    @property(Number) presenterIndex : number = 2;
    @property(Node) bigWinNode : Node = null;
    @property(Node) bigWinAnimationNode : Node = null;
    @property(Node) totalWinAmountNode : Node = null;
    @property(Node) buttonCollectNode : Node = null;

    @property(Number) showDelaySecond : number = 0;
    @property(Number) showNumberDelaySecond : number = 0;
    @property(Number) numberDurationSecond : number = 0;
    @property(Number) closeBigWinFadeSecond : number = 0;

    private bigWinLevel = 0;
    private isCollectClicked = false;

    protected onLoad(): void {
        PresenterDictionary.instance.AddPresenter( GameStateAction.enter , GameState.result, this.presenterIndex, this);
        this.buttonCollectNode.on('click' , this.CollectClicked.bind(this));
    }

    override CheckTriggerCondition(gameStateInfo: GameStateInfo): boolean {
        if(GameData.instance.GetResult().total_win_amount >= GameData.instance.GetGameBet() * GameData.instance.bigWinLevel[2]){
            return true;
        }
        else{
            return false;
        }
    }

    override async RunPresenter () {
        // delay for N seconds before showing for better presentation
        await Utils.WaitForSeconds(this.showDelaySecond);

        let winAmount = GameData.instance.GetResult().total_win_amount;

        for(var i = 0; i < GameData.instance.bigWinLevel.length; i++){
            if(winAmount >= (GameData.instance.GetGameBet() * GameData.instance.bigWinLevel[i])){
                this.bigWinLevel = i;
                break;
            }
        }

        this.buttonCollectNode.active = false;
        this.totalWinAmountNode.active = false;
        this.bigWinAnimationNode.active = true;
        this.bigWinNode.active = true;

        switch(this.bigWinLevel) {
            case 0 :
                this.bigWinAnimationNode.getComponent(sp.Skeleton).animation = "UltimateWin";
            break;
            case 1 :
                this.bigWinAnimationNode.getComponent(sp.Skeleton).animation = "MegaWin";
            break;
            case 2 :
                this.bigWinAnimationNode.getComponent(sp.Skeleton).animation = "BigWin";
            break;
        }

        await Utils.WaitForSeconds(this.showNumberDelaySecond);

        this.buttonCollectNode.getComponent(Button).interactable = true;
        this.totalWinAmountNode.getComponent(RollingNumber).SetImmediate(0);

        this.buttonCollectNode.active = true;
        this.totalWinAmountNode.active = true;

        let resumePresenter = false;
        this.isCollectClicked = false;
        this.totalWinAmountNode.getComponent(RollingNumber).IncrementTarget(winAmount , this.numberDurationSecond , 0, () => { resumePresenter = true; });
        
        await Utils.WaitForCondition((() => resumePresenter || this.isCollectClicked).bind(this));

        if (!resumePresenter) {
            this.totalWinAmountNode.getComponent(RollingNumber).SetImmediate(winAmount);
        }

        // player have to click again to close the presenter
        this.buttonCollectNode.getComponent(Button).interactable = true;
        this.isCollectClicked = false;
        await Utils.WaitForCondition((() => this.isCollectClicked).bind(this));

        await TweenUtils.FadeUIOpacity(this.bigWinNode, this.closeBigWinFadeSecond);

        this.bigWinNode.active = false;
        this.bigWinNode.getComponent(UIOpacity).opacity = 255;

        return;
    }

    CollectClicked () {
        this.isCollectClicked = true;
        this.buttonCollectNode.getComponent(Button).interactable = false;
    }
}


