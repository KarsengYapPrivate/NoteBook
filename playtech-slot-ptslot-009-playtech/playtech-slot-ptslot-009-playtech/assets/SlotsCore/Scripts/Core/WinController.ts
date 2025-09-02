import { _decorator, AudioClip, AudioSource, Component, Node, sp, tween, UIOpacity, v3, Vec2, Vec3 } from 'cc';
import { GameState, GameStateAction, GameStateEvent } from '../Model/GameStateData';
import GameData, { GameStateInfo } from '../Model/GameData';
import Utils from '../Util/Utils';
import { Symbol, SymbolValue } from './Symbol';
import { ReelController } from './ReelController';
import RollingNumber from '../UI/RollingNumber';
import TweenUtils from '../Util/TweenUtils';
import AudioManager from './AudioManager';
const { ccclass, property } = _decorator;

@ccclass('WinController')
export class WinController extends Component {

    public static instance: WinController;

    @property(Node) protected payLines : Node = null;
    @property(Node) protected points : Node = null;
    @property(Node) protected winSymbolReels : Node[] = [];
    @property(Node) protected reels : Node[] = [];
    @property(Number) protected startDelaySecond : number = 0;
    @property(Number) protected rotateIntervalSecond : number = 0;
    
    @property(Node) protected winningLayers : Node [] = [];
    
    @property({type : Node , group:'LineSetting'}) protected lineWinAmountNumberNode : Node = null;
    @property({type : Number , group:'LineSetting'}) protected lineWinAmountNumberNodeOffsetY: number = 0;
    @property({type : Number , group:'LineSetting'}) protected lineWinAmountMoveSecond: number = 0;
    @property({type : Number , group:'LineSetting'}) protected lineWinAmountFadeInSecond: number = 0;
    @property({type : Number , group:'LineSetting'}) protected lineWinAmountStaySecond: number = 0;
    @property({type : Number , group:'LineSetting'}) protected lineWinAmountFadeOutSecond: number = 0;
    @property({type : Boolean , group:'LineSetting'}) protected showTotalWinLineAmount : boolean = false;
    
    @property(Boolean) protected isWinLineNeedFade : boolean = false;
    @property({type: Number , visible:function(this:WinController){ return this.isWinLineNeedFade}})
    protected lineFadeInTime : number = 0;
  
    protected showWinLineTimeoutHandler: any = null;
    protected showWinLineIntervalHandler: any = null;
    protected winLineIndex: number = 0;
    protected winData: any[] = [];
    protected isAllOfAKind = false;
    protected winArrays = [[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0]];


    onLoad(){

        if (WinController.instance == null) {
            WinController.instance = this;
        }

        addEventListener(GameStateEvent.game_state_changed , this.OnGameStateChange.bind(this));
    }

    OnGameStateChange(customEvent: CustomEvent) {
        let eventDetail = customEvent.detail as GameStateInfo;

        this.isAllOfAKind = false;
        GameData.instance.SetAllOfAKind(this.isAllOfAKind);
        // currently exit spin event is handle inside reelcontroller
        // exit spin will have to wait till all reels is stopped only start run presenter and change state
        if (Utils.CheckCurrentGameState(GameStateAction.exit, GameState.spin, eventDetail)) {
            this.isAllOfAKind = false;
            if(GameData.instance.GetResult() != null && GameData.instance.GetResult().data?.length > 0 && GameData.instance.GetResult().data[0].icon_type !="PS"){
                this.FilterArray();
            }
        } else if (Utils.CheckCurrentGameState(GameStateAction.enter,GameState.idle, eventDetail)){
            if(this.winData.length > 0){
                this.ResetWinSymbol();

                this.showWinLineTimeoutHandler = setTimeout(() => {
                    this.ShowWinLineRotation();
                    this.showWinLineIntervalHandler = setInterval(() => {this.ShowWinLineRotation()}, (this.rotateIntervalSecond * 1000));
                }, (this.startDelaySecond * 1000));
            }
        } else if (Utils.CheckCurrentGameState(GameStateAction.exit, GameState.idle, eventDetail)) {
            this.Reset();
        } 
    }

