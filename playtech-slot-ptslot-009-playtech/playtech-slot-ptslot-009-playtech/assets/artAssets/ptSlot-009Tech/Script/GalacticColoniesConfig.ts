import { _decorator, Component, Node, Prefab, sp } from 'cc';
const { ccclass, property } = _decorator;

@ccclass ('WinningNode') 
class WinningNode{
    @property(Node) wayNumberNode : Node = null;
    @property(Node) lineWinNode : Node = null;
}

@ccclass ('ExtraFeature')
class ExtraFeature {
    @property(Node) percentageNode : Node = null;
    @property(Node) percentageNodeAnimation : Node = null;
    @property(Node) multiplierBarHolder : Node = null;
    @property(Node) multiplyNodeLayer : Node = null;
    @property(Node) multiplyNodeTopLayer : Node = null;
    @property(Prefab) multiplyPrefab : Prefab = null;
    @property(Prefab) multiplyLabelPrefab : Prefab = null;
    @property(sp.SkeletonData) multiplyLabel : sp.SkeletonData [] = [];
    @property(Node) changeToWildNode : Node = null;
    @property(sp.SkeletonData) changeToWildSpine : sp.SkeletonData = null;
    @property(Prefab) extraLinePrefab : Prefab = null;
    @property(Node) extraLineStartPoint : Node = null;
    @property(Node) extraLineLayer : Node = null;
    public multiplyNumber : number = 0;
    public storeExraWildChance : string = null;
}

@ccclass ('IntroGroup')
class IntroGroup {
    @property(Node) reelGroup : Node = null;
    @property(Node) UIGroup : Node = null;
    @property(Node) characterHolderNode : Node = null;
    @property(Node) blackHoleNode : Node = null;
    @property(Node) characterNode : Node = null;
}
@ccclass('CharacterGroup')
class CharacterGroup {
    @property(Node) leftCharacter : Node = null;
    @property(Node) rightCharacter : Node = null;
}
@ccclass('BackGroundGroup')
class BackGroundGroup {
    @property(Node) backgroundH : Node = null;
    @property(Node) backgroundV : Node = null;
    @property(Node) rockGroup : Node = null;
}

@ccclass('Sound')
class Sound {
    @property(String) sfxIntro : string = ''; 
    @property(String) totalWinLoopEnd : string = ''; 
    @property(String) nearMissAppear : string = '';
    @property(String) nearMissFail : string = '';
    @property(String) nearMissSuccess : string = '';
    @property(String) scatterTrigger : string = '';
    @property(String) changeWild : string = '';
    @property(String) changeWildFeature : string = '';
    @property(String) sfxMultiplierAppear : string = '';
    @property(String) sfxMultiplierHit : string = '';
    @property(String) CharacterOne : string = '';
    @property(String) CharacterTwo : string = '';
    @property(String) symbolWin : string = '';
    @property(String) secondSymbolWin : string = '';
    @property(String) rockTransition : string = '';
    @property(String) freespinTransition : string = '';
    @property(String) consolationIncrease : string = '';
    @property(String) coinCountLoop : string = '';
    @property(String) coinCountLoopEnd : string = '';
    @property(String) reelDrop : string = '';
}

@ccclass('GalacticColoniesConfig')
export class GalacticColoniesConfig extends Component {
    public static instance : GalacticColoniesConfig = null;
    @property(WinningNode) winningNode : WinningNode = null;
    @property(ExtraFeature) extraFeature : ExtraFeature = null;
    @property(IntroGroup) introGroup : IntroGroup = null;
    @property(CharacterGroup) characterGroup : CharacterGroup = null;
    @property(BackGroundGroup) backGroundGroup : BackGroundGroup = null;
    @property(Sound) sound : Sound = null;
    public symbolID = ['P01', 'P02', 'P03', 'P04', 'P05', 'P06', 'P07', 'P08', 'P09', 'P10', 'P11' ];
    public sizeArray = [[1,1,1,1,1], [1,1,1,1,1], [1,1,1,1,1], [1,1,1,1,1], [1,1,1,1,1], [1,1,1,1,1], [1,1,1,1]];

    @property({type : Number , readonly : true}) currentWayNumber : number = 0;
    @property(Number) currentRound : number = 0;

    public scatterCount = 0;

    protected onLoad(): void {
        if(GalacticColoniesConfig.instance == null) {
            GalacticColoniesConfig.instance = this;
        }
    }
}


