import { _decorator, Component, director, instantiate, Node, sp, tween, UITransform, v3 } from 'cc';
import PresenterPrototype from '../../../SlotsCore/Scripts/Presenter/PresenterPrototype';
import GameData, { GameStateInfo } from '../../../SlotsCore/Scripts/Model/GameData';
import { ReelController } from '../../../SlotsCore/Scripts/Core/ReelController';
import Utils from '../../../SlotsCore/Scripts/Util/Utils';
import { CacasdingSymbol } from './CacasdingSymbol';
import { CacasdingReelDopController } from './CacasdingReelDopController';
const { ccclass, property } = _decorator;

export enum Direction {
    Up,
    Down,
    Left,
    Right
}

@ccclass('CacasdingWinPresenter')
export class CacasdingWinPresenter extends PresenterPrototype {
    private resumePresenter = false;
    private totalNumberOfNodeNeedToDestroy = 0;
    private numberNodeDestroy = 0;
    private destroyDone = false;
    private resultIndex = 0;

    private isAllLiveSymbolMove = false;
    private liveSymbolMove = 0;
    private symbolMove = 0;
    private totalSymbolMove = 0;

    protected onLoad(): void {
        addEventListener('DestroySymbol' , this.DestroySymbolDone.bind(this));
    }
    override CheckTriggerCondition(gameStateInfo: GameStateInfo): boolean {
        let trigger = false;

        if (GameData.instance.GetResult().total_win_amount > 0) {
            trigger = true;
        }
        return trigger;
    }

    override async RunPresenter(): Promise<void> {
        let result = GameData.instance.GetResult().data;
        this.resultIndex = 0;
        this.resumePresenter = false;
        this.DestroySymbol(result[this.resultIndex]);

        await Utils.WaitForCondition((()=>this.resumePresenter).bind(this));

        return;
    }

    async DestroySymbol(result) {
        await Utils.WaitForSeconds(0.1);
        if(result.winnings <= 0) {
            this.resumePresenter = true;
            return;
        }

        let reels = ReelController.instance.reelNormals;

        for(let i = 0; i < reels.length; i++) { 
            for(let j = 0; j < reels[i].node.children.length; j++) {
                let symbol =  reels[i].node.children[j];
                symbol.getComponent(CacasdingSymbol).liveSymbol = false;
            }
        }

        this.totalNumberOfNodeNeedToDestroy = 0;
        this.numberNodeDestroy = 0;
        this.destroyDone = false;
        this.totalSymbolMove = 0;
        this.symbolMove = 0;
        this.liveSymbolMove = 0;
        this.isAllLiveSymbolMove = false;

        for (let i = 0; i < result.destroySymbolIndexes.length; i++) {
            for (let j = 0; j < result.destroySymbolIndexes[i].length; j++) {
                if(result.destroySymbolIndexes[i][j] == 0) {
                    this.totalNumberOfNodeNeedToDestroy ++;
                    let symbolID = reels[i].node.children[j].getComponent(CacasdingSymbol).symbolID;
                    reels[i].node.children[j].getComponent(CacasdingSymbol).PlayAnimation(symbolID);
                } else {
                    this.liveSymbolMove++;
                    reels[i].node.children[j].getComponent(CacasdingSymbol).liveSymbol = true;
                }
            }
        }

        await Utils.WaitForCondition((()=>this.destroyDone).bind(this))

        this.MoveSymbol();
    }

    async MoveSymbol() {
        this.resultIndex++;
        let result = GameData.instance.GetResult().array[this.resultIndex];
        let reels = ReelController.instance.reelNormals;

        for (let i = 0; i < reels.length; i++) {
            await Utils.WaitForSeconds(0.05);
            this.SpawnSymbol(reels[i] , result , i);
        }
    }

    DestroySymbolDone() {
        this.numberNodeDestroy++;
        if(this.numberNodeDestroy == this.totalNumberOfNodeNeedToDestroy) {
            this.destroyDone = true;
        }
    }

