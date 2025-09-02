import { _decorator, Component, CurveRange, director, Enum, instantiate, Label, Node, tween, Tween, UITransform, v3 } from 'cc';
import { ReelStopOptions, Reel } from '../../../SlotsCore/Scripts/Core/Reel';
import { ReelController } from '../../../SlotsCore/Scripts/Core/ReelController';
import { ReelSpinPrototype } from '../../../SlotsCore/Scripts/Core/ReelSpinPrototype';
import GameData from '../../../SlotsCore/Scripts/Model/GameData';
import { UIButtonEvent } from '../../../SlotsCore/Scripts/Model/GameStateData';
import Utils from '../../../SlotsCore/Scripts/Util/Utils';
import { CacasdingSymbol } from './CacasdingSymbol';
import { Symbol } from '../../../SlotsCore/Scripts/Core/Symbol';
import { GalacticColoniesConfig } from './GalacticColoniesConfig';
import RollingNumber from 'db://assets/SlotsCore/Scripts/UI/RollingNumber';
import AudioManager from 'db://assets/SlotsCore/Scripts/Core/AudioManager';
const { ccclass, property } = _decorator;

export enum Direction {
    Up,
    Down,
    Left,
    Right
}

@ccclass('GalacticReelDropController')
export class GalacticReelDropController extends ReelSpinPrototype {
    @property({ type: Enum(Direction) }) direction: Direction = Direction.Down;
    @property(CurveRange) moveUpCurveRange = new CurveRange();

    @property(Number) symbolDropIntervel: number = 0;
    @property(Number) symbolDropTime: number = 0;
    public symbolHeight = 0;
    private symbolWidth = 0;
    public symbolNodes: Node[] = [];
    private isSpawn: boolean = false;
    private symbolStopIndex = 0;
    private isSpinning = false;
    private isNeedSlow = false;
    private symbolStopIndexBefore = 0;
    private isForceStop = false;

    protected onLoad(): void {
        addEventListener(UIButtonEvent[UIButtonEvent.spin_stop_clicked], this.ForceStop.bind(this));
    }

    override InitReel(callback: () => void) {
        let nodeHeight = this.node.getComponent(UITransform).contentSize.height;
        let nodeWidth = this.node.getComponent(UITransform).contentSize.width;
        switch (this.direction) {
            case Direction.Down:
            case Direction.Up:
                if (this.symbolHeight == 0) {
                    this.symbolHeight = nodeHeight / this.numberOfSymbols;
                }
                if (this.isSpawn == false) {

                    let startY = nodeHeight - (this.symbolHeight / 2);

                    for (let i = 0; i < this.numberOfSymbols; i++) {
                        let symbol = instantiate(this.symbolPrefab);
                        this.node.addChild(symbol);
                        symbol.setPosition(0, startY, 0);
                        startY = startY - this.symbolHeight;
                        this.symbolNodes.push(symbol);
                    }

                    this.SetRandomSpriteToAllSymbols();
                    this.isSpawn = true;
                }
                break;
            case Direction.Left:
            case Direction.Right:
                if (this.symbolWidth == 0) {
                    this.symbolWidth = nodeWidth / this.numberOfSymbols;
                }
                if (this.isSpawn == false) {

                    let startX = nodeWidth - (this.symbolWidth / 2);

                    for (let i = 0; i < this.numberOfSymbols; i++) {
                        let symbol = instantiate(this.symbolPrefab);
                        this.node.addChild(symbol);
                        symbol.setPosition(startX, 0, 0);
                        startX = startX - this.symbolWidth;
                        this.symbolNodes.push(symbol);
                    }

                    this.SetRandomSpriteToAllSymbols();
                    this.isSpawn = true;
                }
                break;
        }

        callback?.call(null);
    }

    SetRandomSpriteToAllSymbols() {
        let maxRand: number = 13;
        let index = 0;

        while (index < this.symbolNodes.length) {
            let rand = Utils.RandomValueInt(0, maxRand);
            let symbolID = "";
            if ((symbolID = GameData.instance.spriteDatas[rand]['_name']) != "PS_1x1" && (symbolID = GameData.instance.spriteDatas[rand]['_name']) != "PW_1x1") {
                this.symbolNodes[index].getComponent(Symbol).UpdateSymbol(symbolID);
                this.symbolNodes[index].getComponent(Symbol).LoadIdleAnimation();
                index += 1;
            }
        }
    }

