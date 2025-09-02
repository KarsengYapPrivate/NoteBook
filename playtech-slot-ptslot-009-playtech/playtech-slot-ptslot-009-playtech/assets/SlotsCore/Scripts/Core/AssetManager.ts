import { _decorator, assetManager, BitmapFont, Component, director, error, Font, ImageAsset, log, SpriteFrame, TextAsset } from 'cc';
import { DEBUG } from 'cc/env';
import { GameState, GameStateAction, GameStateEvent } from '../Model/GameStateData';
import { LoadingProgressDetail } from '../Model/LoadingProgressDetail';
import Utils from '../Util/Utils';
import {default as Encryption} from '../Util/Encryption/ecrypt.js';
import { BaseLocalizationScript } from '../Localization/BaseLocalizationScript';
import GameConfig from '../Model/GameConfig';
import { FontLocalizationScript } from '../Localization/FontLocalizationScript';
const { ccclass, property } = _decorator;

interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface FontDefDictionaryItem {
    rect: Rect;
    xOffset: number;
    yOffset: number;
    xAdvance: number;

}

interface FntConfig {
    atlasName: string;
    commonHeight: number;
    fontDefDictionary: {
        [charId: string]: FontDefDictionaryItem;
    };
    fontSize: number;
    kerningDict: Record<string, unknown>; // assuming kerningDict is an empty object
}
   
   

@ccclass('AssetManager')
export class AssetManager extends Component {

    public static instance: AssetManager = null;

    @property(String) private scmsAPIUrl = "";
    @property(String) private scmsAPIKey = "";
    //https://playtech-pop.s3.ap-southeast-1.amazonaws.com/dynamic-assets/staging/errorMessage.json

    private scmsLanguageCodeMapping = null;
    private isScmsLanguageCodeLoaded = false;
    private languageCodeComponentKey = "LanguageCode";

    private scmsCurrencyCodeMapping = null;
    private scmsCurrencyFontAssetsData = null;
    private isScmsCurrencyCodeLoaded = false;
    private currencyCodeComponentKey = "CurrencyCode";
    private scmsCurrencyFontDatas = {};
    private scmsCurrencyFontImages = {};
    private testscms = {};
    private gameCurrencyFont = null;

    private gameAssetLocalizationKey = "GameAsset";

    private textLocalizationKey = "TextLocalization";
    private textLocalization: any = {};

    private artAssetPathsKey = "ArtAssets";
    // private graphicKey: string = "graphic";
    // private graphicCropString: string = "";
    private graphicPaths: any = [];
    private loadedSpriteFrames: any = {};

    private scmsLanguageCode = "en";
    private gameLanguage = "en";

    private scmsTotalAssetsCount = 2;
    private scmsLoadedAssetsCount = 0;

    onLoad() {

        if (AssetManager.instance == null) {
            AssetManager.instance = this;
            director.addPersistRootNode(this.node);

            let urlParams = new URLSearchParams(window.location.search);
            let urlLanguage = urlParams.get("lang");

            if (urlLanguage != null && urlLanguage.length > 0 && urlLanguage != "undefined") {
                this.gameLanguage = urlLanguage.toLowerCase();
            }

            this.LoadEndPointConfig();
            this.LoadScmsLanguageCode();
            this.LoadScmsCurrencyCode();

            addEventListener(GameStateEvent.load_asset_start, this.OnLoadAssetStart.bind(this));
            addEventListener(GameStateEvent.game_state_changed, this.OnGameStateChanged.bind(this));

        } else {
            this.node.destroy();
        }
    }

