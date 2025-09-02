import { _decorator, Component, log, Node } from 'cc';
import { GameState, GameStateAction, GameType } from '../Model/GameStateData';
import { PresenterDictionary } from '../Model/PresenterDictionary';
import GameData, { GameStateInfo } from '../Model/GameData';
import GameConfig from '../Model/GameConfig';
import Utils from '../Util/Utils';
const { ccclass, property } = _decorator;

@ccclass('PresentationController')
export class PresentationController extends Component {

    public static instance: PresentationController = null;

    protected onLoad(): void {
        if (PresentationController.instance == null) {
            PresentationController.instance = this;
        }
    }

    public CheckHavePresenters (gameStateInfo: GameStateInfo): boolean {
        return PresenterDictionary.instance.GetPresenters(gameStateInfo.currentGameStateAction, gameStateInfo.currentGameState).length > 0;
    }

    // public async RunPresenters (gameStateAction: GameStateAction, gameState: GameState, gameType: GameType): Promise<any>;
    // public async RunPresenters (gameStateAction: GameStateAction | GameStateInfo, gameState?: GameState, gameType?: GameType): Promise<any> {
    public async RunPresenters (gameStateInfo: GameStateInfo): Promise<any> {
        return new Promise<void>(async (resolve) => {
            log("Running Presenters for:", GameStateAction[gameStateInfo.currentGameStateAction], GameState[gameStateInfo.currentGameState]);
            let presenters = PresenterDictionary.instance.GetPresenters(gameStateInfo.currentGameStateAction, gameStateInfo.currentGameState);
            let runPresenters = [];

            for (let i = 0; i < presenters.length; i++) {
                let presenter = presenters[i];
                if (presenter.CheckTriggerCondition(gameStateInfo)) {
                    runPresenters.push(presenter);
                }
            }

            for (let i = 0; i < runPresenters.length; i++) {
                if (runPresenters.length > 0) await Utils.WaitForMilliseconds(GameConfig.instance.GetBeforePresenterDelayMillis());
                await runPresenters[i].RunPresenter();
                if (runPresenters.length > 0) await Utils.WaitForMilliseconds(GameConfig.instance.GetAfterPresenterDelayMillis());
            }

            log("Resolve Running Presenters for:", GameStateAction[gameStateInfo.currentGameStateAction], GameState[gameStateInfo.currentGameState]);
            resolve();
        });
    }
}


