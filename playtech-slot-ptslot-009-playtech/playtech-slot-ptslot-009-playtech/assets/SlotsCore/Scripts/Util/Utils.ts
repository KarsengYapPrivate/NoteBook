import { __private, _decorator, log, Node, screen, sp, Sprite, SpriteFrame, sys, VERSION } from 'cc';
import { GameOrientation, GameState, GameStateAction, GameStateEvent, GameType } from '../Model/GameStateData';
import GameData, { GameStateInfo } from '../Model/GameData';
import {default as MobileDetect} from '../Util/Jslib/mobile-detect.js';
import { AssetManager } from '../Core/AssetManager';
import { PopupOption } from '../Core/PopupMessageHandler';
import GameConfig from '../Model/GameConfig';

const { ccclass, property } = _decorator;

@ccclass('Utils')
export default class Utils {

    public static RandomValueInt (min: number, max: number){
        return Math.floor(Math.random() * (max - min) + min);
    }

    public static ChangeSpine (objectSpine: any , name: any, spineDatas: sp.SkeletonData[]) {
        objectSpine.skeletonData = Utils.GetSpineData(name, spineDatas);
    }

    public static GetSpineData (name: any, spineDatas: sp.SkeletonData[]) {
        let temp = null;
        for (let i = 0; i < spineDatas.length; i++) {
            if (spineDatas[i].name == name) {
                temp = spineDatas[i];
            }
        }

        if (temp == null) {
            log("Spine not found in spine data list - name: " + name);
        }

        return temp;
    }

    public static ChangeSprite (objectSprite: any, name: any, spriteDatas: SpriteFrame[]) {
        objectSprite.spriteFrame = Utils.GetSpriteData(name, spriteDatas);
    }

    public static GetSpriteData (name: any, spriteDatas: SpriteFrame[]) {
        let temp = null;
        for (let i = 0; i < spriteDatas.length; i++) {
            if (spriteDatas[i].name == name) {
                temp = spriteDatas[i];
            }
        }

        if (temp == null) {
            log("Sprite not found in sprite data list - name: " + name);
        }

        return temp;
    }

    public static GetDeviceType () {
        let deviceType = 0;
        
        if (sys.isMobile) {
            deviceType = 1;
        } else {
            let md = new MobileDetect(Utils.GetUserAgent());
            deviceType = md.tablet()? 2 : 0;
        }

        return deviceType;
    }
    
    public static GetBrowserType () {
        return sys.browserType + " : " + sys.browserVersion;
    }

    public static GetOSversion () {
        return sys.osVersion;
    }

    public static GetDeviseOS () {
        switch(sys.os) {
            case "OS X":
                return 3;
            break;
            case "Android":
                return 0;
            break;
            case "Windows":
                return 2;
            break;
            case "Linux":
                return 4;
            break;
            case "iOS":
                return 1;
            break;
            default:
                return 99;
            break;
        }
    }

    public static GetH5App () {
        if (URL["h5_app"]!=null&&URL["h5_app"]!="") {
            return URL["h5_app"];
        } else {
            return 99;
        }
    }

    public static GetPhoneModel () {
        let model = "Desktop";
        let md = new MobileDetect(Utils.GetUserAgent());
        model = md.phone() || model;
        
        return model;
    }

    public static GetUserAgent () {
        return window.navigator.userAgent;
    }

    // find: Utils.CheckCurrentGameState(GameStateAction.exit, GameState.spin
    public static CheckCurrentGameState (gameStateAction: GameStateAction | string, gameState: GameState | string, gameStateInfo: GameStateInfo = null) {
        if (typeof gameStateAction === 'string') gameStateAction = GameState[gameStateAction];
        if (typeof gameState === 'string') gameState = GameState[gameState];
        if (gameStateInfo != null) {
            return  gameStateAction == gameStateInfo.currentGameStateAction
                    && gameState == gameStateInfo.currentGameState;
        } else {
            return  gameStateAction == GameData.instance.GetCurrentGameStateAction()
                    && gameState == GameData.instance.GetCurrentGameState();
        }
    }

