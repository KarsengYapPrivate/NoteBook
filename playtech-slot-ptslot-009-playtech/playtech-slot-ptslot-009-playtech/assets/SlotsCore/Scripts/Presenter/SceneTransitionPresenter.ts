import { _decorator, AudioClip, Component, director, Enum, Node, sp, Sprite, tween, UIOpacity } from 'cc';
import PresenterPrototype, { PresenterOption } from './PresenterPrototype';
import { GameState, GameStateEvent, GameType } from '../Model/GameStateData';
import GameData, { GameStateInfo } from '../Model/GameData';
import Utils from '../Util/Utils';
import TweenUtils from '../Util/TweenUtils';
const { ccclass, property } = _decorator;

@ccclass('SceneTransitionSoundSetting')
class SceneTransitionSoundSetting { 
    @property({ type: AudioClip }) 
    soundClip: AudioClip = null;

    @property({ type: Number, slide: true, min: 0, max: 10, step: 0.01 }) 
    playDelay: number = 0;

    @property({ type: Boolean })
    fadeIn: boolean = false;

    @property({ type: Boolean })
    fadeOut: boolean = false;

    @property({ type: Number, slide: true, min: 0, max: 10, step: 0.01 }) 
    fadeInDelay: number = 0;

    @property({ type: Number, slide: true, min: 0, max: 10, step: 0.01 }) 
    fadeOutDelay: number = 0;
}

@ccclass('SceneTransitionSpineAddictiveSetting')
class SceneTransitionSpineAddictiveSetting { 
    @property({ type: String }) 
    animationName: string = "";

    @property({ type: Number }) 
    delay: number = 0;

    @property({ type: Boolean }) 
    loop: boolean = true;
}

@ccclass('SceneTransitionSet')
class SceneTransitionSet {

    @property({ type: String, multiline: true }) 
    description: string = "play spine > fade in node > fade out node > show node > hide node";

    @property({ type: Boolean, tooltip: "this set will start by itself without waiting previous to finish" }) 
    startWithoutQueue: boolean = false;

    @property({ type: Number, tooltip: "delay before start this set" }) 
    startDelayTime: number = 0;

    @property({ type: Number, tooltip: "immediately start next TransitionSet after specific second, the sequence inside still run by its own" }) 
    absoluteEndTime: number = 0;

    @property({ type: Boolean }) 
    playSpineAnimation: boolean = true;

    @property({ type: Node, visible: function(this:SceneTransitionSet){ return this.playSpineAnimation } }) 
    spineNodeGroup: Node = null;

    @property({ type: Node, visible: function(this:SceneTransitionSet){ return this.playSpineAnimation } }) 
    spineNode: Node = null;

    @property({ type: String, visible: function(this:SceneTransitionSet){ return this.playSpineAnimation } }) 
    spineAnimationName = "fade_in";

    @property({ type: [SceneTransitionSpineAddictiveSetting], visible: function(this:SceneTransitionSet){ return this.playSpineAnimation } }) 
    spineAddictiveSetting: SceneTransitionSpineAddictiveSetting[] = [];

    @property({ type: Boolean, visible: function(this:SceneTransitionSet){ return this.playSpineAnimation } }) 
    hideSpineNodeGroupAfterAnimation: boolean = false;

    @property({ type: Boolean, visible: function(this:SceneTransitionSet){ return this.playSpineAnimation } }) 
    loopSpineAnimation: boolean = false;

    @property({ type: Number, visible: function(this:SceneTransitionSet){ return this.playSpineAnimation } }) 
    spineAnimationSpeed: number = 1;

    @property({ type: Boolean }) 
    fadeInNodes: boolean = false;

    @property({ type: Boolean, visible: function(this:SceneTransitionSet){ return this.playSpineAnimation && this.fadeInNodes } }) 
    startFadeInNodesAfterSpineFinish: boolean = true;

    @property({ type: Number, visible: function(this:SceneTransitionSet){ return this.fadeInNodes } }) 
    fadeInDuration: number = 1;

    @property({ type: Number, visible: function(this:SceneTransitionSet){ return this.fadeInNodes } }) 
    fadeInOpacity: number = 255;

    // wait after fade in node
    @property({ type: Number, visible: function(this:SceneTransitionSet){ return this.fadeInNodes } }) 
    waitBeforeFadeIn: number = 0;

    // wait after fade in node
    @property({ type: Number, visible: function(this:SceneTransitionSet){ return this.fadeInNodes } }) 
    waitAfterFadeIn: number = 0;

    // fade in nodes
    @property({ type: [Node], visible: function(this:SceneTransitionSet){ return this.fadeInNodes } }) 
    nodesToFadeIn: Node[] = [];
    
    @property({ type: Boolean }) 
    fadeOutNodes: boolean = false;

    @property({ type: Boolean, visible: function(this:SceneTransitionSet){ return this.playSpineAnimation && this.fadeOutNodes } }) 
    startFadeOutNodesAfterSpineFinish: boolean = true;

    @property({ type: Number, visible: function(this:SceneTransitionSet){ return this.fadeOutNodes } }) 
    fadeOutDuration: number = 1;

