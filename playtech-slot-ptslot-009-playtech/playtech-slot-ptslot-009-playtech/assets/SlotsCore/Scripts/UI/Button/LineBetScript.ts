import { Button, Enum, Label, _decorator } from 'cc';
import { BaseButtonScript, ButtonGameStateOption } from './BaseButtonScript';
import { GameNetworkResponseEvent, GameState, GameStateAction, GameStateEvent, GameType, UIButtonEvent  } from '../../Model/GameStateData';
import GameData from '../../Model/GameData';
import { PopupOption } from '../../Core/PopupMessageHandler';
import Utils from '../../Util/Utils';
import AudioManager from '../../Core/AudioManager';
import { GalacticColoniesConfig } from 'db://assets/artAssets/ptSlot-009Tech/Script/GalacticColoniesConfig';
import { UIController } from '../UIController';
const { ccclass, property } = _decorator;

enum LineBetButtonEvent {
    Increment_Line_Bet,
    Decrement_Line_Bet,
    Increment_Buy_Free_Spin_Line_Bet,
    Decrement_Buy_Free_Spin_Line_Bet
}

@ccclass('LineBetScript')
export class LineBetScript extends BaseButtonScript {

    // hide base button script option from editor
    @property({type: Enum(UIButtonEvent), visible: false})  
    buttonClickEvent: UIButtonEvent = UIButtonEvent.none;

    @property({type: Enum(LineBetButtonEvent)})  
    lineBetClickEvent: LineBetButtonEvent = LineBetButtonEvent.Increment_Line_Bet;

    @property(Boolean) promptResetIfWildInReel: boolean = false;

    protected lineBetInteractOnGameStates: ButtonGameStateOption[] = [];

    private isWildChance: boolean = false;

    override Initialize () {
        switch (this.lineBetClickEvent) {
            case LineBetButtonEvent.Increment_Line_Bet: {
                this.buttonClickEvent = UIButtonEvent.increase_lineBet_clicked;
                break;
            }
            case LineBetButtonEvent.Decrement_Line_Bet: {
                this.buttonClickEvent = UIButtonEvent.decrease_lineBet_clicked;
                break;
            }
            case LineBetButtonEvent.Increment_Buy_Free_Spin_Line_Bet: {
                this.buttonClickEvent = UIButtonEvent.increase_buy_free_spin_bet_clicked;
                break;
            }
            case LineBetButtonEvent.Decrement_Buy_Free_Spin_Line_Bet: {
                this.buttonClickEvent = UIButtonEvent.decrease_buy_free_spin_bet_clicked;
                break;
            }
        }

        this.lineBetInteractOnGameStates = this.setInteractOnGameStates;

        super.Initialize();

        addEventListener(GameStateEvent.line_bet_changed, this.CheckToDisableInteract.bind(this));
        addEventListener(GameStateEvent.set_auto_spin, this.CheckToDisableInteract.bind(this));
        addEventListener(GameNetworkResponseEvent.on_Custom_Feature_Data , this.CustomDataSave.bind(this))
    }

    CustomDataSave(event: CustomEvent) {
        let data = event.detail;
        if(data != null) {
            if(data["featureData"] != null) {
                GameData.instance.SetLineBet(data.featureData.betMultiplier);
            }
        }
    }

    override OnGameStateChanged (customEvent: CustomEvent) {
        let allowParentInteractableChange = false;

        switch (this.lineBetClickEvent) {
            case LineBetButtonEvent.Increment_Line_Bet: {
                allowParentInteractableChange = !GameData.instance.IsLineBetMaxLimitReached();
                break;
            }
            case LineBetButtonEvent.Decrement_Line_Bet: {
                allowParentInteractableChange = !GameData.instance.IsLineBetMinLimitReached();
                break;
            }
            case LineBetButtonEvent.Increment_Buy_Free_Spin_Line_Bet: {
                allowParentInteractableChange = !GameData.instance.IsBuyFreeSpinLineBetMaxLimitReached();
                break;
            }
            case LineBetButtonEvent.Decrement_Buy_Free_Spin_Line_Bet: {
                allowParentInteractableChange = !GameData.instance.IsBuyFreeSpinLineBetMinLimitReached();
                break;
            }
        }

        if (allowParentInteractableChange) {
            this.setInteractOnGameStates = this.lineBetInteractOnGameStates;
        } else {
            this.setInteractOnGameStates = [];
        }

        super.OnGameStateChanged(customEvent);
    }
       
    override OnClickEvent () {
        let parentOnClickEvent = super.OnClickEvent.bind(this);

        if(GalacticColoniesConfig.instance.extraFeature.percentageNode.getComponent(Label).string != '0%') {
            this.isWildChance = true;
        }

        if (this.promptResetIfWildInReel && this.isWildChance && !Utils.CheckGameTypeTransition(GameType.free_game, GameType.normal_game)) {
            
            AudioManager.instance?.PlayGeneralBtnSound(this.buttonClickEvent);
            
            let yesCallback = () => {
                // window.location.reload();
                UIController.instance.currentLineBet = GameData.instance.GetGameBet();
                GalacticColoniesConfig.instance.extraFeature.storeExraWildChance = GalacticColoniesConfig.instance.extraFeature.percentageNode.getComponent(Label).string;
                GalacticColoniesConfig.instance.extraFeature.percentageNode.getComponent(Label).string = '0%';
                dispatchEvent(new CustomEvent(GameStateEvent.close_popup_message));
                parentOnClickEvent();
                this.isWildChance = false;
            };

            let noCallback = () => {
                this.isWildChance = false;
                dispatchEvent(new CustomEvent(GameStateEvent.close_popup_message));
            };

            // TODO: change message to get from config
            let message = "Do you want to continue?\nChange bet will reset wild progress.";
            
            let popupOption = new PopupOption(message, yesCallback, noCallback);
            dispatchEvent(new CustomEvent(GameStateEvent.popup_message, {detail: popupOption}));
            
        } else {
            parentOnClickEvent();
            if(GameData.instance.GetGameBet() == UIController.instance.currentLineBet) {
                GalacticColoniesConfig.instance.extraFeature.percentageNode.getComponent(Label).string = GalacticColoniesConfig.instance.extraFeature.storeExraWildChance;
            }
        }
    }

    CheckToDisableInteract (customEvent: CustomEvent) {
        let eventDetail = customEvent.detail;

        // check if called from autospin and is turn off auto spin
        if (eventDetail != null && eventDetail.isAutoSpin != null && eventDetail.isAutoSpin == true) return;

        switch (this.lineBetClickEvent) {
            case LineBetButtonEvent.Increment_Line_Bet: {
                this.node.getComponent(Button).interactable = !GameData.instance.IsLineBetMaxLimitReached();
                break;
            }
            case LineBetButtonEvent.Decrement_Line_Bet: {
                this.node.getComponent(Button).interactable = !GameData.instance.IsLineBetMinLimitReached();
                break;
            }
            case LineBetButtonEvent.Increment_Buy_Free_Spin_Line_Bet: {
                this.node.getComponent(Button).interactable = !GameData.instance.IsBuyFreeSpinLineBetMaxLimitReached();
                break;
            }
            case LineBetButtonEvent.Decrement_Buy_Free_Spin_Line_Bet: {
                this.node.getComponent(Button).interactable = !GameData.instance.IsBuyFreeSpinLineBetMinLimitReached();
                break;
            }
        }
    }
}


