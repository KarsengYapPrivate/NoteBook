import { _decorator, Component, Node } from 'cc';
import { GameState, GameStateAction } from './GameStateData';
import PresenterPrototype from '../Presenter/PresenterPrototype';
import GameData, { GameStateInfo } from './GameData';
const { ccclass, property } = _decorator;

class PresenterListItem {
    sequenceIndex: number;
    presenter: PresenterPrototype;

    constructor (sequenceIndex: number, presenter: PresenterPrototype) {
        this.sequenceIndex = sequenceIndex;
        this.presenter = presenter;
    }
}

class PresenterList {
    enter: PresenterListItem[];
    exit: PresenterListItem[];

    constructor () {
        this.enter = [];
        this.exit = [];
    }
}

@ccclass('PresenterDictionary')
export class PresenterDictionary extends Component {

    public static instance: PresenterDictionary = null;
    private presenterDictionary: Map<GameState, PresenterList> = null;

    onLoad () {
        if (PresenterDictionary.instance == null) {
            PresenterDictionary.instance = this;
        }

        this.InitializeDictionary();
    }

    private InitializeDictionary () {
        // Initialize the presenter dictionary
        this.presenterDictionary = new Map<GameState, PresenterList>();
        this.presenterDictionary.set(GameState.idle, new PresenterList());
        this.presenterDictionary.set(GameState.spin, new PresenterList());
        this.presenterDictionary.set(GameState.result, new PresenterList());

        this.LoadAllPresenters();
    }

    private LoadAllPresenters () {
        let allPresenters = this.node.getComponentsInChildren(PresenterPrototype);
        for (let i = 0; i < allPresenters.length; i++) {
            (allPresenters[i] as PresenterPrototype).AddPresenterToDictionary();
        }
    }

    public AddPresenter (gameStateAction: GameStateAction, gameState: GameState, sequenceIndex: number, presenter: PresenterPrototype) {
        let presenterListItems = [];
        if (!this.presenterDictionary.has(gameState)) { // if game state is not initialized into dictionary
            let newPresenterList: PresenterList = new PresenterList();
            this.presenterDictionary.set(gameState, newPresenterList);
            presenterListItems = gameStateAction == GameStateAction.enter? newPresenterList.enter : newPresenterList.exit;

        } else { // if game state already exists inside presenter dictionary
            let presenterList = this.presenterDictionary.get(gameState);
            presenterListItems = gameStateAction == GameStateAction.enter? presenterList.enter : presenterList.exit;
        }

        presenterListItems.push(new PresenterListItem(sequenceIndex, presenter));
        presenterListItems.sort((a, b) => a.sequenceIndex - b.sequenceIndex); // sort presenter list base on sequenceIndex
    }

    // two of the following overload functions will force calling this function to pass either none or both params
    public GetPresenters (): PresenterPrototype[];
    public GetPresenters (gameStateAction: GameStateAction, gameState: GameState): PresenterPrototype[];
    // only one function body is allowed for a function, this function will now show in suggestion
    public GetPresenters (gameStateAction?: GameStateAction, gameState?: GameState): PresenterPrototype[] {
        let presenterListItems: PresenterListItem[] = [];
        if (gameStateAction == null && gameState == null) {
            let gameStateInfo = GameData.instance.GetGameStateInfo();
            gameStateAction = gameStateInfo.currentGameStateAction;
            gameState = gameStateInfo.currentGameState;
        }

        let presenterList: PresenterList = this.presenterDictionary.get(gameState);
        if (presenterList) {
            presenterListItems = gameStateAction == GameStateAction.enter? presenterList.enter : presenterList.exit;
        }
        // else return empty list

        let presenters: PresenterPrototype[] = [];
        for (let i = 0; i < presenterListItems.length; i++) {
            presenters.push(presenterListItems[i].presenter);
        }

        return presenters;
    }

    public GetPresentersWithGameStateInfo (gameStateInfo: GameStateInfo) {
        return PresenterDictionary.instance.GetPresenters(gameStateInfo.currentGameStateAction, gameStateInfo.currentGameState);
    }

    public GetCurrentStatePresenters () {
        let gameStateInfo = GameData.instance.GetGameStateInfo();
        return PresenterDictionary.instance.GetPresenters(gameStateInfo.currentGameStateAction, gameStateInfo.currentGameState);
    }
}


