import { _decorator, Component, log, sys } from 'cc';
import SocketIOClient, { Listener } from './SocketIOClient';
import {default as Encryption} from '../Util/Encryption/ecrypt.js';
import GameConfig from '../Model/GameConfig';
import { GameNetworkResponseEvent, GameState, GameStateAction, GameStateEvent } from '../Model/GameStateData';
import GameData, { GameStateInfo } from '../Model/GameData';
import Utils from '../Util/Utils';
import ResponseIntegration, { ResponseHandlers } from './ResponseIntegration';
import { DEBUG } from 'cc/env';
import { PopupOption } from '../Core/PopupMessageHandler';
import { OfflineModeController } from './OfflineModeController';
import { AssetManager } from '../Core/AssetManager';

const { ccclass, property } = _decorator;


@ccclass('NetworkController')
export default class NetworkController extends Component implements Listener {

    public static instance: NetworkController;

    @property public logResponseData: boolean = false;
    @property public isEncrypt: boolean = false;
    @property public offlineMode: boolean = false;
    @property(String) hackResult : string = '';

    @property(Boolean)
    isBigWin : Boolean = false;

    @property(Boolean)
    isFreeSpin : Boolean = false;

    private socketio: SocketIOClient = null;
    private offlineData : OfflineModeController = null;
    private authorizedSocketID: string = null;
    private socketStatus: number = 0;
    
    onLoad () {
        if (NetworkController.instance == null) {
            NetworkController.instance = this;
        }

        addEventListener(GameStateEvent.game_state_changed, this.OnGameStateChanged.bind(this));
        addEventListener(GameNetworkResponseEvent.on_subscribe_done, this.OnSubscribeDone.bind(this));
    }

    start () {

    }

    OnGameStateChanged (customEvent: CustomEvent) {
        let eventDetail = customEvent.detail as GameStateInfo;

        if (Utils.CheckCurrentGameState(GameStateAction.enter, GameState.initialize, eventDetail)) {
            this.InitializeAPI();
        } else if (Utils.CheckCurrentGameState(GameStateAction.enter, GameState.login, eventDetail)) {
            if (!GameConfig.instance.IsBOv2()) {
                this.InitializeSocketIO(GameConfig.instance.GetSocketURL());
            }
            this.InitializeOfflineData();
        }
    }

    OnSubscribeDone (customEvent: CustomEvent) {
        let eventDetail = customEvent.detail;

        if (GameConfig.instance.IsBOv2()) {
            this.UpdateLoginResponseData(eventDetail);

            dispatchEvent(new CustomEvent(GameStateEvent.game_initialize));
        }
    }

    InitializeAPI () {
        this.Log(GameConfig.instance.GetHostID(), GameConfig.instance.GetAccessToken());
        GameConfig.instance.GetGameLanguage();
        this.Call_GeoIP();
    }

    InitializeSocketIO (url: string) {
        this.socketio = new SocketIOClient();
        this.socketio.Initialize(url);
        this.socketio.AddClientListener(this); // listen to socketio events

        let customListeners: ResponseHandlers[] = ResponseIntegration.responseHandlers;

        for (let index in customListeners) {
            let customListener = customListeners[index];
            this.socketio.AddListener(customListener.key, (data) => {
                customListener.callback(this.ProcessResponseData(data));
            });
        }

        this.socketio.Connect();
    }

    InitializeOfflineData(){
        this.offlineData = new OfflineModeController();
    }


    public SendRequest (requestName: string, requestData: string) {
        if(!this.offlineMode){
            this.socketio.RequestEvent(requestName, this.isEncrypt? Encryption.encrypt(requestData) : requestData);
        }
        else{
            if(this.isBigWin){
                this.offlineData.RequestEvent(requestName , requestData , 'BigWin');
            }
            else if(this.isFreeSpin){
                this.offlineData.RequestEvent(requestName , requestData , 'FreeSpin');
            }
            else{
                this.offlineData.RequestEvent(requestName , requestData , this.hackResult);
            }
        }
    }

    public OpenOfflineMode(){
        this.offlineMode = !this.offlineMode;
    }


    
    // =====================================================================
    // Private functions
    // #region
    // =====================================================================

    private Call_GeoIP () {
        let xhr = new XMLHttpRequest();
        xhr.open("POST", GameConfig.instance.GetGeoIPUrl(), true);
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        xhr.setRequestHeader("Accept-Language", "en-US");
        xhr.onreadystatechange = () => {
            if (xhr.readyState == 4 && (xhr.status >= 200 && xhr.status <= 207)) {
                this.Log("Call geo IP success");
                let result = JSON.parse(xhr.responseText);
                GameConfig.instance.SetGeoIP(result["ip"]);
                GameConfig.instance.SetCountry(result["countryCode"]);
                this.CheckAndLogin();
            }
        }
        xhr.onerror = (error) => {
            this.Log("Xhr error", error);
            GameConfig.instance.SetGeoIP("none");
            this.Log("Unable to get geo IP - skipping geo IP call");
            this.CheckAndLogin();
        };
        xhr.send();
    }

