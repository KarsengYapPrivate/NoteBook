import { _decorator, assetManager, AssetManager, Component, JsonAsset, loader, Node, resources, TextAsset } from 'cc';
import ResponseIntegration from './ResponseIntegration';
import { UIButtonEvent } from '../Model/GameStateData';
import NetworkController from './NetworkController';
const { ccclass, property } = _decorator;

@ccclass('OfflineModeController')
export class OfflineModeController extends Component {
    public static instance : OfflineModeController = null;

    private value = null;

    private number : number = 0;

    protected onLoad(): void {
        if(OfflineModeController.instance == null){
            OfflineModeController.instance = this;
        }

        addEventListener(UIButtonEvent[UIButtonEvent.debug_normal_play_clicked] , this.DebugNormal.bind(this));
        addEventListener(UIButtonEvent[UIButtonEvent.debug_big_win_clicked] , this.DebugBigWin.bind(this));
        addEventListener(UIButtonEvent[UIButtonEvent.debug_free_spin_clicked] , this.DebugFreeSpin.bind(this));
        addEventListener(UIButtonEvent[UIButtonEvent.debug_clear_clicked] , this.DebugClear.bind(this));
    
        let self = this;
    }

    public RequestEvent(eventName : string = null, data : any , name : String = null){
        let self = this;
        if(eventName == 'slot-spin'){
            eventName = 'slot-result';
        }

        resources.load('/data/' + name, JsonAsset, (err, asset) => {
            if (err) {
                console.error("Failed to load text file:", err);
                return;
            }
            self.value = asset.json;

            for(let i = 0; i < ResponseIntegration.responseHandlers.length; i++){
                if(eventName == ResponseIntegration.responseHandlers[i].key){
                    ResponseIntegration.responseHandlers[i].callback(self.value.resultArray[self.number].result);
                    self.number++;
                    if(self.number >= self.value.resultArray.length){
                        self.number = 0;
                    }
                }
            }
        });
    }

    DebugNormal(){
        NetworkController.instance.offlineMode = true;
        NetworkController.instance.isBigWin = false;
        NetworkController.instance.isFreeSpin = false;
    }

    DebugBigWin(){
        NetworkController.instance.offlineMode = true;
        NetworkController.instance.isBigWin = true;
        NetworkController.instance.isFreeSpin = false;
    }

    DebugFreeSpin(){
        NetworkController.instance.offlineMode = true;
        NetworkController.instance.isBigWin = false;
        NetworkController.instance.isFreeSpin = true;
    }

    DebugClear(){
        NetworkController.instance.offlineMode = false;
        NetworkController.instance.isBigWin = false;
        NetworkController.instance.isFreeSpin = false;
    }
}



