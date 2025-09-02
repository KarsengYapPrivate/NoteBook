import { _decorator, Button, Component, Node, tween, UIOpacity, Vec3 } from 'cc';
import { GameOrientation, UIButtonEvent } from '../Model/GameStateData';
import Utils from '../Util/Utils';
import GameConfig from '../Model/GameConfig';

const { ccclass, property } = _decorator;

@ccclass('MenuPanelController')
export class MenuPanelController extends Component {

    public static instance: MenuPanelController = null;

    @property(Node) menuPanel: Node = null;
    @property(Node) menuButton: Node = null;
    @property(Node) menuSubButtonsParent: Node = null;
    @property(Node) historyButton: Node = null;
    @property(Node) supportButton: Node = null;
    @property(Node) cashierButton: Node = null;
    @property(Node) lobbyButton: Node = null;
    @property(Node) logoutButton: Node = null;

    onLoad () {

        if (MenuPanelController.instance == null) {
            MenuPanelController.instance = this;
        }
        
        addEventListener(UIButtonEvent[UIButtonEvent.open_menu_panel_clicked] , this.OnMenuButtonClicked.bind(this));
        addEventListener(UIButtonEvent[UIButtonEvent.close_menu_panel_clicked] , this.OnCloseMenuButtonClicked.bind(this));
    }

    private OnMenuButtonClicked (customEvent: CustomEvent){
        let orientation = Utils.CheckOrientation();
        let menuPanel = this.menuPanel;
        let menuButton = this.menuButton;
        let menuSubButtonsParent = this.menuSubButtonsParent;

        if (menuPanel != null) {
            menuPanel.active = true;
            menuButton.active = false;

            let fadeDuration = 0.025;

            for(let i = 0; i < menuSubButtonsParent.children.length; i++){
                menuSubButtonsParent.children[i].getComponent(UIOpacity).opacity = 1;
            }

            for(let i = 0; i < menuSubButtonsParent.children.length; i++){
                tween(menuSubButtonsParent.children[i])
                    .delay( i * fadeDuration)
                    .call((()=>{menuSubButtonsParent.children[i].getComponent(UIOpacity).opacity = 255;}).bind(this))
                    .to(0.02 , {scale:new Vec3(1,1,1)})
                    .call((()=>{
                        if(GameConfig.instance.GetSupportUrl()!="" && JSON.stringify(GameConfig.instance.GetSupportUrl()).length > 0) {
                            this.supportButton.getComponent(Button).interactable = true;
                        }
                        if(GameConfig.instance.GetLobbyUrl()!="" && JSON.stringify(GameConfig.instance.GetLobbyUrl()).length > 0) {
                            this.lobbyButton.getComponent(Button).interactable = true;
                        }
                        if(GameConfig.instance.GetHistoryUrl()!="" && JSON.stringify(GameConfig.instance.GetHistoryUrl()).length > 0) {
                            this.historyButton.getComponent(Button).interactable = true;
                        }
                        if(GameConfig.instance.GetLogoutUrl()!="" && JSON.stringify(GameConfig.instance.GetLogoutUrl()).length > 0) {
                            this.logoutButton.getComponent(Button).interactable = true;
                        }
                        if(GameConfig.instance.GetCashierUrl()!="" && JSON.stringify(GameConfig.instance.GetCashierUrl()).length > 0) {
                            this.cashierButton.getComponent(Button).interactable = true;
                        }
                    }).bind(this))
                    .start();
            }
        }
    }

    private async OnCloseMenuButtonClicked(customEvent: CustomEvent){
        let orientation = Utils.CheckOrientation();
        let menuPanel = this.menuPanel;
        let menuButton = this.menuButton;
        let menuSubButtonsParent = this.menuSubButtonsParent;

        if (menuPanel != null) {
            menuPanel.active = true;
            menuButton.active = false;

            let fadeDuration = 0.025;

            for(let i = 0; i < menuSubButtonsParent.children.length; i++){
                menuSubButtonsParent.children[i].getComponent(UIOpacity).opacity = 255;
            }

            for(let i = 0; i < menuSubButtonsParent.children.length; i++){
                let index = menuSubButtonsParent.children.length - i - 1;
                tween(menuSubButtonsParent.children[index])
                    .delay(i * fadeDuration)
                    .call((()=>{
                        menuSubButtonsParent.children[index].getComponent(UIOpacity).opacity = 1;

                        if (index == 0) {
                            this.menuPanel.active = false;
                            this.menuButton.active = true;

                            // this.hMenuPanel.active = false;
                            // this.hMenuButton.active = true;
                        }
                    }).bind(this))
                    .start();
            }
        }
    }
}