    private CheckAndLogin () {
        if (GameConfig.instance.IsBOv2()) {
            this.InitializeSocketIO(GameConfig.instance.GetSocketURL());
        } else {
            this.Login();
        }
    }

    private Login () {
        let that = this;
        that.Log("Login: ", GameConfig.instance.GetURLLink(), GameConfig.instance.GetHostID(), GameConfig.instance.GetAccessToken() , GameConfig.instance.GetGameCode());
        
        let xhr = new XMLHttpRequest();
        let body = "host_id="+GameConfig.instance.GetHostID()+"&access_token="+GameConfig.instance.GetAccessToken()+"&device_type=Desktop&game_code="+GameConfig.instance.GetGameCode()+"&country_code="+GameConfig.instance.GetCountry()+"&is_promotion="+GameConfig.instance.GetPromotion();
        let url = GameConfig.instance.GetURLLink()+"?host_id="+GameConfig.instance.GetHostID()+"&access_token="+GameConfig.instance.GetAccessToken()+"&game_code="+GameConfig.instance.GetGameCode()+"&is_promotion="+GameConfig.instance.GetPromotion();
        this.Log("Login url: ", url);
        this.Log("Login body: ", body);

        xhr.open("POST", url, true);
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        xhr.setRequestHeader("Accept-Language", "en-US");
        xhr.onreadystatechange = async () => {
            if (xhr.readyState == 4 && (xhr.status >= 200 && xhr.status <= 207)) {
                let result = JSON.parse(xhr.responseText);

                if(result.hasOwnProperty("error")) {
                    alert(result["error"]["message"].toString());
                    return;
                }

                that.Log("Login config result:", result);
                that.UpdateLoginResponseData(result["data"]);
                
                await AssetManager?.instance?.UpdateCurrencyData(); // Update currency exponent from mapping and asset bundle if available

                dispatchEvent(new CustomEvent(GameStateEvent.game_initialize));
            }
        };
        xhr.onerror = (error) => {
            this.Log("Login error: ", error);
        };
        xhr.send(body);
    }

    private UpdateLoginResponseData (result: any) {
        let responseData = {};
        if (GameConfig.instance.IsBOv2()) {
            let bov2Response = result["config"]["configs"];

            responseData["username"] = bov2Response["username"];
            responseData["balance"] = bov2Response["balance"];
            responseData["user_id"] = bov2Response["clientId"];
            responseData["maxline"] = GameConfig.instance.GetMaxLine(); // BOv2 max line config will use game value
            responseData["rtp"] = "96.00"; // hardcoded
            responseData["denominator"] = bov2Response["denominator"];
            responseData["currency"] = bov2Response["currencyCode"];
            responseData["currency_exponent"] = bov2Response["currencyExponent"];
            responseData["multiplier"] = bov2Response["multiplier"];
            responseData["lobby_url"] = bov2Response["lobbyUrl"];
            responseData["is_demo"] = 0; // no demo mode for AWP version 2
            responseData["game_type"] = bov2Response["gameType"];
            responseData["default_denominator"] = bov2Response["defaultDenominator"];
            responseData["default_multiplier"] = bov2Response["defaultMultiplier"];
            responseData["dynamic_assets_url"] = bov2Response["dynamicAssetsUrl"];

            responseData["show_intro_paytable"] = result["config"]["show_intro_paytable"];

            if (result["config"]["freespins"] != null 
                && result["config"]["freespins"]["config_value"] != null 
                && result["config"]["freespins"]["config_value"].length > 0) {

                let freeSpinData = JSON.parse(result["config"]["freespins"]["config_value"]);
                responseData["free_spin"] = freeSpinData;
            }

        } else {
            responseData = result;
        }

        GameConfig.instance.GetUsername(responseData["username"]);
        GameConfig.instance.GetDefaultBalance(responseData["balance"]);
        GameConfig.instance.GetUserID(responseData["user_id"]);
        GameConfig.instance.GetMaxLine(responseData["maxline"]);
        GameConfig.instance.GetRTP(responseData["rtp"]);
        GameConfig.instance.GetDenominator(responseData["denominator"]);

        GameConfig.instance.GetCurrency(responseData["currency"]);
        GameConfig.instance.GetCurrencyExponent(responseData["currency_exponent"]);
        GameConfig.instance.SetShowIntroPaytable(responseData["show_intro_paytable"]);

        GameConfig.instance.GetMultiplier(responseData["multiplier"]);
        GameConfig.instance.GetJackpotMinor(responseData["minor"]);
        GameConfig.instance.GetJackpotMajor(responseData["major"]);
        GameConfig.instance.GetSlotType(responseData["slot_type"]);
        GameConfig.instance.GetJackpotType(responseData["jackpot_type"]);

        if (GameConfig.instance.IsBOv2()) {
            GameConfig.instance.SetLobbyUrl(responseData["lobby_url"]);
        } else {
            GameConfig.instance.SetPlatformUrls(responseData["lobby_url"]); // for playtech - lobby_url - contains multiple urls
        }

        GameConfig.instance.GetSocketURL(responseData["socket_url"]);
        GameConfig.instance.IsDemo(responseData["is_demo"]);
        GameConfig.instance.GetGameType(responseData["game_type"]);

        this.Log("GameType " , GameConfig.instance.GetGameType());

        GameConfig.instance.GetDefaultDenom(responseData["default_denominator"]);
        GameConfig.instance.GetDefaultMultiplier(responseData["default_multiplier"]);
        GameConfig.instance.SetDynamicAssetsURL(responseData["dynamic_assets_url"]);

        GameData.instance.SetLoginResponseData(responseData);
        GameData.instance.SetMaxLine(GameConfig.instance.GetMaxLine());
        GameData.instance.SetLineBetList(GameConfig.instance.GetMultiplier(), GameConfig.instance.GetDenominator()[0]);
        GameData.instance.SetLine(GameConfig.instance.GetMaxLine());
        GameData.instance.SetBalance(GameConfig.instance.GetDefaultBalance());

        // run custom response handler on login results
        ResponseIntegration.loginResponseHandler(responseData);
    }