    OnGameStateChanged () {
        if (Utils.CheckCurrentGameState(GameStateAction.enter, GameState.initialize)) {
            let baseLocalizationScripts: BaseLocalizationScript[] = director.getScene().getComponentsInChildren(BaseLocalizationScript);
            for (let i = 0; i < baseLocalizationScripts.length; i++) {
                baseLocalizationScripts[i].InitLocalization();
            }
        } else if (Utils.CheckCurrentGameState(GameStateAction.exit, GameState.login)) {
            // Currency code only get after logged in, so need to update font after login 
            
            if (this.scmsCurrencyFontDatas[GameConfig.instance.GetCurrency()] != null
                && this.scmsCurrencyFontImages[GameConfig.instance.GetCurrency()] != null) {
                this.gameCurrencyFont = new BitmapFont();
                this.gameCurrencyFont.fntConfig = this.scmsCurrencyFontDatas[GameConfig.instance.GetCurrency()];
                this.gameCurrencyFont.spriteFrame = this.scmsCurrencyFontImages[GameConfig.instance.GetCurrency()];
            }

            let fontLocalizationScripts: FontLocalizationScript[] = director.getScene().getComponentsInChildren(FontLocalizationScript);
            for (let i = 0; i < fontLocalizationScripts.length; i++) {
                fontLocalizationScripts[i].InitLocalization();
            }
        }
    }

    LoadEndPointConfig() {
        let encryptedEndPointConfig = window["encryptedEndPointConfig"] != null? window["encryptedEndPointConfig"] : true;
 
        if(window["endPointConfig"] != null) {
            let endPointConfig = encryptedEndPointConfig ? Encryption.decrypt(window["endPointConfig"]) : window["endPointConfig"];
            if(endPointConfig != null) {
                let endPointConfigJson = encryptedEndPointConfig ? JSON.parse(endPointConfig) : endPointConfig;
               
                if (endPointConfigJson.scmsAPIUrl != null) {
                    this.scmsAPIUrl = endPointConfigJson.scmsAPIUrl;
                } else {
                    console.log("SCMS API url not found in config, using default value!");
                }
            } else {
                console.log("Failed to process end point config, using default value!");
            }

        } else {
            console.log("End point config not found, using default value!");
        }

        if(window["scmsAPIKey"] != null) {
            let encryptedKey = window["scmsAPIKey"];
            if(encryptedKey.length > 0) {
                this.scmsAPIKey = Encryption.decrypt(encryptedKey);
            }
        } else {
            console.log("SCMS API key not found in config, using default value!");
        }
    }

    LoadScmsLanguageCode() {
        let that = this;
        let xhr = that.CreateGetRequest("en", that.languageCodeComponentKey); // language code is hardcoded at en
        xhr.onreadystatechange = (() => {
            if (xhr.readyState == 4 && (xhr.status >= 200 && xhr.status <= 207)) {
                let result = JSON.parse(xhr.responseText);
                try {
                    that.scmsLanguageCodeMapping = result["data"][0][that.languageCodeComponentKey]["en"]["Mapping"];

                    for (let key in that.scmsLanguageCodeMapping) {
                        let languageKey = that.scmsLanguageCodeMapping[key];
                        let languageCode = languageKey.language_code;

                        // if string means without country code and match with first 2 letter
                        if (typeof(languageCode) === "string") {
                            let escapeRegex = function (string) {
                                return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                            }
                            
                            let pattern = `^${escapeRegex(languageCode)}.*`;
                            let regex = new RegExp(pattern);

                            if (regex.test(that.gameLanguage) == true) {
                                that.scmsLanguageCode = key;
                                break;
                            }

                        } else { // else is an array then check exact match

                            let isMatch = false;
                            for (let i = 0; i < languageCode.length; i++) {
                                if (that.gameLanguage == languageCode[i]) {
                                    isMatch = true;
                                    break;
                                }
                            }
                            if (isMatch) {
                                that.scmsLanguageCode = key;
                                break;
                            }
                        }
                    }

                    log("SCMS language code loaded successfully! Language code:", that.scmsLanguageCode);

                } catch (err) {
                    log("Unable to get language code mapping from scms result:", result)
                } finally {
                    that.isScmsLanguageCodeLoaded = true;
                }
            }
        }).bind(this);
        xhr.onerror = ((error) => {
            that.isScmsLanguageCodeLoaded = true;
            this.Log("Load scms language code xhr error:", error);
        }).bind(this);
        xhr.send();
    }