    override async StartSpin(reelIndex: number, totalReels: number, callback: () => void, speed: number) {
        let firstNode = this.node.children[0];
        let lastNode = this.node.children[this.node.children.length - 1];
        this.isSpinning = false;
        this.isNeedSlow = false;
        for (let i = 0; i < this.node.children.length; i++) {
            this.node.children[i].getComponent(CacasdingSymbol).CallMyChildBack();
        }

        this.symbolStopIndex = 0;
        this.symbolStopIndexBefore = 0;

        let index = 0;
        switch (this.direction) {
            case Direction.Up:
                for (let i = 0; i < this.node.children.length; i++) {
                    let targetPositionY = this.node.children[i].position.y + (this.symbolHeight * (this.numberOfSymbols))
                    let dropTween = tween(this.node.children[i])
                        .to(0.1, { position: v3(0, targetPositionY, 0) })
                        .call((() => {
                            index++
                            dropTween.stop();
                            this.node.children[i].getComponent(CacasdingSymbol).Destroy();
                            if (index == this.node.children.length - 1) {
                                callback?.call(null);
                            }
                        }).bind(this))
                        .start()
                }
                break;

            case Direction.Down:
                for (let i = 0; i < this.node.children.length; i++) {
                    let targetPositionY = this.node.children[i].position.y - (this.symbolHeight * (this.numberOfSymbols))
                    let dropTween = tween(this.node.children[i])
                        .to(0.1, { position: v3(0, targetPositionY, 0) })
                        .call((() => {
                            index++
                            dropTween.stop();
                            this.node.children[i].getComponent(CacasdingSymbol).Destroy();
                            if (index == this.node.children.length - 1) {
                                callback?.call(null);
                            }
                        }).bind(this))
                        .start()
                }
                break;

            case Direction.Left:
                for (let i = 0; i < this.node.children.length; i++) {
                    let targetPositionX = this.node.children[i].position.x - (this.symbolWidth * (this.node.children.length))
                    let dropTween = tween(this.node.children[i])
                        .to(0.1, { position: v3(targetPositionX, 0, 0) })
                        .call((() => {
                            index++
                            dropTween.stop();
                            this.node.children[i].getComponent(CacasdingSymbol).Destroy();
                            if (index == this.node.children.length - 1) {
                                callback?.call(null);
                            }
                        }).bind(this))
                        .start()
                }
                break;

            case Direction.Right:
                for (let i = 0; i < this.node.children.length; i++) {
                    let targetPositionX = this.node.children[i].position.x + (this.symbolWidth * (this.node.children.length))
                    let dropTween = tween(this.node.children[i])
                        .to(0.1, { position: v3(targetPositionX, 0, 0) })
                        .call((() => {
                            index++
                            dropTween.stop();
                            this.node.children[i].getComponent(CacasdingSymbol).Destroy();
                            if (index == this.node.children.length - 1) {
                                callback?.call(null);
                            }
                        }).bind(this))
                        .start()
                }
                break;
        }
    }

    override SlowSpin(initialSpeedMultiplier: number, speedMultiplier: number, durationSeconds: number) {

    }