    private EmitUser (userID: number, 
                        userHostID: string, 
                        userToken: string, 
                        userBalance: number, 
                        userLocalIP: string, 
                        userName: string, 
                        isDemo: number, 
                        gameType: string,
                        rtp: number,
                        slotType: string,
                        socketStatus: number,
                        mycurrency: string,
                        isApollo: boolean,
                        defaultBet: number
    ) {

        let data: any = null;
        if(sys.isMobile) {
            data = JSON.stringify({user_id: userID, 
                    game_code: GameConfig.instance.GetGameCode(), 
                    host_id: userHostID , 
                    access_token: userToken, 
                    credits: userBalance,
                    username: userName,
                    // device_type: "Mobile",
                    ip_address: userLocalIP,
                    is_demo: isDemo,
                    jackpot_type: gameType,
                    rtp: rtp,
                    slot_type: slotType,
                    socket_state: socketStatus,
                    currency: GameConfig.instance.GetCurrency(),
                    is_apollo: isApollo,
                    default_bet: defaultBet,
                    device_type: Utils.GetDeviceType(),
                    os_type: Utils.GetDeviseOS(),
                    h5_app: Utils.GetH5App(),
                    browser_type: Utils.GetBrowserType(),
                    os_version: Utils.GetOSversion(),
                    phone_model: Utils.GetPhoneModel(),
                    user_agent: Utils.GetUserAgent(),
                    event_type: GameConfig.instance.GetPromotion()});
        } else {
            data = JSON.stringify({
                    user_id: userID, 
                    game_code: GameConfig.instance.GetGameCode(), 
                    host_id: userHostID, 
                    access_token: userToken, 
                    credits: userBalance,
                    username: userName,
                    // device_type: "Desktop",
                    ip_address: userLocalIP,
                    is_demo: isDemo,
                    jackpot_type: gameType,
                    rtp: rtp,
                    slot_type: slotType,
                    socket_state: socketStatus,
                    currency: GameConfig.instance.GetCurrency(),
                    is_apollo: isApollo,
                    default_bet: defaultBet,
                    device_type: Utils.GetDeviceType(),
                    os_type: Utils.GetDeviseOS(),
                    h5_app: Utils.GetH5App(),
                    browser_type: Utils.GetBrowserType(),
                    os_version: Utils.GetOSversion(),
                    phone_model: Utils.GetPhoneModel(),
                    user_agent: Utils.GetUserAgent(),
                    event_type: GameConfig.instance.GetPromotion()});
        }

        this.Log("Emit user - subscribe data:", data);
        let subscribeData = this.isEncrypt? Encryption.encrypt(data) : data;
        this.socketio.RequestEvent('subscribe', subscribeData);
    }

    private EmitUserBOv2 () {
        let data: any = null;
        data = JSON.stringify({
            game_code: GameConfig.instance.GetGameCode(), 
            access_token:  GameConfig.instance.GetAccessToken(),
            device_type: sys.isMobile? "Mobile" : "Desktop",
            country: GameConfig.instance.GetCountry(),
            ip_address: GameConfig.instance.GetGeoIP()
        });

        this.Log("Emit user v2 - subscribe data:", data);
        let subscribeData = this.isEncrypt? Encryption.encrypt(data) : data;
        this.socketio.RequestEvent('subscribe', subscribeData);
    }

