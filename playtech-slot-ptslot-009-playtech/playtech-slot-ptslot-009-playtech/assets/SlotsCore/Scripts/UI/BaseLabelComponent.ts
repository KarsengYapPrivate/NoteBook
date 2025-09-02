import { _decorator, Button, Component, Enum, Label, Node } from 'cc';
import { BaseUIComponent, UIGameStateOption } from './BaseUIComponent';
import GameData, { GameStateInfo } from '../Model/GameData';
import { ButtonGameStateOption } from './Button/BaseButtonScript';
import { GameNetworkResponseEvent, GameState, GameStateAction, GameStateEvent, GameType, LabelEvent, UIButtonEvent } from '../Model/GameStateData';
import Utils from '../Util/Utils';
import RollingNumber from './RollingNumber';
import GameConfig from '../Model/GameConfig';
const { ccclass, property } = _decorator;

@ccclass('BaseLabelComponent')
export class BaseLabelComponent extends BaseUIComponent {

    @property(Boolean)
    showRollingAnimation : boolean = false;
    @property({type : Number , visible:function(this:BaseLabelComponent) {return this.showRollingAnimation}}) 
    delayBeforeStart : number = 0;
    @property({type : Number , visible:function(this:BaseLabelComponent) {return this.showRollingAnimation}}) 
    durationInSeconds : number = 0;
    @property({type : Enum(LabelEvent)})
    labelUpdate: LabelEvent = LabelEvent.none; 

    private rollingNumber: RollingNumber = null;
    private label: Label = null;

    override Initialize () {
        super.Initialize();

        this.rollingNumber = this.node.getComponent(RollingNumber);
        this.label = this.node.getComponent(Label);

        if (this.label == null) console.error("Base label component error: Label not found in node: " + this.node.name);
        
        addEventListener(GameStateEvent.game_initialize , this.InitializeLabelValues.bind(this));
        addEventListener(GameStateEvent[GameStateEvent.line_bet_changed] , this.CheckTotalBet.bind(this));
        
    }

    InitializeLabelValues () {
        switch(this.labelUpdate) {
            case LabelEvent.label_player_balance:
                this.SetImmediate(GameData.instance.GetBalance());
            break;

            case LabelEvent.label_total_bet:
                this.SetImmediate(GameData.instance.GetGameBet());
            break;

            case LabelEvent.label_win_result:
                this.SetImmediate(GameData.instance.GetTotalFreeSpinWin());
            break;
            
            case LabelEvent.label_free_spin_remaining:
                this.SetImmediate(GameData.instance.GetFreeSpinRemaining());
            break;
            
            case LabelEvent.label_free_spin_total_win:
                this.SetImmediate(GameData.instance.GetTotalFreeSpinWin());
            break;
            
            case LabelEvent.label_line_bet_amount:
            this.SetImmediate(GameData.instance.GetLineBet());
            break;
            
            case LabelEvent.label_buy_free_spin_amount:
                this.SetImmediate(GameData.instance.GetBuyFreeSpinAmount());
            break;

            case LabelEvent.label_buy_free_spin_bet_amount:
                this.SetImmediate(GameData.instance.GetBuyFreeSpinBet());
            break;
        }
    }

