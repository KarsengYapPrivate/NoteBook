import { _decorator, AudioClip, Button, Component, Enum, Label, log, Node, Skeleton, sp, utils } from 'cc';
import PresenterPrototype, { PresenterOption } from '../../../SlotsCore/Scripts/Presenter/PresenterPrototype';
import GameData, { GameStateInfo } from '../../../SlotsCore/Scripts/Model/GameData';
import RollingNumber from '../../../SlotsCore/Scripts/UI/RollingNumber';
import Utils from '../../../SlotsCore/Scripts/Util/Utils';
import AudioManager from '../../../SlotsCore/Scripts/Core/AudioManager';
import { GameStateEvent } from '../Model/GameStateData';
const { ccclass, property } = _decorator;

@ccclass('BigWinAnimationQueue')
export class BigWinAnimationQueue {
    @property(String)
    animationName: string = "";

    @property(Boolean)
    changeTierAfterAnimationEnded: boolean = false;

    @property(Boolean)
    setTierAmountWhenStart: boolean = false;

    @property(Boolean)
    canSkip: boolean = true;

    @property(Boolean)
    skipPlayWhenSkipTier: boolean = false;

    @property({ type: Boolean, tooltip: "only play this animation when skip at to last tier"})
    playOnlyWhenSkipToLastTier: boolean = false;

    @property(Number)
    loopCount: number = 1;

    @property({ type: String })
    audioEventName: string = "";
}

@ccclass('BigWinAnimationSetLevel')
export class BigWinAnimationSetLevel {
    @property(Number)
    bigWinLevel: number = 30;

    @property([BigWinAnimationQueue])
    animationQueue: BigWinAnimationQueue[] = [];

    @property(Number)
    rollingNumberDuration: number = 2;

    @property(Number)
    animationSkipDelay: number = 0.35;

    @property(Number)
    bigWinAudioIndex: number = 1;
    
    /**
     *
     */
    constructor(bigWinLevel: number, rollingNumberDuration: number,
        bigWinAudioIndex: number) {
        this.bigWinLevel = bigWinLevel;
        this.rollingNumberDuration = rollingNumberDuration;
        this.bigWinAudioIndex = bigWinAudioIndex;
    }
}

@ccclass('BigWinAscendingPresenter')
export class BigWinAscendingPresenter extends PresenterPrototype {

    @property({type: PresenterOption}) protected presenterOption: PresenterOption = new PresenterOption();

    @property({ type: Node, group: "Node" })
    bigWinNode : Node = null;
    @property({ type: Node, group: "Node" })
    @property(Node) totalWinAmount : Node = null;
    @property({ type: Node, group: "Node" })
    @property(Node) spineComponentNode : Node = null;
    @property({ type: Node, group: "Node" })
    @property(Node) buttonCollect : Node = null;

    @property(Number) showDelaySecond : number = 0;
    @property({ type: Number, group: "Setting" }) showDelay : number = 0;
    // @property({ type: Number, group: "Setting" }) rollingNumberDuration : number = 1;
    @property({ type: Number, group: "Setting" }) rollingNumberDelay : number = 0;
    @property({ type: Number, group: "Setting" }) skipFinalAmountDelay : number = 1;
    @property({ type: Number, group: "Setting" }) hideDelay : number = 0;
    @property({ type: Number, group: "Setting" }) animationSkipDelay: number = 0.3;

    // @property( { type: [BigWinAnimationSetLevel], readonly: true }) bigWinAnimationSetLevel : BigWinAnimationSetLevel[] = [
    @property( { type: [BigWinAnimationSetLevel] }) bigWinAnimationSetLevel : BigWinAnimationSetLevel[] = [
        new BigWinAnimationSetLevel(20, 2.4, 0),
        new BigWinAnimationSetLevel(30, 2, 1),
        new BigWinAnimationSetLevel(40, 1.6, 2)
    ];
    @property({type: Boolean, tooltip: "click to immediately skip to next ascending animation"}) clickToSkipAscending : boolean = true;
    @property({type: Boolean, tooltip: "use ascending mode"}) ascendingMode : boolean = true;
    @property(Boolean) testRun : boolean = false;

    private bigWinLevel = 0;
    private resumePresenter: boolean = false;
    private buttonClicked: boolean = false;
    private asyncFunctionList: Array<() => Promise<void>> = [];

    private totalWinAmountLabel = null;
    private totalWinAmountData = null;

