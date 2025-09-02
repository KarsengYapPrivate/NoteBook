import { _decorator, animation, Animation, Button, Component, Node, sp, UIOpacity } from 'cc';
import GameMaster from '../../../SlotsCore/Scripts/Core/GameMaster';
import { GalacticColoniesConfig } from './GalacticColoniesConfig';
import TweenUtils from '../../../SlotsCore/Scripts/Util/TweenUtils';
import AudioManager from 'db://assets/SlotsCore/Scripts/Core/AudioManager';
const { ccclass, property } = _decorator;

@ccclass('GalacticGameMaster')
export class GalacticGameMaster extends GameMaster {
    private isResume = false;

    override StartGame(): void {
        let intro = GalacticColoniesConfig.instance.introGroup;

        AudioManager.instance.PlayEventSound(GalacticColoniesConfig.instance.sound.sfxIntro);

        TweenUtils.FadeUIOpacity(intro.UIGroup, 0.1, 1);
        TweenUtils.FadeUIOpacity(intro.reelGroup, 0.1, 1).then((() => {
            this.introductionNode.getComponent(UIOpacity).opacity = 0;
            this.introductionNode.getComponentInChildren(Button).interactable = false;
            intro.characterHolderNode.getComponent(Animation).play();
            intro.characterNode.getComponent(sp.Skeleton).animation = 'animation';
            intro.blackHoleNode.getComponent(sp.Skeleton).animation = 'animation';
            intro.blackHoleNode.getComponent(sp.Skeleton).setCompleteListener((function (data) {
                if (data.animation.name == 'animation') {
                    if (this.isResume == true) {
                        GalacticColoniesConfig.instance.backGroundGroup.backgroundH.getComponent(sp.Skeleton).animation = 'normal_toFeature';
                        GalacticColoniesConfig.instance.backGroundGroup.backgroundV.getComponent(sp.Skeleton).animation = 'normal_toFeature';
                        GalacticColoniesConfig.instance.backGroundGroup.backgroundV.getComponent(sp.Skeleton).setCompleteListener((function (data) {
                            if (data.animation.name == 'normal_toFeature') {
                                GalacticColoniesConfig.instance.backGroundGroup.rockGroup.active = true;
                                for (let i = 0; i < GalacticColoniesConfig.instance.backGroundGroup.rockGroup.children.length; i++) {
                                    GalacticColoniesConfig.instance.backGroundGroup.rockGroup.children[i].getComponent(sp.Skeleton).animation = 'animation';
                                }
                                GalacticColoniesConfig.instance.backGroundGroup.backgroundH.getComponent(sp.Skeleton).animation = 'feature_idle';
                                GalacticColoniesConfig.instance.backGroundGroup.backgroundV.getComponent(sp.Skeleton).animation = 'feature_idle';
                            }
                        }).bind(this));
                        GalacticColoniesConfig.instance.backGroundGroup.rockGroup.children[0].getComponent(sp.Skeleton).setCompleteListener(((function (data) {
                            if (data.animation.name == 'animation') {
                                TweenUtils.FadeUIOpacity(intro.UIGroup, 0.5, 255);
                                TweenUtils.FadeUIOpacity(intro.reelGroup, 0.5, 255).then((() => {
                                    this.introductionNode.active = false;
                                }).bind(this));
                            }
                        }).bind(this))); 
                    } else {
                        TweenUtils.FadeUIOpacity(intro.UIGroup, 0.5, 255);
                        TweenUtils.FadeUIOpacity(intro.reelGroup, 0.5, 255).then((() => {
                            this.introductionNode.active = false;
                        }).bind(this));
                    }
                }
            }).bind(this))
        }).bind(this));
    }

    override onLoad(): void {
        super.onLoad();

        addEventListener("freegameData" , this.isResumeFreeSpin.bind(this));
    }

    isResumeFreeSpin() {
        this.isResume = true;
    }
}


