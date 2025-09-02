import { _decorator, Component, Node } from 'cc';
import GameData from '../Model/GameData';
import { GameStateEvent } from '../Model/GameStateData';
import { PopupOption } from '../Core/PopupMessageHandler';
import { AutoSpinPanelController } from '../UI/AutoSpinPanelController';
const { ccclass, property } = _decorator;


@ccclass('PlaytechIntegration')
export class PlaytechIntegration extends Component {
    public static instance : PlaytechIntegration = null;

    private request = {
        _type: "ucip.basic.g2wInitializationRequest",
        version: "1.0.0",
        features: ["pause", "autoplay", "errors"]
    }
    
    // private MessageHandler = (message: any) => void{};
    protected onLoad(): void {
        if (PlaytechIntegration.instance == null) {
            PlaytechIntegration.instance = this;
        }
        this.SendPostMessage(this.request);
        window.addEventListener('message' , this.Message.bind(this));

        
    }

    Message(customEvent : CustomEvent) {
        switch(customEvent['data']._type) {
            case 'ucip.pause.w2gPauseCommand' :
                GameData.instance.SetPauseGameEvent(customEvent['data'].pause);
                if(GameData.instance.GetPauseGameEvent()) {
                    let message = "Game Pause";
                    let popupOption = new PopupOption(message);
                    dispatchEvent(new CustomEvent(GameStateEvent.popup_message, {detail: popupOption}));
                } else {
                    dispatchEvent(new CustomEvent(GameStateEvent.close_popup_message));
                }

                dispatchEvent(new CustomEvent(GameStateEvent.pasue_auto_play, {detail: GameData.instance.GetPauseGameEvent()}));
                
            break;

            case 'ucip.autoplay.w2gInterruptGameplayCommand' :
                AutoSpinPanelController.instance.ForceStopAutoPlay();
            break;

            default:

            break;
        }
    }

    SendPostMessage(request){
        // Convert a json object into string
        let requestString = JSON.stringify(request);
        window.parent.postMessage(requestString, "*");
    }

}


