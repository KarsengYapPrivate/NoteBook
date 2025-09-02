import { _decorator, Button, Component, Node } from 'cc';
import { BaseButtonScript } from './BaseButtonScript';
import { UIButtonEvent } from '../../Model/GameStateData';
import AudioManager from '../../Core/AudioManager';
const { ccclass, property } = _decorator;

@ccclass('RulePageToggleScript')
export class RulePageToggleScript extends BaseButtonScript {

    override Initialize(): void {
        super.Initialize()
    }

    override OnClickEvent(): void {
        AudioManager.instance?.PlayGeneralBtnSound(this.buttonClickEvent);
        if (this.allowOneClickPerEntry) this.getComponent(Button).interactable = false;
        dispatchEvent(new CustomEvent(UIButtonEvent[this.buttonClickEvent] , {detail:{data:this.node.children[0].active}}));
    }
}