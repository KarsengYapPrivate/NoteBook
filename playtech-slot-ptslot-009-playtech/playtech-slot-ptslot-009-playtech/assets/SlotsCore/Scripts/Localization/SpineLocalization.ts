import { _decorator, Component, log, Node, sp } from 'cc';
import { BaseLocalizationScript } from './BaseLocalizationScript';
import { AssetManager } from '../Core/AssetManager';
const { ccclass, property } = _decorator;

@ccclass('SpineLocalization')
export class SpineLocalization extends BaseLocalizationScript {

    @property(String) private localizationKey: string = ""; // spine name
    override InitLocalization() {
        if (AssetManager.instance != null) {
            let existingSpine = this.getComponent(sp.Skeleton);
            if (existingSpine != null) {
                let existingTrackIndex;
                let existingAnimName;
                if (existingSpine.animation != "") {
                    existingTrackIndex = existingSpine.getCurrent(0).trackIndex;
                    existingAnimName = existingSpine.animation;
                } else {
                    existingTrackIndex = 0;
                    existingAnimName = "";
                }

                let spine = AssetManager.instance.GetSpineWithKey(this.localizationKey);
                if (spine != null) {
                    existingSpine.skeletonData = spine;
                    // existingSpine.setSkeletonData(spine);
                    console.log("Localized spine:", this.localizationKey, "| value:", spine);
                    let animationData = this.createAnimationsFromJson(existingSpine.skeletonData.skeletonJsonStr);

                    if (animationData.length > 0) {
                        console.log("Animation List = ", animationData);
                        let existingAnimNameFound = false;

                        if (existingAnimName != "") {
                            for (let i = 0; i < animationData.length; i++) {
                                if (animationData[i] == existingAnimName) {
                                    existingSpine.setAnimation(existingTrackIndex, animationData[i], true);
                                    console.log("ANIM LOADED\nName:", animationData[i], "\nSpine:", this.localizationKey, "\nTrack Index:", existingTrackIndex);
                                    // existingSpine.animation = animationData[i];
                                    existingAnimNameFound = true;
                                    break;
                                }
                            }
                        }

                        if (!existingAnimNameFound) {
                            if(existingAnimName == "") {
                                log("Existing spine animation is blank for", this.localizationKey);
                                // existingSpine.setAnimation(existingTrackIndex, animationData[0], true);
                            } else {
                                log("Existing spine animation for", existingAnimName, "not found on", this.localizationKey);
                            }
                        }
                    } else {
                        log("No animation data found");
                    }
                } else {
                    log("Localized spine not found:", this.localizationKey);
                }
            }
        }
    }

    createAnimationsFromJson(jsonString: string) {
        const jsonData = JSON.parse(jsonString);
        const animationNames = Object.keys(jsonData.animations); // Get all animation names
        return animationNames;
    }
}


