import { __private, _decorator, Color, Component, Node, Sprite, tween, UIOpacity, sp, Enum, Label, UITransform } from 'cc';
import { GameSpinType, GameState, GameStateAction, GameStateEvent, GameType } from '../Model/GameStateData';
import { GameStateInfo } from '../Model/GameData';
import Utils from '../Util/Utils';
import TweenUtils from '../Util/TweenUtils';
const { ccclass, property } = _decorator;

enum ListenGameStateEvent {
    Game_State_Changed,
    Game_State_Changed_Presenter_Completed
}

@ccclass('UIGameStateOption')
export class UIGameStateOption {
    @property({type: Enum(GameStateAction)}) gameStateAction: GameStateAction = GameStateAction.enter;
    @property({type: Enum(GameState)}) gameState: GameState = GameState.idle;

    @property(Boolean) isAffectedByGameType: boolean = false;

    @property({type: Enum(GameType), visible: function(this:UIGameStateOption) {return this.isAffectedByGameType}}) 
    gameType: GameType = GameType.normal_game;

    @property(Boolean) isAffectedByGameSpinType : boolean = false;
    @property({type: Enum(GameSpinType), visible: function(this:UIGameStateOption) {return this.isAffectedByGameSpinType}}) 
    gameSpinType: GameSpinType = GameSpinType.normal_spin;

    @property(Boolean) isAffectedByPreviousGameState : boolean = false;
    @property({type: Enum(GameStateAction), visible: function(this:UIGameStateOption) {return this.isAffectedByPreviousGameState}}) 
    previousGameStateAction: GameStateAction = GameStateAction.enter;
    @property({type: Enum(GameState), visible: function(this:UIGameStateOption) {return this.isAffectedByPreviousGameState}}) 
    previousGameState: GameState = GameState.idle;;


}

@ccclass('BaseUIComponent')
export class BaseUIComponent extends Component {

    @property({type: Enum(ListenGameStateEvent)}) listenOnGameStateChangedEvent = ListenGameStateEvent.Game_State_Changed;

    @property setToInactiveOnStart: boolean = false;
    @property toggleActive: boolean = false;

    @property showActiveOptions: boolean = false;

    // Advanced options for auto toggling
    @property({type: Node, visible: function(this:BaseUIComponent) {return this.showActiveOptions}})  
    protected targetNode: Node = null;

    @property({type: Number, visible: function(this:BaseUIComponent) {return this.showActiveOptions}})  
    fadeInDelaySecond: number = 0.5;
    @property({type: Number, visible: function(this:BaseUIComponent) {return this.showActiveOptions}})  
    fadeInDurationSecond: number = 0.5;
    @property({type: Number, visible: function(this:BaseUIComponent) {return this.showActiveOptions}})
    fadeInOpacity: number = 255;

    @property({type: Number, visible: function(this:BaseUIComponent) {return this.showActiveOptions}})  
    fadeOutDelaySecond: number = 0.5;
    @property({type: Number, visible: function(this:BaseUIComponent) {return this.showActiveOptions}})  
    fadeOutDurationSecond: number = 0.5;
    @property({type: Number, visible: function(this:BaseUIComponent) {return this.showActiveOptions}})
    fadeOutOpacity: number = 0;

    // Enable game states changed to auto call FadeIn / FadeOut

    @property({type: [UIGameStateOption], visible: function(this:BaseUIComponent) {return this.showActiveOptions}})  
    showOnGameStates: UIGameStateOption[] = new Array();

    @property({type: [UIGameStateOption], visible: function(this:BaseUIComponent) {return this.showActiveOptions}})
    hideOnGameStates: UIGameStateOption[] = new Array();

    private targetNodeUIOpacity: UIOpacity = null;
    protected initialized: boolean = false;

    onLoad() { }

    IsInitialized () {
        return this.initialized;
    }

    SetInitialized () {
        this.initialized = true;
    }

    Initialize () {
        if (this.targetNode == null) this.targetNode = this.node;
        this.targetNodeUIOpacity = this.targetNode.getComponent(UIOpacity);

        if (this.setToInactiveOnStart) {
            if (this.targetNodeUIOpacity != null) this.targetNodeUIOpacity.opacity = 0;
            else this.targetNode.active = false;
        }

        if (this.listenOnGameStateChangedEvent == ListenGameStateEvent.Game_State_Changed_Presenter_Completed) {
            addEventListener(GameStateEvent.game_state_presenter_completed, this.OnGameStateChanged.bind(this));
        } else {
            addEventListener(GameStateEvent.game_state_changed, this.OnGameStateChanged.bind(this));
        }
        
    }

    OnGameStateChanged (customEvent: CustomEvent) {
        let eventDetail = customEvent.detail as GameStateInfo;
        
        // Check to show
        if (this.showOnGameStates.length > 0) {
            for (let i = 0; i < this.showOnGameStates.length; i++) {
                let gameState = this.showOnGameStates[i];
                if (gameState.gameStateAction == eventDetail.currentGameStateAction
                    && gameState.gameState == eventDetail.currentGameState
                    && (!gameState.isAffectedByGameType || gameState.gameType == eventDetail.currentGameType)) {
                        let isOpacityActive = this.targetNodeUIOpacity != null && this.targetNodeUIOpacity.opacity >= this.fadeInOpacity;
                        if (!this.targetNode.active || !isOpacityActive) this.FadeIn();
                    break;
                }
            }
        }

        // Check to hide
        if (this.hideOnGameStates.length > 0) {
            for (let i = 0; i < this.hideOnGameStates.length; i++) {
                let gameState = this.hideOnGameStates[i];
                if (gameState.gameStateAction == eventDetail.currentGameStateAction
                    && gameState.gameState == eventDetail.currentGameState
                    && (!gameState.isAffectedByGameType || gameState.gameType == eventDetail.currentGameType)) {
                        let isOpacityActive = this.targetNodeUIOpacity != null && this.targetNodeUIOpacity.opacity >= this.fadeInOpacity;
                        if (this.targetNode.active || isOpacityActive) this.FadeOut();
                    break;
                }
            }
        }
    }

    FadeIn () {
        if (this.targetNodeUIOpacity != null) {
            if (this.toggleActive) this.targetNode.active = true;
            let fadeTween = tween(this.targetNodeUIOpacity);
            if (this.fadeInDelaySecond > 0) fadeTween.delay(this.fadeInDelaySecond);
            fadeTween.to(this.fadeInDurationSecond, { opacity: this.fadeInOpacity });
            fadeTween.start();

        } else { // if dont have opacity component then toggle active instead
            this.targetNode.active = true;
        }
    }

    FadeOut () {
        if (this.targetNodeUIOpacity != null) {
            let fadeTween = tween(this.targetNodeUIOpacity);
            if (this.fadeOutDelaySecond > 0) fadeTween.delay(this.fadeOutDelaySecond);
            fadeTween.to(this.fadeOutDurationSecond, { opacity: this.fadeOutOpacity });
            if (this.toggleActive) fadeTween.call((() => { this.targetNode.active = false; }).bind(this));
            fadeTween.start();

        } else { // if dont have opacity component then toggle active instead
            this.targetNode.active = false;
        }
    }
}


