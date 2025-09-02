import { _decorator, Button, Component, Node } from 'cc';
import { BaseButtonScript } from './BaseButtonScript';
import { UIButtonEvent } from '../../Model/GameStateData';
import AudioManager from '../../Core/AudioManager';
import GameConfig from '../../Model/GameConfig';
const { ccclass, property } = _decorator;

@ccclass('MenuToggleScript')
export class MenuToggleScript extends BaseButtonScript {
    private isDisable = false;

    override Initialize () {
        super.Initialize();

        switch(this.buttonClickEvent) {
            case UIButtonEvent.history_button_clicked:
                if(GameConfig.instance.GetHistoryUrl() =="") {
                    this.isDisable = true;
                }
            break;
        }
    }

    override OnGameStateChanged(customEvent: CustomEvent): void {
        super.OnGameStateChanged(customEvent);

        if(this.isDisable) {
            this.node.getComponent(Button).interactable = false;
        } else {
            this.node.getComponent(Button).interactable = true;
        }
    }

    override OnClickEvent(): void {
        AudioManager.instance?.PlayGeneralBtnSound(this.buttonClickEvent);
        if (this.allowOneClickPerEntry) this.getComponent(Button).interactable = false;
        dispatchEvent(new CustomEvent(UIButtonEvent[this.buttonClickEvent] , {detail:{data:this.node.children[0].active}}));
    }
}


