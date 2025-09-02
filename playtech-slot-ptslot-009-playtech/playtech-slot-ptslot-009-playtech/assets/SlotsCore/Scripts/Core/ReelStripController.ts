import { _decorator, Component, Node, Prefab } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ReelStripController')
export class ReelStripController extends Component {

    @property (Prefab)
    iconPrefabs: Prefab [] = [];

    public UpdateReelStrip(data, reelList){
        
        let self = this;

        for(var i =0;i<data["data"]["normal"].length;i++){
            for(var j=0;j<data["data"]["normal"][i.toString()].length;j++){
                for(var k=0;k<self.iconPrefabs.length;k++){
                
                    if(data["data"]["normal"][i][j]==self.iconPrefabs[k].data.name && reelList[i] != null){
                   
                        reelList[i].nodes.push(self.iconPrefabs[k]);
                    }
                }
            }
            if(reelList[i] != null){

                reelList[i].CreateSymbol();
            }
        }
    }
}