    LoadScmsCurrencyCode() {
        let that = this;
        let xhr = this.CreateGetRequest("en", that.currencyCodeComponentKey); // currency code is hardcoded at en
        xhr.onreadystatechange = (() => {
            if (xhr.readyState == 4 && (xhr.status >= 200 && xhr.status <= 207)) {
                let result = JSON.parse(xhr.responseText);
                try {
                    that.scmsCurrencyCodeMapping = result["data"][0][that.currencyCodeComponentKey]["en"]["Mapping"];
                    that.scmsCurrencyFontAssetsData = result["data"][0][that.currencyCodeComponentKey]["en"]["Assets"][0];

                    log("SCMS currency code loaded successfully! Currency code:", that.scmsCurrencyCodeMapping);

                } catch (err) {
                    log("Unable to get currency code mapping from scms result:", result)
                } finally {
                    that.isScmsCurrencyCodeLoaded = true;
                }
            }
        }).bind(this);
        xhr.onerror = ((error) => {
            that.isScmsCurrencyCodeLoaded = true;
            this.Log("Load scms currency code xhr error:", error);
        }).bind(this);
        xhr.send();
    }

    OnLoadAssetStart () {
        let that = this;
        let textLocLoadingProgress = new LoadingProgressDetail().UpdateWithObject({
            key: LoadingProgressDetail.ASSET_MANAGER_KEY,
            completedCount: 0,
            totalCount: 2
        });

        dispatchEvent(new CustomEvent(GameStateEvent.load_asset_update_progress, {detail: textLocLoadingProgress}));

        setTimeout(() => {
            that.isScmsLanguageCodeLoaded = true;
            that.isScmsCurrencyCodeLoaded = true;
        }, 10000); // 10 seconds timeout for loading scms language code
        Utils.WaitForCondition(() => {
            return that.isScmsLanguageCodeLoaded == true && that.isScmsCurrencyCodeLoaded == true;
        }).then(() => {
            that.LoadScmsGameAssets();
            that.LoadSCMSCurrencyFontAssets();
        });
    }

    LoadRemote (url: string, progressCallback: (finished, total, item) => void, completedCallback: (err, data) => void) {
        let options = { preset: "remote" }; // need to pass in preset remote to indicate this is a remote load
        assetManager.loadAny({ url: url }, options, progressCallback, completedCallback);
    }

    LoadScmsGameAssets () {
        let that = this;

        let xhr = that.CreateGetRequest(that.scmsLanguageCode, that.gameAssetLocalizationKey);
        xhr.onreadystatechange = (() => {
            if (xhr.readyState == 4 && (xhr.status >= 200 && xhr.status <= 207)) {
                let result = JSON.parse(xhr.responseText);

                try {
                    let textLocalization = result["data"][0][that.gameAssetLocalizationKey][that.scmsLanguageCode][that.textLocalizationKey];
                    if (textLocalization != null) {
                        that.textLocalization = textLocalization;
                    }

                    let artAsset = result["data"][0][that.gameAssetLocalizationKey][that.scmsLanguageCode][that.artAssetPathsKey][0];
                    if (artAsset != null) {

                        let artAssetPaths = artAsset["file_url"];
                        let pathPrefix = artAsset["path_dir_url"];
                        
                        that.graphicPaths = [];
                        for (let i = 0; i < artAssetPaths.length; i++) {
                            that.graphicPaths.push(pathPrefix + artAssetPaths[i]);
                        }
                    }

                } catch (err) {
                    log("Error loading localization assets!");
                } finally {
                    that.ScmsLoadComplete();
                }
            }
        }).bind(that);
        xhr.onerror = ((error) => {
            that.ScmsLoadComplete();
            that.Log("Load text localization xhr error:", error);
        }).bind(that);
        xhr.send();
    }
    
