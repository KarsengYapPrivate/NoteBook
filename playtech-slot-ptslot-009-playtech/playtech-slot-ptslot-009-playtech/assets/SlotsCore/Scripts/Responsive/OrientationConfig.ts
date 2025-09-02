import { _decorator, Component, Enum, math, Node, Vec2, view, screen, Label, ResolutionPolicy, v2, sys, log, Details, director } from 'cc';
import { GameOrientation, GameStateEvent } from '../Model/GameStateData';
import Utils from '../Util/Utils';
import { NodeOrientation } from './NodeOrientation';
const { ccclass, property } = _decorator;

@ccclass('ResponsiveScript')
export class ResponsiveScript extends Component {

    @property({ type: Enum(GameOrientation) })
    originalOrientation: GameOrientation = GameOrientation.horizontal;

    @property({type: Vec2, readonly: true})
    horizontalResolution: Vec2 = new Vec2(1920, 1080);

    @property({type: Vec2, readonly: true})
    vertitalResolution: Vec2 = new Vec2(1080, 1920);

    @property(Number)
    setResolutionDelay: number = 0.5;

    @property(Boolean) lockScreen : boolean = false;

    private originalDesignResolution: math.Size;

    private currentOrientation = -1;

    private onViewOrientationChangedHandler = null;
    
    start() {
        view.resizeWithBrowserSize(true);

        // set original design resolution
        this.Init();

        this.onViewOrientationChangedHandler = this.OnViewOrientationChangedHandler.bind(this);

        // bind callback to orientation change event
        if(!this.lockScreen) {
            screen.on("orientation-change", this.onViewOrientationChangedHandler, this);
            screen.on("window-resize", this.onViewOrientationChangedHandler, this);
        }

        // change the design resolution first time
        this.OnViewOrientationChangedHandler();
    }

    protected onLoad(): void {
        let orientationComponents: NodeOrientation[] = director.getScene().getComponentsInChildren(NodeOrientation);
        for (let i = 0; i < orientationComponents.length; i++) {
            let orientationComponent = orientationComponents[i]; 
            orientationComponent.Initialize(); 
        }
    }


    protected onDestroy(): void {
        screen.off("orientation-change", this.onViewOrientationChangedHandler, this);
        screen.off("window-resize", this.onViewOrientationChangedHandler, this);
    }

    Init () {
        // console.log(view.getDesignResolutionSize());
        if(this.originalOrientation == GameOrientation.horizontal)
            this.originalDesignResolution = new math.Size(this.horizontalResolution.x, this.horizontalResolution.y);
        else
            this.originalDesignResolution = new math.Size(this.vertitalResolution.x, this.vertitalResolution.y);
    }

    OnViewOrientationChangedHandler () {
        let orientation = Utils.CheckOrientation(); 

        
        if (orientation == GameOrientation.horizontal) {
            view.setDesignResolutionSize(this.originalDesignResolution.x, this.originalDesignResolution.y, ResolutionPolicy.SHOW_ALL);
        } else {
            // this.SetDesignResolution();
            view.setDesignResolutionSize(this.vertitalResolution.x, this.vertitalResolution.y, ResolutionPolicy.SHOW_ALL);
        }

        if(this.currentOrientation != orientation) {
            this.currentOrientation = orientation;
            dispatchEvent(new CustomEvent(GameStateEvent.orientation_changed, {detail: {orientation: orientation}}));
        }
    }

    SetDesignResolution () {

        // widthx2 more than height
        view.setDesignResolutionSize(this.vertitalResolution.x, this.vertitalResolution.y, ResolutionPolicy.SHOW_ALL);
    }
}