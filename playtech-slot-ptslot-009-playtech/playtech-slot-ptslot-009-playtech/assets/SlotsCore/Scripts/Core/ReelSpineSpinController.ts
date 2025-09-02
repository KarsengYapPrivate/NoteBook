import { _decorator, Component, instantiate, Node, Prefab, v2, UITransform, sp, Sprite, tween, v3, Skeleton } from 'cc';
import { ReelSpinPrototype } from './ReelSpinPrototype';
import Utils from '../Util/Utils';
import GameData from '../Model/GameData';
import { Reel, ReelStopOptions } from './Reel';
import { Symbol } from './Symbol';
const { ccclass, property } = _decorator;

@ccclass('ReelSpineSpinController')
export class ReelSpineSpinController extends ReelSpinPrototype {
    @property(Node) spinSpine: Node = null;

    public beginY: number = 0;
    public symbolNodes: Node[] = [];
    private symbolHeight: number = 0; // 236
    private isSpawn: boolean = false;
    private originalSpineTimeScale: number = 1;
    private symbolStopIndex: number = 0;

    override InitReel(callback: () => void) {
        if (this.symbolHeight == 0) {
            this.symbolHeight = this.node.getComponent(UITransform).contentSize.height / this.numberOfSymbols;
        }

        if (this.isSpawn == false) {
            let nodeHeight = this.symbolHeight;
            let startY = this.node.getComponent(UITransform).height - (nodeHeight / 2);

            for (let i = 0; i < 3; i++) {
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

    SetRandomSpriteToAllSymbols() {
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

    override StartSpin(reelIndex: number, totalReels: number, callback: () => void) {
        if (this.spinSpine) {
            this.spinSpine.active = true;

            // randomize reel spinning animation time to make it look like each reel is spinning individually
            let spinningSpine = this.spinSpine.getComponent(sp.Skeleton);
            let reelPartialTime = (1 / totalReels);
            spinningSpine.getCurrent(0).trackTime = 1 - (reelIndex * Math.random() * reelPartialTime);
            this.originalSpineTimeScale = spinningSpine.timeScale;
        }

        let nodeHeight = this.symbolHeight;
        let endY = this.node.getComponent(UITransform).height * 2;

        for (let i = 0; i < this.symbolNodes.length; i++) {
            this.symbolNodes[i].setPosition(0, endY, 0);
            endY = endY - nodeHeight;
            this.symbolNodes[i].getComponent(Symbol).Destroy();
        }

        callback?.call(null);
        this.symbolStopIndex = 0;
    }

    override SlowSpin(initialSpeedMultiplier: number, speedMultiplier: number, durationSeconds: number) {
        if (this.spinSpine) {
            this.spinSpine.getComponent(sp.Skeleton).timeScale = initialSpeedMultiplier;
            tween(this.spinSpine.getComponent(sp.Skeleton)).to(durationSeconds, { timeScale: speedMultiplier }).start();
        }
    }

    override StopSpin(reelStopOptions: ReelStopOptions) {

        let nodeHeight = this.symbolHeight;
        let startY = this.node.getComponent(UITransform).height - (nodeHeight / 2);

        let endY = this.node.getComponent(UITransform).height;
        this.symbolNodes = [];
        for (let i = 0; i < 3; i++) {
            let symbol = instantiate(this.symbolPrefab);
            this.node.addChild(symbol);
            symbol.setPosition(0, endY, 0);
            this.symbolNodes.push(symbol);
        }
        for (let i = 0; i < this.symbolNodes.length; i++) {
            let symbolNode = this.symbolNodes[i];
            // symbolNode.active = true;
            symbolNode.getComponent(Symbol).UpdateSymbol(reelStopOptions.reelResult[i]);

            tween(symbolNode)
                .to(reelStopOptions.stopDuration, { position: v3(0, (startY - 100), 0) })
                .call((() => {
                    if (this.spinSpine) {
                        this.spinSpine.active = false;
                        this.spinSpine.getComponent(sp.Skeleton).timeScale = this.originalSpineTimeScale; // reset timescale to original
                    }
                }).bind(this))
                .to(reelStopOptions.stopBounceDuration, { position: v3(0, startY, 0) })
                .call((() => {
                    this.AllSymbolStop();
                    symbolNode.getComponent(Symbol).LoadAppearAnimation();
                    if (this.symbolStopIndex == this.node.children.length) {
                        reelStopOptions.stopCompletedCallback(-1);
                    }
                }).bind(this))
                .start();
            startY = startY - nodeHeight;
        }
    }

    AllSymbolStop() {
        if (this.symbolStopIndex < this.node.children.length) {
            this.symbolStopIndex++
        }
    }
}


