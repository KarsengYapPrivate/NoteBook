import { _decorator, Component, Label, Node, log, KeyCode, sys } from 'cc';
import { GameNetworkRequestEvent, GameNetworkResponseEvent, GameState, GameStateAction, GameStateEvent, GameType, UIButtonEvent } from '../Model/GameStateData';
import GameData, { GameStateInfo } from '../Model/GameData';
import GameConfig from '../Model/GameConfig';
import NetworkController from '../Network/NetworkController';
import Utils from '../Util/Utils';
import { PresentationController } from '../Core/PresentationController';
import { ReelController } from './ReelController';
import { DEBUG } from 'cc/env';
import { AutoSpinPanelController } from '../UI/AutoSpinPanelController';
import AudioManager from './AudioManager';
import { KeyboardInputHandler } from '../Input/KeyboardInputHandler';
import { PopupOption } from './PopupMessageHandler';
import { AssetManager } from './AssetManager';
import { PlaytechIntegration } from '../Network/PlaytechIntegration';
import { UIController } from '../UI/UIController';
import ResponseIntegration from '../Network/ResponseIntegration';

const { ccclass, property } = _decorator;

@ccclass('GameMaster')
export default class GameMaster extends Component {

    public static instance: GameMaster = null;

    @property(String) version: string = "v 0.1.1";
    @property(Node) versionLabelNode: Node = null;
    @property(Node) demoModeNode: Node = null;

    @property(Node) loadingPopupNode: Node = null;
    @property(Node) introductionNode: Node = null;

    protected onLoad(): void {

        if (GameMaster.instance == null) {
            GameMaster.instance = this;
        }

        if (this.demoModeNode != null) {
            this.demoModeNode.active = false;
        }

        if (this.versionLabelNode != null) {
            this.versionLabelNode.active = false;
        }

        // if (this.blockObject) this.blockObject.active = true;
        this.InitializeEventListeners();
    }

    protected start(): void {
        if (this.loadingPopupNode != null) this.loadingPopupNode.active = true;
        if (this.introductionNode != null) this.introductionNode.active = true;
        this.ChangeGameState(GameStateAction.enter, GameState.initialize);
    }

    public StartGame(): void {
        if (this.introductionNode.active) {
            this.introductionNode.active = false;
        }
    }

    // =======================================================
    // #region Private functions
    // =======================================================

    private InitializeEventListeners () {
        addEventListener(GameNetworkResponseEvent.on_subscribe_done, this.OnSubscribeDone.bind(this));
        addEventListener(GameNetworkResponseEvent.slot_result, this.OnSlotResult.bind(this));
        addEventListener(GameNetworkResponseEvent.server_error, this.OnServerError.bind(this));

        addEventListener(GameStateEvent.game_initialize, this.OnInitialize.bind(this));
        addEventListener(GameStateEvent.game_state_changed, this.OnGameStateChanged.bind(this));
        addEventListener(GameStateEvent.all_reel_stopped_spin, this.OnAllReelStopSpin.bind(this));
        addEventListener(GameStateEvent.set_auto_spin , this.OnSetAutoSpin.bind(this));
        addEventListener(GameStateEvent.exit_to_lobby, this.ExitToLobby.bind(this));
        addEventListener(GameStateEvent.logout_from_game, this.LogoutFromGame.bind(this));
        addEventListener(GameStateEvent.open_history, this.OpenHistory.bind(this));
        addEventListener(GameStateEvent.open_support, this.OpenSupport.bind(this));
        addEventListener(GameStateEvent.open_cashier, this.OpenCashier.bind(this));
        addEventListener(GameStateEvent.pasue_auto_play , this.ContinueAutoPlay.bind(this));

        // addEventListener(GameStateEvent.keyboard_key_clicked, this.OnKeyboardKeyClicked.bind(this));
    }

    private OnInitialize () {
        if (GameConfig.instance.IsDemo()) {
            if (this.demoModeNode != null) {
                this.demoModeNode.active = true;
            }
        }
            
        if (this.versionLabelNode != null) {
            this.versionLabelNode.active = true;
            let versionLabels = this.versionLabelNode.getComponentsInChildren(Label);
            if (versionLabels != null) {
                for (let i = 0; i < versionLabels.length; i++) {
                    versionLabels[i].string = this.version;
                }
            }
        }
        
        GameData.instance.SetIsInitialized(true);

        this.ChangeGameState(GameStateAction.enter, GameState.login);
    }
    
