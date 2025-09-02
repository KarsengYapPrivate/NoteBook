import { _decorator, Component, Label, Node } from 'cc';
import { UIButtonEvent } from '../Model/GameStateData';
import GameData from '../Model/GameData';
const { ccclass, property } = _decorator;

@ccclass('PageNumberScript')
export class PageNumberScript extends Component {
   @property(Number) number : number[] = [];

    onLoad(){
        addEventListener(UIButtonEvent[UIButtonEvent.rule_page_clicked], this.CheckNumber.bind(this));
    }

    CheckNumber(){
        for(var i = 0; i < this.node.children.length; i++){
            this.node.children[i].getComponent(Label).string = (this.number[i] * GameData.instance.GetGameBet()).toString();
        }
    }
}


