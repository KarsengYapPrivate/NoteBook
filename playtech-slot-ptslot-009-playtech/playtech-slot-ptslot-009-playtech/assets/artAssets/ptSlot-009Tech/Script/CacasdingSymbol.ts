import { _decorator, Component, Node, sp, Sprite, SpriteFrame } from 'cc';
import { Symbol, SymbolValue } from '../../../SlotsCore/Scripts/Core/Symbol';
import GameData from '../../../SlotsCore/Scripts/Model/GameData';
import Utils from '../../../SlotsCore/Scripts/Util/Utils';
import { GalacticColoniesConfig } from './GalacticColoniesConfig';
import AudioManager from 'db://assets/SlotsCore/Scripts/Core/AudioManager';
const { ccclass, property } = _decorator;

@ccclass('CacasdingSymbol')
export class CacasdingSymbol extends Symbol {
    @property(Node) spriteFrameNode : Node = null;

    @property({type: Number , readonly:true}) symbolIndex = 0;
    @property({type: Number , readonly:true}) symbolSize = 1;
    @property({type: Number , readonly:true}) symbolStopPosition = 0;
    @property({type: Number , readonly:true}) remainTime = 0;
    @property({type: Boolean , readonly:true}) liveSymbol = false;

    private symbolIDCacasding = null;
    public isInstantStop = false;
    
    override onLoad(): void {
        super.onLoad();
        this.symbolIndex = this.node.getSiblingIndex();
        this.symbolSize = 1;
    }

    UpdateName() {
        this.node.name = this.symbolID;
    }

    UpdateSize(size) {
        this.symbolSize = size;
    }

    UpdateSymbol (symbolID: string, spriteDatas: SpriteFrame[] = null, spineDatas: sp.SkeletonData[] = null , spriteBlurDatas: SpriteFrame[] = null) {
        this.symbolID = symbolID.replace('_1x1', '');
        if(!this.symbolID.includes('_1x1')) {
            this.symbolIDCacasding = this.symbolID + '_1x' + this.symbolSize;
        } else {
            this.symbolIDCacasding = this.symbolID;
        }
        if (spriteDatas == null) spriteDatas = GameData.instance.spriteDatas;
        if (spineDatas == null) spineDatas = GameData.instance.spineDatas;
        // if (spriteBlurDatas == null) spriteBlurDatas = GameData.instance.spriteBlurDatas;
        Utils.ChangeSprite(this.spriteFrameNode.getComponent(Sprite), this.symbolIDCacasding, spriteDatas);
        Utils.ChangeSpine(this.spineNode.getComponent(sp.Skeleton), this.symbolIDCacasding, spineDatas);
        if(spriteBlurDatas != null) {
            Utils.ChangeSprite(this.spriteBlurNode.getComponent(Sprite), this.symbolIDCacasding, spriteBlurDatas);
        }
     
        if(GameData.instance.specSymbol.indexOf(this.symbolID) >= 0){
            this.symbolValue = SymbolValue.SpecSymbol;
        }
        else if(GameData.instance.highSymbol.indexOf(this.symbolID) >= 0){
            this.symbolValue = SymbolValue.HighSymbol;
        } 
        else if(GameData.instance.lowSymbol.indexOf(this.symbolID) >= 0){
            this.symbolValue = SymbolValue.LowSymbol;
        }
    }

    UpdateStopPosition(number) {
        this.symbolStopPosition = number;
    }

    UpdateRemainTime(number) {
        this.remainTime = number
    }

    override PlayAnimation(name?: string): void {
        this.LoadSpineNode();
        this.spineNode.getComponent(sp.Skeleton).loop = false;
        this.spineNode.getComponent(sp.Skeleton).animation = name;
        if(this.symbolID != 'PS') {
            this.spineNode.getComponent(sp.Skeleton).setCompleteListener((function(data) { 
                if(data.animation.name == name) {
                    // this.Destroy();
                    this.parentNode.destroy();
                    this.node.destroy();
                    dispatchEvent(new CustomEvent('DestroySymbol'));
                }
            }).bind(this))
        }

        if(this.winFrame != null){
            this.winFrame.active = true;
            this.winFrame.getComponent(sp.Skeleton).animation = 'animation';
        }
    }

    override LoadAppearAnimation() {
        this.LoadSpineNode();
        let animationName = this.symbolID + '_appear';

        if (this.spineNode.getComponent(sp.Skeleton).findAnimation(animationName) != null) {
            if (this.symbolID == 'P01' && GameData.instance.GetResult().data[GalacticColoniesConfig.instance.currentRound].p01MultiplierArray[this.node.parent.getSiblingIndex()][this.node.getSiblingIndex()] == 1) {
                this.spineNode.getComponent(sp.Skeleton).animation = 'P01_charged_appear';
                this.spineNode.getComponent(sp.Skeleton).setCompleteListener(((data) => {
                    if (data.animation.name == this.symbolID + '_charged_appear') {
                        this.spineNode.getComponent(sp.Skeleton).loop = true;
                        this.spineNode.getComponent(sp.Skeleton).animation = 'P01_charged_idle';
                    }
                }).bind(this))
            } else {
                this.spineNode.getComponent(sp.Skeleton).animation = animationName;
                if(this.symbolID == 'PW') {
                    AudioManager.instance.PlayWildAppearSound();
                } else if(this.symbolID == 'PS') {
                    AudioManager.instance?.PlayReelScatterSound(GalacticColoniesConfig.instance.scatterCount);
                    GalacticColoniesConfig.instance.scatterCount++;
                }
                this.spineNode.getComponent(sp.Skeleton).setCompleteListener(((data) =>{
                    if(data.animation.name == this.symbolID + '_appear') {
                        this.spineNode.getComponent(sp.Skeleton).loop = true;
                        this.LoadIdleAnimation();
                    }
                }).bind(this))
            }
        } else {
            this.LoadIdleAnimation();
        }
    }

    ResetLiveValue() {
        this.liveSymbol = false;
    }   

    protected update(dt: number): void {
        if(this.liveSymbol) {
            if(this.symbolValue == SymbolValue.HighSymbol || this.symbolValue == SymbolValue.SpecSymbol) {
                this.parentNode.setPosition(this.node.position);
            }
        }
    }
}


