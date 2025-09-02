import { _decorator, Button, Component, Node } from 'cc';
import { BaseButtonScript } from './BaseButtonScript';
import { UIButtonEvent } from '../../Model/GameStateData';
import AudioManager from '../../Core/AudioManager';
const { ccclass, property } = _decorator;

@ccclass('ToggleSpriteButton')
export class ToggleSpriteButton extends BaseButtonScript {

    @property(Node) toggleOnNode: Node = null;
    @property(Node) toggleOffNode: Node = null;

    override Initialize () {
        super.Initialize();

        if (this.toggleOnNode == null && this.node.children.length >= 1) {
            this.toggleOnNode = this.node.children[0];
        }

        if (this.toggleOffNode == null && this.node.children.length >= 2) {
            this.toggleOffNode = this.node.children[1];
        }

        // this.ToggleOff();
    }

    override OnClickEvent(){
        this.ButtonClick();
        AudioManager.instance?.PlayGeneralBtnSound(this.buttonClickEvent);
        if (this.allowOneClickPerEntry) this.getComponent(Button).interactable = false;
        dispatchEvent(new CustomEvent(UIButtonEvent[this.buttonClickEvent] , {detail: {toggle:this.IsToggleOn()}}));
    }

    IsToggleOn () {
        return this.toggleOnNode.active;
    }

    ToggleOn () {
        this.toggleOnNode.active = true;
        this.toggleOffNode.active = false;
        this.node.getComponent(Button).target = this.toggleOnNode;
    }

    ToggleOff () {
        this.toggleOnNode.active = false;
        this.toggleOffNode.active = true;
        this.node.getComponent(Button).target = this.toggleOffNode;
    }

    ButtonClick () {
        if (!this.IsToggleOn()) {
            this.ToggleOn();
        } else {
            this.ToggleOff();
        }
    }
}


