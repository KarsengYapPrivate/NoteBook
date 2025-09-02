import { _decorator, Component, Node, sp, Sprite , Color, SpriteFrame, animation, Enum } from 'cc';
import { GameState, GameStateAction, GameStateEvent } from '../Model/GameStateData';
import GameData, { GameStateInfo } from '../Model/GameData';
import Utils from '../Util/Utils';
const { ccclass, property } = _decorator;

export enum SymbolValue{
    None,
    SpecSymbol,
    HighSymbol,
    LowSymbol
}

@ccclass('Symbol')
export class Symbol extends Component {
    
    @property(Node) parentNode : Node = null;
    @property(Node) spineNode : Node = null;
    @property(Node) winFrame : Node = null;
    @property(Node) spriteBlurNode : Node = null;
    public symbolID: string = "";
    // protected spineNode: any = null;
    public spriteNode: any = null;
    public symbolValue : number = 0

    onLoad(){
        this.spriteNode = this.node.getComponentInChildren(Sprite);
    }

    OnGameStateChange: () => void = ((customEvent: CustomEvent) => {
        let eventDetail = customEvent.detail as GameStateInfo;

        if (Utils.CheckCurrentGameState(GameStateAction.enter, GameState.idle, eventDetail)) {
            if( GameData.instance.GetResult() == null || GameData.instance.GetResult().data.length <= 0 ){
                this.LoadIdleAnimation();
            }
        }
    }).bind(this);

    UpdateSymbol (symbolID: string, spriteDatas: SpriteFrame[] = null, spineDatas: sp.SkeletonData[] = null , spriteBlurDatas: SpriteFrame[] = null) {
        this.symbolID = symbolID;
        if (spriteDatas == null) spriteDatas = GameData.instance.spriteDatas;
        if (spineDatas == null) spineDatas = GameData.instance.spineDatas;
        if (spriteBlurDatas == null) spriteBlurDatas = GameData.instance.spriteBlurDatas;
        Utils.ChangeSprite(this.getComponentInChildren(Sprite), this.symbolID, spriteDatas);
        Utils.ChangeSpine(this.spineNode.getComponent(sp.Skeleton), this.symbolID, spineDatas);
        if(spriteBlurDatas != null) {
            Utils.ChangeSprite(this.spriteBlurNode.getComponent(Sprite), this.symbolID, spriteBlurDatas);
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

    SetSymbolID (symbolID: string) {
        this.symbolID = symbolID;
    }

    GetSymbolID () {
        return this.symbolID
    }

    Dim(){
        this.spriteNode.color = new Color(130, 130, 130);
        this.spineNode.getComponent(sp.Skeleton).color = new Color(130, 130, 130);
        if(this.spineNode.getComponent(sp.Skeleton).animation != this.GetSymbolID() + '_idle') {
            this.LoadIdleAnimation();
        }
    }

    Shine(){
        this.spineNode.getComponent(sp.Skeleton).color = new Color(255, 255, 255);
        this.spriteNode.color = new Color(255, 255, 255);
    }

    LoadSpineNode(){
        this.spineNode.getComponent(sp.Skeleton).node.active = true;
        this.spriteNode.node.active = false;
    }

    LoadSpriteNode(){
        this.spriteNode.node.active = true;
        this.spineNode.getComponent(sp.Skeleton).animation = '';
        this.spineNode.getComponent(sp.Skeleton).node.active = false;
    }

    Reset(){
        this.Shine();
    }

    PlayAnimation(name : string = ""){
        this.LoadSpineNode();
        this.spineNode.getComponent(sp.Skeleton).animation = name;
        if(this.winFrame != null){
            this.winFrame.active = true;
            this.winFrame.getComponent(sp.Skeleton).animation = 'animation';
        }
    }
    
    StopAnimation(){
        this.LoadSpineNode();
        this.spineNode.getComponent(sp.Skeleton).animation = '';
        if(this.winFrame != null){
            this.winFrame.active = false;
            this.winFrame.getComponent(sp.Skeleton).animation = '';
        }
    }

    LoadIdleAnimation() {
        this.LoadSpineNode();
        let animationName = this.symbolID + '_idle';
        if (this.spineNode.getComponent(sp.Skeleton).findAnimation(animationName) != null) {
            this.spineNode.getComponent(sp.Skeleton).animation = animationName;
        } else {
            this.spineNode.getComponent(sp.Skeleton).animation = '';
        }
    }

    LoadAppearAnimation() {
        this.LoadSpineNode();
        let animationName = this.symbolID + '_appear';

        if (this.spineNode.getComponent(sp.Skeleton).findAnimation(animationName) != null) {
            this.spineNode.getComponent(sp.Skeleton).animation = animationName;
            this.spineNode.getComponent(sp.Skeleton).setCompleteListener(((data) =>{
                if(data.animation.name == this.symbolID + '_appear') {
                    this.spineNode.getComponent(sp.Skeleton).loop = true;
                    this.LoadIdleAnimation();
                }
            }).bind(this))
        } else {
            this.LoadIdleAnimation();
        }
    }

    PlayHitAnimation() {
        this.LoadSpineNode();
        if (this.spineNode.getComponent(sp.Skeleton).findAnimation('PS_hit') != null){
            this.spineNode.getComponent(sp.Skeleton).setAnimation(0, this.symbolID + '_hit', false);
            this.spineNode.getComponent(sp.Skeleton).addAnimation(0 , this.symbolID + '_hit_loop' , true);
        }
    }

    CallMyChildBack(){
        this.parentNode.setParent(this.node);
        this.parentNode.setPosition(0,0,0);
    }

    Destroy(): void {
        removeEventListener(GameStateEvent.game_state_changed, this.OnGameStateChange);
        this.parentNode.destroy();
        this.node.destroy();    
    }

    LoadBlurSprite() {
        this.spineNode.active = false;
        this.spriteBlurNode.active = true;
    }

    CloseBlurSprite() {
        this.spineNode.active = true;
        this.spriteBlurNode.active = false;
    }
}