    public FilterArray(){
        this.winData = [];
        let tempData = [];
        let tempLength = [];
        let tempLine = [];
        let tempIconType = [];
        let tempPayout = [];
        let tempIcon = [];

        for(var i = 0; i < GameData.instance.GetResult().data.length; i++){
            if(GameData.instance.GetResult().data[i].line < 0)continue;
            tempLine.push(GameData.instance.GetResult().data[i].line);
            tempData.push(GameData.instance.GetResult().data[i].index);
            tempLength.push(GameData.instance.GetResult().data[i].count);
            tempIconType.push(GameData.instance.GetResult().data[i].icon_type);
            tempPayout.push(GameData.instance.GetResult().data[i].payout);
            tempIcon.push(GameData.instance.GetResult().data[i].icons);
        }

        var tempWinData = {count : tempLength , icon_type : tempIconType , index : tempData , line : tempLine, payout : tempPayout , icon : tempIcon};

        this.winData.push(tempWinData);
        for(var i = 0; i < GameData.instance.GetResult().data.length; i++){
            this.winData.push(GameData.instance.GetResult().data[i]);
            if(GameData.instance.GetResult().data[i].count >= ReelController.instance.reelNormals.length){
                this.isAllOfAKind = true;
            }
        }
        GameData.instance.SetAllOfAKind(this.isAllOfAKind);
    }

    DimAllSymbols () {
        for(var i = 0; i < this.reels.length; i++){
            for(var j = 0; j < this.reels[i].children.length; j++){
                this.reels[i].children[j].getComponent(Symbol).Dim();
            }
        }
    }

    SpawnAllSymbol(line: number = 0) {
        for (let i = 0; i < this.winData[line].count.length; i++) {
            for (let j = 0; j < this.winData[line].count[i]; j++) {
                
                if (this.winArrays[j][this.winData[line].index[i][j]] == 0) {
                    let symbolIndex = this.winData[line].index[i][j]; 
                    let winningSymbol = ReelController.instance.reelNormals[j].node.children[symbolIndex].getComponent(Symbol);
                    let position = (v3(0, winningSymbol.node.position.y , 0));
                    switch(winningSymbol.symbolValue){
                        case SymbolValue.SpecSymbol:
                            winningSymbol.parentNode.setParent(GameData.instance.specSymbolLayer.children[j]);
                            winningSymbol.parentNode.setPosition(position);
                        break;
        
                        case SymbolValue.HighSymbol:
                            winningSymbol.parentNode.setParent(GameData.instance.highSymbolLayer.children[j]);
                            winningSymbol.parentNode.setPosition(position);
                        break;
                        
                        case SymbolValue.LowSymbol:
                            winningSymbol.parentNode.setParent(this.winningLayers[j]);
                            winningSymbol.parentNode.setPosition(position);
                        break;
                    }
                    
                    this.winArrays[j][this.winData[line].index[i][j]] = 1;
                    winningSymbol.PlayAnimation(winningSymbol.GetSymbolID());
                    winningSymbol.Shine();
                }
            }
        }
    }

    SpawnSingleSymbol(line : number = 0){
        for (let i = 0; i < this.winData[line].count; i++) {
            let symbolIndex = this.winData[line].index[i]; 
            let winningSymbol = ReelController.instance.reelNormals[i].node.children[symbolIndex].getComponent(Symbol);
            let position = (v3(0, winningSymbol.node.position.y , 0));
            switch(winningSymbol.symbolValue){
                case SymbolValue.SpecSymbol:
                    winningSymbol.parentNode.setParent(GameData.instance.specSymbolLayer.children[i]);
                    winningSymbol.parentNode.setPosition(position);
                break;
        
                case SymbolValue.HighSymbol:
                    winningSymbol.parentNode.setParent(GameData.instance.highSymbolLayer.children[i]);
                    winningSymbol.parentNode.setPosition(position);
                break;
                
                case SymbolValue.LowSymbol:
                    winningSymbol.parentNode.setParent(this.winningLayers[i]);
                    winningSymbol.parentNode.setPosition(position);
                break;
            }
            winningSymbol.PlayAnimation(winningSymbol.GetSymbolID());
            winningSymbol.Shine();
        }
    }

    ResetWinSymbol(){
        this.winArrays = [[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0]];
        let reels = ReelController.instance.reelNormals;
        for(let i = 0; i < reels.length; i++){
            for(let j = 0; j < reels[i].node.children.length; j++){
                reels[i].node.children[j].getComponent(Symbol).CallMyChildBack();
                if(reels[i].node.children[j].getComponent(Symbol).spineNode.getComponent(sp.Skeleton).animation == reels[i].node.children[j].getComponent(Symbol).GetSymbolID()){
                    reels[i].node.children[j].getComponent(Symbol).StopAnimation();
                }
            }
        }
    }
    
