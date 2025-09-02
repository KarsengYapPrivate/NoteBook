import { _decorator, CCString, Component, log } from 'cc';
import {default as Encryption} from '../Util/Encryption/ecrypt.js';
const { ccclass, property } = _decorator;

@ccclass('GameConfig')
export default class GameConfig extends Component {

    // =====================================================================
    // Static instance
    // =====================================================================
    static instance: GameConfig = null;


    // =====================================================================
    // Config variables
    // #region
    // =====================================================================

    @property private gameCode: string = "148"; // old BO e.g. "1" / BOv2 e.g. "ptslot-001"
    private slotType: string = ""; // no need to set at frontend, value get from login - reference: slot-lineA-02-monkeyking

    @property private isBOv2: boolean = false;
    @property({type: CCString, visible:function(this:GameConfig) {return this.isBOv2;}}) 
    private socketURL: string = "https://slots-middleware.bochap.net";

    // manually Set
    // "https://api-xin-stage.xingamers.com"; /// https://bo-stage.lovesquidgame.xyz // "https://bo-stage.slot28.com";
    @property private API_url = "https://pt-api.ippcoin.com"; // point to 18.140.204.87
    // https://bo-stage.lovesquidgame.xyz
    // https://pt-api.ippcoin.com
    private API_url_demo = "/api/user/get-settings-demo";
    private API_url_member = "/api/user/get-settings";
    private dynamic_assets_url = "";
    // slotify "https://geoip.slotify.online/ipapi" 
    // playtech "https://geoip.playtechgamers.com/ipapi"
    @property private geoIPUrl = "https://geoip.playtechgamers.com/ipapi"; 
    private geoIP = "";

    private hostID = ""; // 0e83088027d4c42c8e9934388480c996
    private accessToken = ""; // default
    private defaultAccessToken = "demo01"; // default for old BO
    private defaultAccessTokenBOv2 = ""; // default for BOv2 - demo1 demo2 ...

    private gameName = "";
    private username = "";
    private userID = 0;
    private currency = "MYR";
    private currencyExponent = 2; // e.g.: 2 = "1.23", 0 = "1" // 0.23 will be rounded off 
    private currencySymbol = "$"; // default to "$"
    private showIntroPaytable = false;
    
    private defaultBalance = 10000;
    private isDemo = 0;
    private jackpotType = "AWP";
    private rtp = 96;
    private denominator = [];

    private lobbyUrl = "";
    private supportUrl = "";
    private logoutUrl = "";
    private historyUrl = "";
    private cashierUrl = "";

    private gameLang = "en";
    private jackpotMajor = null;
    private jackpotMinor = null;
    private gameType = "aslot-001";
    private country = "my";

    private defaultDenom = 0;
    private defaultMultiplier = 0;
    private maxLine: number = 30;
    private multiplier: any[] = [];

    private defaultBet = 0;
    private urlParams = null;

    @property private beforePresenterDelayMillis: number = 50;
    @property private afterPresenterDelayMillis: number = 50;
    @property private minimumSpinSecond: number = 0.5;
    @property private minimumTurboSpinSecond: number = 0.1;
    @property private autoSpinDelaySecond: number = 0.5;

    // #endregion
    // =====================================================================
    
    protected onLoad (): void {
        if (GameConfig.instance == null) {
            GameConfig.instance = this;
        }

        let endPointConfig = window["endPointConfig"];
        let encryptedEndPointConfig = window["encryptedEndPointConfig"] != null ? window["encryptedEndPointConfig"] : true;

        if (endPointConfig != null) {
            let networkConfig = encryptedEndPointConfig ? Encryption.decrypt(endPointConfig) : endPointConfig;

            if (networkConfig != null) {
                let networkConfigJson = encryptedEndPointConfig ? JSON.parse(networkConfig) : networkConfig;

                GameConfig.instance.SetAPIURL(networkConfigJson.api_url);
                GameConfig.instance.GetSocketURL(networkConfigJson.socket_url);
                GameConfig.instance.SetGeoIPUrl(networkConfigJson.geoip_url);
            }
        }

        if(window["gameCode"] != null) {
            let encryptedKey = window["gameCode"];
            if (encryptedKey.length > 0) {
                this.gameCode = Encryption.decrypt(encryptedKey);
            }
        } else {
            console.log("SCMS API key not found in config, using default value!");
        }
    }