    public static CheckPreviousGameState (gameStateAction: GameStateAction | string, gameState: GameState | string, gameStateInfo: GameStateInfo = null) {
        if (typeof gameStateAction === 'string') gameStateAction = GameState[gameStateAction];
        if (typeof gameState === 'string') gameState = GameState[gameState];
        if (gameStateInfo != null) {
            return  gameStateAction == gameStateInfo.previousGameStateAction
                        && gameState == gameStateInfo.previousGameState;
        } else {
            return  gameStateAction == GameData.instance.GetPreviousGameStateAction()
                        && gameState == GameData.instance.GetPreviousGameState();
        }
    }
    
    public static CheckGameTypeTransition (previousGameType: GameType | string, currentGameType: GameType | string, gameStateInfo: GameStateInfo = null) {
        if (typeof previousGameType === 'string') previousGameType = GameType[previousGameType];
        if (typeof currentGameType === 'string') currentGameType = GameType[currentGameType];
        if (gameStateInfo != null) {
            return  previousGameType == gameStateInfo.previousGameType
                    && currentGameType == gameStateInfo.currentGameType;
        } else {
            return  previousGameType == GameData.instance.GetPreviousGameType()
                    && currentGameType == GameData.instance.GetCurrentGameType();
        }
    }
    
    public static CheckCurrentGameType (currentGameType: GameType | string, gameStateInfo: GameStateInfo = null) {
        if (typeof currentGameType === 'string') currentGameType = GameType[currentGameType];
        if (gameStateInfo != null) {
            return  currentGameType == gameStateInfo.currentGameType;
        } else {
            return  currentGameType == GameData.instance.GetCurrentGameType();
        }
    }

    // Utility function for Wait for condition / default interval = 50 ms / default timeout = 1 hour
    public static WaitForCondition (handler: () => void, intervalMillis: number = 50, timeoutMillis = 3600000) {
        return new Promise ((resolve, reject) => {
            let clearTimers = () => {
                clearTimeout (timeoutTimer);
                clearInterval (timer);
            };

            let doStep = () => {
                let result;

                try {
                    result = handler ();
                    if (result) {
                        clearTimers ();
                        resolve (result);
                    } else {
                        timer = setTimeout (doStep, intervalMillis);
                    }
                } catch (e) {
                    let message = "Network disconnected. Please restart the game.";
                    if (AssetManager?.instance != null) {
                        let locMessage1 = AssetManager.instance.GetTextWithKey("UI.GameTimedOut");
                        let locMessage = locMessage1;
                        if (locMessage1 != null) message = locMessage;
                    }
                    
                    let popupOption = new PopupOption(message, () => {
                        window.location.href = GameConfig.instance.GetLobbyUrl();
                    });
                    dispatchEvent(new CustomEvent(GameStateEvent.popup_message, {detail: popupOption}));
                    clearTimers ();
                    reject (e);
                }
            };

            let timer = setTimeout (doStep, intervalMillis);
            let timeoutTimer = setTimeout (function onTimeout () {
                let message = "Network disconnected. Please restart the game.";
                if (AssetManager?.instance != null) {
                    let locMessage1 = AssetManager.instance.GetTextWithKey("UI.GameTimedOut");
                    let locMessage = locMessage1;
                    if (locMessage1 != null) message = locMessage;
                }
                
                let popupOption = new PopupOption(message, () => {
                    window.location.href = GameConfig.instance.GetLobbyUrl();
                });
                dispatchEvent(new CustomEvent(GameStateEvent.popup_message, {detail: popupOption}));
                clearTimers ();
                reject (new Error ("Timed out after waiting for " + timeoutMillis + " ms"));
            }, timeoutMillis);
        });
    }

    public static WaitForSeconds (seconds: number) {
        return Utils.WaitForMilliseconds(seconds * 1000);
    }

    public static WaitForMilliseconds (milliseconds: number) {
        if (milliseconds <= 0) return new Promise<void>((resolve) => resolve());
        return new Promise<void> ((resolve) => {
            setTimeout(() => {
                resolve();
            }, milliseconds);
        });
    }

