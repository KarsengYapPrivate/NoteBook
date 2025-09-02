import { _decorator, Component, instantiate, Node, Prefab, UITransform } from 'cc';
import { GameDetailReelsController } from './GameDetailReelsController';
const { ccclass, property } = _decorator;

@ccclass('GameDetailController')
export class GameDetailController extends Component {

    @property(Node) contentNode: Node = null;
    @property(Prefab) reelContentPrefab: Prefab = null;

    private resultArray: [] = null;
    private resultSizeArray: [] = null;

    protected onLoad(): void {
        let searchParams = new URLSearchParams(window.location.search);

        let value = searchParams.get("result");
        if (value != null) {
            let decodedURI = decodeURI(value);
            let resultStrings = decodedURI.split("|");
            this.resultArray = JSON.parse(resultStrings[0]);
            this.resultSizeArray = JSON.parse(resultStrings[1]);
        }

        if (this.resultArray == null || this.resultSizeArray == null) {
            console.error("Unable to form result from searchParams! searchParams:", searchParams);
        }
    }

    protected start(): void {
        let contentTransform = this.contentNode.getComponent(UITransform);
        contentTransform.setContentSize(contentTransform.width, contentTransform.contentSize.height * this.resultArray.length);

        for (let i = 0; i < this.resultArray.length; i++) {
            let newReelContentNode = instantiate(this.reelContentPrefab);
            newReelContentNode.parent = this.contentNode;
            newReelContentNode.getComponent(GameDetailReelsController).Initialize(this.resultArray[i], this.resultSizeArray[i]);
        }
    }
}