    start() {
        this.buttonCollect.on('click' , this.CollectClicked.bind(this));

        if(this.testRun){
            this.scheduleOnce(() => {
                this.TestRun();
            }, 3)
        }
    }

    override async RunPresenter () {
        if(this.showDelaySecond > 0)
            await Utils.WaitForSeconds(this.showDelaySecond);

        let winAmount = GameData.instance.GetResult().total_win_amount;
        this.totalWinAmountData = winAmount;

        await this.PresenterLogic(winAmount);
        
        return;
    }

    async TestRun () {

        if(this.showDelaySecond > 0)
            await Utils.WaitForSeconds(this.showDelaySecond);

        // big win
        // let winAmount = 2;

        // mega win
        // let winAmount = 4;

        // ultimate win
        // let winAmount = 4.75;
        // let winAmount = 4.9;
        // let winAmount = 15;
        // let winAmount = 150;
        let winAmount = 1500;
        // test bet is 0.25
        await this.PresenterLogic(winAmount, 0.25);
        
        return;
    }

    async PresenterLogic (winAmount: number, gameBet?: number) {
        this.asyncFunctionList = [];

        // get highest big level
        for(var i = 0; i < this.bigWinAnimationSetLevel.length; i++){
            // if(winAmount >= (GameData.instance.GetGameBet() * this.bigWinAnimationSetLevel[i].bigWinLevel)){
            // if(winAmount >= (0.25 * this.bigWinAnimationSetLevel[i].bigWinLevel)){
            if(gameBet && winAmount >= (0.25 * this.bigWinAnimationSetLevel[i].bigWinLevel)){
                this.bigWinLevel = i;
            }
            
            else if(winAmount >= (GameData.instance.GetGameBet() * this.bigWinAnimationSetLevel[i].bigWinLevel)){
                this.bigWinLevel = i;
            }
        }

        // see how many level achieve by game bet part 
        // divide the rolling number animation by N part
        // use this.bigWinLevel as N part
        let winAmountRollingNumber: number[] = [];

        if(this.ascendingMode)
            for (let index = 0; index < this.bigWinLevel + 1; index++) {
                winAmountRollingNumber.push(winAmount/(this.bigWinLevel + 1));
            }
        else {
            winAmountRollingNumber.push(winAmount);
        }

        var self = this;
        this.bigWinNode.active = true;
        if(!this.totalWinAmount.getComponent(RollingNumber))
        {
            let rollingNumber: RollingNumber = this.totalWinAmount.addComponent(RollingNumber);
            rollingNumber.isShowDecimal = true;
        }
        this.totalWinAmount.getComponent(RollingNumber).SetImmediate(0);

        // queue the animation
        // last animation make number set to end
        let skipFlag: Boolean = false;
        var spineComponent = this.spineComponentNode.getComponent(sp.Skeleton);
        if(this.ascendingMode)
        for (let w = 0; w < winAmountRollingNumber.length; w++) {
            const asyncAnimationQueue: () => Promise<void> = async () => {

                log("play queue: " + w);
                const element = winAmountRollingNumber[w];
                self.resumePresenter = false;
                self.buttonClicked = false;
                let index = w;
                // spine animation duration duration
                let totalRollingDuration: number = 0;

                for (let s = 0; s < self.bigWinAnimationSetLevel[index].animationQueue.length; s++) {
                    const queueName = self.bigWinAnimationSetLevel[index].animationQueue[s].animationName;
                    // console.log(queueName);
                    totalRollingDuration += spineComponent.findAnimation(queueName).duration;
                }

                self.totalWinAmount.getComponent(RollingNumber).IncrementTarget(element, 
                    self.bigWinAnimationSetLevel[w].rollingNumberDuration, 
                    self.rollingNumberDelay);

                innerLoop: for (let s = 0; s < self.bigWinAnimationSetLevel[index].animationQueue.length; s++) {
                    const queueName = self.bigWinAnimationSetLevel[index].animationQueue[s].animationName;
                    self.resumePresenter = false;
                    
                    if(self.bigWinAnimationSetLevel[index].animationQueue[s].playOnlyWhenSkipToLastTier === true
                        && index < winAmountRollingNumber.length - 1)
                        continue innerLoop;

                    // handle for skip tier flag
                    if( skipFlag === true
                        && self.bigWinAnimationSetLevel[index].animationQueue[s].skipPlayWhenSkipTier === true){
                        self.resumePresenter = true;
                    }
                    else{
                        skipFlag = false;
                    }

                    let loopCount = 0;
                    let maxLoop = self.bigWinAnimationSetLevel[index].animationQueue[s].loopCount;
                    let loop: boolean = maxLoop > 1;

                    // animation
                    if(self.resumePresenter === false)
                        {
                        
                        self.resumePresenter = false;

                        Utils.SetSpineAnimation(self.spineComponentNode,
                        queueName, 
                        () => {
                            loopCount++;
                            if(loopCount >= maxLoop){
                                self.resumePresenter = true;

                                // stop sound
                                if(self.bigWinAnimationSetLevel[index].animationQueue[s].audioEventName != "")
                                dispatchEvent(new CustomEvent(GameStateEvent.stop_audio, { detail: { audioName: self.bigWinAnimationSetLevel[index].animationQueue[s].audioEventName }}))
                            }
                        }, null, null, loop);

                        // play sound
                        if(self.bigWinAnimationSetLevel[index].animationQueue[s].audioEventName != "")
                        dispatchEvent(new CustomEvent(GameStateEvent.play_audio, { detail: { audioName: self.bigWinAnimationSetLevel[index].animationQueue[s].audioEventName }}))
                    }

                    if(self.bigWinAnimationSetLevel[index].animationQueue[s].setTierAmountWhenStart){
                        if(w >= 1){
                            let accumulateTotal = 0;
                            for (let n = 0; n <= w; n++) {
                                const amount = winAmountRollingNumber[n];
                                accumulateTotal += amount;
                            }
                            self.totalWinAmount.getComponent(RollingNumber).SetImmediate(accumulateTotal);
                        }
                        else{
                            self.totalWinAmount.getComponent(RollingNumber).SetImmediate(element);
                        }
                    }

                    // disable button interactable to prevent spam skip
                    self.buttonCollect.getComponent(Button).interactable = false;

                    if(self.bigWinAnimationSetLevel[index].animationQueue[s].canSkip
                        || (self.bigWinAnimationSetLevel[index].animationQueue[s].changeTierAfterAnimationEnded 
                            && w < winAmountRollingNumber.length - 1)){
                        self.scheduleOnce(() => {
                            self.buttonCollect.active = true;
                            self.buttonCollect.getComponent(Button).interactable = true;
                        }, self.bigWinAnimationSetLevel[index].animationSkipDelay);
                    }
                    else{
                        self.buttonCollect.active = false;
                    }
 
                    await Utils.WaitForCondition((() => (self.resumePresenter)).bind(self));

                    if(self.buttonClicked 
                        && skipFlag !== true
                        && self.clickToSkipAscending
                        && index !== winAmountRollingNumber.length - 1
                        )
                    {
                        console.log("skip to final");
                        // skip to final tier second animation
                        // self.resumePresenter = true;
                        skipFlag = true;
                        continue innerLoop;
                        // return;
                    }
                    
                    if(s >= self.bigWinAnimationSetLevel[index].animationQueue.length && 
                        self.totalWinAmount.getComponent(RollingNumber).currentValue 
                        != self.totalWinAmount.getComponent(RollingNumber).targetValue)
                    {
                        if(w >= 1){
                            let accumulateTotal = 0;
                            for (let n = 0; n <= w; n++) {
                                const amount = winAmountRollingNumber[n];
                                accumulateTotal += amount;
                            }
                            self.totalWinAmount.getComponent(RollingNumber).SetImmediate(accumulateTotal);
                        }
                        else{
                            self.totalWinAmount.getComponent(RollingNumber).SetImmediate(element);
                        }
                    }

                    // if displaying ascending
                    // skip to next ascend
                    if(winAmountRollingNumber.length > 0 && index < winAmountRollingNumber.length - 1
                        && self.buttonClicked && self.clickToSkipAscending){
                        // set the rolling number immediately 
                        if(w >= 1){
                                let accumulateTotal = 0;
                                for (let n = 0; n <= w; n++) {
                                    const amount = winAmountRollingNumber[n];
                                    accumulateTotal += amount;
                                }
                                self.totalWinAmount.getComponent(RollingNumber).SetImmediate(accumulateTotal);
                        }
                        else{
                            self.totalWinAmount.getComponent(RollingNumber).SetImmediate(element);
                        }

                        return;
                    }

                    if(self.bigWinAnimationSetLevel[index].animationQueue[s].changeTierAfterAnimationEnded
                        && index < winAmountRollingNumber.length -1){
                        return;
                    }
                }
            }
            self.asyncFunctionList.push(asyncAnimationQueue);
        }
        else{
            const asyncAnimationQueue: () => Promise<void> = async () => {
                self.resumePresenter = false;
                self.buttonClicked = false;
                let index = this.bigWinLevel;
                // spine animation duration duration
                let totalRollingDuration: number = self.bigWinAnimationSetLevel[this.bigWinLevel].rollingNumberDuration;

                // start big win sound
                // AudioManager.instance?.PlayBigWinSound(self.bigWinAnimationSetLevel[this.bigWinLevel].bigWinAudioIndex);

                // for (let s = 0; s < self.bigWinAnimationSetLevel[index].animationQueue.length - 1; s++) {
                //     const queueName = self.bigWinAnimationSetLevel[index].animationQueue[s].animationName;
                //     // console.log(queueName);
                //     totalRollingDuration += spineComponent.findAnimation(queueName).duration;
                // }

                self.totalWinAmount.getComponent(RollingNumber).SetTarget(winAmount, 
                    totalRollingDuration, 
                    self.rollingNumberDelay);

                for (let s = 0; s < self.bigWinAnimationSetLevel[index].animationQueue.length; s++) {
                    const queueName = self.bigWinAnimationSetLevel[index].animationQueue[s].animationName;
                    self.resumePresenter = false;

                    let loopCount = 0;
                    let maxLoop = self.bigWinAnimationSetLevel[index].animationQueue[s].loopCount;
                    let loop: boolean = maxLoop > 1;

                    Utils.SetSpineAnimation(self.spineComponentNode,
                        queueName, 
                        () => {
                            loopCount++;
                            if(loopCount >= maxLoop){
                                self.resumePresenter = true;
                            }
                        }, null, null, loop);

                    dispatchEvent(new CustomEvent(GameStateEvent.play_audio, 
                        { detail: { audioName: self.bigWinAnimationSetLevel[index].animationQueue[s].audioEventName }}))

                    if(self.bigWinAnimationSetLevel[index].animationQueue[s].setTierAmountWhenStart){
                        self.totalWinAmount.getComponent(RollingNumber).SetImmediate(winAmount);
                    }

                    // disable button interactable to prevent spam skip
                    self.buttonCollect.getComponent(Button).interactable = false;
                    if(self.bigWinAnimationSetLevel[index].animationQueue[s].canSkip){

                        self.scheduleOnce(() => {
                            self.buttonCollect.active = true;
                            self.buttonCollect.getComponent(Button).interactable = true;
                        }, self.bigWinAnimationSetLevel[index].animationSkipDelay);
                    }
                    else{
                        self.buttonCollect.active = false;
                    }
 
                    await Utils.WaitForCondition((() => (self.resumePresenter)).bind(self));
                }

                // AudioManager.instance?.StopBigWinSound(self.bigWinAnimationSetLevel[index].bigWinAudioIndex);
                return;
            }
            self.asyncFunctionList.push(asyncAnimationQueue);
        }

        console.log(this.asyncFunctionList);
        for (const fn of this.asyncFunctionList) {
            await fn() // call function to get returned Promise
        }

        self.totalWinAmount.getComponent(RollingNumber).SetImmediate(winAmount);

        if(this.hideDelay > 0)
            await Utils.WaitForSeconds(this.showDelaySecond);

        // call close big win
        this.bigWinNode.active = false;

        return;
    }

    public CheckTriggerCondition (gameStateInfo: GameStateInfo) {
        // override CheckTriggerCondition(gameStateAction: GameStateAction, gameState: GameState, gameType?: GameType): boolean {
            if(GameData.instance.GetResult().total_win_amount >= GameData.instance.GetGameBet() * this.bigWinAnimationSetLevel[0].bigWinLevel){
                return true;
            }
            else{
                return false;
            }
    }

    CollectClicked(){
        // set the boolean
        log("click");

        this.resumePresenter = true;
        this.buttonClicked = true;

        AudioManager.instance.PlayGeneralBtnSound();

    }

    protected update(dt: number): void {
        this.totalWinAmountLabel = this.totalWinAmount.getComponent(Label).string;

        if(this.totalWinAmountLabel == this.totalWinAmountData){
            AudioManager.instance?.StopCoinCollectSound();
        }
    }
}