    @property({ type: Number, visible: function(this:SceneTransitionSet){ return this.fadeOutNodes } }) 
    fadeOutOpacity: number = 0;

    @property({ type: Number, visible: function(this:SceneTransitionSet){ return this.fadeOutNodes } }) 
    waitBeforeFadeOut: number = 0;

    @property({ type: Number, visible: function(this:SceneTransitionSet){ return this.fadeOutNodes } }) 
    waitAfterFadeOut: number = 0;
    
    // fade out nodes
    // wait after fade out node
    @property({ type: [Node], visible: function(this:SceneTransitionSet){ return this.fadeOutNodes } }) 
    nodesToFadeOut: Node[] = [];

    // show node
    @property({ type: [Node]}) 
    nodesToShow: Node[] = []; // node that show after this transition

    // hide node
    @property({ type: [Node]}) 
    nodesToHide: Node[] = []; // node that show after this transition

    @property({ type: Number, tooltip: "delay before end this set and start next set" }) 
    endDelayTime: number = 0;

    @property({ type: Boolean }) 
    playSound: boolean = false;

    @property({ type: [SceneTransitionSoundSetting], visible: function(this:SceneTransitionSet){ return this.playSound } }) 
    sceneTransitionSoundSetting: SceneTransitionSoundSetting[] = [];

    setEnded: boolean = false;
    /**
     *
     */
    constructor(playSpineAnimation: boolean = true, spineAnimationName: string, 
        hideSpineNodeGroupAfterAnimation: boolean = false) {
        this.playSpineAnimation = playSpineAnimation;
        this.spineAnimationName = spineAnimationName;
        this.hideSpineNodeGroupAfterAnimation = hideSpineNodeGroupAfterAnimation;
    }

    async ExecuteStartTransition () {
        if(this.absoluteEndTime > 0)
            await this.StartTransitionWithExitTime();
        else await this.StartTransition();
    }

    async StartTransition () {
        this.setEnded = false;
        if(this.startDelayTime > 0)
            await Utils.WaitForSeconds(this.startDelayTime);

        if(this.playSound)
        {
            for (let s = 0; s < this.sceneTransitionSoundSetting.length; s++) {
                const element = this.sceneTransitionSoundSetting[s];

                if(element.fadeIn){
                    var time = { time : 0 };
                    tween(time)
                    .to(element.fadeInDelay, { time: 0 })
                    .call(() => {
                        // dispatchEvent(new CustomEvent(GameStateEvent.fade_in_audio, { detail: { audioName: element.soundClip.name } }));
                    })
                    .start();
                }
                else if (element.fadeOut){
                    var time = { time : 0 };
                    tween(time)
                    .to(element.fadeOutDelay, { time: 0 })
                    .call(() => {
                        // dispatchEvent(new CustomEvent(GameStateEvent.fade_out_audio, { detail: { audioName: element.soundClip.name } }));
                    })
                    .start();
                }
                else{
                    var time = { time : element.playDelay };
                    tween(time)
                    .to(element.playDelay, { time: 0 })
                    .call(() => {
                        dispatchEvent(new CustomEvent(GameStateEvent.play_audio, { detail: { audioName: element.soundClip.name } }));
                    })
                    .start();
                }
            }
        }

        if(this.playSpineAnimation){
            if(this.spineNodeGroup.active == false)
            this.spineNodeGroup.active = true;
            // console.log(this.spineAnimationName);
            // console.log(this.spineNode);
            var spineAnimEnded = false;
            if(this.spineAnimationName != ""){

                var track = this.spineNode.getComponent(sp.Skeleton).setAnimation(0, this.spineAnimationName, this.loopSpineAnimation);
                track.timeScale = this.spineAnimationSpeed;
                
                var spineAnimEnded = false;
                
                this.spineNode.getComponent(sp.Skeleton).setTrackCompleteListener(track, () => {
                    spineAnimEnded = true;
                });
                
                await Utils.WaitForCondition(() => spineAnimEnded == true);
            }

            if(this.spineAddictiveSetting.length > 0){
                for (let a = 0; a < this.spineAddictiveSetting.length; a++) {
                    const element = this.spineAddictiveSetting[a];
                    
                    if(a == this.spineAddictiveSetting.length - 1){
                        Utils.AddSpineAnimation(this.spineNode, element.animationName, 
                        () => {
                            spineAnimEnded = true;
                        }, 
                        null,
                        () => {
                            spineAnimEnded = true;
                        }, element.delay, element.loop);
                    }
                    else{
                        Utils.AddSpineAnimation(this.spineNode, element.animationName, null, null, null,
                            element.delay, element.loop);
                    }
                }
                await Utils.WaitForCondition(() => spineAnimEnded == true);
            }
            
            if(this.hideSpineNodeGroupAfterAnimation)
            this.spineNodeGroup.active = false;
        }

        await this.FadeInNodes();

        await this.FadeOutNodes();
        
        this.ShowNodes();
        this.HideNodes();

        if(this.endDelayTime > 0)
        await Utils.WaitForSeconds(this.endDelayTime);
        
        this.setEnded = true;

        return;
    }

