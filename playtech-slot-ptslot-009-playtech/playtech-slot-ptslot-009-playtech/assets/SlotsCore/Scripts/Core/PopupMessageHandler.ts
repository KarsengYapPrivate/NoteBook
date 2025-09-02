import { _decorator, Button, Component, Label, Node } from 'cc';
import { GameStateEvent } from '../Model/GameStateData';
import { AssetManager } from './AssetManager';
import AudioManager from './AudioManager';
const { ccclass, property } = _decorator;

@ccclass('PopupOption')
export class PopupOption {
    message: string = "";
    yesCallback: () => void = null;
    noCallback: () => void = null;

    constructor (message: string, yesCallback: () => void = null, noCallback: () => void = null) {
        this.message = message;

        // set ok to close popup if no callback is passed in
        this.yesCallback = yesCallback;
        this.noCallback = noCallback;
    }
}

@ccclass('PopupMessageHandler')
export default class PopupMessageHandler extends Component {

    public static instance: PopupMessageHandler = null;

    @property(Node) popupNode: Node = null;
    @property(Label) messageLabel: Label = null;
    @property(Button) yesButton: Button = null;
    @property(Button) noButton: Button = null;

    protected popupOption: PopupOption = null;

    onLoad () {
        if (PopupMessageHandler.instance == null) {
            PopupMessageHandler.instance = this;
        }

        addEventListener(GameStateEvent.popup_message, this.OnPopupMessage.bind(this));
        addEventListener(GameStateEvent.close_popup_message, this.ClosePopup.bind(this));
        this.yesButton.node.on("click", this.YesButtonClicked.bind(this));
        this.noButton.node.on("click", this.NoButtonClicked.bind(this));

        this.Initialize();

        // Utils.WaitForSeconds(3).then(() => {
        //     this.HandlePopup(new CustomEvent(GameStateEvent.popup_message, {detail: new PopupOption("Do you want to continue?\nChangeBet will reset game progress.", true)}));
        // });
    }

    Initialize () {
        this.popupNode.active = false;
        this.yesButton.node.active = false;
        this.noButton.node.active = false;
    }

    PopupMessage (popupOption: PopupOption) {
        this.popupOption = popupOption;
        this.messageLabel.string = this.popupOption.message;

        this.yesButton.node.active = (this.popupOption.yesCallback != null);
        this.noButton.node.active = (this.popupOption.noCallback != null);
        this.popupNode.active = true;
    }

    protected OnPopupMessage (customEvent: CustomEvent) {
        let eventDetail = customEvent.detail as PopupOption;

        if (eventDetail == null) {
            eventDetail = new PopupOption("Unknown error!");
        }

        if (eventDetail.message == null) {
            eventDetail.message = "Unknown error!";
        }

        this.PopupMessage(eventDetail);
    }

    ClosePopup (customEvent: CustomEvent) {
        this.popupNode.active = false;
    }

    YesButtonClicked () {
        AudioManager.instance?.PlayGeneralBtnSound();
        if (this.popupOption?.yesCallback != null) {
            this.popupOption.yesCallback();
        }
    }

    NoButtonClicked () {
        AudioManager.instance?.PlayGeneralBtnSound();
        if (this.popupOption?.noCallback != null) {
            this.popupOption.noCallback();
        }
    }
}