    public static ChangeSpineAnimation(targetNode : Node , animationOne : string , animationTwo : string){
        return new Promise<void> ((resolve) => {
            let targetNodeSkeleton = targetNode.getComponent(sp.Skeleton);
            targetNodeSkeleton.animation = animationOne;
            targetNodeSkeleton.setCompleteListener(function(data){
                if(data.animation.name == animationOne){
                    targetNodeSkeleton.animation = animationTwo;
                    resolve();
                }
            })
        });
    }

    /** 
     * @remarks
     * Set current animation to play.
     * Only works when spine have playing animation
     * This will removed all queued animation before start playing
     * @param callback function when animation completed
     * @param interruptCallback function when animation started but cancel or change to another animation
    */
    public static SetSpineAnimation(targetNode : Node , animationName : string , 
        callback: () => void = null,
        disposeCallback: () => void = null,
        interruptCallback: () => void = null,
        loop: boolean = false,
        trackIndex: number = 0){
        let targetNodeSkeleton = targetNode.getComponent(sp.Skeleton);
        var track = targetNodeSkeleton.setAnimation(trackIndex, animationName, loop);
        if(callback != null){
            targetNodeSkeleton.setTrackCompleteListener(track, callback);
        }

        if(disposeCallback != null){
            targetNodeSkeleton.setTrackInterruptListener(track, disposeCallback);
        }

        if(interruptCallback != null){
            targetNodeSkeleton.setTrackInterruptListener(track, interruptCallback);
        }
    }

    public static SetSpineAnimationOpt(option: AnimationOptions){
        let targetNodeSkeleton = option.targetNode.getComponent(sp.Skeleton);
        var track = targetNodeSkeleton.setAnimation(0, option.animationName, option.loop);
        if(option.callback != null){
            targetNodeSkeleton.setTrackCompleteListener(track, option.callback);
        }

        if(option.disposeCallback != null){
            targetNodeSkeleton.setTrackInterruptListener(track, option.disposeCallback);
        }

        if(option.interruptCallback != null){
            targetNodeSkeleton.setTrackInterruptListener(track, option.interruptCallback);
        }

        track.timeScale = option.speed ?? 1;
    }

    /** 
     * @remarks 
     * Add next animation to play after current animation.
     * Only works when spine have playing animation
     * @param callback function when animation completed
     * @param disposeCallback function when animation cancel or finished to another animation
     * @param interruptCallback function when animation started but cancel or change to another animation
    */
    public static AddSpineAnimation(targetNode : Node , animationName : string , 
        callback: () => void = null,
        disposeCallback: () => void = null,
        interruptCallback: () => void = null,
        delay: number = 0,
        loop: boolean = false,
        trackIndex: number = 0
        ){
        let targetNodeSkeleton = targetNode.getComponent(sp.Skeleton);
        var track = targetNodeSkeleton.addAnimation(0, animationName, loop, delay);
        if(callback != null){
            targetNodeSkeleton.setTrackCompleteListener(track, callback);
        }

        if(disposeCallback != null){
            targetNodeSkeleton.setTrackInterruptListener(track, disposeCallback);
        }
        
        if(interruptCallback != null){
            targetNodeSkeleton.setTrackInterruptListener(track, interruptCallback);
        }
    }

    /**
     * @returns value1 - value2 (absoluteResult == true will always return positive value)
     */
    public static GetTimeDifferenceSeconds (value1: Date | number, value2: Date | number, absoluteResult: boolean = false): number {
        return Utils.GetTimeDifferenceMillis(value1, value2, absoluteResult) / 1000; // convert to seconds
    }

    /**
     * @returns value1 - value2 (absoluteResult == true will always return positive value)
     */
    public static GetTimeDifferenceMillis (value1: Date | number, value2: Date | number, absoluteResult: boolean = false): number {
        if (value1 instanceof Date) value1 = value1.getTime();
        if (value2 instanceof Date) value2 = value2.getTime();

        let result = value1 - value2;
        if (absoluteResult) {
            result = Math.abs(result);
        }

        return result;
    }

