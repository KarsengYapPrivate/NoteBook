import { _decorator, Color, CurveRange, Node, sp, Sprite, Tween, tween , TweenEasing, UIOpacity, v3, Vec3} from 'cc';
const { ccclass, property } = _decorator;

@ccclass('TweenUtils')
export default class TweenUtils {
    public static Slide (targetNode: Node, endPoint: Node, durationSecond: number){
        tween(targetNode)
            .to(durationSecond, {position: new Vec3(endPoint.position.x, endPoint.position.y, 0)})
            .start();
    }

    public static Popup (targetNode: Node, targetPosition: Vec3, durationSecond: number, finalScale: Vec3 = new Vec3(1, 1, 1)){
        targetNode.setScale(0, 0, 0);
        targetNode.active = true;
        return new Promise<void> ((resolve) => {
            tween(targetNode)
                .to(durationSecond, {
                    position: new Vec3(targetPosition.x, targetPosition.y, targetPosition.z),
                    scale: finalScale
                })
                .call(() => { resolve() })
                .start();
        });
    }

    public static PopClose (targetNode: Node, targetPosition: Vec3, durationSecond: number, finalScale: Vec3 = new Vec3(1, 1, 1)){
        targetNode.setScale(0, 0, 0);
        targetNode.active = true;
        return new Promise<void> ((resolve) => {
            tween(targetNode)
                .to(durationSecond, {
                    position: new Vec3(targetPosition.x, targetPosition.y, targetPosition.z),
                    scale: finalScale
                })
                .call(() => { resolve() })
                .start();
        });
    }

    public static FadeUIOpacity (uiOpacityNode: Node, durationSecond: number, opacity: number = 0) {
        let uiOpacity: UIOpacity = uiOpacityNode.getComponent(UIOpacity);
        if (uiOpacity) {
            return new Promise<void> ((resolve) => {
                tween(uiOpacity)
                    .to(durationSecond , { opacity: opacity })
                    .call(() => { resolve() })
                    .start();
            });
        } else {
            return;
        }
    }

    public static FadeSpriteColor (spriteNode: Node, durationSecond: number, finalAlpha = 0) {
        let sprite: Sprite = spriteNode.getComponent(Sprite);
        if (sprite) {
            return new Promise<void> ((resolve) => {
                tween(sprite.color)
                    .to(durationSecond , { a: finalAlpha})
                    .call(() => { resolve() })
                    .start();
            });
        } else {
            return;
        }
    }

    public static StopTween (target: any) {
        Tween.stopAllByTarget(target);
    }

   /**
         * @param targetNode node to tween
         * @param destinationPosition destination position
         * @param durationSecond duration of tween
         * @param callback callback when tween ended
         * @param destinationNode optional destination node reference. 
         * function will calculate destination at realtime with destination node world position
         * @param destinationPosition destination position
         * @param startTweenDelay delay before the tween started
    */
    public static TweenPosition (
        targetNode: Node, 
        destinationPosition: Vec3, 
        durationSecond: number, 
        callback: () => void = null,
        destinationNode: Node = null,
        curveRangeX: CurveRange = null, 
        curveRangeY: CurveRange = null, 
        startTweenDelay: number = 0){

        targetNode.active = true;
        var startPosition = targetNode.worldPosition;

        return new Promise<void> ((resolve) => {
            var obj = { time : 0, destinationPosition: targetNode.worldPosition };
            tween(obj)
            .delay(startTweenDelay)
            .to(durationSecond, { time: 1, destinationPosition: destinationPosition}, {
                onUpdate: (target: { time: number, destinationPosition: Vec3 }, ratio: number) => {
                    var destination: Vec3 = v3(0,0,0);
                    
                    if(destinationNode){
                        const curPos = TweenUtils.CalculateCurrentPosition( startPosition, destinationNode.worldPosition, target.time);
                        destination.x = curPos.x;
                        destination.y = curPos.y;
                        destination.z = curPos.z;
                        if(curveRangeX != null) destination.x += curveRangeX.evaluate(target.time, 0.5);
                        if(curveRangeY != null) destination.y += curveRangeY.evaluate(target.time, 0.5);
                    }
                    else{
                        destination.x = target.destinationPosition.x;
                        destination.y = target.destinationPosition.y;
                        destination.z = target.destinationPosition.z;

                        if(curveRangeX != null) destination.x += curveRangeX.evaluate(target.time, 0.5);
                        if(curveRangeY != null) destination.y += curveRangeY.evaluate(target.time, 0.5);
                    }
                    targetNode.worldPosition = destination;
                }
            })
            .call(() => {
                if(callback != null)
                callback?.();

                resolve();
            })
            .start();
        });
    }

