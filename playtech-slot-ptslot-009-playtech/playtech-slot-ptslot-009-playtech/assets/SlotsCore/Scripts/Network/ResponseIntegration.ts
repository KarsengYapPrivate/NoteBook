import { _decorator, log } from 'cc';
import { GameNetworkResponseEvent, GameStateEvent, GameType } from '../Model/GameStateData';
import GameData from '../Model/GameData';
import NetworkController from './NetworkController';
import { PopupOption } from '../Core/PopupMessageHandler';
import GameConfig from '../Model/GameConfig';
import { DEBUG } from 'cc/env';
const { ccclass, property } = _decorator;


@ccclass('ResponseHandlers')
export class ResponseHandlers {
    public key: string;
    public callback: (data: any) => void;
}

@ccclass('ResponseIntegration')
export default class ResponseIntegration {

    public static loginResponseHandler = (loginResultData: any) => {
        // Game should set data according to the game
        ResponseIntegration.Log("Login result data:", loginResultData);

        let freeSpinData = loginResultData["free_spin"];
        if (freeSpinData != null) {
            GameData.instance.SetFreeSpinOn(true);
            GameData.instance.SetNextSpinGameType(GameType.free_game);
            GameData.instance.SetLineBet(freeSpinData["bet_multiplier"]);
            GameData.instance.SetBuyFreeSpinLineBet(freeSpinData["bet_multiplier"]);
            GameData.instance.SetResumeFreeSpinReelData(freeSpinData["previous_result"]);
    
            let totalFreeSpin = freeSpinData["totalFreeSpin"];
            let currentFreeSpin = freeSpinData["totalCurrentFreeSpin"];
            let remainingFreeSpin = totalFreeSpin - currentFreeSpin;
            GameData.instance.SetFreeSpinRemaining(remainingFreeSpin);
            dispatchEvent(new CustomEvent('freegameData' , {detail: freeSpinData}));
        } else {
            GameData.instance.SetLineBet(GameConfig.instance.GetDefaultMultiplier());
        }
    }

