import { _decorator, Button, Component, instantiate, Label, Node, Prefab } from 'cc';
import { GameState, GameStateAction, GameStateEvent, UIButtonEvent } from '../Model/GameStateData';
import GameData from '../Model/GameData';
import { BaseButtonScript } from './Button/BaseButtonScript';
import GameMaster from '../Core/GameMaster';
import { AutoSpinButtonScript } from './Button/AutoSpinButtonScript';
import Utils from '../Util/Utils';
import { SpinButtonScript } from './Button/SpinButtonScript';
import { PlaytechIntegration } from '../Network/PlaytechIntegration';
const { ccclass, property } = _decorator;

@ccclass('AutoSpinPanelController')
export class AutoSpinPanelController extends Component {

    public static instance: AutoSpinPanelController = null;

    @property(Prefab) autoSpinAmountButton : Prefab = null;
    @property(Node) autoSpinSelectionLayer : Node = null;
    @property(Node) autoSpinRemainingNumberPanel : Node = null;
    @property(Node) autoSpinButton : Node = null;
    @property(Node) autoSpinPanel : Node = null;
    @property(Node) spinButton : Node = null;
    @property(Node) buyFeatureButton : Node = null;

    protected autoSpinButtonScript: AutoSpinButtonScript = null;

    onLoad(): void {
        if(AutoSpinPanelController.instance == null){
            AutoSpinPanelController.instance = this;
        }

        if (this.autoSpinButton != null) {
            this.autoSpinButtonScript = this.autoSpinButton.getComponent(AutoSpinButtonScript);
        }

        addEventListener(GameStateEvent.game_initialize , this.Init.bind(this));
        addEventListener(GameStateEvent.game_state_changed, this.OnGameStateChange.bind(this));
        addEventListener(GameStateEvent.auto_spin_button_clicked , this.AutoSpinAmountButtonClick.bind(this));
        addEventListener(UIButtonEvent[UIButtonEvent.autoSpin_clicked], this.OnAutoSpinButtonClicked.bind(this));
        addEventListener(UIButtonEvent[UIButtonEvent.auto_spin_start_button_clicked] , this.OnAutoSpinStartButtonClicked.bind(this));
        addEventListener(UIButtonEvent[UIButtonEvent.auto_page_close_clicked] , this.OnAutoPageCloseClicked.bind(this));
        addEventListener(GameStateEvent.reset_spin_button, this.ResetAutoSpinButton.bind(this));
    }

    private Init(){
        for(var i = 0; i < GameData.instance.autoSpinSelection.length; i++){
            let autoSpinButtonPrefab = instantiate(this.autoSpinAmountButton);

            autoSpinButtonPrefab.getComponentInChildren(Label).string = (GameData.instance.autoSpinSelection[i]).toString();

            this.autoSpinSelectionLayer.addChild(autoSpinButtonPrefab);
        }

        this.autoSpinSelectionLayer.children[0].getChildByName('selected').active = true;
    }

    private OnGameStateChange (customEvent: CustomEvent) {
        if (Utils.CheckCurrentGameState(GameStateAction.enter, GameState.idle)) {
            if (GameData.instance.GetAutoSpinRemaining() <= 0 && this.autoSpinButtonScript.IsAutoSpinOn()) {
                this.AutoSpinButtonClose();
            }
        }
    }

    private AutoSpinAmountButtonClick(customEvent: CustomEvent){
        let data = customEvent.detail;

        for(var i = 0; i < this.autoSpinSelectionLayer.children.length; i++){
            if(this.autoSpinSelectionLayer.children[i].getComponentInChildren(Label).string == data){
                this.autoSpinSelectionLayer.children[i].getChildByName('selected').active = true;
            }
            else{
                this.autoSpinSelectionLayer.children[i].getChildByName('selected').active = false;
            }
        }
    }

