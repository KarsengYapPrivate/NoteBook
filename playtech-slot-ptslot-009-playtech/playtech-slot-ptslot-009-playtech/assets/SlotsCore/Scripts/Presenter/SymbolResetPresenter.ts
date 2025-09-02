import { _decorator, Component, Node, v3 } from 'cc';
import { GameState, GameStateAction, GameStateEvent } from '../Model/GameStateData';
import GameData, { GameStateInfo } from '../Model/GameData';
import Utils from '../Util/Utils';
import { Symbol } from '../Core/Symbol';
const { ccclass, property } = _decorator;

@ccclass('SymbolResetPresenter')
export class SymbolResetPresenter extends Component {
    onLoad(){
        addEventListener(GameStateEvent.game_state_changed , this.OnGameStateChange.bind(this))
    }

    OnGameStateChange(customEvent : CustomEvent){
        let eventDetail = customEvent.detail as GameStateInfo;

        if(Utils.CheckCurrentGameState(GameStateAction.exit , GameState.idle, eventDetail)){
        let specSymbolLayers = GameData.instance.specSymbolLayer.children;
        for(let i = 0; i < specSymbolLayers.length; i++){
            if(specSymbolLayers[i].children.length > 0){
                for(let j = 0; j < specSymbolLayers[i].children.length; j++){
                    let symbolParentPoint = specSymbolLayers[i].children[j].getComponent(Symbol).parentNode;
                    specSymbolLayers[i].children[j].setPosition(v3(0,0,0));
                    specSymbolLayers[i].children[j].setParent(symbolParentPoint);
                }
            }
        }
        let highSymbolLayers = GameData.instance.highSymbolLayer.children;
        for(let i = 0; i < highSymbolLayers.length; i++){
            if(highSymbolLayers[i].children.length > 0){
                for(let j = 0; j < highSymbolLayers[i].children.length; j++){
                    let symbolParentPoint = highSymbolLayers[i].children[j].getComponent(Symbol).parentNode;
                    highSymbolLayers[i].children[j].setPosition(v3(0,0,0));
                    highSymbolLayers[i].children[j].setParent(symbolParentPoint);
                }
            }
        }
        }
    }
}


