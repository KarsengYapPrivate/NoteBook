import { _decorator, Component, Node, Prefab } from 'cc';
import { ReelStopOptions } from './Reel';
const { ccclass, property } = _decorator;

@ccclass('ReelSpinPrototype')
export abstract class ReelSpinPrototype extends Component {

    @property(Prefab) symbolPrefab : Prefab = null;
    @property(Number) numberOfSymbols: number = 3; 
    @property(Number) stopCompleteCallbackDelay : number = 0;
    
    public abstract InitReel(callback: () => void);

    public abstract StartSpin(reelIndex: number, totalReels: number , callback: () => void , speed : number);

    public abstract SlowSpin(initialSpeedMultiplier: number, speedMultiplier: number, durationSeconds: number);

    public abstract StopSpin(reelStopOptions: ReelStopOptions);

}


