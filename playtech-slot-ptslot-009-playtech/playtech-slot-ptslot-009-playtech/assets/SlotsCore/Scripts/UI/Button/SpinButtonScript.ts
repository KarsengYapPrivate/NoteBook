import { _decorator, Button, Component, Enum, KeyCode, Node, Quat, sp, Vec3 } from 'cc';
import { BaseUIComponent, UIGameStateOption } from '../BaseUIComponent';
import { GameState, GameStateAction, GameStateEvent, GameType, UIButtonEvent } from '../../Model/GameStateData';
import { BaseButtonScript, ButtonGameStateOption } from './BaseButtonScript';
import Utils from '../../Util/Utils';
import GameData, { GameStateInfo } from '../../Model/GameData';
import { KeyboardInputHandler } from '../../Input/KeyboardInputHandler';
import AudioManager from '../../Core/AudioManager';
import { PopupOption } from '../../Core/PopupMessageHandler';
import { UIController } from '../UIController';
const { ccclass, property } = _decorator;

@ccclass('SpinButtonScript')
export class SpinButtonScript extends BaseButtonScript {
    
    @property(Number) slowRotateNumber = 0;
    @property(Number) fastRotateNumber = 0;

    @property showButtonInteractOptions: boolean = false;

    @property({type: Enum(UIButtonEvent), visible: function(this:BaseButtonScript) {return this.showButtonInteractOptions}})  
    buttonClickEvent: UIButtonEvent = UIButtonEvent.none;

    @property({type: [ButtonGameStateOption], visible: function(this:BaseButtonScript) {return this.showButtonInteractOptions}})  
    setInteractOnGameStates: ButtonGameStateOption[] = [];

    @property(Node) spinStopButtonNode: Node = null;

    @property(Node) arrow : Node = null;

    @property(Node) spinButton : Node = null;
    @property(Node) freeSpinButton : Node = null;
    @property(Node) freeSpinButtonLabel : Node = null;

    @property(Number) delayRemainSpinLabel : number = 0;

    private rotateSpeed = 0;
    private spinStopButton: Button = null;
    private isResultReady: boolean = false;
    private currentSpinButton : Node = null;

    override Initialize () {
        super.Initialize();
        
        if (this.spinStopButtonNode != null) {
            this.spinStopButton = this.spinStopButtonNode.getComponent(Button);
            this.spinStopButtonNode.on("click", this.OnSpinStopButtonClicked.bind(this));
            this.SetStopButtonActive(false);
        }

        addEventListener(GameStateEvent.keyboard_key_clicked, this.OnKeyboardKeyClicked.bind(this));
        addEventListener(GameStateEvent.all_reel_stopped_spin ,this.StopSpinButton.bind(this));

        this.currentSpinButton = this.spinButton;
    }

    override OnGameStateChanged (customEvent: CustomEvent) {
        let eventDetail = customEvent.detail as GameStateInfo;
        super.OnGameStateChanged(customEvent);

        if (this.node.getComponent(Button).interactable) {
            this.rotateSpeed = this.slowRotateNumber;

        } else {
            this.rotateSpeed = this.fastRotateNumber;
        }

        if (Utils.CheckCurrentGameState(GameStateAction.enter, GameState.spin, eventDetail)) {
            this.TransitionToStopSpine();
            this.SetStopButtonActive(true);
            this.isResultReady = false;
        } else if (Utils.CheckCurrentGameState(GameStateAction.exit, GameState.spin, eventDetail)) {
            this.isResultReady = true;
            if (KeyboardInputHandler.instance?.IsSpacebarDown() && this.spinStopButton.interactable) {
                this.OnSpinStopButtonClicked();
            }
            if(this.freeSpinButton  != null){
                if (Utils.CheckCurrentGameType(GameType.free_game)) {
                    UIController.instance.remainSpinCount.string = (GameData.instance.GetFreeSpinRemaining()).toString();
                }
            }
            
        } else if (Utils.CheckCurrentGameState(GameStateAction.enter, GameState.idle, eventDetail)) {
            if (this.spinButton != null && this.freeSpinButton != null) {
                if (Utils.CheckCurrentGameType(GameType.free_game)) {
                    this.currentSpinButton = this.freeSpinButton;
                    this.freeSpinButton.active = true;
                    if(this.freeSpinButtonLabel)this.freeSpinButtonLabel.active = true;
                    UIController.instance.remainSpinCount.string = (GameData.instance.GetFreeSpinRemaining()).toString();
                    this.spinButton.active = false;
                } else if (Utils.CheckCurrentGameType(GameType.normal_game)) {
                    this.currentSpinButton = this.spinButton;
                    this.spinButton.active = true;
                    if(this.freeSpinButton != null){
                        this.freeSpinButton.active = false;
                    }
                    if(this.freeSpinButtonLabel)this.freeSpinButtonLabel.active = false;
                }
                }
            this.TransitionToPlaySpine();

        } else if (Utils.CheckCurrentGameState(GameStateAction.enter, GameState.result, eventDetail)) {
            if (this.spinButton != null && this.freeSpinButton != null) {
                if (Utils.CheckCurrentGameType(GameType.free_game)) {
                    if (GameData.instance.GetNextSpinGameType() == GameType.normal_game) {
                        this.currentSpinButton = this.spinButton;
                        this.spinButton.active = true;
                        if(this.freeSpinButton != null){
                            this.freeSpinButton.active = false;
                        }
                        if(this.freeSpinButtonLabel)this.freeSpinButtonLabel.active = false;
                    } else {
                        if(this.freeSpinButton != null){
                            this.currentSpinButton = this.freeSpinButton;
                            this.freeSpinButton.active = true;
                        }
                        if(this.freeSpinButtonLabel)this.freeSpinButtonLabel.active = true;
                        this.spinButton.active = false;
                    }
                } else if (Utils.CheckCurrentGameType(GameType.normal_game)) {
                    if (GameData.instance.GetNextSpinGameType() == GameType.free_game) {
                        this.scheduleOnce(((function () {
                            if(this.freeSpinButton != null){
                                this.currentSpinButton = this.freeSpinButton;
                                this.freeSpinButton.active = true;
                            }
                            if(this.freeSpinButtonLabel)this.freeSpinButtonLabel.active = true;
                            GameData.instance.SetFreeSpinRemaining(GameData.instance.GetResult().freeSpins.freeSpinCount);
                            UIController.instance.remainSpinCount.string = (GameData.instance.GetResult().freeSpins.freeSpinCount).toString();
                            this.spinButton.active = false;
                        }).bind(this)), this.delayRemainSpinLabel)
                    } else {
                        this.currentSpinButton = this.spinButton;
                        this.spinButton.active = true;
                        if(this.freeSpinButton != null){
                            this.freeSpinButton.active = false;
                        }
                        if(this.freeSpinButtonLabel)this.freeSpinButtonLabel.active = false;
                    }
                }
            }
            this.SetStopButtonActive(false);
        }
    }