    private OnAutoSpinStartButtonClicked(){
        // save auto spin data
        for(var i = 0; i < this.autoSpinSelectionLayer.children.length; i++){
            if(this.autoSpinSelectionLayer.children[i].getChildByName('selected').active){
                GameData.instance.SetAutoSpinRemaining(parseInt(this.autoSpinSelectionLayer.children[i].getComponentInChildren(Label).string))
                this.autoSpinRemainingNumberPanel.active = true;
                this.autoSpinRemainingNumberPanel.getComponentInChildren(Label).string = (GameData.instance.GetAutoSpinRemaining()).toString();
            }
        }
        this.autoSpinPanel.active = false;

        dispatchEvent(new CustomEvent(GameStateEvent.set_auto_spin , {detail:{isAutoSpin : true}}));
        let request = {
            _type: "ucip.autoplay.g2wAutoplayStartNotification",
        }
        PlaytechIntegration.instance.SendPostMessage(request);
        
        if (GameData.instance.IsAutoSpin()) {
            this.autoSpinButtonScript?.SetAutoSpinOn();
        }

        GameMaster.instance.StartAutoSpin();
    }

    public DisableAutoSpin () {
        if (GameData.instance.IsAutoSpin()) this.autoSpinButtonScript?.OnClickEvent();
    }

    public AutoSpinButtonClose() {
        // this.autoSpinButtonScript?.SetAutoSpinOn();
        this.autoSpinRemainingNumberPanel.active = false;
        this.autoSpinButtonScript?.SetAutoSpinOff();
    }

    
    public OnAutoSpinButtonClicked (customEvent: CustomEvent) {
        if(GameData.instance.IsAutoSpin()){
            this.autoSpinButtonScript?.SetAutoSpinOff();
            this.autoSpinRemainingNumberPanel.active = false;

            // when disable auto spin but not in enter idle state then disable the button
            if (!Utils.CheckCurrentGameState(GameStateAction.enter, GameState.idle)) {
                this.autoSpinButton.getComponent(Button).interactable = false;

            } else {
                if (this.spinButton != null) {
                    this.spinButton.getComponent(SpinButtonScript).EnableInteract();
                }
                if (this.buyFeatureButton != null) {
                    this.buyFeatureButton.getComponent(Button).interactable = true;
                }
            }

            dispatchEvent(new CustomEvent(GameStateEvent.set_auto_spin , {detail:{isAutoSpin : false}}));
            let request = {
                _type: "ucip.autoplay.g2wAutoplayEndNotification",
            }
            PlaytechIntegration.instance.SendPostMessage(request);
        } else {
            this.autoSpinPanel.active = true;
        }
    }

    public ForceStopAutoPlay () {
        this.autoSpinButtonScript?.SetAutoSpinOff();
        this.autoSpinRemainingNumberPanel.active = false;

        // when disable auto spin but not in enter idle state then disable the button
        if (!Utils.CheckCurrentGameState(GameStateAction.enter, GameState.idle)) {
            this.autoSpinButton.getComponent(Button).interactable = false;
        } else {
            if (this.spinButton != null) {
                this.spinButton.getComponent(SpinButtonScript).EnableInteract();
            }
            if (this.buyFeatureButton != null) {
                this.buyFeatureButton.getComponent(Button).interactable = true;
            }
        }

        dispatchEvent(new CustomEvent(GameStateEvent.set_auto_spin , {detail:{isAutoSpin : false}}));
        let request = {
            _type: "ucip.autoplay.g2wAutoplayEndNotification",
        }
        PlaytechIntegration.instance.SendPostMessage(request);
    }

    private OnAutoPageCloseClicked(customEvent: CustomEvent){
        this.autoSpinPanel.active = false;
    }

    private ResetAutoSpinButton (customEvent: CustomEvent) {
        this.autoSpinButtonScript?.SetAutoSpinOff();
        this.autoSpinRemainingNumberPanel.active = false;
        dispatchEvent(new CustomEvent(GameStateEvent.set_auto_spin , {detail:{isAutoSpin : false}}));
        let request = {
            _type: "ucip.autoplay.g2wAutoplayEndNotification",
        }
        PlaytechIntegration.instance.SendPostMessage(request);
    }
}


