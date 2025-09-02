import { _decorator } from 'cc';
import { BaseButtonScript } from './BaseButtonScript';
import { UIButtonEvent } from '../../Model/GameStateData';
import AudioManager from '../../Core/AudioManager';
const { ccclass, property } = _decorator;

@ccclass('StartButtonScript')
export class StartButtonScript extends BaseButtonScript {

    override OnClickEvent(): void {
        AudioManager.instance?.PlayGeneralBtnSound(UIButtonEvent.close_start_overlay_clicked);
        dispatchEvent(new CustomEvent(UIButtonEvent[this.buttonClickEvent]));
    }
}