    private OnSubscribeDone (customEvent: CustomEvent) {
        let eventDetail = customEvent.detail;

        // BOv2 flow will initialize game after login 
        // enter initialize > connect and subscribe socket > game_initialize > enter login (do nothing) > exit login
        if (!GameConfig.instance.IsBOv2()) {
            this.ChangeGameState(GameStateAction.exit, GameState.login);
        }
    }

    private OnGameStateChanged (customEvent: CustomEvent) {
        let eventDetail = customEvent.detail as GameStateInfo;
        this.HandlePresenterStateChange();
    }
    
    private async OnSlotResult (customEvent: CustomEvent) {
        GameData.instance.SetBuyFreeSpin(false);
        let nextSpinGameType = GameData.instance.IsFreeSpinOn()? GameType.free_game : GameType.normal_game;
        GameData.instance.SetNextSpinGameType(nextSpinGameType);
        let spinningSeconds = Utils.GetTimeDifferenceSeconds(Date.now(), GameData.instance.GetSpinStartTime(), true);
        let minimumSpinSeconds = GameData.instance.IsTurboSpin()? GameConfig.instance.GetMinimumTurboSpinSecond() : GameConfig.instance.GetMinimumSpinSecond();
        
        await Utils.WaitForCondition(() => ReelController.instance.IsAllReelSpinning());
        if (spinningSeconds > minimumSpinSeconds) {
            this.ChangeGameState(GameStateAction.exit, GameState.spin);
        } else {
            let remainingSeconds = minimumSpinSeconds - spinningSeconds;
            Utils.WaitForSeconds(remainingSeconds).then(() => {
                this.ChangeGameState(GameStateAction.exit, GameState.spin);
            });
        }
    }

    private async OnServerError (customEvent: CustomEvent) {
        if (Utils.CheckCurrentGameState(GameStateAction.enter, GameState.spin) && GameData.instance.IsGameErrorAllowContinue()) {
            await Utils.WaitForCondition(() => ReelController.instance.IsAllReelSpinning());
            this.ChangeGameState(GameStateAction.exit, GameState.spin);
        }
    }

    private EmitSpinRequest () {
        let betStake = Utils.CheckCurrentGameType(GameType.free_game)?
                            0 // current game type is free game then set bet stake to 0
                            : GameData.instance.IsBuyFreeSpin()?
                                GameData.instance.GetBuyFreeSpinBet()
                                : GameData.instance.GetGameBet();
                                
        let multiplier = GameData.instance.IsBuyFreeSpin() || GameData.instance.GetNextSpinGameType() == GameType.free_game? 
                            GameConfig.instance.GetMultiplier()[GameData.instance.GetBuyFreeSpinLineBetIndex()]
                            : GameConfig.instance.GetMultiplier()[GameData.instance.GetLineBetIndex()];
                        
        let requestData = {
            reel_value: GameData.instance.GetLine(), 
            bet_stake: betStake, 
            isPlayFreeSpin: GameData.instance.GetNextSpinGameType() == GameType.free_game, 
            denominator: GameConfig.instance.GetDenominator()[0], // currently denom have only 1 value
            multiplier: multiplier, // this is lineBet before multiply denom
            // random_jp_value: 1582.48, // TODO: currently is hardcoded value for testing
            buy_free_spin: GameData.instance.IsBuyFreeSpin(),
            is_auto_spin: GameData.instance.IsAutoSpin() || GameData.instance.IsFreeSpinOn(), // free spin will consider as auto spin
            language_code: GameConfig.instance.GetGameLanguage(), // get from url params
            result_icon: []
            // result_icon: [['P01','P01','P08'],['P01','P01','P08'],['P01','PW','P06'],['P01','P01','P02'],['P01','P01','P06']] // P02 5-of-a-kind
        };
        
        this.Log("requestData:", requestData);
        
        let requestDataJson = GameData.instance.GetSpinRequestDataJson(requestData);
        NetworkController.instance.SendRequest(GameNetworkRequestEvent.slot_spin, requestDataJson);

        // use for test error stop spin without result - to be deleted
        // Utils.WaitForSeconds(2).then(() => {
        //     for (let i = 0; i < ResponseIntegration.responseHandlers.length; i++) {
        //         let handler = ResponseIntegration.responseHandlers[i];
        //         if (handler.key == "kick-user") {
        //             let data = {
        //                 message: "test stop reel without result",
        //                 status_code: "1213",
        //                 retriable: true
        //             };
        //             GameData.instance.SetResult(null);
        //             handler.callback(data);
        //             break;
        //         }
        //     }
        // });
        
    }
    
