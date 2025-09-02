import { _decorator, Node, sp, UIOpacity } from 'cc';
import PresenterPrototype from './PresenterPrototype';
import { GameStateAction, GameState, GameStateEvent } from '../Model/GameStateData';
import GameData, { GameStateInfo } from '../Model/GameData';
import { PresenterDictionary } from '../Model/PresenterDictionary';
import Utils from '../Util/Utils';
import { Reel } from '../Core/Reel';
import { ReelController } from '../Core/ReelController';
import { WinController } from '../Core/WinController';
import TweenUtils from '../Util/TweenUtils';
import AudioManager from '../Core/AudioManager';
const { ccclass, property } = _decorator;

@ccclass('FiveOfAKindPresenter')
export class FiveOfAKindPresenter extends PresenterPrototype {

    @property(Number) presenterIndex : number = 1;
    @property(Node) fiveOfAKindNode : Node = null;
    @property(Node) skipButton : Node = null;
    @property(String) fiveOfAKindString : string = "animation";
    @property(Number) fadeOutSecond : number = 0;
    @property(Boolean) isSkipAbleToOutro : boolean = false;

    private reels: Reel[] = [];
    private isClick = false;
    private resumePresenter = false;

    onLoad(){
        PresenterDictionary.instance.AddPresenter(GameStateAction.enter , GameState.result, this.presenterIndex, this);
        if(this.isSkipAbleToOutro) {
            this.skipButton.on('click',this.ClickEvent.bind(this));
        }

        addEventListener(GameStateEvent.game_initialize, this.Initialize.bind(this));
    }

    private Initialize () {
        this.reels = ReelController.instance.GetAllReels();
    }

    override CheckTriggerCondition(gameStateInfo: GameStateInfo): boolean {
        
        // no need to check for gameStateAction, gameState, and gameType because this presenter is only added into ENTER RESULT
        if(GameData.instance.GetAllOfAKind()){
            return true;
        }    
        return false;
    }

    override async RunPresenter () {

        let winLines = [];
        for(var i = 0; i < GameData.instance.GetResult().data.length; i++){
            if(GameData.instance.GetResult().data[i].count == 5){
                winLines.push(GameData.instance.GetResult().data[i]);
            }
        }

        this.fiveOfAKindNode.active = true;
        this.resumePresenter = false;
        this.isClick = false;
        AudioManager.instance.PlayFiveOfAKindSound();
        this.fiveOfAKindNode.getComponentInChildren(sp.Skeleton).animation = 'intro';
        this.fiveOfAKindNode.getComponentInChildren(sp.Skeleton).setCompleteListener((function(data) {
            if(data.animation.name == 'intro'){
                this.fiveOfAKindNode.getComponentInChildren(sp.Skeleton).animation = 'loop';
                this.skipButton.active = true;
            } else if (data.animation.name == 'loop') {
                this.resumePresenter = true;
            }
        }).bind(this));

        // show 5-of-a-kind symbol animation and highlight animation
        WinController.instance.ShowAllFiveOfAKind();

        await Utils.WaitForCondition((() => this.resumePresenter || this.isClick).bind(this));
        this.resumePresenter = false;
        this.isClick = false;
        this.fiveOfAKindNode.getComponentInChildren(sp.Skeleton).animation = 'outro'; 
        this.fiveOfAKindNode.getComponentInChildren(sp.Skeleton).setCompleteListener((function(data) {
            if(data.animation.name == 'outro'){
                this.resumePresenter = true;
                AudioManager.instance.StopFiveOfAKindSound();
            }
        }).bind(this));

        await Utils.WaitForCondition((() => this.resumePresenter).bind(this));


        // await TweenUtils.FadeUIOpacity(this.fiveOfAKindNode, this.fadeOutSecond);

        this.fiveOfAKindNode.active = false;

        return;
    }

    ClickEvent(){
        this.isClick = true;
        this.skipButton.active = false;
    }
}