    ShowWinLineRotation () {
        if (this.winData.length > 0) {
            this.DimAllSymbols();
            AudioManager.instance.PlayWinLineSound();
            if (this.winLineIndex == 0) {
                if(this.payLines != null){
                    for(var i = 0; i < this.payLines.children.length; i++){
                        let payLines = this.payLines.children[i];
                        if(this.isWinLineNeedFade){
                            TweenUtils.FadeUIOpacity(payLines , 0 , 0);
                        }
                        payLines.active = false;
                    }
                }
                if(this.points != null){
                    for(var i = 0; i < this.payLines.children.length; i++){
                        this.points.children[i].active = false;
                    }
                }
                for(var i = 0; i < this.winData.length-1; i++){
                    if(this.payLines){
                        let payLineNodes = this.payLines.children[this.winData[this.winLineIndex].line[i]];
                        payLineNodes.active = true;
                        if (this.isWinLineNeedFade) {
                            TweenUtils.FadeUIOpacity(payLineNodes, 0, 0).then(() => {
                                TweenUtils.FadeUIOpacity(payLineNodes, this.lineFadeInTime, 255).then(() => {
                                })
                            })
                        }
                        payLineNodes.getComponent(sp.Skeleton).animation = "animation";
                    } 
                    if(this.points) this.points.children[this.winData[this.winLineIndex].line[i]].active = true;
                }

                this.ResetWinSymbol();
                this.SpawnAllSymbol(this.winLineIndex);
                if(this.showTotalWinLineAmount){
                    let winAmountNumber = 0;
                    for(let i = 0; i < this.winData[this.winLineIndex].payout.length; i++) {
                        winAmountNumber = winAmountNumber + this.winData[this.winLineIndex].payout[i];
                    }
                    this.WinAmountSpawn(winAmountNumber);
                }

            } else {
                // reset previous paylines / points
                if(this.payLines != null){
                    for(var i = 0; i < this.payLines.children.length; i++){
                        let payLines = this.payLines.children[i];
                        if(this.isWinLineNeedFade){
                            TweenUtils.FadeUIOpacity(payLines , 0 , 0);
                        }
                        payLines.active = false;
                    }
                }
                if(this.points != null){
                    for(var i = 0; i < this.payLines.children.length; i++){
                        this.points.children[i].active = false;
                    }
                }
                
                // set new paylines / points
                if(this.payLines != null){
                    let paylineNode = this.payLines.children[this.winData[this.winLineIndex].line];
                    paylineNode.active = true;
                    if(this.isWinLineNeedFade){
                        TweenUtils.FadeUIOpacity(paylineNode , 0 , 0).then(()=>{
                            TweenUtils.FadeUIOpacity(paylineNode, this.lineFadeInTime, 255).then(() => {
                            })
                        })
                    }
                    paylineNode.getComponent(sp.Skeleton).animation = "animation";
                }
                if(this.points != null){
                    this.points.children[this.winData[this.winLineIndex].line].active = true;
                }

                let winAmountNumber = this.winData[this.winLineIndex].payout;

                
                this.ResetWinSymbol();
                this.SpawnSingleSymbol(this.winLineIndex);
                this.WinAmountSpawn(winAmountNumber);
            }
    
            if(this.winLineIndex < this.winData.length - 1){
                this.winLineIndex++
            } else if (this.winLineIndex == this.winData.length -1){
                this.winLineIndex = 0;
            }
        }
    }

    Reset () {
        if (this.showWinLineTimeoutHandler) clearTimeout(this.showWinLineTimeoutHandler);
        if (this.showWinLineIntervalHandler) clearInterval(this.showWinLineIntervalHandler);
        
        this.winData = [];
        this.winLineIndex = 0;
        this.lineWinAmountNumberNode.active = false;

        if(this.payLines) {
            this.payLines.children.forEach((payline) => { payline.active = false; });
        }
        if(this.points) this.points.children.forEach((point) => { point.active = false; });

        this.winSymbolReels.forEach((winSymbolReel) => {
            winSymbolReel.children.forEach((winSymbol) => {
                winSymbol.active = false;
            });
        });

        this.reels.forEach((symbols) =>{
            symbols.children.forEach((symbol) => {
                symbol.getComponent(Symbol).LoadSpriteNode();
            })
        })

        for(var i = 0; i < this.reels.length; i++){
            for(var j = 0; j < this.reels[i].children.length; j++){
                this.reels[i].children[j].getComponent(Symbol).Shine();
            }
        }
    }