    async SpawnSymbol(reel , result , index) {
        switch(reel.node.getComponent(CacasdingReelDopController).direction) {
            case Direction.Up : {
                let newReelsSymbolNumber = result[index].length - reel.node.children.length;
                let reelNodeLength = result[index].length - 1;
                for (let j = newReelsSymbolNumber - 1; j >= 0; j--) {
                   let symbol = instantiate(reel.node.getComponent(CacasdingReelDopController).symbolPrefab);
                   reel.node.addChild(symbol);
                   symbol.setSiblingIndex(newReelsSymbolNumber);

                   symbol.getComponent(CacasdingSymbol).UpdateSize(GameData.instance.GetResult().sizeArray[this.resultIndex][index][reelNodeLength - j]);
                   symbol.getComponent(CacasdingSymbol).UpdateSymbol(result[index][reelNodeLength - j]);
                   symbol.getComponent(CacasdingSymbol).UpdateName();
                }
                let number = 0;
                for (let k = 0; k < reel.node.children.length; k++) {
                    this.totalSymbolMove++;
                    let symbolHeight = reel.node.getComponent(CacasdingReelDopController).symbolHeight;
                    let symbol = reel.node.children[k];
                    let startY = reel.node.getComponent(UITransform).contentSize.height;
                    let endPosition = (reel.node.getComponent(UITransform).contentSize.height)
                    let numberOfSymbols = reel.node.getComponent(CacasdingReelDopController).numberOfSymbols

                    number += GameData.instance.GetResult().sizeArray[this.resultIndex][index][k];
                    reel.node.children[k].getComponent(CacasdingSymbol).symbolIndex = number - GameData.instance.GetResult().sizeArray[this.resultIndex][index][k];
                    let positionY = -(symbolHeight / 2) - ((symbolHeight * (symbol.getComponent(CacasdingSymbol).symbolIndex) + ((symbol.getComponent(CacasdingSymbol).symbolSize - 1) * (symbolHeight / 2))))
                    if(!reel.node.children[k].getComponent(CacasdingSymbol).liveSymbol) {
                        symbol.setPosition(v3(0,positionY, 0));
                        symbol.getComponent(CacasdingSymbol).UpdateStopPosition(symbol.position.y + endPosition);
                    } else {
                        symbol.getComponent(CacasdingSymbol).UpdateStopPosition(positionY + endPosition);
                        this.MoveLiveSymbolY(symbol , reel.node.getComponent(CacasdingReelDopController).direction);
                    }
                }     
                break;
            }
            case Direction.Down : {
                let newReelsSymbolNumber = result[index].length - reel.node.children.length;
                for (let j = newReelsSymbolNumber - 1; j >= 0; j--) {
                   let symbol = instantiate(reel.node.getComponent(CacasdingReelDopController).symbolPrefab);
                   reel.node.addChild(symbol);
                   symbol.setSiblingIndex(0);

                   symbol.getComponent(CacasdingSymbol).UpdateSize(GameData.instance.GetResult().sizeArray[this.resultIndex][index][j]);
                   symbol.getComponent(CacasdingSymbol).UpdateSymbol(result[index][j]);
                   symbol.getComponent(CacasdingSymbol).UpdateName();
                }
                let number = 0;
                for (let k = 0; k < reel.node.children.length; k++) {
                    this.totalSymbolMove++;
                    let symbolHeight = reel.node.getComponent(CacasdingReelDopController).symbolHeight;
                    let symbol = reel.node.children[k];
                    let startY = reel.node.getComponent(UITransform).contentSize.height;
                    let endPosition = (reel.node.getComponent(UITransform).contentSize.height + symbolHeight) - (symbolHeight / 2)
                    let numberOfSymbols = reel.node.getComponent(CacasdingReelDopController).numberOfSymbols

                    number += GameData.instance.GetResult().sizeArray[this.resultIndex][index][k];
                    reel.node.children[k].getComponent(CacasdingSymbol).symbolIndex = number - GameData.instance.GetResult().sizeArray[this.resultIndex][index][k];
                    let positionY = startY + ((symbolHeight * (numberOfSymbols - symbol.getComponent(CacasdingSymbol).symbolIndex) - ((symbol.getComponent(CacasdingSymbol).symbolSize - 1) * (symbolHeight / 2))))
                    if(!reel.node.children[k].getComponent(CacasdingSymbol).liveSymbol) {
                        symbol.setPosition(v3(0,positionY, 0));
                        symbol.getComponent(CacasdingSymbol).UpdateStopPosition(symbol.position.y - endPosition);
                    } else {
                        symbol.getComponent(CacasdingSymbol).UpdateStopPosition(positionY - endPosition);
                        this.MoveLiveSymbolY(symbol , reel.node.getComponent(CacasdingReelDopController).direction);
                    }
                }     
                break;
            }
            
            case Direction.Left : {
                let newReelsSymbolNumber = result[index].length - reel.node.children.length;
                for (let j = newReelsSymbolNumber - 1; j >= 0; j--) {
                   let symbol = instantiate(reel.node.getComponent(CacasdingReelDopController).symbolPrefab);
                   reel.node.addChild(symbol);
                   symbol.setSiblingIndex(reel.node.children.length);
                   symbol.getComponent(CacasdingSymbol).UpdateSize(GameData.instance.GetResult().sizeArray[this.resultIndex][index][result[index].length - 1 - j]);
                   symbol.getComponent(CacasdingSymbol).UpdateSymbol(result[index][result[index].length - 1 - j]);
                   symbol.getComponent(CacasdingSymbol).UpdateName();
                }
                let number = 0;
                for (let k = 0; k < reel.node.children.length; k++) {
                    this.totalSymbolMove++;
                    let symbolWidth = reel.node.getComponent(CacasdingReelDopController).symbolWidth;
                    let symbol = reel.node.children[k];
                    let startX = reel.node.getComponent(UITransform).contentSize.width;
                    let endPositionX = (reel.node.getComponent(UITransform).contentSize.width + symbolWidth) - (symbolWidth / 2)
                    let numberOfSymbols = reel.node.getComponent(CacasdingReelDopController).numberOfSymbols

                    number += GameData.instance.GetResult().sizeArray[this.resultIndex][index][k];
                    reel.node.children[k].getComponent(CacasdingSymbol).symbolIndex = number - GameData.instance.GetResult().sizeArray[this.resultIndex][index][k];
                    let positionX = startX + (symbolWidth / 2) + ((symbolWidth * (symbol.getComponent(CacasdingSymbol).symbolIndex) - ((symbol.getComponent(CacasdingSymbol).symbolSize - 1) * (symbolWidth / 2))))
                    if(!reel.node.children[k].getComponent(CacasdingSymbol).liveSymbol) {
                        symbol.setPosition(v3(positionX , 0 , 0));
                        symbol.getComponent(CacasdingSymbol).UpdateStopPosition(symbol.position.x - endPositionX + (symbolWidth / 2));
                    } else {
                        symbol.getComponent(CacasdingSymbol).UpdateStopPosition(positionX - endPositionX + (symbolWidth / 2));
                        this.MoveLiveSymbolX(symbol , reel.node.getComponent(CacasdingReelDopController).direction);
                    }
                }
                await Utils.WaitForCondition((()=>this.isAllLiveSymbolMove).bind(this));
                
                break;
            }

            case Direction.Right : {
                let newReelsSymbolNumber = result[index].length - reel.node.children.length;
                for (let j = newReelsSymbolNumber - 1; j >= 0; j--) {
                   let symbol = instantiate(reel.node.getComponent(CacasdingReelDopController).symbolPrefab);
                   reel.node.addChild(symbol);
                   symbol.setSiblingIndex(0);
                   symbol.getComponent(CacasdingSymbol).UpdateSize(GameData.instance.GetResult().sizeArray[this.resultIndex][index][j]);
                   symbol.getComponent(CacasdingSymbol).UpdateSymbol(result[index][j]);
                   symbol.getComponent(CacasdingSymbol).UpdateName();
                }
                let number = 0;
                for (let k = 0; k < reel.node.children.length; k++) {
                    this.totalSymbolMove++;
                    let symbolWidth = reel.node.getComponent(CacasdingReelDopController).symbolWidth;
                    let symbol = reel.node.children[k];
                    let startX = reel.node.getComponent(UITransform).contentSize.width;
                    let endPositionX = (reel.node.getComponent(UITransform).contentSize.width + symbolWidth) - (symbolWidth / 2)
                    let numberOfSymbols = reel.node.getComponent(CacasdingReelDopController).numberOfSymbols

                    number += GameData.instance.GetResult().sizeArray[this.resultIndex][index][k];
                    reel.node.children[k].getComponent(CacasdingSymbol).symbolIndex = number - GameData.instance.GetResult().sizeArray[this.resultIndex][index][k];
                    let positionX = (0 + (symbolWidth / 2)) - (symbolWidth * (numberOfSymbols - symbol.getComponent(CacasdingSymbol).symbolIndex) - ((symbol.getComponent(CacasdingSymbol).symbolSize - 1) * (symbolWidth / 2)));
                    if(!reel.node.children[k].getComponent(CacasdingSymbol).liveSymbol) {
                        symbol.setPosition(v3(positionX , 0 , 0));
                        symbol.getComponent(CacasdingSymbol).UpdateStopPosition(symbol.position.x + endPositionX - (symbolWidth/2));
                    } else {
                        symbol.getComponent(CacasdingSymbol).UpdateStopPosition(positionX + endPositionX - (symbolWidth/2));
                        this.MoveLiveSymbolX(symbol , reel.node.getComponent(CacasdingReelDopController).direction);
                    }
                }
                await Utils.WaitForCondition((()=>this.isAllLiveSymbolMove).bind(this));
                
                break;
            }
        }
    }