    public Call_BetHistory (callback: (result)=>{}, errorCallback: (error)=>{} = null) {
        let xhr = new XMLHttpRequest();
        let getBetHistoryUrl = GameConfig.instance.GetAPIURL(); // TODO
        // test api for ptslot-002
        // https://pt-api.ippcoin.com/api/user/slot-report?host_id=0e83088027d4c42c8e9934388480c996&access_token=demo16&game_code=010&day=100&page_size=10&cursor=
        xhr.open("GET", getBetHistoryUrl, true);
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        xhr.setRequestHeader("Accept-Language", "en-US");
        xhr.onreadystatechange = () => {
            if (xhr.readyState == 4 && (xhr.status >= 200 && xhr.status <= 207)) {
                let result = JSON.parse(xhr.responseText);
                callback(result);
            } else {
                errorCallback?.({status: xhr.status});
            }
        }
        xhr.onerror = (error) => {
            this.Log("Xhr error", error);
            errorCallback?.(error);
        };
        xhr.send();
    }

    // #endregion
    // =====================================================================



    // =====================================================================
    // Private / utilities functions
    // #region
    // =====================================================================

    private Log (...message: any[]) {
        if (DEBUG) log("{", NetworkController.name, "}", ...message);
    }

    private ProcessResponseData (data: any) {
        
        if(this.isEncrypt) {
            let decryptedData = Encryption.decrypt(data);
            data = JSON.parse(decryptedData);
        }

        if (this.logResponseData) {
            this.Log("Response data:", data);
        }

        return data;
    }

    // #endregion
    // =====================================================================



    // =====================================================================
    // SocketIO events interfaces
    // #region
    // =====================================================================

    OnConnected (socketID: string) : void {
        this.authorizedSocketID = socketID;
        this.Log("OnConnected - authorized socket id: ", this.authorizedSocketID);

        if (GameConfig.instance.IsBOv2()) {
            this.EmitUserBOv2();
        } else {
            this.EmitUser(GameConfig.instance.GetUserID(),//1
                GameConfig.instance.GetHostID(),//2
                GameConfig.instance.GetAccessToken(),//3
                GameConfig.instance.GetDefaultBalance(),//4
                GameConfig.instance.GetGeoIPUrl(),//5
                GameConfig.instance.GetUsername(),//6
                GameConfig.instance.IsDemo(),//7
                GameConfig.instance.GetJackpotType(),//8
                GameConfig.instance.GetRTP(),//9
                GameConfig.instance.GetSlotType(),//10
                this.socketStatus,//11
                GameConfig.instance.GetCurrency(),
                true,
                GameConfig.instance.GetDefaultBet()
            );//13
        }
    }

    OnDisconnected (reason: string, isServerDisconnected: boolean) : void {
        this.Log("OnDisconnected - reason: ", reason, "| server disconnect: ", isServerDisconnected);
        let message = "Network disconnected. Please restart the game.";
        if (AssetManager?.instance != null) {
            let locMessage1 = AssetManager.instance.GetTextWithKey("UI.Disconnected");
            let locMessage2 = AssetManager.instance.GetTextWithKey("UI.RestartGame");
            let locMessage = locMessage1 + " " + locMessage2;
            if (locMessage1 != null && locMessage2 != null) message = locMessage;
        }
        
        let popupOption = new PopupOption(message, () => {
            window.location.href = GameConfig.instance.GetLobbyUrl();
        });
        dispatchEvent(new CustomEvent(GameStateEvent.popup_message, {detail: popupOption}));
    }

    OnConnectError () : void {
        this.Log("OnConnectError");
        
        let message = "Connect error. Please restart the game.";
        if (AssetManager?.instance != null) {
            let locMessage1 = AssetManager.instance.GetTextWithKey("UI.Disconnected");
            let locMessage2 = AssetManager.instance.GetTextWithKey("UI.RestartGame");
            let locMessage = locMessage1 + " " + locMessage2;
            if (locMessage1 != null && locMessage2 != null) message = locMessage;
        }
        
        let popupOption = new PopupOption(message, () => {
            window.location.href = GameConfig.instance.GetLobbyUrl();
        });
        dispatchEvent(new CustomEvent(GameStateEvent.popup_message, {detail: popupOption}));
    }
    
    OnReconnectAttempt (attempt: number) : void {
        this.Log("OnReconnectAttempt - attempt: ", attempt);
    }

    OnReconnected () : void {
        this.Log("OnReconnected");

        // TODO: this is copy from v2 framework, double check usage of this socket status and remove if not needed
        this.socketStatus = 1;
    }

    // #endregion
    // =====================================================================
}