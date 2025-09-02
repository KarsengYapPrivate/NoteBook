import { _decorator, Button, Color, Component, Node, Sprite, UIOpacity, Vec3, tween, screen, Label, director, log, PageView } from 'cc';
import { GameSpinType, GameState, GameStateAction, GameStateEvent, GameType, UIButtonEvent } from '../Model/GameStateData';
import GameMaster from '../Core/GameMaster';
import GameData, { GameStateInfo } from '../Model/GameData';
import { BaseButtonScript } from './Button/BaseButtonScript';
import Utils from '../Util/Utils';
import { BaseUIComponent } from './BaseUIComponent';
import { PopupOption } from '../Core/PopupMessageHandler';
import { AssetManager } from '../Core/AssetManager';
import { SpinButtonScript } from './Button/SpinButtonScript';
import GameConfig from '../Model/GameConfig';
const { ccclass, property } = _decorator;

@ccclass('UIController')
export class UIController extends Component {

    public static instance: UIController = null;

    @property(Node) spinButton : Node = null;
    @property(Node) infoButton : Node = null;
    @property(Node) rulePageMenu : Node = null;
    @property(Node) buyFreeSpinButton : Node = null;
    @property(Node) buyFreeSpinPanel : Node = null;
    @property(Node) buyFreeSpinConfirmationPopup : Node = null;
    // @property(Node) menuPanel : Node = null;
    // @property(Node) menuPanelButtons : Node [] = [];
    @property(Node) maxFullscreenButton : Node = null;
    @property(Node) minFullscreenButton : Node = null;
    @property(Node) onSoundButton : Node = null;
    @property(Node) offSoundButton : Node = null;
    @property(Node) exitMenuPopupPanel : Node = null;
    @property(Label) remainSpinCount : Label = null;
    @property(Node) historyButton: Node = null;
    @property(Node) supportButton: Node = null;
    @property(Node) cashierButton: Node = null;
    @property(Node) lobbyButton: Node = null;
    @property(Node) logoutButton: Node = null;
    @property(Node) rtpLabel : Node []= [];
    @property(Node) totalWinLabel : Node = null;

    private fullscreenMode = false;
    private isSoundOn = true;
    public pageView = null;

    public currentLineBet = 0;