    override OnClickEvent () {
        if (this.IsSpinButtonInteractable()) {
            if (this.allowOneClickPerEntry) this.DisableInteract();
            AudioManager.instance?.PlayGeneralBtnSound(this.buttonClickEvent);
            dispatchEvent(new CustomEvent(UIButtonEvent[this.buttonClickEvent]));
        }
    }

    OnKeyboardKeyClicked (customEvent: CustomEvent) {
        let eventDetail = customEvent.detail;
        let keyCode = eventDetail.keyCode;

        switch (keyCode) {
            case KeyCode.SPACE: {
                if (this.IsSpinButtonInteractable()) {
                    this.OnClickEvent();
                } else if (this.spinStopButton.interactable) {
                    this.OnSpinStopButtonClicked();
                }
                break;
            }
        }
    }

    update(dt: number){
        let rotateAnimation = this.rotateSpeed * dt;
        
        this.arrow.rotate(new Quat(this.node.getRotation().x,this.node.getRotation().y,this.node.getRotation().z - rotateAnimation ,this.node.getRotation().w));
    }

    TransitionToStopSpine () {
        this.currentSpinButton.getComponent(sp.Skeleton).setCompleteListener((function(data) {
            if(data.animation.name == "intro") {
                this.currentSpinButton.getComponent(sp.Skeleton).animation = "loop";
            }
        }).bind(this));
        
        if (this.currentSpinButton.getComponent(sp.Skeleton).findAnimation("intro") != null) {
            this.currentSpinButton.getComponent(sp.Skeleton).animation = "intro";
        }
    }

    TransitionToPlaySpine () {
        this.currentSpinButton.getComponent(sp.Skeleton).setCompleteListener((function(data) {
            if(data.animation.name == "outro"){
                this.currentSpinButton.getComponent(sp.Skeleton).animation = "idle";
            }
        }).bind(this));

        if (this.currentSpinButton.getComponent(sp.Skeleton).findAnimation("outro") != null) {
            this.currentSpinButton.getComponent(sp.Skeleton).animation = "outro";
        }
    }

    OnSpinStopButtonClicked () {
        if (this.isResultReady) {
            this.isResultReady = false; // prevent double call
            this.SetStopButtonActive(false);
            AudioManager.instance?.PlayGeneralBtnSound(this.buttonClickEvent);
            dispatchEvent(new CustomEvent(UIButtonEvent[UIButtonEvent.spin_stop_clicked]));
        }
    }

    EnableInteract () {
        this.node.getComponent(Button).interactable = true;
        this.rotateSpeed = this.slowRotateNumber;
    }

    DisableInteract () {
        this.node.getComponent(Button).interactable = false;
        this.rotateSpeed = this.fastRotateNumber;
    }

    IsSpinButtonInteractable () {
        return this.node.getComponent(Button).interactable;
    }

    private SetStopButtonActive (active: boolean) {
        if (this.spinStopButtonNode != null) this.spinStopButtonNode.active = active;
        if (this.spinStopButton != null) this.spinStopButton.interactable = active;
    }

    private StopSpinButton() {
        this.SetStopButtonActive(false);
    }
}