    private async OnAllReelStopSpin () {
        if (GameData.instance.IsGameError()) {
            this.ChangeGameState(GameStateAction.enter, GameState.idle); // straight change back to ENTER IDLE if result have error
           
        } else {
            this.Log("All reel spin stopped - entering result states");
            this.ChangeGameState(GameStateAction.enter, GameState.result);
        }
    }
    
    private async HandlePresenterStateChange () {
        let currentGameStateInfo = GameData.instance.GetGameStateInfo();
        await PresentationController.instance.RunPresenters(currentGameStateInfo);
        dispatchEvent(new CustomEvent(GameStateEvent.game_state_presenter_completed, {detail: currentGameStateInfo}));

        // After presenters finish then change game state


        if (Utils.CheckCurrentGameState(GameStateAction.enter, GameState.login, currentGameStateInfo)) {
            if (GameConfig.instance.IsBOv2()) {
                this.ChangeGameState(GameStateAction.exit, GameState.login);
            }

        } else if (Utils.CheckCurrentGameState(GameStateAction.exit, GameState.login, currentGameStateInfo)) {
            if (this.loadingPopupNode != null) this.loadingPopupNode.active = false;
            let that = this;

            Utils.WaitForCondition(() => { 
                return (that.introductionNode == null || !that.introductionNode.active) && UIController.instance.IsRulePageOpen() == false;
            }).then(() => {
                that.ChangeGameState(GameStateAction.enter, GameState.idle, GameData.instance.GetNextSpinGameType());
            });

            // if (this.introductionNode != null && this.introductionNode.active) {
            //     Utils.WaitForCondition(() => { return !this.introductionNode.active; }).then(() => {
            //         this.ChangeGameState(GameStateAction.enter, GameState.idle, GameData.instance.GetNextSpinGameType());
            //     });
            // } else {
            //     this.ChangeGameState(GameStateAction.enter, GameState.idle, GameData.instance.GetNextSpinGameType());
            // }
            
        } else if (Utils.CheckCurrentGameState(GameStateAction.enter, GameState.idle, currentGameStateInfo)) {
            // when enter idle set complete to current cycle
            GameData.instance.SetCurrentGameCycleCompleted();

            if (GameData.instance.IsGameError() && GameData.instance.IsGameErrorAllowContinue()) {
                GameData.instance.SetGameErrorCode(null); // reset game error code and allow game continue
            }

            if (KeyboardInputHandler.instance?.IsSpacebarDown() || (GameData.instance.IsAutoSpin() && !GameData.instance.GetPauseGameEvent()) || (Utils.CheckCurrentGameType(GameType.free_game) && !GameData.instance.GetPauseGameEvent())) {
                Utils.WaitForSeconds(GameConfig.instance.GetAutoSpinDelaySecond()).then(() => {

                    if (GameData.instance.IsCurrentGameCycleCompleted()) {
                        if (Utils.CheckCurrentGameType(GameType.free_game)) {
                            AutoSpinPanelController?.instance.DisableAutoSpin();
                            GameMaster.instance.SpinButtonClicked();
                        } else if (GameData.instance.IsAutoSpin() && GameData.instance.GetAutoSpinRemaining() > 0) {

                            if (GameData.instance.GetGameBet() > GameData.instance.GetBalance()) {
                                AutoSpinPanelController?.instance.DisableAutoSpin();
                            } else {
                                // check again in case player has stopped auto spin or already spinning
                                GameMaster.instance.StartAutoSpin();
                            }
                        } else if (KeyboardInputHandler.instance?.IsSpacebarDown()) {
                            GameMaster.instance.SpinButtonClicked();
                        }
                    }
                })
                
            }
            
        }  else if (Utils.CheckCurrentGameState(GameStateAction.exit, GameState.idle, currentGameStateInfo)) {
            this.ChangeGameState(GameStateAction.enter, GameState.spin);
            
        } else if (Utils.CheckCurrentGameState(GameStateAction.enter, GameState.spin, currentGameStateInfo)) {
            ReelController.instance.StartSpin();
            GameData.instance.SetSpinStartTimeToNow();
            this.EmitSpinRequest();

        } else if (Utils.CheckCurrentGameState(GameStateAction.exit, GameState.spin, currentGameStateInfo)) {
            if (GameData.instance.IsGameError() && ReelController.instance.StopSpinWithoutResult != null) {
                ReelController.instance.StopSpinWithoutResult();
            } else {
                ReelController.instance.StopSpin(GameData.instance.GetResult()?.array);
            }
            
        } else if (Utils.CheckCurrentGameState(GameStateAction.enter, GameState.result, currentGameStateInfo)) {
            this.ChangeGameState(GameStateAction.exit, GameState.result);
            
        } else if (Utils.CheckCurrentGameState(GameStateAction.exit, GameState.result, currentGameStateInfo)) {
            this.ChangeGameState(GameStateAction.enter, GameState.idle, GameData.instance.GetNextSpinGameType());
        }
    }
    