    onLoad () {
        if (UIController.instance == null) {
            UIController.instance = this;
        }

        let uiComponents: BaseUIComponent[] = director.getScene().getComponentsInChildren(BaseUIComponent);
        for (let i = 0; i < uiComponents.length; i++) {
            let uiComponent = uiComponents[i];
            if (!uiComponent.IsInitialized()) {
                uiComponent.Initialize();
                uiComponent.SetInitialized();
            }
        }

        addEventListener(GameStateEvent.game_initialize, this.OnGameInitialize.bind(this));

        addEventListener(UIButtonEvent[UIButtonEvent.spin_clicked], this.OnSpinButtonClicked.bind(this));
        addEventListener(UIButtonEvent[UIButtonEvent.spin_stop_clicked], this.OnSpinStopButtonClicked.bind(this));
        addEventListener(UIButtonEvent[UIButtonEvent.turboMode_clicked], this.OnTurboSpinButtonClicked.bind(this));
        addEventListener(UIButtonEvent[UIButtonEvent.increase_lineBet_clicked], this.OnIncreaseLineBetClicked.bind(this));
        addEventListener(UIButtonEvent[UIButtonEvent.decrease_lineBet_clicked], this.OnDecreaseLineBetClicked.bind(this));
        addEventListener(UIButtonEvent[UIButtonEvent.increase_buy_free_spin_bet_clicked], this.OnIncreaseBuyFreeSpinBetClicked.bind(this));
        addEventListener(UIButtonEvent[UIButtonEvent.decrease_buy_free_spin_bet_clicked], this.OnDecreaseBuyFreeSpinBetClicked.bind(this));
        addEventListener(UIButtonEvent[UIButtonEvent.sound_clicked], this.OnSoundButtonClicked.bind(this));
        addEventListener(UIButtonEvent[UIButtonEvent.rule_page_clicked], this.OnRulePageClicked.bind(this));
        addEventListener(UIButtonEvent[UIButtonEvent.rule_page_close_clicked], this.OnRulePageCloseClicked.bind(this));
        addEventListener(UIButtonEvent[UIButtonEvent.open_buy_free_spin_panel_clicked], this.OnOpenBuyFreeSpinPanelClicked.bind(this));
        addEventListener(UIButtonEvent[UIButtonEvent.close_buy_free_spin_panel_clicked], this.OnCloseBuyFreeSpinPanelClicked.bind(this));
        addEventListener(UIButtonEvent[UIButtonEvent.buy_free_spin_clicked], this.OnBuyFreeSpinClicked.bind(this));
        addEventListener(UIButtonEvent[UIButtonEvent.confirm_buy_free_spin_clicked], this.OnConfirmBuyFreeSpinClicked.bind(this));
        addEventListener(UIButtonEvent[UIButtonEvent.cancel_buy_free_spin_clicked], this.OnCancelBuyFreeSpinClicked.bind(this));
        // addEventListener(UIButtonEvent[UIButtonEvent.open_menu_panel_clicked] , this.OnMenuButtonClicked.bind(this));
        // addEventListener(UIButtonEvent[UIButtonEvent.close_menu_panel_clicked] , this.OnCloseMenuButtonClicked.bind(this));
        addEventListener(UIButtonEvent[UIButtonEvent.fullscreen_clicked] , this.OnFullScreenClicked.bind(this));
        addEventListener(UIButtonEvent[UIButtonEvent.confirm_exit_game_button_clicked] , this.OnConfirmExitGameButtonClicked.bind(this));
        addEventListener(UIButtonEvent[UIButtonEvent.cancel_exit_game_button_clicked] , this.OnCancelExitGameButtonClicked.bind(this));
        addEventListener(UIButtonEvent[UIButtonEvent.auto_spin_start_button_clicked] , this.StartAutoSpin.bind(this));

        addEventListener(UIButtonEvent[UIButtonEvent.history_button_clicked] , this.OnHistoryButtonClicked.bind(this));
        addEventListener(UIButtonEvent[UIButtonEvent.support_button_clicked] , this.OnSupportButtonClicked.bind(this));
        addEventListener(UIButtonEvent[UIButtonEvent.cashier_button_clicked] , this.OnCashierButtonClicked.bind(this));
        addEventListener(UIButtonEvent[UIButtonEvent.exit_game_button_clicked] , this.OnExitGameButtonClicked.bind(this)); // exit to lobby
        addEventListener(UIButtonEvent[UIButtonEvent.logout_button_clicked] , this.OnLogoutButtonClicked.bind(this));

        addEventListener(UIButtonEvent[UIButtonEvent.start_game_button_clicked], this.OnStartGameButtonClicked.bind(this));
        addEventListener(GameStateEvent.reset_spin_button, this.ResetSpinButton.bind(this));
        
        addEventListener("fullscreenchange", this.OnExitFullscreen.bind(this));
    }

    public OnGameInitialize () {
        // show paytable on intro according to config from BO
        if (GameConfig.instance.IsShowIntroPaytable()) {
            this.OnRulePageClicked(null);
        }
    }

    public OnSpinButtonClicked () {
        GameMaster.instance.SpinButtonClicked();
    }

    private StartAutoSpin(){
        if (GameData.instance.IsAutoSpin()) {
            this.infoButton.getComponent(Button).interactable = false;
            if(this.buyFreeSpinButton != null) this.buyFreeSpinButton.getComponent(Button).interactable = false;
        } else if (Utils.CheckCurrentGameState(GameStateAction.enter, GameState.idle)) {
            this.infoButton.getComponent(Button).interactable = true;
            if(this.buyFreeSpinButton != null) this.buyFreeSpinButton.getComponent(Button).interactable = true;
        }
    }

    public OnSpinStopButtonClicked () {
        GameMaster.instance.SpinStopButtonClicked();
    }

    private OnTurboSpinButtonClicked (customEvent: CustomEvent) {
        let eventDetail = customEvent.detail;
        let toggleTurboSpin = !GameData.instance.IsTurboSpin();
        if (eventDetail != null && eventDetail.toggle != null) {
            eventDetail.toggle = eventDetail.toggle;
        }
        GameData.instance.SetTurboSpin(toggleTurboSpin);
    }

    private OnIncreaseLineBetClicked (customEvent: CustomEvent) {
        GameData.instance.IncrementLineBet();
        dispatchEvent(new CustomEvent(GameStateEvent[GameStateEvent.line_bet_changed]));
    }

    private OnDecreaseLineBetClicked (customEvent: CustomEvent) {
        GameData.instance.DecrementLineBet();
        dispatchEvent(new CustomEvent(GameStateEvent[GameStateEvent.line_bet_changed]));
    }