    protected LoadAssetCompleteEventFunc = () => {
        log("{ Asset Manager } Loaded sprite keys:", Object.keys(this.loadedSpriteFrames));

        this.scmsLoadedAssetsCount += 1;
        let textLocLoadingComplete = new LoadingProgressDetail().UpdateWithObject({
            key: LoadingProgressDetail.ASSET_MANAGER_KEY,
            completedCount: this.scmsLoadedAssetsCount,
            totalCount: this.scmsTotalAssetsCount
        });
        dispatchEvent(new CustomEvent(GameStateEvent.load_asset_update_progress, {detail: textLocLoadingComplete}));
    };

    protected ScmsLoadComplete () {
        let that = this;

        if (that.graphicPaths.length > 0) {
            let imagesLoaded = 0;
            let totalImages = that.graphicPaths.length;
            let checkAllImagesLoaded = () => {
                imagesLoaded++;
                if (imagesLoaded >= totalImages) {
                    that.LoadAssetCompleteEventFunc();
                }
            };
    
            that.graphicPaths.forEach(graphicUrl => {
                assetManager.loadRemote(graphicUrl, (err, imageAsset: ImageAsset) => {
                    if (err) {
                        error("Failed to load image asset: ", graphicUrl);
                    }
                    // Let SpriteFrame create from png and store loaded SpriteFrames with their name as the key
                    let spriteFrame = SpriteFrame.createWithImage(imageAsset);
                    let imgKey = that.ExtractImageName(graphicUrl);
                    that.loadedSpriteFrames[imgKey] = spriteFrame;
                    checkAllImagesLoaded();
                });
            });

        } else {
            that.LoadAssetCompleteEventFunc();
        }
    }

    private CreateGetRequest (languageCode: string = null, componentName: string = null) : XMLHttpRequest {
        let xhr = new XMLHttpRequest();
        let languageParam = languageCode != null? ("?language_code=" + languageCode) : "";
        let componentParam = componentName != null? ("&component_name=" + componentName) : "";
        let refinedUrl = this.scmsAPIUrl + languageParam + componentParam;

        xhr.open("GET", refinedUrl, true);
        xhr.setRequestHeader("scms-api-key", this.scmsAPIKey);
        return xhr;
    }

    private Log (...message: any[]) {
        if (DEBUG) log("{", AssetManager.name, "}", ...message);
    }

    public GetSpriteFrameWithKey (key: string) {
        return this.loadedSpriteFrames[key];
    }

    public GetTextWithKey (key: string) {
        let keys = key.split(".");
        return this.RecurssiveGetTextWithKey(keys, this.textLocalization);
    }

    private RecurssiveGetTextWithKey (keys: string[], textDictionary: any) {
        if (textDictionary == null) {
            return null;
        } else if (keys.length > 1) {
            let firstKey = keys.splice(0, 1)[0]; // always slice first element only
            return this.RecurssiveGetTextWithKey(keys, textDictionary[firstKey]);
        } else {
            return textDictionary[keys[0]];
        }
    }

    private ExtractImageName(url: string): string {
        let parts = url.split("/");
        let fileNameWithExtension = parts[parts.length - 1];
        let fileName = fileNameWithExtension.split(".")[0];
        return fileName; // Last part of the URL is the image name/key
    }

    public UpdateCurrencyData () {
        if (this.scmsCurrencyCodeMapping != null && this.scmsCurrencyCodeMapping[GameConfig.instance.GetCurrency()] != null) {
            let currencyData = this.scmsCurrencyCodeMapping[GameConfig.instance.GetCurrency()];
            GameConfig.instance.GetCurrencyExponent(currencyData.exponent);
            GameConfig.instance.SetCurrencySymbol(currencyData.symbol);
        }
    }

