import { _decorator, Component, Node, v3 } from 'cc';
import { WinController } from './WinController';
import GameData, { GameStateInfo } from '../Model/GameData';
import { GameStateAction, GameState } from '../Model/GameStateData';
import Utils from '../Util/Utils';
import { ReelController } from './ReelController';
import { Symbol, SymbolValue } from './Symbol';
const { ccclass, property } = _decorator;

@ccclass('WaysWinController')
export class WaysWinController extends WinController {
    override OnGameStateChange(customEvent: CustomEvent<any>): void {
        let eventDetail = customEvent.detail as GameStateInfo;
        if (Utils.CheckCurrentGameState(GameStateAction.exit, GameState.spin, eventDetail)) {
            if(GameData.instance.GetResult() != null && GameData.instance.GetResult().data.winnings > 0 && GameData.instance.GetResult().data.allSymbolWinnings['PS'] == null){
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
    override FilterArray(): void {
        this.winData = [];
        let tempData = [];
        let tempSymbol = [];

        let winningResult = GameData.instance.GetResult().data.allSymbolWinnings;
        //way 1
        /*for(let key in winningResult){
            for(let i = 0; i < winningResult[key].indexes.length; i++){
                //Use to get all the index of ways winning position
                if(winningResult[key].indexes.length >= ReelController.instance.reelNormals.length){
                    isAllOfAKind = true;
                }
                for(let j = 0; j < winningResult[key].indexes[i].length; j++){
                    let winningIndexes = [];
                    winningIndexes = [i , winningResult[key].indexes[i][j]];
                    tempData.push(winningIndexes);
                }
            }
            tempSymbol.push(winningResult[key].symbol);
        }*/
        
        //way 2
        let array = [];
        let tempWinData = {indexes : tempData , symbol : tempSymbol , wayWinnings : GameData.instance.GetResult().data.winnings , FiveOfAKind : this.isAllOfAKind};
        for(let i = 0; i < ReelController.instance.reelNormals.length; i++){
            for(let key in winningResult) {
                if(winningResult[key].indexes.length >= i + 1) {
                    tempData.push(...winningResult[key].indexes[i]);
                }
                if(winningResult[key].indexes.length == ReelController.instance.reelNormals.length) {
                    this.isAllOfAKind = true;
                }
            }
            array.push(tempData);
            tempData = [];
        }
        tempWinData.indexes = array;
        
        // push win symbol
        for(let key in winningResult) {
            tempSymbol.push(winningResult[key].symbol);
        }
        tempWinData.symbol = tempSymbol;
        this.winData.push(tempWinData);
        
        for(let key in winningResult){
            this.winData.push(winningResult[key]);
        }

        GameData.instance.SetAllOfAKind(this.isAllOfAKind);

    }

    override ShowWinLineRotation(): void {
        if (this.winData.length > 0) {
            if (this.winLineIndex == 0) {
                this.ResetWinSymbol();
                this.DimAllSymbols();
                this.SpawnAllSymbol(this.winLineIndex);
                if(this.showTotalWinLineAmount) {
                    let winAmountNumber = this.winData[this.winLineIndex].wayWinnings;
                    this.WinAmountSpawn(winAmountNumber);
                }

            } else {
                let winAmountNumber = this.winData[this.winLineIndex].totalWinnings;              
                this.ResetWinSymbol();
                this.DimAllSymbols();
                this.SpawnAllSymbol(this.winLineIndex);
                this.WinAmountSpawn(winAmountNumber);
            }
    
            if(this.winLineIndex < this.winData.length - 1){
                this.winLineIndex++
            } else if (this.winLineIndex == this.winData.length -1){
                this.winLineIndex = 0;
            }
        }
    }

    override SpawnAllSymbol(line?: number): void {
        let winningResults = this.winData[line].indexes;

        for(let i = 0; i < winningResults.length; i++) {
            if(winningResults[i].length > 0){
                for(let j = 0; j < winningResults[i].length; j++) {
                    let symbolIndex = winningResults[i][j];
                    let winningSymbol = ReelController.instance.reelNormals[i].node.children[symbolIndex].getComponent(Symbol);
                    let position = (v3(0, winningSymbol.node.position.y , 0));
                    switch(winningSymbol.symbolValue) {
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
        }

    }

    override ShowScatterWin(): void {
        if (GameData.instance.IsFreeSpinOn()) {
            let winningResult = GameData.instance.GetResult().data.allSymbolWinnings;
            this.DimAllSymbols();
            for(let key in winningResult) {
                for(let i = 0; i < winningResult[key].indexes.length; i++) {
                    for(let j = 0; j < winningResult[key].indexes[i].length; j++) {
                        if(winningResult[key].indexes[i].length > 0){
                            let symbolIndex = winningResult[key].indexes[i][j];
                            let winningSymbol = ReelController.instance.reelNormals[i].node.children[symbolIndex].getComponent(Symbol);
                            let position = (v3(0, winningSymbol.node.position.y , 0));
                            switch(winningSymbol.symbolValue) {
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
                }
            }
        }
        
    }

    override ShowAllFiveOfAKind(): void {
        let winningResult = GameData.instance.GetResult().data.allSymbolWinnings;
        this.DimAllSymbols();
        for(let key in winningResult) {
            if(winningResult[key].indexes.length >= ReelController.instance.reelNormals.length) {
                for(let i = 0; i < winningResult[key].indexes.length; i++) {
                    for(let j = 0; j < winningResult[key].indexes[i].length; j++) {
                        let symbolIndex = winningResult[key].indexes[i][j];
                        let winningSymbol = ReelController.instance.reelNormals[i].node.children[symbolIndex].getComponent(Symbol);
                        let position = (v3(0, winningSymbol.node.position.y , 0));
                        switch(winningSymbol.symbolValue) {
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
            }
        }
    }
}