    private OnIncreaseBuyFreeSpinBetClicked (customEvent: CustomEvent) {
        GameData.instance.IncrementBuyFreeSpinLineBet();
        dispatchEvent(new CustomEvent(GameStateEvent[GameStateEvent.line_bet_changed]));
    }

    private OnDecreaseBuyFreeSpinBetClicked (customEvent: CustomEvent) {
        GameData.instance.DecrementBuyFreeSpinLineBet();
        dispatchEvent(new CustomEvent(GameStateEvent[GameStateEvent.line_bet_changed]));
    }
    
    public OnSoundButtonClicked (customEvent: CustomEvent) {
        this.isSoundOn = !this.isSoundOn;
        if(this.isSoundOn){
            this.onSoundButton.active = true;
            this.offSoundButton.active = false;
        }
        else{
            this.onSoundButton.active = false;
            this.offSoundButton.active = true;
        }
        GameData.instance.SetSoundOn(this.isSoundOn);
        dispatchEvent(new CustomEvent(GameStateEvent.check_sound_mute , {detail:this.isSoundOn}))
    }

    public IsRulePageOpen () {
        return this.rulePageMenu.active;
    }

    private OnRulePageClicked (customEvent: CustomEvent) {
        if (this.rulePageMenu != null) this.rulePageMenu.active = true;
        for(let i = 0; i < this.rulePageMenu.children.length; i++) {
            if(this.rulePageMenu.children[i].active == true) {
                this.pageView = this.rulePageMenu.children[i].getComponentInChildren(PageView);
            }
        }
        dispatchEvent(new CustomEvent('rulePageOpen' , {detail : this.pageView}));
    }

    private OnRulePageCloseClicked(customEvent: CustomEvent){
        if (this.rulePageMenu != null) this.rulePageMenu.active = false;
    }

    public OnOpenBuyFreeSpinPanelClicked (customEvent: CustomEvent) {
        if (this.buyFreeSpinPanel != null) {
            this.buyFreeSpinPanel.active = true;
        } else {
            GameData.instance.SetBuyFreeSpin(true);
            GameMaster.instance.SpinButtonClicked();
        }
    }

    private OnCloseBuyFreeSpinPanelClicked (customEvent: CustomEvent) {
        if (this.buyFreeSpinPanel != null) this.buyFreeSpinPanel.active = false;
        if (this.buyFreeSpinConfirmationPopup != null) 
                this.buyFreeSpinConfirmationPopup.active = false;
        // this.buyFreeSpinConfirmationPopup.forEach((childNode => {childNode.active = false;}));
    }

    private OnBuyFreeSpinClicked (customEvent: CustomEvent) {
        let eventDetail = customEvent.detail;
        let isBuyFreeSpinWildResetPrompted = (eventDetail != null && eventDetail.isBuyFreeSpinWildResetPrompted == true);

        if (!Utils.CheckGameTypeTransition(GameType.free_game, GameType.normal_game) 
                && GameData.instance.IsResultContainWild() 
                && !isBuyFreeSpinWildResetPrompted) {

            let yesCallback = () => {
                dispatchEvent(new CustomEvent(GameStateEvent.close_popup_message));
                dispatchEvent(new CustomEvent(UIButtonEvent[UIButtonEvent.buy_free_spin_clicked], {detail: {
                    isBuyFreeSpinWildResetPrompted: true
                }}));
            };

            let noCallback = () => {
                dispatchEvent(new CustomEvent(GameStateEvent.close_popup_message));
            };

            // TODO: change message to get from config
            let message = "Do you want to continue?\nBuy feature will reset wild progress.";
            if (AssetManager?.instance != null) {
                let locMessage = AssetManager.instance.GetTextWithKey("Game.BuyFeatureResetWildWarning");
                if (locMessage != null) message = locMessage;
            }
            
            let popupOption = new PopupOption(message, yesCallback, noCallback);
            dispatchEvent(new CustomEvent(GameStateEvent.popup_message, {detail: popupOption}));

        } else {
            if (this.buyFreeSpinConfirmationPopup != null) {
                // this.buyFreeSpinConfirmationPopup.forEach((childNode => {childNode.active = true;}));
                this.buyFreeSpinConfirmationPopup.active = true;
            }
        }
    } 

    public OnConfirmBuyFreeSpinClicked (customEvent: CustomEvent) {
        if (this.buyFreeSpinPanel) this.buyFreeSpinPanel.active = false;
        if (this.buyFreeSpinConfirmationPopup != null) 
            // this.buyFreeSpinConfirmationPopup.forEach((childNode => {childNode.active = false;}));
        this.buyFreeSpinConfirmationPopup.active = false;

        
        // set line bet index to be same as buy free spin line bet index (for display)
        GameData.instance.SetLineBetIndex(GameData.instance.GetBuyFreeSpinLineBetIndex());
        dispatchEvent(new CustomEvent(GameStateEvent[GameStateEvent.line_bet_changed]));

        GameData.instance.SetBuyFreeSpin(true);
        GameMaster.instance.SpinButtonClicked();
    }