    private LoadSCMSCurrencyFontAssets () {
        let that = this;
        if (this.scmsCurrencyFontAssetsData != null) {
            let fntFilePaths = this.scmsCurrencyFontAssetsData["file_url"].filter(path => path.includes(".fnt"));
            let pngFilePaths = this.scmsCurrencyFontAssetsData["file_url"].filter(path => path.includes(".png"));

            let assetsLoaded = 0;
            let totalAssets = fntFilePaths.length + pngFilePaths.length;
            let checkAllCurrencyAssetsLoaded = () => {
                assetsLoaded += 1;
                if (assetsLoaded >= totalAssets) {
                    that.LoadAssetCompleteEventFunc();
                }
            };

            for (let i = 0; i < fntFilePaths.length; i++) {
                let fullPath = this.scmsCurrencyFontAssetsData["path_dir_url"] + fntFilePaths[i];
                let splitPaths = fntFilePaths[i].split("/");
                let key = splitPaths[splitPaths.length - 2];

                assetManager.loadRemote(fullPath, (err, fontAsset: TextAsset) => {
                    if (err) {
                        error("Failed to load font asset: ", fullPath);
                    } else {
                        let font = this.parseFntString(fontAsset.text)
                        that.scmsCurrencyFontDatas[key] = font;
                    }
                    checkAllCurrencyAssetsLoaded();
                });
            }
            
            for (let i = 0; i < pngFilePaths.length; i++) {
                let fullPath = this.scmsCurrencyFontAssetsData["path_dir_url"] + pngFilePaths[i];
                let splitPaths = pngFilePaths[i].split("/");
                let key = splitPaths[splitPaths.length - 2];

                assetManager.loadRemote(fullPath, (err, pngAsset: ImageAsset) => {
                    if (err) {
                        error("Failed to load font png asset: ", fullPath);

                    } else {
                        let spriteFrame = SpriteFrame.createWithImage(pngAsset);
                        that.scmsCurrencyFontImages[key] = spriteFrame;
                    }
                    checkAllCurrencyAssetsLoaded();
                });
            }
        } else {
            that.LoadAssetCompleteEventFunc();
        }
    }

    public GetCurrencyFont () {
        return this.gameCurrencyFont;
    }

    public GetCurrencyFontLetterDefinitions () {
        let currencyData = this.scmsCurrencyCodeMapping[GameConfig.instance.GetCurrency()];
        return currencyData.letterDefinitions;
    }

    parseFntString(fntString: string): FntConfig {
        const parsedData: FntConfig = {
          atlasName: '',
          commonHeight: 0,
          fontDefDictionary: {},
          fontSize: 0,
          kerningDict: {}, // Empty object for kerningDict
        };
       
        const lines = fntString.split('\n');
       
        lines.forEach(line => {
          line = line.trim();
       
          if (line.startsWith('page ')) {
            const match = line.match(/file="([^"]+)"/);
            if (match) {
              parsedData.atlasName = match[1];
            }
          }
       
          if (line.startsWith('common ')) {
            const match = line.match(/lineHeight=(\d+)/);
            if (match) {
              parsedData.commonHeight = parseInt(match[1], 10);
            }
          }
       
          if (line.startsWith('info ')) {
            const match = line.match(/size=(\d+)/);
            if (match) {
              parsedData.fontSize = parseInt(match[1], 10);
            }
          }
       
          if (line.startsWith('char ')) {
            const charData: Record<string, number> = {};
            const matches = line.matchAll(/([a-zA-Z]+)=([^\s]+)/g);
            for (const match of matches) {
              charData[match[1]] = parseInt(match[2], 10);
            }
       
            const charId = charData['id'];
            parsedData.fontDefDictionary[charId] = {
              rect: {
                x: charData['x'],
                y: charData['y'],
                width: charData['width'],
                height: charData['height'],
              },
              xOffset: charData['xoffset'],
              yOffset: charData['yoffset'],
              xAdvance: charData['xadvance'],
            };
          }
        });
       
        return parsedData;
      }
}