import { _decorator, CCFloat, CCString, Component, Node, Prefab, SpriteFrame } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('GameDetailSymbolData')
export class GameDetailSymbolData {
    @property(CCString) symbolID: string = "P01";
    @property(CCFloat) offsetY: number = 0;
    @property([SpriteFrame]) spriteDatas : SpriteFrame[] = [];
}

@ccclass('GameDetailData')
export class GameDetailData extends Component {

    public static instance: GameDetailData = null;

    @property(Prefab) gameDetailSymbolPrefab = null;
    
    @property(CCFloat) oneStackSymbolSizeX = 175;
    @property(CCFloat) oneStackSymbolSizeY = 134;
    @property({type: [GameDetailSymbolData]}) gameDetailSymbolDatas = [];

    protected onLoad(): void {
        if (GameDetailData.instance == null) {
            GameDetailData.instance = this;
            console.log(GameDetailData.instance);
        }
    }
}