    private OnCancelBuyFreeSpinClicked (customEvent: CustomEvent) {
        if (this.buyFreeSpinConfirmationPopup != null) 
            // this.buyFreeSpinConfirmationPopup.forEach((childNode => {childNode.active = false;}));
        this.buyFreeSpinConfirmationPopup.active = false;

    }

    private OnFullScreenClicked(customEvent: CustomEvent){
        if(!screen.supportsFullScreen){
            return;
        }

        if(this.fullscreenMode){
            screen.exitFullScreen().then(()=>{
                this.fullscreenMode = false;
                this.maxFullscreenButton.active = true;
                this.minFullscreenButton.active = false;
            });
        }
        else {
            screen.requestFullScreen().then(()=>{
                this.fullscreenMode = true;
                this.maxFullscreenButton.active = false;
                this.minFullscreenButton.active = true;
            })
        }
    }

    OnExitFullscreen (event) {
        if(screen.fullScreen() === true){
            this.fullscreenMode = true;
            this.maxFullscreenButton.active = false;
            this.minFullscreenButton.active = true;
        }
 
        if(screen.fullScreen() === false){
            this.fullscreenMode = false;
            this.maxFullscreenButton.active = true;
            this.minFullscreenButton.active = false;
        }
    }

    private OnExitGameButtonClicked(customEvent: CustomEvent){
        // this.exitMenuPanel.active = true;
        log("Exit to lobby button clicked");

        let message = "Confirm Exit?";
        if (AssetManager?.instance != null) {
            let locMessage = AssetManager.instance.GetTextWithKey("UI.ConfirmExit");
            if (locMessage != null) message = locMessage;
        }

        let popupOption = new PopupOption(
            message,
            () => {
                dispatchEvent(new CustomEvent(GameStateEvent.exit_to_lobby));
            },
            () => {
                dispatchEvent(new CustomEvent(GameStateEvent.close_popup_message));
            }
        );
        
        dispatchEvent(new CustomEvent(GameStateEvent.popup_message, {detail: popupOption}));
    }

    private OnConfirmExitGameButtonClicked(customEvent: CustomEvent){
        this.exitMenuPopupPanel.active = false;
        log("Confirm exit to lobby button clicked");
        dispatchEvent(new CustomEvent(GameStateEvent.exit_to_lobby));
    }

    private OnCancelExitGameButtonClicked(customEvent: CustomEvent){
        this.exitMenuPopupPanel.active = false;
        log("Cancel exit to lobby button clicked");
    }

    private OnHistoryButtonClicked (customEvent: CustomEvent) {
        log("History button clicked");
        dispatchEvent(new CustomEvent(GameStateEvent.open_history));
    }

    private OnSupportButtonClicked (customEvent: CustomEvent) {
        log("Support button clicked");
        dispatchEvent(new CustomEvent(GameStateEvent.open_support));
    }

    private OnLogoutButtonClicked (customEvent: CustomEvent) {
        log("Logout button clicked");

        let message = "Confirm Logout?";
        if (AssetManager?.instance != null) {
            let locMessage = AssetManager.instance.GetTextWithKey("UI.ConfirmLogout");
            if (locMessage != null) message = locMessage;
        }

        let popupOption = new PopupOption(
            message,
            () => {
                dispatchEvent(new CustomEvent(GameStateEvent.logout_from_game));
            },
            () => {
                dispatchEvent(new CustomEvent(GameStateEvent.close_popup_message));
            }
        );
        
        dispatchEvent(new CustomEvent(GameStateEvent.popup_message, {detail: popupOption}));
    }

    private OnCashierButtonClicked (customEvent: CustomEvent) {
        log("Cashier button clicked");
        dispatchEvent(new CustomEvent(GameStateEvent.open_cashier));
    }

    public OnStartGameButtonClicked (customEvent: CustomEvent) {
        log("Start Game");
        GameMaster.instance.StartGame();
    }

    private ResetSpinButton (customEvent: CustomEvent) {
        log("Reset spin button called");

        if (this.spinButton != null) {
            this.spinButton.getComponent(SpinButtonScript).EnableInteract();
        }
    }
}