    ShowScatterWin () {
        if (GameData.instance.IsFreeSpinOn()) {
            let isAllSymbolDimmed = false;

            // assuming when get free spin first element in data is always scatter win
            let resultData = GameData.instance.GetResult().data[0];
            for (var i = 0; i < resultData.index.length; i++) {
                if (resultData.index[i] >= 0) {
                    if (!isAllSymbolDimmed) {
                        this.DimAllSymbols();
                        isAllSymbolDimmed = true
                    }
                    let symbolIndex = resultData.index[i];
                    this.reels[i].children[symbolIndex].getComponent(Symbol).Shine();
                    this.reels[i].children[symbolIndex].getComponent(Symbol).PlayAnimation(resultData.icon_type);

                    if(this.winSymbolReels.length > i){
                        this.winSymbolReels[i].children[symbolIndex].active = true;
                        this.winSymbolReels[i].children[symbolIndex].getComponent(sp.Skeleton).animation = "symbol-win-frame";
                        this.winSymbolReels[i].children[symbolIndex].setPosition(new Vec3(0, this.reels[i].children[symbolIndex].position.y, 0));
                    }
                }
            }
        }
    }



    ShowAllFiveOfAKind () {
        let resultDatas = GameData.instance.GetResult().data;
        if(resultDatas && resultDatas.length > 0) {
            this.DimAllSymbols();

            let fiveOfAKindWinIndexes = [];
            let fiveOfAKindWinIcons = [];
            let fiveOfAKindWinLines = [];

            for (let i = 0; i < resultDatas.length; i++) {
                let resultData = resultDatas[i];
                if (resultData.count == 5) {
                    fiveOfAKindWinIndexes.push(resultData.index);
                    fiveOfAKindWinIcons.push(resultData.icons);
                    fiveOfAKindWinLines.push(resultData.line);
                }
            }

            // show lines and points
            for (let i = 0; i < fiveOfAKindWinLines.length; i++) {
                if(this.payLines) this.payLines.children[fiveOfAKindWinLines[i]].active = true;
                if(this.points) this.points.children[fiveOfAKindWinLines[i]].active = true;
            }

            // show icons highlight and play icons animation
            for (let i = 0; i < this.winSymbolReels.length; i++) {
                let reelShowWinSymbolIndexes = [];
                for (let j = 0; j < fiveOfAKindWinIndexes.length; j++) {
                    reelShowWinSymbolIndexes.push(fiveOfAKindWinIndexes[j][i]);
                }
                
                for (let j = 0; j < this.winSymbolReels[i].children.length; j++) {
                    if (reelShowWinSymbolIndexes.indexOf(j) >= 0) {
                        let winSymbol = this.winSymbolReels[i].children[j];
                        winSymbol.active = true;
                        winSymbol.getComponent(sp.Skeleton).animation = "symbol-win-frame";
                        winSymbol.setPosition(new Vec3(0, this.reels[i].children[j].position.y, 0));

                        let symbol = this.reels[i].children[j].getComponent(Symbol);
                        symbol.Shine();
                        symbol.PlayAnimation(symbol.getComponentInChildren(sp.Skeleton).skeletonData.name);
                    }
                }
            }
        }
    }

    WinAmountSpawn(winLineAmount : number = 0){
        this.lineWinAmountNumberNode.getComponent(RollingNumber).SetImmediate(winLineAmount);
        this.lineWinAmountNumberNode.getComponent(UIOpacity).opacity = 255;
        this.lineWinAmountNumberNode.active = true;
        let lineWinLabelNode = this.lineWinAmountNumberNode;

        // stop tween first before calling new tween to prevent clash
        TweenUtils.StopTween(lineWinLabelNode.getComponent(UIOpacity));
        lineWinLabelNode.getComponent(UIOpacity).opacity = 0;
        TweenUtils.FadeUIOpacity(lineWinLabelNode, this.lineWinAmountFadeInSecond, 255).then(() => {
            Utils.WaitForSeconds(this.lineWinAmountStaySecond).then(() => {
                TweenUtils.FadeUIOpacity(lineWinLabelNode, this.lineWinAmountFadeOutSecond, 0).then(() => {
                    lineWinLabelNode.active = false;  
                });
            });
        });

        if (this.lineWinAmountNumberNodeOffsetY > 0) {
            TweenUtils.StopTween(this.lineWinAmountNumberNode);
            this.lineWinAmountNumberNode.position = v3(0, 0, 0);
            tween(this.lineWinAmountNumberNode)
            .to(this.lineWinAmountMoveSecond, {position : v3(0, this.lineWinAmountNumberNodeOffsetY, 0)})
            .start();
        }
    }
}



