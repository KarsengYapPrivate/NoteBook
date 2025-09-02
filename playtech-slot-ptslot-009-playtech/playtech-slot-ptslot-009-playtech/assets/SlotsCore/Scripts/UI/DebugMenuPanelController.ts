import { _decorator, Component, Node, tween, UIOpacity, Vec3 } from 'cc';
import { UIButtonEvent, GameOrientation } from '../Model/GameStateData';
import Utils from '../Util/Utils';
import { DEBUG } from 'cc/env';
const { ccclass, property } = _decorator;

@ccclass('DebugMenuPanelController')
export class DebugMenuPanelController extends Component {
    public static instance: DebugMenuPanelController = null;

    @property(Node) vMenuPanel: Node = null;
    @property(Node) vMenuButton: Node = null;
    @property(Node) vMenuSubButtonsParent: Node = null;

    @property(Node) hMenuPanel: Node = null;
    @property(Node) hMenuButton: Node = null;
    @property(Node) hMenuSubButtonsParent: Node = null;

    @property(Node) DebugButton : Node = null;

    onLoad () {

        if (DebugMenuPanelController.instance == null) {
            DebugMenuPanelController.instance = this;
        }
        
        addEventListener(UIButtonEvent[UIButtonEvent.debug_open_menu_panel_clicked] , this.DebugOnMenuButtonClicked.bind(this));
        addEventListener(UIButtonEvent[UIButtonEvent.debug_close_menu_panel_clicked] , this.DebugOnCloseMenuButtonClicked.bind(this));

        // if(DEBUG) this.DebugButton.active = true;
    }

    private DebugOnMenuButtonClicked (customEvent: CustomEvent){
        
        let orientation = Utils.CheckOrientation();
        let menuPanel = null;
        let menuButton = null;
        let menuSubButtonsParent = null;

        if (orientation == GameOrientation.horizontal && this.hMenuPanel != null) {
            menuPanel = this.hMenuPanel;
            menuButton = this.hMenuButton;
            menuSubButtonsParent = this.hMenuSubButtonsParent;
            
        } else {
            menuPanel = this.vMenuPanel;
            menuButton = this.vMenuButton;
            menuSubButtonsParent = this.vMenuSubButtonsParent;
        }

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
                    .start();
            }
        }
    }

    private async DebugOnCloseMenuButtonClicked(customEvent: CustomEvent){
        let orientation = Utils.CheckOrientation();
        let menuPanel = null;
        let menuButton = null;
        let menuSubButtonsParent = null;

        if (orientation == GameOrientation.horizontal && this.hMenuPanel != null) {
            menuPanel = this.hMenuPanel;
            menuButton = this.hMenuButton;
            menuSubButtonsParent = this.hMenuSubButtonsParent;
        } else {
            menuPanel = this.vMenuPanel;
            menuButton = this.vMenuButton;
            menuSubButtonsParent = this.vMenuSubButtonsParent;
        }

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
                            this.vMenuPanel.active = false;
                            this.vMenuButton.active = true;

                            this.hMenuPanel.active = false;
                            this.hMenuButton.active = true;
                        }
                    }).bind(this))
                    .start();
            }
        }
    }
}