    GetDynamicAssetsURL () {
        return this.dynamic_assets_url;
    }

    SetDynamicAssetsURL (value: any = null) {
        this.dynamic_assets_url = value;
        return this.dynamic_assets_url;
    }

    GetCountry () {
        return this.country;
    }

    SetCountry (data: string) {
        if (data != null) {
            this.country = data;
        }
    }

    GetJackpotMinor (data: any = null) {
        if(data==null) {
            return this.jackpotMinor;
        } else {
            this.jackpotMinor = data;
            return this.jackpotMinor;
        }
    }

    GetJackpotMajor (data: any = null) {

        if(data==null) {
            return this.jackpotMajor;
        } else {
            this.jackpotMajor = data;
            return this.jackpotMajor;
        }
    }

    GetMultiplier (data: any = null) {
        if(data==null) {
            return this.multiplier;
        } else {
            this.multiplier = data;
            return this.multiplier;
        }
    }

    SetGeoIP (value: any = null) {
        this.geoIP = value;
    }

    GetGeoIP () {
        return this.geoIP;
    }

    IsBOv2 () {
        return this.isBOv2;
    }

    SetIsBOv2 (value: any = null) {
        this.isBOv2 = value;
    }

    GetAPIURL () {
        return this.API_url;
    }

    SetAPIURL (value: any = null) {
        this.API_url = value;
    }

    GetDefaultMultiplier (data: any = null) {
        if(data==null) {
            return this.defaultMultiplier;
        } else {
            this.defaultMultiplier = data;
            return this.defaultDenom;
        }
    }

    GetDefaultDenom (data: any = null) {
        if(data==null) {
            return this.defaultDenom;
        } else {
            this.defaultDenom = data;
            return this.defaultDenom;
        }
    }

    GetSocketURL (value: any = null) {
        if(value == null) {
            return this.socketURL;
        } else {
            this.socketURL = value;
            return this.socketURL;
        }
    }

    GetDefaultBalance (value: any = null) {
        if(value == null) {
            return this.defaultBalance;
        } else {
            this.defaultBalance = value;
            return this.defaultBalance;
        }
    }

    GetCurrency (value: any = null) {
        if(value == null) {
            return this.currency;
        } else {
            this.currency = value;
            return this.currency;
        }
    }

    GetCurrencyExponent (value: any = null) {
        if(value == null) {
            return this.currencyExponent;
        } else {
            this.currencyExponent = value;
            return this.currencyExponent;
        }
    }

    SetCurrencySymbol (value: string = null) {
        if(value != null) {
            this.currencySymbol = value;
        }
    }

    GetCurrencySymbol () {
        return this.currencySymbol;
    }

    SetShowIntroPaytable (value: boolean = null) {
        if(value != null) {
            this.showIntroPaytable = value;
        }
    }

    IsShowIntroPaytable () {
        return this.showIntroPaytable;
    }

    GetUsername (value: any = null) {
        if(value == null) {
            return this.username;
        } else {
            this.username = value;
            return this.username;
        }
    }

    GetMaxLine (value: any = null) {
        if(value == null) {
            return this.maxLine;
        } else {
            this.maxLine = value;
            return this.maxLine;
        }
    }

    GetRTP (value: any = null) {
        if(value == null) {
            return this.rtp;
        } else {
            this.rtp = value;
            return this.rtp;
        }
    }

    GetJackpotType (value: any = null) {
        if(value == null) {
            return this.jackpotType;
        } else {
            this.jackpotType = value;
            return this.jackpotType;
        }
    }

    GetDenominator (value: any = null) {
        if(value == null) {
            return this.denominator;
        } else {
            this.denominator = value;
            return this.denominator;
        }
    }

    GetUserID (value: any = null) {
        if(value == null) {
            return this.userID;
        } else {
            this.userID = value;
            return this.userID;
        }
    }