    public static responseHandlers: ResponseHandlers[] = [
        {
            key: "onSubscribeDone",
            callback: (data) => {
                GameData.instance.SetIsLoggedIn(true);
                let responseEvent = ResponseIntegration.CreateCustomResponseEvent(GameNetworkResponseEvent.on_subscribe_done, data);
                dispatchEvent(responseEvent);
            }
        },
        {
            key: "kick-user",
            callback: (data) => {
                log("Kick user:", data);
                let message = data["message"];
                let popupOption = new PopupOption(message);
                let allowGameToContinue = data["status_code"] == "1213" || data["retriable"] == true; // special handle for playtech games
                
                if (allowGameToContinue) {
                    GameData.instance.SetGameErrorCode(data["status_code"]);
                    GameData.instance.SetGameErrorAllowContinue(allowGameToContinue);

                    popupOption.yesCallback = () => {
                        dispatchEvent(new CustomEvent(GameStateEvent.close_popup_message));

                        let responseEvent = ResponseIntegration.CreateCustomResponseEvent(GameNetworkResponseEvent.server_error, null);
                        dispatchEvent(responseEvent);
                    }
                    
                } else {
                    popupOption.yesCallback = () => {
                        window.location.href = GameConfig.instance.GetLobbyUrl();
                    }
                }
                
                dispatchEvent(new CustomEvent(GameStateEvent.popup_message, {detail: popupOption}));
            }
        },
        {
            key: "slot-result",
            callback: (result) => {
                let resultData = result.data;
                GameData.instance.SetResult(resultData);
                GameData.instance.SetBalance(resultData.balance);
                GameData.instance.SetTotalWinAmount(resultData.total_win_amount);
                GameData.instance.SetFreeSpinOn(resultData.is_freespin_on);

                // check and make sure resultData.freeSpins is not null and not empty
                if (resultData.freeSpins != null && resultData.freeSpins.currentfreespin != null) {
                    GameData.instance.SetFreeSpinRemaining(resultData.freeSpins.freeSpinCount - resultData.freeSpins.currentfreespin);
                    GameData.instance.SetCurrentFreeSpin(resultData.freeSpins.currentFreespin);
                    GameData.instance.SetTotalFreeSpinWin(resultData.freeSpins.totalFreespinWin);
                    GameData.instance.SetFreeSpinRetrigger(resultData.freeSpins.retrigger);
                }

                let responseEvent = ResponseIntegration.CreateCustomResponseEvent(GameNetworkResponseEvent.slot_result, resultData);
                dispatchEvent(responseEvent);
            }
        },
        {
            key: "balance",
            callback: (data) => {
                let responseEvent = ResponseIntegration.CreateCustomResponseEvent(GameNetworkResponseEvent.player_balance, data);
                dispatchEvent(responseEvent);
            }
        },
        {
            key: 'slot-reel-symbols', 
            callback: (data) =>
            {
                let responseEvent = ResponseIntegration.CreateCustomResponseEvent(GameNetworkResponseEvent.slot_reel_symbols, data);
                dispatchEvent(responseEvent);
            }
        },
        {
            key: "slot-bet-success",
            callback: (data) => {
                let responseEvent = ResponseIntegration.CreateCustomResponseEvent(GameNetworkResponseEvent.slot_bet_success, data);
                dispatchEvent(responseEvent);
            }
        },
        {
            key: "reset-jackpot",
            callback: (data) =>
            {
                let responseEvent = ResponseIntegration.CreateCustomResponseEvent(GameNetworkResponseEvent.reset_jackpot, data);
                dispatchEvent(responseEvent);
            }
        },
        {
            key: "jackpot-balance",
            callback: (data) =>
            {
                let responseEvent = ResponseIntegration.CreateCustomResponseEvent(GameNetworkResponseEvent.jackpot_balance, data);
                dispatchEvent(responseEvent);
            }
        },
        {
            key: "hit-jackpot",
            callback: (data) =>
            {
                let responseEvent = ResponseIntegration.CreateCustomResponseEvent(GameNetworkResponseEvent.hit_jackpot, data);
                dispatchEvent(responseEvent);
            }
        },
        {
            key: "onFreeSpinSelection",
            callback: (data) =>
            {
                let responseEvent = ResponseIntegration.CreateCustomResponseEvent(GameNetworkResponseEvent.on_free_spin_selection, data);
                dispatchEvent(responseEvent);
            }
        },
        {
            key: "onSlotGamble",
            callback: (data) =>
            {    
                let responseEvent = ResponseIntegration.CreateCustomResponseEvent(GameNetworkResponseEvent.gamble_result, data);
                dispatchEvent(responseEvent);
            }
        },
        {
            key: "slot-progress",
            callback: (data) =>
            {
                let responseEvent = ResponseIntegration.CreateCustomResponseEvent(GameNetworkResponseEvent.slot_progress, data);
                dispatchEvent(responseEvent);
            }
        },
        {
            key: "onCustomFeatureData",
            callback: (data) =>
            {
                let responseEvent = ResponseIntegration.CreateCustomResponseEvent(GameNetworkResponseEvent.on_Custom_Feature_Data, data);
                dispatchEvent(responseEvent);
            }
        }
    ];

    private static CreateCustomResponseEvent (eventName: string, data: any) {
        if (NetworkController.instance.logResponseData) {
            ResponseIntegration.Log("event:", eventName, " | event data:", data);
            if(eventName == 'slot-result' || eventName == 'slot_result') {
                let JSONData = JSON.stringify(data);
                if(DEBUG) log('Result ASB----------Result JSON: ' + JSONData);
            }
        }
        return new CustomEvent(eventName, {detail: data});
    }

    private static Log (...message: any) {
        log("{", ResponseIntegration.name, "}", ...message);
    }
}


