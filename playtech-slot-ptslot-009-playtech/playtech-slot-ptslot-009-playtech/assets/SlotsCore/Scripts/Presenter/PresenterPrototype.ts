import { _decorator, CCInteger, Component, Enum, log } from 'cc';
import { GameState, GameStateAction } from '../Model/GameStateData';
import { PresenterDictionary } from '../Model/PresenterDictionary';
import { GameStateInfo } from '../Model/GameData';
const { ccclass, property } = _decorator;

@ccclass('PresenterOption')
export class PresenterOption {
    @property({type: CCInteger, range:[0, 1000]}) presenterIndex: number = 0;
    @property({type: Enum(GameStateAction)}) gameStateAction: GameStateAction = GameStateAction.enter;
    @property({type: Enum(GameState)}) gameState: GameState = GameState.idle;
}

@ccclass('PresenterPrototype')
export default class PresenterPrototype extends Component {

    @property({type: PresenterOption}) protected presenterOption: PresenterOption = null;

    public AddPresenterToDictionary () {
        if (this.presenterOption != null) {
            log("Presenter [" + this.name + "] added");
            PresenterDictionary.instance.AddPresenter(this.presenterOption.gameStateAction, this.presenterOption.gameState, this.presenterOption.presenterIndex, this);
        }
    }

    // Presenter implementation must override this 
    // PresentationController will call this to check whether need to call RunPresenter
    public CheckTriggerCondition (gameStateInfo: GameStateInfo) {
        return true;
    }

    // Presenter implementation must override this 
    // PresentationController will call this to run this presenter
    // PresentationController will wait until RunPresenter is finished, either from async await or resolve in a Promise
    public RunPresenter (): Promise<void> {
        return;
    }
}


