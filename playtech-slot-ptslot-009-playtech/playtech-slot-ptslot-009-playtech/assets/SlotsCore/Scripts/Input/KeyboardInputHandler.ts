import { _decorator, Component, EventKeyboard, Input, input, KeyCode, Node } from 'cc';
import { GameState, GameStateAction, GameStateEvent } from '../Model/GameStateData';
import Utils from '../Util/Utils';
import GameData from '../Model/GameData';
import GameMaster from '../Core/GameMaster';
const { ccclass, property } = _decorator;

@ccclass('KeyboardInputHandler')
export class KeyboardInputHandler extends Component {

    public static instance: KeyboardInputHandler = null;

    @property([Node]) disableWhenNodesActive: Node[] = [];

    protected spacebarDown: boolean = false;

    protected onLoad(): void {
        if (KeyboardInputHandler.instance == null) {
            KeyboardInputHandler.instance = this;
        }
        
        addEventListener(GameStateEvent.game_initialize, this.OnInitialize.bind(this));
    }

    OnInitialize () {
        input.on(Input.EventType.KEY_DOWN, this.OnKeyDown.bind(this));
        input.on(Input.EventType.KEY_UP, this.OnKeyUp.bind(this));
    }

    OnKeyDown (event: EventKeyboard) {
        switch(event.keyCode) {
            case KeyCode.SPACE:
                this.spacebarDown = true;

                if (this.CheckAllowSpacebarButtonEvent()) {
                    let eventDetail = { keyCode: KeyCode.SPACE };
                    dispatchEvent(new CustomEvent(GameStateEvent.keyboard_key_clicked, { detail: eventDetail }));
                }
                break;
        }
    }

    OnKeyUp (event: EventKeyboard) {
        switch(event.keyCode) {
            case KeyCode.SPACE:
                this.spacebarDown = false;
                break;
        }
    }

    IsSpacebarDown () {
        if (this.CheckAllowSpacebarButtonEvent()) return this.spacebarDown;
        else return false;
    }

    CheckAllowSpacebarButtonEvent () {
        let isAllow = true;
        for (let i = 0; i < this.disableWhenNodesActive.length; i++) {
            if (this.disableWhenNodesActive[i] != null && this.disableWhenNodesActive[i].active == true) {
                isAllow = false;
                break;
            }
        }

        return isAllow;
    }
}