    async DropSymbol() {
        let reels = ReelController.instance.reelNormals;

        for(let i = 0; i < reels.length; i++) { 
            switch(reels[i].node.getComponent(CacasdingReelDopController).direction) {
                case Direction.Up : {
                    for (let k = 0; k < reels[i].node.children.length; k++) {
                        let numberOfSymbols = reels[i].node.getComponent(CacasdingReelDopController).numberOfSymbols;
                        let symbolDropIntervel = reels[i].node.getComponent(CacasdingReelDopController).symbolDropIntervel;
                        let symbol = reels[i].node.children[k];
                        if (!reels[i].node.children[k].getComponent(CacasdingSymbol).liveSymbol) {
                            this.MoveLiveSymbolY(symbol , reels[i].node.getComponent(CacasdingReelDopController).direction);
                            await Utils.WaitForSeconds(symbolDropIntervel - ((symbolDropIntervel / (numberOfSymbols + 2)) * (reels[i].node.children.length - k)));
                        }
                    }         
                    
                    break;
                }
                case Direction.Down : {
                    for (let k = reels[i].node.children.length - 1; k >= 0; k--) {
                        let numberOfSymbols = reels[i].node.getComponent(CacasdingReelDopController).numberOfSymbols;
                        let symbolDropIntervel = reels[i].node.getComponent(CacasdingReelDopController).symbolDropIntervel;
                        let symbol = reels[i].node.children[k];
                        if (!reels[i].node.children[k].getComponent(CacasdingSymbol).liveSymbol) {
                            this.MoveLiveSymbolY(symbol , reels[i].node.getComponent(CacasdingReelDopController).direction);
                            await Utils.WaitForSeconds(symbolDropIntervel - ((symbolDropIntervel / (numberOfSymbols + 2)) * (reels[i].node.children.length - k)));
                        }
                    }         
                    
                    break;
                }

                case Direction.Left : {
                    for (let k = 0; k < reels[i].node.children.length; k++) {
                        let numberOfSymbols = reels[i].node.getComponent(CacasdingReelDopController).numberOfSymbols;
                        let symbolDropIntervel = reels[i].node.getComponent(CacasdingReelDopController).symbolDropIntervel;
                        let symbol = reels[i].node.children[k];
                        if (!reels[i].node.children[k].getComponent(CacasdingSymbol).liveSymbol) {
                            this.MoveLiveSymbolX(symbol , reels[i].node.getComponent(CacasdingReelDopController).direction);
                            await Utils.WaitForSeconds(symbolDropIntervel - ((symbolDropIntervel / (numberOfSymbols + 2)) * (reels[i].node.children.length - k)))
                        }
                    }  
                    
                    break;
                }

                case Direction.Right : {
                    for (let k = 0; k < reels[i].node.children.length; k++) {
                        let numberOfSymbols = reels[i].node.getComponent(CacasdingReelDopController).numberOfSymbols;
                        let symbolDropIntervel = reels[i].node.getComponent(CacasdingReelDopController).symbolDropIntervel;
                        let symbol = reels[i].node.children[k];
                        if (!reels[i].node.children[k].getComponent(CacasdingSymbol).liveSymbol) {
                            this.MoveLiveSymbolX(symbol , reels[i].node.getComponent(CacasdingReelDopController).direction);
                            await Utils.WaitForSeconds(symbolDropIntervel - ((symbolDropIntervel / (numberOfSymbols + 2)) * (reels[i].node.children.length - k)))
                        }
                    }  
                    break;
                }
            }
            await Utils.WaitForSeconds(0.05);
        }
    }

