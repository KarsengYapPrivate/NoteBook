import { __private, _decorator, Enum, Button } from 'cc';
import { GameState, GameStateAction, UIButtonEvent } from '../../Model/GameStateData';
import { BaseUIComponent, UIGameStateOption } from '../BaseUIComponent';
import GameData, { GameStateInfo } from '../../Model/GameData';
import AudioManager from '../../Core/AudioManager';
const { ccclass, property } = _decorator;

@ccclass('ButtonGameStateOption')
export class ButtonGameStateOption {
    @property(UIGameStateOption) gameStateOption: UIGameStateOption = new UIGameStateOption();

    @property({type: Boolean, tooltip:"On game state above will set button interact to this value"}) 
    enableInteract: boolean = true;
}

@ccclass('BaseButtonScript')
export class BaseButtonScript extends BaseUIComponent {

    @property disableInteractAtStart: boolean = false;
    @property allowOneClickPerEntry: boolean = false;
    @property showButtonInteractOptions: boolean = false;
    
    @property({type: Enum(UIButtonEvent), visible: function(this:BaseButtonScript) {return this.showButtonInteractOptions}})  
    buttonClickEvent: UIButtonEvent = UIButtonEvent.none;
    
    // Enable game states changed to enable / disable button interactable

    @property({type: [ButtonGameStateOption], visible: function(this:BaseButtonScript) {return this.showButtonInteractOptions}})  
    setInteractOnGameStates: ButtonGameStateOption[] = [];

    override Initialize () {
        super.Initialize();

        if (this.disableInteractAtStart) {
            this.targetNode.getComponent(Button).interactable = false;
        }

        if (this.buttonClickEvent != UIButtonEvent.none) {
            this.targetNode.on("click", this.OnClickEvent.bind(this));
        }
    }

    protected onEnable() {
        // removed interactable to prevent unwanted set, to be deleted
        // if (this.allowOneClickPerEntry) this.getComponent(Button).interactable = true;
    }

    OnGameStateChanged(customEvent: CustomEvent) {
        super.OnGameStateChanged(customEvent); // calls parent event handler first

        let eventDetail = customEvent.detail as GameStateInfo;

        // Check to enable interact
        if (this.setInteractOnGameStates.length > 0) {
            for (let i = 0; i < this.setInteractOnGameStates.length; i++) {
                let gameState = this.setInteractOnGameStates[i];

                let isGameStateMatch = gameState.gameStateOption.gameStateAction == eventDetail.currentGameStateAction
                                            && gameState.gameStateOption.gameState == eventDetail.currentGameState;
                let isGameTypeMatch = !gameState.gameStateOption.isAffectedByGameType || gameState.gameStateOption.gameType == eventDetail.currentGameType;
                let isGameSpinTypeMatch = !gameState.gameStateOption.isAffectedByGameSpinType || gameState.gameStateOption.gameSpinType == eventDetail.gameSpinType;
                let isPreviousGameStateMatch = !gameState.gameStateOption.isAffectedByPreviousGameState 
                                                    || (gameState.gameStateOption.previousGameStateAction == eventDetail.previousGameStateAction
                                                        && gameState.gameStateOption.previousGameState == eventDetail.previousGameState);


                if (isGameStateMatch && isGameTypeMatch && isGameSpinTypeMatch && isPreviousGameStateMatch) {
                    this.targetNode.getComponent(Button).interactable = gameState.enableInteract;
                    break;
                }
            }
        }

    }
       
    OnClickEvent(){
        AudioManager.instance?.PlayGeneralBtnSound(this.buttonClickEvent);
        if (this.allowOneClickPerEntry) this.targetNode.getComponent(Button).interactable = false;
        dispatchEvent(new CustomEvent(UIButtonEvent[this.buttonClickEvent]));
    }
}


