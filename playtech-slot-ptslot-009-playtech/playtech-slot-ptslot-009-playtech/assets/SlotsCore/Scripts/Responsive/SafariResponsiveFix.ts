import { _decorator, Component, Node, screen, sys, view } from 'cc';
import { GameOrientation } from '../Model/GameStateData';
import Utils from '../Util/Utils';
const { ccclass, property } = _decorator;

// export enum Orientation {
//     Horizontal = "Horizontal",
//     Vertical = "Vertical",
//     None = "None"
// }

@ccclass('SafariResponsiveFix')
export class SafariResponsiveFix extends Component {

    private dispatch_event: boolean = true

    private lastOrientation: GameOrientation = GameOrientation.vertical;

    start() {
        screen.on("orientation-change", this.OnScreenOrientationChangedHandler.bind(this), this);

        // safari ios fix rotate orientation causes 
        // game view not fit to web page
        // start()
        this.lastOrientation = Utils.CheckOrientation();
        setTimeout(this.OnScreenOrientationChangedHandler.bind(this) ,500)
    }

    onDestroy () {
        screen.off("orientation-change", this.OnScreenOrientationChangedHandler, this);
    }

    OnScreenOrientationChangedHandler () {
        var self = this;
        // self.lastOrientation = self.CheckScreenOrientation();
        if (self.dispatch_event){
            self.dispatch_event = false
            setTimeout(()=>{
                var curOrientation = Utils.CheckOrientation();
                if(self.lastOrientation == curOrientation && sys.platform == sys.Platform.DESKTOP_BROWSER) return;
                self.lastOrientation = curOrientation
                let event = document.createEvent("HTMLEvents")
                
                event.initEvent("orientationchange", true, true)
                // fix mobile web browser not resize when orientation change
                window.dispatchEvent(event);
                
                self.dispatch_event = true;
            }, 100)
        }
    }

    areDatesMeetMinimumDifference(date1: Date, date2: Date, differenceInSecond: number): boolean {
        const differenceInSeconds: number = Math.abs((date1.getTime() - date2.getTime()) / 1000);
        return differenceInSeconds >= differenceInSecond;
    }

    update(deltaTime: number) {
        
    }
}