    override async StopSpin(reelStopOptions: ReelStopOptions) {
        this.isSpinning = true;
        if(reelStopOptions.scatterSlowDurationSeconds > 0) {
            this.isNeedSlow = true;
        }

        switch (this.direction) {
            case Direction.Up: {
                let startY = 0;
                let endPosition = this.node.getComponent(UITransform).contentSize.height
                for (let i = 0; i < reelStopOptions.reelResult[this.node.getSiblingIndex()].length; i++) {
                    let symbol = instantiate(this.symbolPrefab);
                    this.node.addChild(symbol);

                    symbol.getComponent(CacasdingSymbol).UpdateSize(GameData.instance.GetResult().sizeArray[0][this.node.getSiblingIndex()][i]);
                    symbol.getComponent(CacasdingSymbol).UpdateSymbol(reelStopOptions.reelResult[this.node.getSiblingIndex()][i]);
                    symbol.getComponent(CacasdingSymbol).UpdateName();
                    symbol.getComponent(CacasdingSymbol).UpdateRemainTime(this.symbolDropTime);
                    let number = 0;
                    for (let j = 0; j < this.node.children.length; j++) {
                        number += GameData.instance.GetResult().sizeArray[0][this.node.getSiblingIndex()][j];
                        if (j == this.node.children.length - 1) {
                            symbol.getComponent(CacasdingSymbol).symbolIndex = number - GameData.instance.GetResult().sizeArray[0][this.node.getSiblingIndex()][j]
                        }
                    }
                }
                for (let i = 0; i < this.node.children.length; i++) {
                    let symbol = this.node.children[i];
                    symbol.setPosition(v3(0, -(this.symbolHeight / 2) - ((this.symbolHeight * (symbol.getComponent(CacasdingSymbol).symbolIndex) + ((symbol.getComponent(CacasdingSymbol).symbolSize - 1) * (this.symbolHeight / 2)))), 0));
                    symbol.getComponent(CacasdingSymbol).UpdateStopPosition(symbol.position.y + endPosition);
                }
                let time = 0
                if (this.node.getComponent(Reel).instantStop || GameData.instance.IsTurboSpin()) {
                    time = this.symbolDropTime / 2;
                } else {
                    time = this.symbolDropTime
                }

                

                for (let i = 0; i < this.node.children.length; i++) {
                    let symbol = this.node.children[i];

                    if (symbol.getComponent(CacasdingSymbol).isInstantStop) {
                        return;
                    }

                    if(this.isNeedSlow == true && !this.node.getComponent(Reel).instantStop) {
                        await Utils.WaitForSeconds(0.5);
                    }

                    let positionTween = tween(symbol)
                        .tag(1)
                        .to(time, { position: v3(0, symbol.getComponent(CacasdingSymbol).symbolStopPosition, 0) }, {
                            onUpdate: ((target: Node, ratio: number) => {
                                let currentPos = v3(symbol.position.x, symbol.position.y + this.moveUpCurveRange.evaluate(ratio, 0.5), 0);
                                target.setPosition(currentPos);
                            }).bind(this)
                        })
                        .call((() => {
                            symbol.getComponent(Symbol).LoadAppearAnimation();
                            this.AllSymbolStopBeforeDelay();
                            if(this.symbolStopIndexBefore == this.node.children.length) {
                                AudioManager.instance.PlayOneReelSound();
                            }
                        }).bind(this))
                        .delay(0.5)
                        .call((() => {
                            this.AllSymbolStop();

                            if (this.symbolStopIndex == this.node.children.length) {
                                reelStopOptions.stopCompletedCallback(-1);
                            }
                        }).bind(this))
                        .start();
                    if (!this.node.getComponent(Reel).instantStop && !GameData.instance.IsTurboSpin()) {
                        await Utils.WaitForSeconds(this.symbolDropIntervel - ((this.symbolDropIntervel / (this.numberOfSymbols + 2)) * (this.node.children.length - i)))
                    }
                }
                break;
            }
            case Direction.Down: {
                let startY = this.node.getComponent(UITransform).contentSize.height;
                let endPosition = (this.node.getComponent(UITransform).contentSize.height + this.symbolHeight) - (this.symbolHeight / 2)
                for (let i = 0; i < reelStopOptions.reelResult[this.node.getSiblingIndex()].length; i++) {
                    let symbol = instantiate(this.symbolPrefab);
                    this.node.addChild(symbol);
                    let array = [];
                    if(GameData.instance.GetResult() != null) {
                        array = GameData.instance.GetResult().sizeArray[0][this.node.getSiblingIndex()];
                    } else {
                        array = GalacticColoniesConfig.instance.sizeArray[this.node.getSiblingIndex()];
                    }
                    symbol.getComponent(CacasdingSymbol).UpdateSize(array[i]);
                    symbol.getComponent(CacasdingSymbol).UpdateSymbol(reelStopOptions.reelResult[this.node.getSiblingIndex()][i]);
                    if(GameData.instance.GetResult() != null) {
                        if(GameData.instance.GetResult().extraFeatureIsWildChance) {
                            if(GameData.instance.GetResult().wildResultArray[this.node.getSiblingIndex()][i] == 1) {
                                let rand = Utils.RandomValueInt(0, GalacticColoniesConfig.instance.symbolID.length);
                                symbol.getComponent(CacasdingSymbol).UpdateSymbol(GalacticColoniesConfig.instance.symbolID[rand]);
                            }
                        }
                    }
                    symbol.getComponent(CacasdingSymbol).UpdateName();
                    symbol.getComponent(CacasdingSymbol).UpdateRemainTime(this.symbolDropTime);
                    let number = 0;
                    for (let j = 0; j < this.node.children.length; j++) {
                        number += array[j];
                        if (j == this.node.children.length - 1) {
                            symbol.getComponent(CacasdingSymbol).symbolIndex = number - array[j]
                        }
                    }
                }

                let rollingNumberTime = 0;

                for (let i = this.node.children.length - 1; i >= 0; i--) {
                    let symbol = this.node.children[i];
                    symbol.setPosition(v3(0, startY + ((this.symbolHeight * (this.numberOfSymbols - symbol.getComponent(CacasdingSymbol).symbolIndex) - ((symbol.getComponent(CacasdingSymbol).symbolSize - 1) * (this.symbolHeight / 2)))), 0));
                    symbol.getComponent(CacasdingSymbol).UpdateStopPosition(symbol.position.y - endPosition);

                    if(this.isNeedSlow) {
                        rollingNumberTime = rollingNumberTime + 0.5 + (this.symbolDropIntervel - ((this.symbolDropIntervel / (this.numberOfSymbols + 2)) * (this.node.children.length - i)))
                    } else {
                        rollingNumberTime = rollingNumberTime + (this.symbolDropIntervel - ((this.symbolDropIntervel / (this.numberOfSymbols + 2)) * (this.node.children.length - i)))
                    }
                }

                if(GalacticColoniesConfig.instance.currentWayNumber == 0) {
                    GalacticColoniesConfig.instance.currentWayNumber = this.node.children.length;
                } else {
                    GalacticColoniesConfig.instance.currentWayNumber = GalacticColoniesConfig.instance.currentWayNumber * this.node.children.length;
                }
                GalacticColoniesConfig.instance.winningNode.wayNumberNode.getComponent(RollingNumber).SetTarget(GalacticColoniesConfig.instance.currentWayNumber , rollingNumberTime)

                let time = 0
                if (this.node.getComponent(Reel).instantStop || GameData.instance.IsTurboSpin()) {
                    time = this.symbolDropTime / 2;
                } else {
                    time = this.symbolDropTime;
                }

                let scatterPlaying = false;

                let playReelStopAudio = false;


                for (let i = this.node.children.length - 1; i >= 0; i--) {
                    let symbol = this.node.children[i];

                    if (symbol.getComponent(CacasdingSymbol).isInstantStop) {
                        return;
                    }
                    if(this.isNeedSlow == true && !this.node.getComponent(Reel).instantStop) {
                        await Utils.WaitForSeconds(0.5);
                    }

                    // if(!scatterPlaying && reelStopOptions.scatterSlowDurationSeconds > 0 && this.node.getComponent(Reel).reelScatterNodes != null && !this.node.getComponent(Reel).instantStop) {
                    //     this.node.getComponent(Reel).PlayScattreReelFrame();
                    //     scatterPlaying = true;
                    // }

                    tween(symbol)
                        .tag(this.StringToHash(this.node.uuid))
                        .to(time, { position: v3(0, symbol.getComponent(CacasdingSymbol).symbolStopPosition, 0) }, {
                            onUpdate: ((target: Node, ratio: number) => {
                                // if (!this.node.getComponent(Reel).instantStop) {
                                //     symbol.getComponent(CacasdingSymbol).UpdateRemainTime(time - (time * ratio));
                                //     let currentPos = v3(symbol.position.x, symbol.position.y + this.moveUpCurveRange.evaluate(ratio, 0.5), 0);
                                //     target.setPosition(currentPos);
                                // }
                            }).bind(this)
                        })
                        .call((() => {
                            symbol.getComponent(Symbol).LoadAppearAnimation();
                            if(!this.isForceStop) {
                                if(symbol.getComponent(CacasdingSymbol).symbolID != 'PS') {
                                    AudioManager.instance.PlayEventSound(GalacticColoniesConfig.instance.sound.reelDrop); 
                                }
                            }


                            if(!playReelStopAudio) {
                                AudioManager.instance.PlayOneReelSound();
                                playReelStopAudio = true;
                            }

                            this.AllSymbolStopBeforeDelay();
                            if(this.symbolStopIndexBefore == this.node.children.length) {
                                if(this.isForceStop) {
                                    AudioManager.instance.PlayEventSound(GalacticColoniesConfig.instance.sound.reelDrop); 
                                }
                                dispatchEvent(new CustomEvent('ReelDone'));
                                this.isSpinning = false;
                            }
                        }).bind(this))
                        .delay(0.5)
                        .call((() => {
                            this.AllSymbolStop();
                            if (this.symbolStopIndex == this.node.children.length) {
                                reelStopOptions.stopCompletedCallback(-1);
                            }
                        }).bind(this))
                        .start();
                    if (!this.node.getComponent(Reel).instantStop && !GameData.instance.IsTurboSpin()) {
                        await Utils.WaitForSeconds(this.symbolDropIntervel - ((this.symbolDropIntervel / (this.numberOfSymbols + 2)) * (this.node.children.length - i)))
                    }
                }

                break;
            }
            case Direction.Left: {
                let startX = this.node.getComponent(UITransform).contentSize.width;
                let endPositionX = (this.node.getComponent(UITransform).contentSize.width + this.symbolWidth) - (this.symbolWidth / 2)
                for (let i = 0; i < reelStopOptions.reelResult[this.node.getSiblingIndex()].length; i++) {
                    let symbol = instantiate(this.symbolPrefab);
                    this.node.addChild(symbol);
                    symbol.getComponent(CacasdingSymbol).UpdateSymbol(reelStopOptions.reelResult[this.node.getSiblingIndex()][i]);
                    symbol.getComponent(CacasdingSymbol).UpdateName();
                    symbol.getComponent(CacasdingSymbol).UpdateRemainTime(this.symbolDropTime);
                    let number = 0;
                    let array = [];
                        if (GameData.instance.GetResult() != null) {
                            array = GameData.instance.GetResult().sizeArray[0][this.node.getSiblingIndex()];
                        } else {
                            array = GalacticColoniesConfig.instance.sizeArray[this.node.getSiblingIndex()];
                        }
                    for (let j = 0; j < this.node.children.length; j++) {
                        
                        number += array[j];
                        if (j == this.node.children.length - 1) {

                            symbol.getComponent(CacasdingSymbol).symbolIndex = number - array[j];
                        }
                    }
                    symbol.getComponent(CacasdingSymbol).UpdateSize(array[i]);
                }
                for (let i = this.node.children.length - 1; i >= 0; i--) {
                    let symbol = this.node.children[i];
                    symbol.setPosition(v3(startX + (this.symbolWidth / 2) + ((this.symbolWidth * (symbol.getComponent(CacasdingSymbol).symbolIndex) - ((symbol.getComponent(CacasdingSymbol).symbolSize - 1) * (this.symbolWidth / 2)))), 0, 0));
                }

                let rollingNumberTime = 0;

                for (let i = 0; i < this.node.children.length; i++) {
                    let symbol = this.node.children[i];
                    symbol.getComponent(CacasdingSymbol).UpdateStopPosition(symbol.position.x - endPositionX + (this.symbolWidth / 2));
                    if(this.isNeedSlow) {
                        rollingNumberTime = rollingNumberTime + 0.5 + (this.symbolDropIntervel - ((this.symbolDropIntervel / (this.numberOfSymbols + 2)) * (this.node.children.length - i)))
                    } else {
                        rollingNumberTime = rollingNumberTime + (this.symbolDropIntervel - ((this.symbolDropIntervel / (this.numberOfSymbols + 2)) * (this.node.children.length - i)))
                    }
                }

                let time = 0
                if (this.node.getComponent(Reel).instantStop || !GameData.instance.IsTurboSpin()) {
                    time = this.symbolDropTime / 2;
                } else {
                    time = this.symbolDropTime
                }

                if(GalacticColoniesConfig.instance.currentWayNumber == 0) {
                    GalacticColoniesConfig.instance.currentWayNumber = this.node.children.length;
                } else {
                    GalacticColoniesConfig.instance.currentWayNumber = GalacticColoniesConfig.instance.currentWayNumber * this.node.children.length;
                }
                if(GameData.instance.GetResult() != null) {
                    GalacticColoniesConfig.instance.winningNode.wayNumberNode.getComponent(RollingNumber).SetTarget(GameData.instance.GetResult().data[0].ways , rollingNumberTime)
                }

                let scatterPlaying = false;

                let playReelStopAudio = false;

                for (let i = 0; i < this.node.children.length; i++) {
                    let symbol = this.node.children[i];
                    if (symbol.getComponent(CacasdingSymbol).isInstantStop) {
                        return;
                    }

                    if(this.isNeedSlow == true && !this.node.getComponent(Reel).instantStop) {
                        await Utils.WaitForSeconds(0.5);
                    }

                    // if(!scatterPlaying && reelStopOptions.scatterSlowDurationSeconds > 0 && this.node.getComponent(Reel).reelScatterNodes != null && !this.node.getComponent(Reel).instantStop) {
                    //     this.node.getComponent(Reel).PlayScattreReelFrame();
                    //     scatterPlaying = true;
                    // }

                    tween(symbol)
                        .tag(this.StringToHash(this.node.uuid))
                        .to(time, { position: v3(symbol.getComponent(CacasdingSymbol).symbolStopPosition, 0, 0) })
                        .call((() => {
                            symbol.getComponent(Symbol).LoadAppearAnimation();

                            if(!playReelStopAudio) {
                                AudioManager.instance.PlayOneReelSound();
                                playReelStopAudio = true;
                            }

                            this.AllSymbolStopBeforeDelay();
                            if(!this.isForceStop) {
                                if(symbol.getComponent(CacasdingSymbol).symbolID != 'PS') {
                                    AudioManager.instance.PlayEventSound(GalacticColoniesConfig.instance.sound.reelDrop); 
                                }
                            }
                            
                            if(this.symbolStopIndexBefore == this.node.children.length) {
                                if(!this.isForceStop) {
                                    AudioManager.instance.PlayEventSound(GalacticColoniesConfig.instance.sound.reelDrop); 
                                }
                                dispatchEvent(new CustomEvent('ReelDone'));
                                this.isSpinning = false;
                            }
                        }).bind(this))
                        .delay(0.5)
                        .call((() => {
                            this.AllSymbolStop();
                            
                            if (this.symbolStopIndex == this.node.children.length) {
                                if(GalacticColoniesConfig.instance.currentWayNumber == 0) {
                                    GalacticColoniesConfig.instance.currentWayNumber = this.node.children.length;
                                } else {
                                    GalacticColoniesConfig.instance.currentWayNumber = GalacticColoniesConfig.instance.currentWayNumber * this.node.children.length;
                                }
                                if(GameData.instance.GetResult() != null) {
                                    GalacticColoniesConfig.instance.winningNode.wayNumberNode.getComponent(RollingNumber).SetTarget(GameData.instance.GetResult().data[0].ways , 0.05)
                                }
                                reelStopOptions.stopCompletedCallback(-1);
                            }
                        }).bind(this))
                        .start();
                    if (!this.node.getComponent(Reel).instantStop && !GameData.instance.IsTurboSpin()) {
                        await Utils.WaitForSeconds(this.symbolDropIntervel - ((this.symbolDropIntervel / (this.numberOfSymbols + 2)) * (this.node.children.length - i)))
                    }
                }
                break;
            }
            case Direction.Right: {
                let startX = this.node.getComponent(UITransform).contentSize.width;
                let endPositionX = this.node.getComponent(UITransform).contentSize.width
                for (let i = 0; i < reelStopOptions.reelResult[this.node.getSiblingIndex()].length; i++) {
                    let symbol = instantiate(this.symbolPrefab);
                    this.node.addChild(symbol);
                    symbol.getComponent(CacasdingSymbol).UpdateSymbol(reelStopOptions.reelResult[this.node.getSiblingIndex()][i]);
                    symbol.getComponent(CacasdingSymbol).UpdateName();
                    symbol.getComponent(CacasdingSymbol).UpdateRemainTime(this.symbolDropTime);
                    let number = 0;
                    for (let j = 0; j < this.node.children.length; j++) {
                        number += GameData.instance.GetResult().sizeArray[0][this.node.getSiblingIndex()][j];
                        if (j == this.node.children.length - 1) {
                            symbol.getComponent(CacasdingSymbol).symbolIndex = number - GameData.instance.GetResult().sizeArray[0][this.node.getSiblingIndex()][j]
                        }
                    }
                    symbol.getComponent(CacasdingSymbol).UpdateSize(GameData.instance.GetResult().sizeArray[0][this.node.getSiblingIndex()][i]);
                }
                for (let i = 0; i < this.node.children.length; i++) {
                    let symbol = this.node.children[i];
                    symbol.setPosition(v3((0 + (this.symbolWidth / 2)) - (this.symbolWidth * (this.numberOfSymbols - symbol.getComponent(CacasdingSymbol).symbolIndex) - ((symbol.getComponent(CacasdingSymbol).symbolSize - 1) * (this.symbolWidth / 2))), 0, 0));
                    symbol.getComponent(CacasdingSymbol).UpdateStopPosition(symbol.position.x + endPositionX);
                }

                let time = 0
                if (this.node.getComponent(Reel).instantStop || !GameData.instance.IsTurboSpin()) {
                    time = this.symbolDropTime / 2;
                } else {
                    time = this.symbolDropTime
                }

                

                for (let i = this.node.children.length - 1; i >= 0; i--) {
                    let symbol = this.node.children[i];
                    if (symbol.getComponent(CacasdingSymbol).isInstantStop) {
                        return;
                    }

                    if(this.isNeedSlow == true && !this.node.getComponent(Reel).instantStop) {
                        await Utils.WaitForSeconds(0.5);
                    }

                    tween(symbol)
                        .tag(4)
                        .to(time, { position: v3(symbol.getComponent(CacasdingSymbol).symbolStopPosition, 0, 0) })
                        .call((() => {
                            symbol.getComponent(Symbol).LoadAppearAnimation();
                        }).bind(this))
                        .delay(0.5)
                        .call((() => {
                            this.AllSymbolStop();

                            if (this.symbolStopIndex == this.node.children.length) {
                                if (GalacticColoniesConfig.instance.currentWayNumber == 0) {
                                    GalacticColoniesConfig.instance.currentWayNumber = this.node.children.length;
                                } else {
                                    GalacticColoniesConfig.instance.currentWayNumber = GalacticColoniesConfig.instance.currentWayNumber * this.node.children.length;
                                }
                                GalacticColoniesConfig.instance.winningNode.wayNumberNode.getComponent(RollingNumber).SetTarget(GalacticColoniesConfig.instance.currentWayNumber , 0.05)
                                reelStopOptions.stopCompletedCallback(-1);
                            }
                        }).bind(this))
                        .start();
                    if (!this.node.getComponent(Reel).instantStop && !GameData.instance.IsTurboSpin()) {
                        await Utils.WaitForSeconds(this.symbolDropIntervel - ((this.symbolDropIntervel / (this.numberOfSymbols + 2)) * (this.node.children.length - i)))
                    }
                }
                break;
            }
        }
    }

