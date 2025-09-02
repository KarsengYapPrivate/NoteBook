import { _decorator, Component, instantiate, Node } from 'cc';
import GameData from '../../SlotsCore/Scripts/Model/GameData';
import { GameDetailData } from './GameDetailData';
import { GameDetailSymbol } from './GameDetailSymbol';
const { ccclass, property } = _decorator;

@ccclass('GameDetailReelsController')
export class GameDetailReelsController extends Component {

    @property([Node]) reelNodes: Node[] = [];

    Initialize (result: [][], resultSizes: [][]) {
        for (let i = 0; i < this.reelNodes.length; i++) {
            let reel = this.reelNodes[i];
            let reelResult = result[i];
            let reelSizes = resultSizes[i];

            for (let j = 0; j < reelResult.length; j++) {
                let detailSymbolNode = instantiate(GameDetailData.instance.gameDetailSymbolPrefab);
                detailSymbolNode.parent = reel;
                let detailSymbol: GameDetailSymbol = detailSymbolNode.getComponent(GameDetailSymbol);
                detailSymbol.Initialize(reelResult[j], reelSizes[j]);
            }
        }
    }
}


