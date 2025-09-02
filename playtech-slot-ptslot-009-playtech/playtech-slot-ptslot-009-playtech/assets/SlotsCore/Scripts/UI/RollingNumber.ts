
import { _decorator, Component, Node, Label, Enum } from 'cc';
import NumberUtils from '../Util/NumberUtils';
import GameConfig from '../Model/GameConfig';
 
const { ccclass, property } = _decorator;
 
export enum RollNumberDisplayModes
{
    Normal,
    CompactCurrency,
    FullCurrency
}
 
 
@ccclass('RollingNumber')
export default class RollingNumber extends Component
{
    public currentValue: number = 0;
    public targetValue: number = 0;
    public label: Label;
 
    @property(Boolean) showZeroValue : boolean = false;
    @property(Boolean) isShowDecimal : boolean = false;
   
    @property({type: Enum(RollNumberDisplayModes)})
    displayMode: RollNumberDisplayModes = RollNumberDisplayModes.FullCurrency;
 
    @property({type: Boolean, visible: function(this:RollingNumber) {return this.displayMode == RollNumberDisplayModes.FullCurrency}})  
    useCurrencySymbol : boolean = true;
 
    @property({type: Boolean, visible: function(this:RollingNumber) {return this.useCurrencySymbol}})  
    useCustomSymbol: boolean = false;
 
    @property({type: String, visible: function(this:RollingNumber) {return this.useCustomSymbol}})  
    customSymbol: string = "$";
 
    private delayBeforeStart: number = 0;
    private deltaChange: number = 1;
 
    private targetReachCallback : ()=>void = null;
 
    public SetTarget(target: number, duration_in_seconds: number, delay_before_start: number = 0 , targetReachCallback : ()=>void = null)
    {

        //0 duration = instant change
        if (duration_in_seconds <= 0) {
            this.SetImmediate(target, true);
            targetReachCallback?.();
        } else {
            if (this.displayMode == RollNumberDisplayModes.CompactCurrency || this.displayMode == RollNumberDisplayModes.FullCurrency) {
                target = target >= 0? target : 0;
            }

            //Set up roll number animation
            this.targetValue = target;
            this.deltaChange = (this.targetValue - this.currentValue) / duration_in_seconds;
            this.delayBeforeStart = delay_before_start;
            this.targetReachCallback = targetReachCallback;
        }
    }
 
    public IncrementTarget(amount: number, duration_in_seconds: number, delay_before_start: number = 0 , targetReachCallback : ()=>void = null)
    {
        this.SetTarget(this.targetValue + amount, duration_in_seconds, delay_before_start , targetReachCallback);
    }
 
    public SetImmediate(value: number, updatelabel: boolean = true)
    {
        if (this.displayMode == RollNumberDisplayModes.CompactCurrency || this.displayMode == RollNumberDisplayModes.FullCurrency) {
            value = value >= 0? value : 0;
        }
 
        this.currentValue = this.targetValue = value;
 
        if (this.label == null) this.label = this.getComponent(Label);
        if (updatelabel) this.UpdateDisplayLabel();
    }
   
    update(dt: number)
    {
        if (this.currentValue == this.targetValue) return;
 
        if (this.delayBeforeStart>0)
        {
            this.delayBeforeStart -= dt;
            return;
        }
       
        if (this.currentValue < this.targetValue)
        {
            this.currentValue += this.deltaChange * dt;
            if (this.currentValue>=this.targetValue){
                this.currentValue = this.targetValue; //Reached
                this.targetReachCallback?.();
            }
        }
        else
        {
            this.currentValue += this.deltaChange * dt; //Also add, because the deltaChange would have been negative
            if (this.currentValue<=this.targetValue){
                this.currentValue = this.targetValue; //Reached
                this.targetReachCallback?.();
            }
        }
 
        if (this.label == null) this.label = this.getComponent(Label);
        this.UpdateDisplayLabel();
    }
 
    private UpdateDisplayLabel()
    {
        if(this.currentValue <= 0 && !this.showZeroValue){
            this.label.string = "";
            return;
        }
        switch (this.displayMode)
        {
            case RollNumberDisplayModes.CompactCurrency: this.label.string = NumberUtils.FormatMoneyStringCompact(this.currentValue); return;
            case RollNumberDisplayModes.FullCurrency:
                {
                    let decimalPlaces = GameConfig.instance.GetCurrencyExponent();
                    this.label.string = NumberUtils.FormatMoneyString(this.currentValue, decimalPlaces);
                    if(this.label.string.length > 0 && decimalPlaces > 0 && this.label.string.split(".").length < 2) {
                        let addOnDecimalString = ".";
                        for (let i = 0; i < decimalPlaces; i++) {
                            addOnDecimalString += '0';
                        }
                        this.label.string = this.label.string + addOnDecimalString;
                    }
                    if (this.useCurrencySymbol) {
                        let currencySymbol = this.useCustomSymbol? this.customSymbol : GameConfig.instance.GetCurrencySymbol();
                        this.label.string = currencySymbol + this.label.string;
                    }
                    return;
                }    
            default: this.label.string = Math.round(this.currentValue).toString(); return;
        }
    }
 
}