    MoveLiveSymbolY(node , direction) {
        node.getComponent(CacasdingSymbol).CallMyChildBack();
        let positionYBeforeBounce = 0 ;
        switch(direction) {
            case Direction.Down :
                positionYBeforeBounce = node.getComponent(CacasdingSymbol).symbolStopPosition;
            break;

            case Direction.Up :
                positionYBeforeBounce = node.getComponent(CacasdingSymbol).symbolStopPosition;
            break;
        }
        tween(node)
        .to(0.2 , {position : v3( 0 , positionYBeforeBounce , 0)})
        .call((()=>{
            if(!node.getComponent(CacasdingSymbol).liveSymbol) {
                node.getComponent(CacasdingSymbol).LoadAppearAnimation();
            }
        }).bind(this))
        .to(0.01 , {position : v3( 0 , node.getComponent(CacasdingSymbol).symbolStopPosition , 0)})
        .call((()=>{
            this.symbolMove++;
            if(this.symbolMove == this.liveSymbolMove) {
                this.DropSymbol();
            }
            if(this.symbolMove == this.totalSymbolMove) {
                let resultData = GameData.instance.GetResult().data;
                this.DestroySymbol(resultData[this.resultIndex]);
            }
        }).bind(this))
        .start();
    }

    MoveLiveSymbolX(node , direction) {
        node.getComponent(CacasdingSymbol).CallMyChildBack();
        let positionXBeforeBounce = 0 ;
        switch(direction) {
            case Direction.Left :
                positionXBeforeBounce = node.getComponent(CacasdingSymbol).symbolStopPosition;
            break;

            case Direction.Right :
                positionXBeforeBounce = node.getComponent(CacasdingSymbol).symbolStopPosition;
            break;
        }
        tween(node)
        .to(0.2 , {position : v3(positionXBeforeBounce , 0 , 0)})
        .call((()=>{
            if(!node.getComponent(CacasdingSymbol).liveSymbol) {
                node.getComponent(CacasdingSymbol).LoadAppearAnimation();
            }
        }).bind(this))
        .call((()=>{
            this.symbolMove++;
            if(this.symbolMove == this.liveSymbolMove) {
                this.DropSymbol();
            }
            if(this.symbolMove == this.totalSymbolMove) {
                let resultData = GameData.instance.GetResult().data;
                this.DestroySymbol(resultData[this.resultIndex]);
            }
        }).bind(this))
        .start();
    }
}