    async ForceStop() {
        //director.pause();
        this.isForceStop = true;
        if (this.isSpinning) {
            switch (this.direction) {
                case Direction.Up: {
                    Tween.stopAllByTag(1);
                    for (let i = 0; i < this.node.children.length; i++) {
                        let symbol = this.node.children[i];
                        symbol.getComponent(CacasdingSymbol).isInstantStop = true;
                        let positionTween = tween(symbol)
                            .to(symbol.getComponent(CacasdingSymbol).remainTime / 2, { position: v3(0, symbol.getComponent(CacasdingSymbol).symbolStopPosition, 0) }, {
                                onUpdate: ((target: Node, ratio: number) => {
                                    let currentPos = v3(symbol.position.x, symbol.position.y + this.moveUpCurveRange.evaluate(ratio, 0.5), 0);
                                    target.setPosition(currentPos);
                                }).bind(this)
                            })
                            .call((() => {
                                symbol.getComponent(Symbol).LoadAppearAnimation();
                            }).bind(this))
                            .delay(0.5)
                            .call((() => {
                                this.AllSymbolStop();

                                if (this.symbolStopIndex == this.node.children.length) {
                                    ReelController.instance.StopCompletedCallback(this.node.getSiblingIndex());
                                    this.isSpinning = false;
                            }}).bind(this))
                            .start();
                    }
                    break;
                }
                case Direction.Down: {
                    Tween.stopAllByTag(this.StringToHash(this.node.uuid));
                    for (let i = this.node.children.length - 1; i >= 0; i--) {
                        let symbol = this.node.children[i];
                        symbol.getComponent(CacasdingSymbol).isInstantStop = true;
                        let positionTween = tween(symbol) 
                            .to(symbol.getComponent(CacasdingSymbol).remainTime / 2, { position: v3(0, symbol.getComponent(CacasdingSymbol).symbolStopPosition, 0) }, {
                                onUpdate: ((target: Node, ratio: number) => {
                                }).bind(this)
                            })
                            .call((() => {
                                symbol.getComponent(Symbol).LoadAppearAnimation();
                                this.AllSymbolStopBeforeDelay();
                                if (this.symbolStopIndexBefore == this.node.children.length) {
                                    AudioManager.instance.PlayEventSound(GalacticColoniesConfig.instance.sound.reelDrop); 
                                }
                            }).bind(this))
                            .delay(0.5)
                            .call((() => {
                                this.AllSymbolStop();
                                if (this.symbolStopIndex == this.node.children.length) {
                                    this.node.getComponent(Reel).StopSpinCompletedCallback();
                                    this.isSpinning = false;
                            }}).bind(this))
                            .start();
                    }

                    break;
                }
                case Direction.Left: {
                    Tween.stopAllByTag(this.StringToHash(this.node.uuid));
                    for (let i = 0; i < this.node.children.length; i++) {
                        let symbol = this.node.children[i];
                        symbol.getComponent(CacasdingSymbol).isInstantStop = true;
                        tween(symbol)
                            .to(symbol.getComponent(CacasdingSymbol).remainTime / 2, { position: v3(symbol.getComponent(CacasdingSymbol).symbolStopPosition, 0, 0) })
                            .call((() => {
                                symbol.getComponent(Symbol).LoadAppearAnimation();
                                this.AllSymbolStopBeforeDelay();
                                if (this.symbolStopIndexBefore == this.node.children.length) {
                                    AudioManager.instance.PlayEventSound(GalacticColoniesConfig.instance.sound.reelDrop); 
                                }
                            }).bind(this))
                            .delay(0.5)
                            .call((() => {
                                this.AllSymbolStop();

                                if (this.symbolStopIndex == this.node.children.length) {
                                    this.node.getComponent(Reel).StopSpinCompletedCallback();
                                    this.isSpinning = false;
                            }}).bind(this))
                            .start();
                    }
                    break;
                }
                case Direction.Right: {
                    Tween.stopAllByTag(4);
                    for (let i = this.node.children.length - 1; i >= 0; i--) {
                        let symbol = this.node.children[i];
                        symbol.getComponent(CacasdingSymbol).isInstantStop = true;
                        tween(symbol)
                            .to(symbol.getComponent(CacasdingSymbol).remainTime / 2, { position: v3(symbol.getComponent(CacasdingSymbol).symbolStopPosition, 0, 0) })
                            .call((() => {
                                symbol.getComponent(Symbol).LoadAppearAnimation();
                            }).bind(this))
                            .delay(0.5)
                            .call((() => {
                                this.AllSymbolStop();

                                if (this.symbolStopIndex == this.node.children.length) {
                                    ReelController.instance.StopCompletedCallback(this.node.getSiblingIndex());
                                    this.isSpinning = false;
                            }}).bind(this))
                            .start();
                    }
                    break;
                }
            }
        }
    }

    AllSymbolStop() {
        if (this.symbolStopIndex < this.numberOfSymbols) {
            this.symbolStopIndex++
        }
    }

    AllSymbolStopBeforeDelay() {
        if(this.symbolStopIndexBefore < this.numberOfSymbols) {
            this.symbolStopIndexBefore++;
        }
    }

    StringToHash(str: string): number {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash |= 0;
        }
        return Math.abs(hash);
    }
}