    IsDemo (value: any = null) {
        if(value == null) {
            return this.isDemo;
        } else {
            this.isDemo = value;
            return this.isDemo;
        }
    }

    GetGameType (value: any = null) {
        if(value == null)
            return this.gameType;
        else {
            this.gameType = value;
            return this.gameType;
        }
    }

    GetBeforePresenterDelayMillis () {
        return this.beforePresenterDelayMillis;
    }

    GetAfterPresenterDelayMillis () {
        return this.afterPresenterDelayMillis;
    }

    GetMinimumSpinSecond () {
        return this.minimumSpinSecond;
    }

    GetMinimumTurboSpinSecond () {
        return this.minimumTurboSpinSecond;
    }
    
    GetAutoSpinDelaySecond () {
        return this.autoSpinDelaySecond;
    }

    GetGameName (value: any = null) {
        if(value == null) {
            return this.gameName;
        } else {
            this.gameName = value;
            return this.gameName;
        }
    }

    GetGeoIPUrl () {
        return this.geoIPUrl;
    }

    SetGeoIPUrl (value: string) {
        if (value != null) {
            this.geoIPUrl = value;
        }
    }

    GetGameLanguage () {
        let language = this.GetURLParam("lang");
        if(language != null && language != "undefined") {
            this.gameLang = language;
        }
        return this.gameLang;
    }

    GetURLLink () {
        let data = "";
        if(this.GetURLParam("host_id") != null && this.GetURLParam("access_token") != null) {
            data = this.API_url + this.API_url_member;
        } else {
            data = this.API_url + this.API_url_demo;
        }
        return data;
    }

    GetGameCode () {
        return this.gameCode;
    }

    GetSlotType (value: any = null) {
        if(value == null) {
            return this.slotType;
        } else {
            this.slotType = value;
            return this.slotType;
        }
    }

    GetURLParam(urlParam: string) {
        if (this.urlParams == null) {
            this.urlParams = new URLSearchParams(window.location.search);
        }

        let data = this.urlParams.get(urlParam);

        if(data == null || data == "") {
            data = null;
        }

        return data;
    }

    GetHostID () {
        let hostID = this.GetURLParam("host_id");
        if(hostID != null && hostID != "") {
            this.hostID = hostID;
        }
        return this.hostID;
    }

    GetAccessToken () {
        let accessToken = this.GetURLParam("access_token");
        if (accessToken != null) {
            this.accessToken = accessToken;
        } else if (this.accessToken.length <= 0) {
            this.accessToken = this.IsBOv2()? this.defaultAccessTokenBOv2 : this.defaultAccessToken;
        }
        return this.accessToken;
    }

    GetPromotion () {
        let data = this.GetURLParam("is_promotion");
        if (data == null || data == "") {
            data = 0;
        }
        return data;
    }
    
    GetDefaultBet(value: any = null) {
        if(value == null) {
            return this.defaultBet;
        } else {
            this.defaultBet  =value;
            return this.defaultBet;
        }
    }

    SetPlatformUrls (platformUrlString: string) {
        let platformUrls = null;

        try {
            platformUrls = JSON.parse(platformUrlString);
        } catch (e) {
            platformUrls = {};
        }

        this.supportUrl = platformUrls['support'] != null? platformUrls['support'] : this.supportUrl;
        this.logoutUrl = platformUrls['logout'] != null? platformUrls['logout'] : this.logoutUrl;
        this.historyUrl = platformUrls['history'] != null? platformUrls['history'] : this.historyUrl;
        this.lobbyUrl = platformUrls['lobby'] != null? platformUrls['lobby'] : this.lobbyUrl;
        this.cashierUrl = platformUrls['cashier'] != null? platformUrls['cashier'] : this.cashierUrl;
    }

    SetLobbyUrl (lobbyUrl: string) {
        this.lobbyUrl = lobbyUrl;
    }

    GetLobbyUrl () {
        return this.lobbyUrl;
    }

    GetSupportUrl () {
        return this.supportUrl;
    }

    GetHistoryUrl () {
        return this.historyUrl;
    }

    GetLogoutUrl () {
        return this.logoutUrl;
    }

    GetCashierUrl () {
        return this.cashierUrl;
    }
}