    /**
     * @returns GameOrientation enum
     */
    public static CheckOrientation (): GameOrientation {
        if (screen.windowSize.width > screen.windowSize.height) {
            return GameOrientation.horizontal;
        } 
        else {
            return GameOrientation.vertical;
        }
    }
}


if (VERSION.startsWith("3.8")) {
    log("patch cocos 3.8.x spine listener bug!")
    interface Listeners {
        completeListener?: __private._cocos_spine_skeleton__TrackListener
        endListener?: __private._cocos_spine_skeleton__TrackListener
        eventListener?: __private._cocos_spine_skeleton__TrackListener2
        interruptListener?: __private._cocos_spine_skeleton__TrackListener
        disposeListener?: __private._cocos_spine_skeleton__TrackListener
        startListener?: __private._cocos_spine_skeleton__TrackListener
    }
    function clearTrackListeners(obj: sp.Skeleton, tr: sp.spine.TrackEntry) {
        let $$ = (tr as any)["$$"]
        if ($$) {
            let ptr = $$.ptr.toString()
            let objAny = obj as any
            let trackListeners = objAny.__p_trackListeners
            if (trackListeners) {
                delete trackListeners[ptr]
            }
        }
    }

    function listeners(obj: sp.Skeleton, tr: sp.spine.TrackEntry | null, create: boolean): Listeners | null | undefined {
        let holder: any
        if (tr) {
            let $$ = (tr as any)["$$"]
            if ($$) {
                let ptr = $$.ptr.toString()
                let objAny = obj as any
                let trackListeners = objAny.__p_trackListeners || (objAny.__p_trackListeners = {})
                holder = trackListeners[ptr] || (trackListeners[ptr] = {})
            } else {
                holder = tr
            }
        } else {
            holder = obj
        }

        let listeners = holder.__p_listeners
        if (!listeners && create) {
            listeners = holder.__p_listeners = {}
        }
        return listeners
    }

    let setCompleteListener_old = sp.Skeleton.prototype.setCompleteListener
    let __p_setEndListener = sp.Skeleton.prototype.setEndListener
    let __p_setEventListener = sp.Skeleton.prototype.setEventListener
    let __p_setInterruptListener = sp.Skeleton.prototype.setInterruptListener
    let __p_setDisposeListener = sp.Skeleton.prototype.setDisposeListener
    let __p_setStartListener = sp.Skeleton.prototype.setStartListener
    function setOldListenerIfNeed(obj: sp.Skeleton, key: string, oldSetter: Function, listener: Function) {
        let objAny = obj as any
        if (objAny[key]) {
            return
        }
        oldSetter.apply(obj, [listener.bind(obj)])
        objAny[key] = true
    }

    function p_onComplete(this: sp.Skeleton, tr: sp.spine.TrackEntry) {
        let l1 = listeners(this, null, false)
        let l2 = listeners(this, tr, false)
        l1 && l1.completeListener && l1.completeListener(tr)
        l2 && l2.completeListener && l2.completeListener(tr)
    }

    function p_onEnd(this: sp.Skeleton, tr: sp.spine.TrackEntry) {
        let l1 = listeners(this, null, false)
        let l2 = listeners(this, tr, false)
        clearTrackListeners(this, tr)
        l1 && l1.endListener && l1.endListener(tr)
        l2 && l2.endListener && l2.endListener(tr)
    }

    function p_onEvent(this: sp.Skeleton, tr: sp.spine.TrackEntry, ev: sp.spine.Event) {
        let l1 = listeners(this, null, false)
        let l2 = listeners(this, tr, false)
        l1 && l1.eventListener && l1.eventListener(tr, ev)
        l2 && l2.eventListener && l2.eventListener(tr, ev)
    }
    function p_onInterrupt(this: sp.Skeleton, tr: sp.spine.TrackEntry) {
        let l1 = listeners(this, null, false)
        let l2 = listeners(this, tr, false)
        l1 && l1.interruptListener && l1.interruptListener(tr)
        l2 && l2.interruptListener && l2.interruptListener(tr)
    }
    function p_onDispose(this: sp.Skeleton, tr: sp.spine.TrackEntry) {
        let l1 = listeners(this, null, false)
        let l2 = listeners(this, tr, false)
        l1 && l1.disposeListener && l1.disposeListener(tr)
        l2 && l2.disposeListener && l2.disposeListener(tr)
    }
    function p_onStart(this: sp.Skeleton, tr: sp.spine.TrackEntry) {
        let l1 = listeners(this, null, false)
        let l2 = listeners(this, tr, false)
        l1 && l1.startListener && l1.startListener(tr)
        l2 && l2.startListener && l2.startListener(tr)
    }

    sp.Skeleton.prototype.setCompleteListener = function (listener) {
        setOldListenerIfNeed(this, "__p_setCompleteListener", setCompleteListener_old, p_onComplete)
        listeners(this, null, true)!.completeListener = listener
    }

    sp.Skeleton.prototype.setTrackCompleteListener = function (tr, listener) {
        setOldListenerIfNeed(this, "__p_setCompleteListener", setCompleteListener_old, p_onComplete)
        //参数不匹配
        //@ts-ignore
        listeners(this, tr, true)!.completeListener = listener
    }



    sp.Skeleton.prototype.setEndListener = function (listener) {
        setOldListenerIfNeed(this, "__p_setEndListener", __p_setEndListener, p_onEnd)
        listeners(this, null, true)!.endListener = listener
    }
    sp.Skeleton.prototype.setTrackEndListener = function (tr, listener) {
        setOldListenerIfNeed(this, "__p_setEndListener", __p_setEndListener, p_onEnd)
        listeners(this, tr, true)!.endListener = listener
    }

    sp.Skeleton.prototype.setEventListener = function (listener) {
        setOldListenerIfNeed(this, "__p_setEventListener", __p_setEventListener, p_onEvent)
        listeners(this, null, true)!.eventListener = listener
    }
    sp.Skeleton.prototype.setTrackEventListener = function (tr, listener) {
        setOldListenerIfNeed(this, "__p_setEventListener", __p_setEventListener, p_onEvent)
        listeners(this, tr, true)!.eventListener = listener
    }



    sp.Skeleton.prototype.setInterruptListener = function (listener) {
        setOldListenerIfNeed(this, "__p_setInterruptListener", __p_setInterruptListener, p_onInterrupt)
        listeners(this, null, true)!.interruptListener = listener
    }
    sp.Skeleton.prototype.setTrackInterruptListener = function (tr, listener) {
        setOldListenerIfNeed(this, "__p_setInterruptListener", __p_setInterruptListener, p_onInterrupt)
        listeners(this, tr, true)!.interruptListener = listener
    }



    sp.Skeleton.prototype.setDisposeListener = function (listener) {
        setOldListenerIfNeed(this, "__p_setDisposeListener", __p_setDisposeListener, p_onDispose)
        listeners(this, null, true)!.disposeListener = listener
    }
    sp.Skeleton.prototype.setTrackDisposeListener = function (tr, listener) {
        setOldListenerIfNeed(this, "__p_setDisposeListener", __p_setDisposeListener, p_onDispose)
        listeners(this, tr, true)!.disposeListener = listener
    }


    sp.Skeleton.prototype.setStartListener = function (listener) {
        setOldListenerIfNeed(this, "__p_setStartListener", __p_setStartListener, p_onStart)
        listeners(this, null, true)!.startListener = listener
    }
    sp.Skeleton.prototype.setTrackStartListener = function (tr, listener) {
        setOldListenerIfNeed(this, "__p_setStartListener", __p_setStartListener, p_onStart)
        listeners(this, tr, true)!.startListener = listener
    }

}

interface AnimationOptions {
    targetNode: Node;
    animationName: string;
    callback?: () => void;
    disposeCallback?: () => void;
    interruptCallback?: () => void;
    loop?: boolean;
    delay?: number;
    speed?: number;
    trackIndex?: number;
}