import { _decorator, Component, Node } from 'cc';
import { BaseButtonScript, ButtonGameStateOption } from './BaseButtonScript';
import { UIButtonEvent } from '../../Model/GameStateData';
import { UIGameStateOption } from '../BaseUIComponent';
const { ccclass, property } = _decorator;

@ccclass('AutoSpinButtonScript')
export class AutoSpinButtonScript extends BaseButtonScript {

    // preset button values
    showButtonInteractOptions: boolean = true;
    buttonClickEvent: UIButtonEvent = UIButtonEvent.autoSpin_clicked;

    @property(Node) toggleOnNode: Node = null;
    @property(Node) toggleOffNode: Node = null;

    SetAutoSpinOn () {
        this.toggleOnNode.active = true;
        this.toggleOffNode.active = false;
    }

    SetAutoSpinOff () {
        this.toggleOnNode.active = false;
        this.toggleOffNode.active = true;
    }

    IsAutoSpinOn () {
        return this.toggleOnNode.active;
    }
}


