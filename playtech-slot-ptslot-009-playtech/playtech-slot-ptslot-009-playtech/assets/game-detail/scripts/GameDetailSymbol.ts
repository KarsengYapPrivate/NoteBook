import { _decorator, Component, Node, Sprite, SpriteFrame, UITransform, Vec3, Color } from 'cc';
import { GameDetailData, GameDetailSymbolData } from './GameDetailData';
const { ccclass, property } = _decorator;

@ccclass('GameDetailSymbol')
export class GameDetailSymbol extends Component {

    @property(Node) spriteNode: Node = null;

    public Initialize (symbolID: string, symbolSize: number) {
        let gameDetailSymbolData: GameDetailSymbolData = null;
        
        for (let i = 0; i < GameDetailData.instance.gameDetailSymbolDatas.length; i++) {
            let symbolData: GameDetailSymbolData = GameDetailData.instance.gameDetailSymbolDatas[i];
            if (symbolData.symbolID == symbolID) {
                gameDetailSymbolData = symbolData;
                break;
            }
        }

        if (gameDetailSymbolData != null) {
            let spriteIndex = symbolSize - 1;
            this.spriteNode.getComponent(Sprite).spriteFrame = gameDetailSymbolData.spriteDatas[spriteIndex];

            let symbolWidth = GameDetailData.instance.oneStackSymbolSizeX;
            let symbolHeight = GameDetailData.instance.oneStackSymbolSizeY * symbolSize;
            this.node.getComponent(UITransform).setContentSize(symbolWidth, symbolHeight);
            this.spriteNode.setPosition(new Vec3(0, (symbolHeight / 2 * -1), 0));

        } else {
            console.error("Unable to find symbol data for symbol:", symbolID);
        }
    }
}


