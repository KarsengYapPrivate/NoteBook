import { _decorator, log, Sprite } from 'cc';
import { BaseLocalizationScript } from './BaseLocalizationScript';
import { AssetManager } from '../Core/AssetManager';
const { ccclass, property } = _decorator;

@ccclass('ImageLocalization')
export class ImageLocalization extends BaseLocalizationScript {
    @property(String) private imageKey: string = ""; // feature_game.jpg

    override InitLocalization() {
        if (AssetManager.instance != null) {
            let existingSprite = this.node.getComponent(Sprite)
            if (!existingSprite) {
                console.error("Sprite component not found on node:", this.node.name);
            } else {
                let spriteFrame = AssetManager.instance.GetSpriteFrameWithKey(this.imageKey);
                if (spriteFrame != null) {
                    existingSprite.spriteFrame = spriteFrame;
                } else {
                    log("Sprite frame not found from asset manager:", this.imageKey);
                }
            }
        } else {
            log("Asset Manager instance not found");
        }
    }
}