    OnGameStateChanged (customEvent: CustomEvent) {
        super.OnGameStateChanged(customEvent); // calls parent event handler first

        let eventDetail = customEvent.detail as GameStateInfo;  
        
        switch(this.labelUpdate) {
            case LabelEvent.label_player_balance:
                if (Utils.CheckCurrentGameState(GameStateAction.enter, GameState.spin, eventDetail)) {
                    let gameBet = 0;

                    // if buy free spin then minus out buy free spin amount
                    if (GameData.instance.IsBuyFreeSpin()) gameBet = GameData.instance.GetBuyFreeSpinAmount() * -1;
                    // if is free spin then do not deduct
                    else if (Utils.CheckCurrentGameType(GameType.free_game)) gameBet = 0;
                    // else (normal spin) then deduct game bet
                    else gameBet = GameData.instance.GetGameBet() * -1;

                    // this will deduct the balance first before result comes in for better presentation
                    this.IncrementTarget(gameBet, 0, this.delayBeforeStart);
                    
                } else if (Utils.CheckCurrentGameState(GameStateAction.exit, GameState.result, eventDetail)) {
                    let number = GameData.instance.GetResult().balance;
                    this.SetTarget(number , this.durationInSeconds , this.delayBeforeStart);
                }
                else if (Utils.CheckCurrentGameState(GameStateAction.exit, GameState.login, eventDetail)) {
                    this.SetImmediate(GameData.instance.GetBalance());
                }
                else if (Utils.CheckCurrentGameState(GameStateAction.enter, GameState.idle, eventDetail)) {
                    this.SetImmediate(GameData.instance.GetBalance());
                }
            break;

            case LabelEvent.label_total_bet:
                if (Utils.CheckCurrentGameState(GameStateAction.enter, GameState.idle, eventDetail)) {
                    this.SetImmediate(GameData.instance.GetGameBet());
                }
            break;

            case LabelEvent.label_win_result:
                if (Utils.CheckCurrentGameState(GameStateAction.exit, GameState.login, eventDetail)) {
                    let result = GameData.instance.GetResult();
                    let winAmount = (result != null && result.total_win_amount != null)? result.total_win_amount : 0;
                    this.SetImmediate(winAmount);

                } else if (Utils.CheckCurrentGameState(GameStateAction.exit , GameState.result , eventDetail)) {
                    if(Utils.CheckCurrentGameType(GameType.normal_game)){ 
                        if (GameData.instance.GetResult().total_win_amount) {
                            this.IncrementTarget(GameData.instance.GetResult().total_win_amount , this.durationInSeconds , this.delayBeforeStart);
                        }
                    }
                    else if(Utils.CheckCurrentGameType(GameType.free_game)){
                        this.SetTarget(GameData.instance.GetTotalFreeSpinWin() , this.durationInSeconds , this.delayBeforeStart);
                    }
                }
                else if (Utils.CheckCurrentGameState(GameStateAction.enter , GameState.spin , eventDetail)) {
                    if(Utils.CheckCurrentGameType(GameType.normal_game)){ 
                        this.SetImmediate(0);
                    }
                    else if(Utils.CheckCurrentGameType(GameType.free_game)){ 
                        if(GameData.instance.GetTotalFreeSpinWin() <= 0){
                            this.SetImmediate(0);
                        }
                    }
                }
            break;
            
            case LabelEvent.label_free_spin_remaining:
                if (Utils.CheckGameTypeTransition(GameType.normal_game, GameType.free_game, eventDetail)
                        && Utils.CheckCurrentGameState(GameStateAction.enter, GameState.idle, eventDetail)) {
                    this.SetImmediate(GameData.instance.GetFreeSpinRemaining());

                } else if (Utils.CheckCurrentGameType(GameType.free_game, eventDetail)) {
                    if (Utils.CheckCurrentGameState(GameStateAction.enter, GameState.result, eventDetail)) {
                        this.SetImmediate(GameData.instance.GetFreeSpinRemaining());
                    }
                }
            break;
            
            case LabelEvent.label_free_spin_total_win:
                if (Utils.CheckGameTypeTransition(GameType.normal_game, GameType.free_game, eventDetail)
                        && Utils.CheckCurrentGameState(GameStateAction.enter, GameState.idle, eventDetail)) {
                    this.SetImmediate(GameData.instance.GetTotalFreeSpinWin());

                } else if (Utils.CheckCurrentGameType(GameType.free_game, eventDetail)) {
                    if (Utils.CheckCurrentGameState(GameStateAction.enter, GameState.result, eventDetail)) {
                        this.SetImmediate(GameData.instance.GetTotalFreeSpinWin());
                    }
                }
            break;

            case LabelEvent.label_auto_spin_remaining_amount:
                if(Utils.CheckCurrentGameType(GameType.normal_game , eventDetail)) {
                    if(Utils.CheckCurrentGameState(GameStateAction.exit, GameState.idle , eventDetail) 
                        || Utils.CheckCurrentGameState(GameStateAction.enter, GameState.idle , eventDetail)){
                        this.SetImmediate(GameData.instance.GetAutoSpinRemaining());
                    }
                }
            break;
        }
    }

    CheckTotalBet() {
        switch(this.labelUpdate) {
            case LabelEvent.label_total_bet:
                this.SetImmediate(GameData.instance.GetGameBet());
                break;
            case LabelEvent.label_line_bet_amount:
                this.SetImmediate(GameData.instance.GetLineBet());
                break;
            case LabelEvent.label_buy_free_spin_amount:
                this.SetImmediate(GameData.instance.GetBuyFreeSpinAmount());
                break;
            case LabelEvent.label_buy_free_spin_bet_amount:
                this.SetImmediate(GameData.instance.GetBuyFreeSpinBet());
                break;
        }
    }

    private SetTarget (target: number, duration_in_seconds: number, delay_before_start: number = 0 , targetReachCallback : () => void = null) {
        if (this.rollingNumber) {
            this.rollingNumber.SetTarget(target, duration_in_seconds, delay_before_start, targetReachCallback);
        } else {
            this.label.string = target.toString();
        }
    }

    private SetImmediate (value: number, updatelabel: boolean = true) {
        if (this.rollingNumber) {
            this.rollingNumber.SetImmediate(value, updatelabel);
        } else {
            this.label.string = value.toString();
        }
    }

    private IncrementTarget (amount: number, duration_in_seconds: number, delay_before_start: number = 0 , targetReachCallback : () => void = null) {
        if (this.rollingNumber) {
            this.rollingNumber.IncrementTarget(amount, duration_in_seconds, delay_before_start, targetReachCallback);
        } else {
            let currentValue: number = parseFloat(this.label.string);
            this.label.string = (currentValue + amount).toString();
        }
    }
}