    // ChangeGameState (GameStateAction.enter, GameState.idle
    protected ChangeGameState (newGameStateAction: GameStateAction, newGameState: GameState, newGameType: GameType = null) {
        GameData.instance.UpdateGameState(newGameStateAction, newGameState, newGameType);
        let gameStateInfo = GameData.instance.GetGameStateInfo();
        this.Log("ChangeGameState: " + gameStateInfo.ToString());
        this.Log("ChangeGameState - time: " + (new Date()).toString());

        dispatchEvent(new CustomEvent(GameStateEvent.game_state_changed, {detail: gameStateInfo}));
    }

    private OnJackpotValueUpdate() {
        // TODO: Jackpot not working yet
    }

    private Log (...message: any[]) {
        if (DEBUG) log("{", GameMaster.name, "}", ...message);
    }

    private ExitToLobby () {
        window.location.href = GameConfig.instance.GetLobbyUrl();
    }

    private LogoutFromGame () {
        window.location.href = GameConfig.instance.GetLogoutUrl();
    }

    private OpenHistory () {
        sys.openURL(GameConfig.instance.GetHistoryUrl());
    }

    private OpenSupport () {
        sys.openURL(GameConfig.instance.GetSupportUrl());
    }

    private OpenCashier () {
        sys.openURL(GameConfig.instance.GetCashierUrl());
    }

    private OnSetAutoSpin(customEvent: CustomEvent){
        let data = customEvent.detail;

        GameData.instance.SetAutoSpin(data.isAutoSpin);

        if (!data.isAutoSpin) {
            GameData.instance.SetAutoSpinRemaining(0);
        }
    }

    ContinueAutoPlay(customEvent : CustomEvent) {
        let data = customEvent.detail;
        if((data == false && GameData.instance.IsAutoSpin())|| data == false && Utils.CheckCurrentGameType(GameType.free_game)) {
            if(GameData.instance.IsAutoSpin()) {
                GameData.instance.SetAutoSpinRemaining(GameData.instance.GetAutoSpinRemaining() - 1);
            }
            this.SpinButtonClicked();
        }
    }

    // =======================================================
    // #endregion
    // =======================================================
    
    // =======================================================
    // #region Public functions
    // =======================================================
    
    public SpinButtonClicked () {
        // check if current state not ENTER IDLE then return
        if (!Utils.CheckCurrentGameState(GameStateAction.enter, GameState.idle)) return;

        let spinCost = GameData.instance.IsBuyFreeSpin()? GameData.instance.GetBuyFreeSpinAmount() : GameData.instance.GetGameBet();

        if (spinCost > GameData.instance.GetBalance() && GameData.instance.IsFreeSpinOn() == false) {
            let message = "Insufficient Fund.";
            if (AssetManager?.instance != null) {
                let locMessage = AssetManager.instance.GetTextWithKey("UI.InsufficientFund");
                if (locMessage != null) message = locMessage;
            }
            
            let popupOption = new PopupOption(message, () => {
                dispatchEvent(new CustomEvent(GameStateEvent.close_popup_message));
                GameData.instance.SetBuyFreeSpin(false);
                dispatchEvent(new CustomEvent(GameStateEvent.reset_spin_button));
            });
            dispatchEvent(new CustomEvent(GameStateEvent.popup_message, {detail: popupOption}));
        } else {
            GameData.instance.IncrementCurrentGameCycle();
            this.ChangeGameState(GameStateAction.exit, GameState.idle);
        }
    }

    public SpinStopButtonClicked () {
        ReelController.instance.InstantStopRemainingReels();
    }

    public StartAutoSpin(){
        GameData.instance.SetAutoSpinRemaining(GameData.instance.GetAutoSpinRemaining() - 1);
        GameMaster.instance.SpinButtonClicked();
        if(GameData.instance.GetAutoSpinRemaining() == 0){
            dispatchEvent(new CustomEvent(GameStateEvent.set_auto_spin , {detail:{isAutoSpin : false}}));
            let request = {
                _type: "ucip.autoplay.g2wAutoplayEndNotification",
            }
            PlaytechIntegration.instance.SendPostMessage(request);
        }
    }
    // =======================================================
    // #endregion
    // =======================================================

}


