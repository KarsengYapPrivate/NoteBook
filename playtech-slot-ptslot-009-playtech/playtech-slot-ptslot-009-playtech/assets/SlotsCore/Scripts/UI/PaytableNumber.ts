import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('PaytableNumber')
export class PaytableNumber extends Component {
    @property(Number) payValue : number[] = [];
}


