import { _decorator, Component, Label, Node } from 'cc';
import { GameStateEvent, UIButtonEvent } from '../Model/GameStateData';
const { ccclass, property } = _decorator;

@ccclass('AutoSpinButtonComponent')
export class AutoSpinButtonComponent extends Component {
    private AutoSpinAmountButtonClick(){
        let buttonNumber = parseInt(this.node.getComponentInChildren(Label).string);
        dispatchEvent(new CustomEvent(GameStateEvent.auto_spin_button_clicked , {detail : buttonNumber}));

    }
}