    async StartTransitionWithExitTime() {
        if(this.absoluteEndTime > 0){
            this.StartTransition();
            await Utils.WaitForSeconds(this.absoluteEndTime);
        }
        
        return;
    }

    async FadeInNodes () {
        if(this.fadeInNodes && this.nodesToFadeIn.length > 0){
            for (let n = 0; n < this.nodesToFadeIn.length; n++) {
                const element = this.nodesToFadeIn[n];
                if(!element.getComponent(UIOpacity))
                element.addComponent(UIOpacity);
                TweenUtils.FadeUIOpacity(element, this.fadeOutDuration, this.fadeInOpacity);
            }
            await Utils.WaitForSeconds(this.fadeInDuration + this.waitAfterFadeIn);
        }

        return;
    }

    async FadeOutNodes () {
        // console.log("FadeOutNodes");
        if(this.fadeOutNodes && this.nodesToFadeOut.length > 0){
            for (let n = 0; n < this.nodesToFadeOut.length; n++) {
                const element = this.nodesToFadeOut[n];

                if(!element.getComponent(UIOpacity))
                element.addComponent(UIOpacity);
                TweenUtils.FadeUIOpacity(element, this.fadeOutDuration, this.fadeOutOpacity);
            }
            await Utils.WaitForSeconds(this.fadeOutDuration + this.waitAfterFadeOut);
        }
        return;
    }

    ShowNodes () {
        for (let f = 0; f < this.nodesToShow.length; f++) {
            const element = this.nodesToShow[f];
            element.active = true;
        }
    }

    HideNodes () {
        for (let f = 0; f < this.nodesToHide.length; f++) {
            const element = this.nodesToHide[f];
            element.active = false;
        }
    }
}

@ccclass('SceneTransitionPresenter')
export class SceneTransitionPresenter extends PresenterPrototype {

    @property({type: PresenterOption}) presenterOption: PresenterOption = new PresenterOption();

    @property({ type: Enum(GameType)}) 
    gameType;

    @property({type: Enum(GameType)})
    nextSpinGameType;
    
    @property({ type: Number, tooltip: "delay before start this presenter" }) 
    delayBeforeStartPresenter: number = 0;

    @property({ type: Number, tooltip: "delay before start next presenter" }) 
    delayBeforeEndPresenter: number = 0;

    @property(String)
    gameStateEvent: string = "";
    
    private resumePresenter = false;
    
    @property
    testRun = true;

    @property({type: [SceneTransitionSet]})
    sceneTransitionSet: SceneTransitionSet[] = [
        new SceneTransitionSet(true, "intro", false),
        new SceneTransitionSet(true, "outro", true),
    ];

    start() {
        if(this.testRun){
            this.scheduleOnce(() => {
                this.TestRunPresenter();
            }, 3);
        }
    }

    override CheckTriggerCondition(gameStateInfo: GameStateInfo): boolean {
        // check if exiting free spin 
        if (GameData.instance.GetCurrentGameType() == this.gameType && 
        GameData.instance.GetNextSpinGameType() == this.nextSpinGameType) {
            return true;
        } else {
            return false;
        }
    }

    async PresenterLogic() {
        if(this.gameStateEvent != "")
            dispatchEvent(new CustomEvent(GameStateEvent[this.gameStateEvent]));

        if(this.gameStateEvent != "")
            dispatchEvent(new CustomEvent(GameStateEvent[this.gameStateEvent]));

        var nonQueueList = this.sceneTransitionSet.filter(f => f.startWithoutQueue);
        // console.log(nonQueueList);
        for (let s = 0; s < nonQueueList.length; s++) {
            const element = nonQueueList[s];
            // element.StartTransition();
            element.ExecuteStartTransition();
        }
        // console.log(nonQueueList);

        // list of queue
        var queueList = this.sceneTransitionSet.filter(f => f.startWithoutQueue == false);
        // console.log(queueList);
        for (let s = 0; s < queueList.length; s++) {
            const element = queueList[s];
            // await element.StartTransition();
            await element.ExecuteStartTransition();
        }

        // console.log(queueList);
        // list of non-queue
        if(nonQueueList.length > 0)
        await Utils.WaitForCondition(() => nonQueueList.findIndex(f => f.setEnded == false) == -1);

        return;
    }

    async TestRunPresenter(){

        if(this.delayBeforeStartPresenter > 0)
        await Utils.WaitForSeconds(this.delayBeforeStartPresenter);

        await this.PresenterLogic();
        
        if(this.delayBeforeEndPresenter > 0)
            await Utils.WaitForSeconds(this.delayBeforeEndPresenter);

        return;
    }

    override async RunPresenter () {

        if(this.delayBeforeStartPresenter > 0)
        await Utils.WaitForSeconds(this.delayBeforeStartPresenter);
        
        await this.PresenterLogic();

        if(this.delayBeforeEndPresenter > 0)
            await Utils.WaitForSeconds(this.delayBeforeEndPresenter);

        return;
    }
}


