import { _decorator, Component, CurveRange, instantiate, Node, sp, tween, UITransform, v3 } from 'cc';
import { ReelSpinPrototype } from './ReelSpinPrototype';
import GameData from '../Model/GameData';
import Utils from '../Util/Utils';
import { Reel, ReelStopOptions } from './Reel';
import { Symbol } from './Symbol';
import { GameSpinType, UIButtonEvent } from '../Model/GameStateData';
import { ReelController } from './ReelController';
const { ccclass, property } = _decorator;

@ccclass('ReelSpinSpawnPrefabController')
export class ReelSpinSpawnPrefabController extends ReelSpinPrototype {

    @property(Node) spinSpine : Node = null;
    @property(CurveRange) moveUpCurveRange = new CurveRange();

    public beginY : number = 0;
    public symbolNodes : Node [] = [];
    public symbolNodesUseToStop : Node [] = [];
    private symbolHeight : number = 0; // 236
    private isSpawn : boolean = false;
    private symbolStopIndex : number = 0;
    private instantStopSpeed = 13000;
    private stopSpinCall : boolean = false;

    protected onLoad(): void {
        addEventListener(UIButtonEvent[UIButtonEvent.spin_stop_clicked], this.ForceStop.bind(this));
    }

    // #region Init Reel

    override InitReel (callback: () => void) {
        if (this.symbolHeight == 0) {
            this.symbolHeight = this.node.getComponent(UITransform).contentSize.height / this.numberOfSymbols;
        }

        if(this.isSpawn == false) {
            let nodeHeight = this.symbolHeight;
            let startY = this.node.getComponent(UITransform).height - (nodeHeight/2);
            
            for(let i = 0; i < 3; i++) {
                let symbol = instantiate(this.symbolPrefab);
                this.node.addChild(symbol);
                symbol.setPosition(0, startY, 0);
                startY = startY - nodeHeight;
                this.symbolNodes.push(symbol);
            }
            this.SetRandomSpriteToAllSymbols();
            this.isSpawn = true;
        }

        callback?.call(null);
    }
        
    SetRandomSpriteToAllSymbols () {
        let maxRand: number = GameData.instance.spriteDatas.length;
        let index = 0;

        while (index < this.symbolNodes.length) {
            let rand = Utils.RandomValueInt(0, maxRand);
            let symbolID = "";
            if ((symbolID = GameData.instance.spriteDatas[rand]['_name']) != "PS" && (symbolID = GameData.instance.spriteDatas[rand]['_name']) != "PW") {
                this.symbolNodes[index].getComponent(Symbol).UpdateSymbol(symbolID);
                index += 1;
            } // if random get symbol sprite is PS then redo random for the index again (prevent showing PS symbol with random)
        }
    }

    // #region Start Spin
    override StartSpin(reelIndex: number, totalReels: number, callback: () => void , speed : number) {

        let positionY = this.node.children[0].position.y;
        this.stopSpinCall = false;

        // make all parent point prefab back to the this node before spawn new prefab.
        for(let i = 0 ; i < this.node.children.length; i++) {
            this.node.children[i].getComponent(Symbol).CallMyChildBack();
        }

        // gen more symbol to on top of the reel. Use to make the spinning reel look better;
        if (GameData.instance.GetGameSpinType() == GameSpinType.normal_spin || GameData.instance.GetGameSpinType() == GameSpinType.auto_normal_spin) {
            for(let i = 0; i < 2; i++) {
                positionY = positionY + (this.symbolHeight);
                let symbol = instantiate(this.symbolPrefab);
                this.node.addChild(symbol);
                symbol.setSiblingIndex(0);
                symbol.setPosition(0, positionY, 0);
                let maxRand: number = GameData.instance.spriteDatas.length;
                let rand = Utils.RandomValueInt(0, maxRand);
                let symbolID = GameData.instance.spriteDatas[rand]['_name'];
                symbol.getComponent(Symbol).UpdateSymbol(symbolID);
            }
        }

        for(let i = 0 ; i < this.node.children.length; i++) {
            this.MoveStartSpin(this.node.children[i] , speed);
        }
        
        callback?.call(null);

        this.symbolStopIndex = 0;
    }

    // #region Slow Spin
    override SlowSpin(initialSpeedMultiplier: number, speedMultiplier: number, durationSeconds: number) {
        
    }

    // #region Stop Spin
    override StopSpin (reelStopOptions: ReelStopOptions) {
        this.symbolStopIndex = 0;
        this.symbolNodesUseToStop = [];
        this.stopSpinCall = true;
        
        if(this.node.getComponent(Reel).instantStop) {
            this.DestoySymbolAboveReel(this.instantStopSpeed);
        } else {
            this.DestoySymbolAboveReel(reelStopOptions.stopSpeed);
        }

        let startY = this.node.getComponent(UITransform).height - (this.symbolHeight / 2);

        for(let i = 0; i < this.symbolNodesUseToStop.length; i++) {
            let node = this.symbolNodesUseToStop[i];
            node.getComponent(Symbol).UpdateSymbol(reelStopOptions.reelResult[i]);
            let time = 0;
            if(!this.node.getComponent(Reel).instantStop) {
                time = this.getDistance(node.position.x , node.position.y , node.position.x , startY) / reelStopOptions.stopSpeed;
            } else {
                time = this.getDistance(node.position.x , node.position.y , node.position.x , startY) / this.instantStopSpeed;
            }
            tween(node)
            .to(time , {position : v3(node.position.x , startY , node.position.z)} , {onUpdate : (( target : Node , ratio : number )=>{
                let currentPos = v3(node.position.x , node.position.y + this.moveUpCurveRange.evaluate(ratio , 0.5) , 0);
                target.setPosition(currentPos);
            }).bind(this)})
            .call((()=>{ this.AllSymbolStop();
                node.getComponent(Symbol).LoadAppearAnimation();
                if(this.symbolStopIndex == this.numberOfSymbols){
                    reelStopOptions.stopCompletedCallback(-1); 
                }
            }).bind(this))
            .start();
            startY = startY - this.symbolHeight;
        }
    }

