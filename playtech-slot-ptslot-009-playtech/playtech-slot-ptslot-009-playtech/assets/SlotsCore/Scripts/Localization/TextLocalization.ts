import { _decorator, Component, Label, log } from 'cc';
import { AssetManager } from '../Core/AssetManager';
import { DEBUG } from 'cc/env';
import { BaseLocalizationScript } from './BaseLocalizationScript';
const { ccclass, property } = _decorator;

@ccclass('TextLocalization')
export class TextLocalization extends BaseLocalizationScript {

    @property(String) private localizationKey: string = "";
    
    override InitLocalization () {
        if (AssetManager.instance != null) {
            let value = AssetManager.instance.GetTextWithKey(this.localizationKey);
            if (value != null) {
                this.node.getComponent(Label).string = value;
                log("Localized key:", this.localizationKey, "| value:", value);
            } else {
                log("Localize key not found:", this.localizationKey);
            }
        }
    }
}


