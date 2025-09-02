import { _decorator, Component, Label, Node, PageView, Slider, Sprite, SpriteFrame , tween, UI, Vec3 } from 'cc';
import { GameStateEvent, UIButtonEvent } from '../Model/GameStateData';
import { PaytableNumber } from './PaytableNumber';
import GameData from '../Model/GameData';
import { UIController } from './UIController';
import GameConfig from '../Model/GameConfig';
import Utils from '../Util/Utils';
import NumberUtils from '../Util/NumberUtils';
const { ccclass, property } = _decorator;

@ccclass('RuleController')
export class RuleController extends Component {

    @property(Node) pageParent : Node = null;
    @property(Node) paytableNumber : Node[] = [];
    @property(Number) PSNumber : number = 0;

    private payoutNodes : Node [] = [];

    private pageView = null;
    private isEventAdd = false;
    private currentPageIndex = 0;
    private currentOrientation = 0;

    onLoad(){
        addEventListener(UIButtonEvent[UIButtonEvent.rule_page_clicked], this.UpdatePaytableNumber.bind(this));
        addEventListener('rulePageOpen' , this.RulePageIndexRecord.bind(this));
        addEventListener(GameStateEvent.orientation_changed , this.OrientationChange.bind(this));

        this.CollectPayoutNodes(this.node);
    }

    private CollectPayoutNodes(node: Node) {
        if (node.name === "payout") {
            this.payoutNodes.push(node);
        }

        node.children.forEach(child => this.CollectPayoutNodes(child));
    }

    OnPageTurning(){
        this.currentPageIndex = UIController.instance.pageView.getCurrentPageIndex();
    }

    RulePageIndexRecord(event : CustomEvent) {
        let eventDetail = event.detail;
        if(this.isEventAdd == false) {
            eventDetail.node.on(PageView.EventType.PAGE_TURNING, this.OnPageTurning.bind(this));
            this.isEventAdd = true;
        }
        // this.currentOrientation = Utils.CheckOrientation()
    }

    UpdatePaytableNumber(){
        let gameBet = GameData.instance.GetGameBet() / GameData.instance.GetLine();
        for( var i = 0; i < this.payoutNodes.length; i++){
            if(this.payoutNodes[i].parent.parent.name == 'PS'){
                let psGameBet = GameData.instance.GetGameBet();
                let PSString = '';
                for(let j = 0; j < this.PSNumber; j++) {
                    PSString += GameConfig.instance.GetCurrencySymbol() + 
                    this.ConvertCurrencyPayNumber(this.payoutNodes[i].getComponent(PaytableNumber).payValue[j] * psGameBet) + 
                    (j < this.payoutNodes[i].getComponent(PaytableNumber).payValue.length - 1 ? '\n' : ''); 
                }
                /*this.payoutNodes[i].getComponent(Label).string =
                (GameConfig.instance.GetCurrencySymbol() + (this.ConvertCurrencyPayNumber(this.payoutNodes[i].getComponent(PaytableNumber).payValue[0] * psGameBet))) + "\n" 
            + (GameConfig.instance.GetCurrencySymbol() + (this.ConvertCurrencyPayNumber(this.payoutNodes[i].getComponent(PaytableNumber).payValue[1] * psGameBet))) + "\n" 
            + (GameConfig.instance.GetCurrencySymbol() + (this.ConvertCurrencyPayNumber(this.payoutNodes[i].getComponent(PaytableNumber).payValue[2] * psGameBet))) + "\n" 
            + (GameConfig.instance.GetCurrencySymbol() + (this.ConvertCurrencyPayNumber(this.payoutNodes[i].getComponent(PaytableNumber).payValue[3] * psGameBet))); */
            this.payoutNodes[i].getComponent(Label).string = PSString;
            } else {
                let resultString = '';

                for (let j = 0; j < this.payoutNodes[i].getComponent(PaytableNumber).payValue.length; j++) {
                    const value = this.payoutNodes[i].getComponent(PaytableNumber).payValue[j] * gameBet;
                    resultString += 
                        GameConfig.instance.GetCurrencySymbol() + 
                        this.ConvertCurrencyPayNumber(value) + 
                        (j < this.payoutNodes[i].getComponent(PaytableNumber).payValue.length - 1 ? '\n' : ''); 
                }
                this.payoutNodes[i].getComponent(Label).string = resultString;
            }
        }
        if(UIController.instance.rtpLabel[0] != null) {
            for(let i = 0; i < UIController.instance.rtpLabel.length; i++) {
                UIController.instance.rtpLabel[i].getComponent(Label).string = (GameConfig.instance.GetRTP()).toString() + '%';
            }
        }
    }
    
    ConvertCurrencyPayNumber(number : number) {
        let decimalPlaces = GameConfig.instance.GetCurrencyExponent();
        let payout = number;
        let convertFirstPayout = null;
        convertFirstPayout = NumberUtils.FormatMoneyString(payout , decimalPlaces);
        if(convertFirstPayout.length > 0 && decimalPlaces > 0 && convertFirstPayout.split(".").length < 2) {
            let addOnDecimalString = ".";
            for (let i = 0; i < decimalPlaces; i++) {
                addOnDecimalString += '0';
            }
            convertFirstPayout = convertFirstPayout + addOnDecimalString;
        }
        return convertFirstPayout;
    }
    OrientationChange(customEvent : CustomEvent) {
        let eventDetail = customEvent.detail;
        for (let i = 0; i < this.pageParent.children.length; i++) {
            if (this.pageParent.children[i].active == false) {
                this.pageView = this.pageParent.children[i].getComponentInChildren(PageView);
            }
        }
        this.currentPageIndex = this.pageView.getCurrentPageIndex();
        if (this.isEventAdd) {
            if (eventDetail.orientation == 0) {
                for (let i = 0; i < this.pageParent.children.length; i++) {
                    if (this.pageParent.children[i].active == true) {
                        this.pageView = this.pageParent.children[i].getComponentInChildren(PageView);
                    }
                }
                this.pageView.scrollToPage(this.currentPageIndex , 0);
            } else if (eventDetail.orientation == 1) {
                for (let i = 0; i < this.pageParent.children.length; i++) {
                    if (this.pageParent.children[i].active == true) {
                        this.pageView = this.pageParent.children[i].getComponentInChildren(PageView);
                    }
                }
                this.pageView.scrollToPage(this.currentPageIndex , 0);
            }
        }
    }
}