    public static TweenLocalPosition (
        targetNode: Node, 
        destinationPosition: Vec3, 
        durationSecond: number, 
        startTweenDelay: number = 0,
        callback: () => void = null,
        _easing: TweenEasing = "linear",
        destinationNode: Node = null,
        curveRangeX: CurveRange = null, 
        curveRangeY: CurveRange = null, 
        ){

        targetNode.active = true;
        var startPosition = targetNode.worldPosition;

        return new Promise<void> ((resolve) => {
            var obj = { time : 0, destinationPosition: targetNode.position };
            tween(obj)
            .delay(startTweenDelay)
            .to(durationSecond, { time: 1, destinationPosition: destinationPosition }, {
                easing: _easing,
                onUpdate: (target: { time: number, destinationPosition: Vec3 }, ratio: number) => {
                    var destination: Vec3 = v3(0,0,0);
                    
                    if(destinationNode){
                        const curPos = TweenUtils.CalculateCurrentPosition( startPosition, destinationNode.position, target.time);
                        destination.x = curPos.x;
                        destination.y = curPos.y;
                        destination.z = curPos.z;
                        if(curveRangeX != null) destination.x += curveRangeX.evaluate(target.time, 0.5);
                        if(curveRangeY != null) destination.y += curveRangeY.evaluate(target.time, 0.5);
                    }
                    else{
                        destination.x = target.destinationPosition.x;
                        destination.y = target.destinationPosition.y;
                        destination.z = target.destinationPosition.z;

                        if(curveRangeX != null) destination.x += curveRangeX.evaluate(target.time, 0.5);
                        if(curveRangeY != null) destination.y += curveRangeY.evaluate(target.time, 0.5);
                    }
                    targetNode.position = destination;
                }
            })
            .call(() => {
                if(callback != null)
                callback?.();

                resolve();
            })
            .start();
        });
    }

    public static TweenLocalPositionOpt (opts: ITweenLocalPositionOption): { promise: Promise<void>, tween: Tween<{ time: number, destinationPosition: Vec3 }>}{

        opts.targetNode.active = true;
        var startPosition = opts.targetNode.position;
        let delay = opts.startTweenDelay ?? 0;
        let newTween: Tween<{ time: number, destinationPosition: Vec3 }> = null;
        return { promise: new Promise<void> ((resolve) => {
            var obj = { time : 0, destinationPosition: opts.targetNode.position };
            newTween = tween(obj)
            .delay(delay)
            .to(opts.durationSecond, { time: 1, destinationPosition: opts.destinationPosition }, {
                easing: opts.easing,
                onComplete: () => {
                    resolve();
                    if(opts.callback != null)
                    opts.callback?.();
                    // console.log("completed: " + opts.targetNode);
                },
                onUpdate: (target: { time: number, destinationPosition: Vec3 }, ratio: number) => {
                    var destination: Vec3 = v3(0,0,0);
                    
                    if(opts.destinationNode){
                        const curPos = TweenUtils.CalculateCurrentPosition( startPosition, opts.destinationNode.position, target.time);
                        destination.x = curPos.x;
                        destination.y = curPos.y;
                        destination.z = curPos.z;
                        if(opts.curveRangeX != null) destination.x += opts.curveRangeX.evaluate(target.time, 0.5);
                        if(opts.curveRangeY != null) destination.y += opts.curveRangeY.evaluate(target.time, 0.5);
                    }
                    else{
                        destination.x = target.destinationPosition.x;
                        destination.y = target.destinationPosition.y;
                        destination.z = target.destinationPosition.z;

                        if(opts.curveRangeX != null) destination.x += opts.curveRangeX.evaluate(target.time, 0.5);
                        if(opts.curveRangeY != null) destination.y += opts.curveRangeY.evaluate(target.time, 0.5);
                    }
                    opts.targetNode.position = destination;
                }

            })
            // .call(() => {
            //     if(opts.callback != null)
            //     opts.callback?.();

            //     resolve();
            // })
            .start();
        }),
            tween: newTween
        };
    }

    private static Lerp(start, end, time) {
        return start + (end - start) * time;
    }

    private static CalculateCurrentPosition(startPosition, endPosition, time) {
        const x = this.Lerp(startPosition.x, endPosition.x, time);
        const y = this.Lerp(startPosition.y, endPosition.y, time);
        const z = this.Lerp(startPosition.z, endPosition.z, time);
        return v3(x, y, z);
    }
    
}

export interface ITweenLocalPositionOption {

    /**
     * @targetNode
     * node to tween
     */
    targetNode: Node, 
    /**
     * @destinationPosition
     * destination
     */
    destinationPosition: Vec3, 
     /**
     * @durationSecond
     * duration of tween
     */
    durationSecond: number, 
    /**
     * @callback
     * callback when tween completed
     */
    callback?: () => void,
     /**
     * @destinationNode
     * destinationNode (optional). input to let system calculate destination on realtime.
     * use for destination that will change after tween started
     */
    destinationNode?: Node,
    /**
     * @startTweenDelay
     * delay before start tween
     */
    startTweenDelay?: number,
     /**
     * @easing
     * easing of tween
     */
    easing?: TweenEasing,
    curveRangeX?: CurveRange, 
    curveRangeY?: CurveRange, 
}