    AllSymbolStop(){
        if(this.symbolStopIndex < this.numberOfSymbols){
            this.symbolStopIndex++
        }
    }

    ForceStop() {
        if(!this.node.getComponent(Reel).instantStop) {
            let startY = this.node.getComponent(UITransform).height - (this.symbolHeight / 2);

            for(let i = 0; i < this.symbolNodesUseToStop.length; i++) {
                let node = this.symbolNodesUseToStop[i];
                let time = 0;
                time = this.getDistance(node.position.x , node.position.y , node.position.x , startY) / this.instantStopSpeed;
                tween(node)
                .to(time , {position : v3(node.position.x , startY , node.position.z)} , {onUpdate : (( target : Node , ratio : number )=>{
                    let currentPos = v3(node.position.x , node.position.y + this.moveUpCurveRange.evaluate(ratio , 0.5) , 0);
                    target.setPosition(currentPos);
                }).bind(this)})
                .call((()=>{ this.AllSymbolStop();
                    node.getComponent(Symbol).LoadAppearAnimation();
                    if(this.symbolStopIndex == this.numberOfSymbols){
                        ReelController.instance.StopCompletedCallback(-1); 
                    }
                }).bind(this))
                .start();
                startY = startY - this.symbolHeight;
            }
        }
    }

    // move start spin : this is for the first round node. use to make the node look have a little bit bounce so the game look better;
    MoveStartSpin(node , speed = 0) {
        let time = this.getDistance(node.position.x , node.position.y , node.position.x , 0 - this.symbolHeight) / speed;
        tween(node)
        .to(0.3 , {position : v3(node.position.x , node.position.y + 40 , node.position.z)})
        .call((()=>{
            if(this.stopSpinCall == false) {
                this.SpawnNewSymbol(speed);
            }
        }).bind(this))
        .to(time , {position : v3(node.position.x , 0 - this.symbolHeight , node.position.z)})
        .call((()=>{
            node.getComponent(Symbol).Destroy();
        }).bind(this))
        .start();
    }

    // move start spin 2 : this is for the reel node that spawn later because is new spin so I dun need to make it bounce;
    MoveStartSpin2(node , speed = 0) {
        let time = this.getDistance(node.position.x , node.position.y , node.position.x , 0 - this.symbolHeight) / speed;
        tween(node)
        .to(time , {position : v3(node.position.x , 0 - this.symbolHeight , node.position.z)})
        .call((()=>{
            if(this.stopSpinCall == false) {
                this.SpawnNewSymbol(speed);
            }
            node.getComponent(Symbol).Destroy();
        }).bind(this))
        .start();
    }

    // the symbol that use for random loop, nothing else do for this.
    SpawnNewSymbol(speed) {
        let positionY = this.node.children[0].position.y;
        let symbol = instantiate(this.symbolPrefab);
        let maxRand: number = GameData.instance.spriteDatas.length;
        let rand = Utils.RandomValueInt(0, maxRand);
        let symbolID = GameData.instance.spriteDatas[rand]['_name'];
        
        positionY = positionY + (this.symbolHeight);
        this.node.addChild(symbol);
        symbol.setSiblingIndex(0);
        symbol.setPosition(0, positionY, 0);
        symbol.getComponent(Symbol).UpdateSymbol(symbolID);
        this.MoveStartSpin2(symbol , speed);
    }

    // this is the function that use to spawn the final result.
    SpawnSymbolNeedStop(position) {
        let positionY = 0;
        if (GameData.instance.GetGameSpinType() == GameSpinType.normal_spin || GameData.instance.GetGameSpinType() == GameSpinType.auto_normal_spin) {
            positionY = position + this.symbolHeight;
        } else {
            positionY = position + this.symbolHeight /*+ (this.symbolHeight / 2)*/;
        }


        for(let i = 0; i < this.numberOfSymbols; i++) {
            let symbol = instantiate(this.symbolPrefab);
            this.node.addChild(symbol);
            symbol.setSiblingIndex(0);
            symbol.setPosition(0, positionY, 0);
            positionY = positionY + (this.symbolHeight);
            this.symbolNodesUseToStop.unshift(symbol);
        }
    }

    DestoySymbolAboveReel(speed) {
        let target = this.node.getComponent(UITransform).height;
        let closerPoint = this.node.children[0].position.y;
        let minDifference = Math.abs(target - closerPoint);
        let lastPosition = 0;
        for(let i = 0; i < this.node.children.length; i++) {
            let point = Math.abs(target - this.node.children[i].position.y);

            if(point <= minDifference) {
                minDifference = point;
                lastPosition = this.node.children[i].position.y;
            }
            if(this.node.children[i].position.y >= this.node.getComponent(UITransform).height + (this.symbolHeight/2)) {
                this.node.children[i].getComponent(Symbol).Destroy();
            }
        }
        for(let i = 0 ; i < this.node.children.length; i++) {
            this.MoveStartSpin2(this.node.children[i] , speed);
        }
        this.SpawnSymbolNeedStop(lastPosition);
    }

    getDistance(x1: number, y1: number, x2: number, y2: number): number {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }

    
}


