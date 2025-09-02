import { _decorator, Label, log } from 'cc';
import { AssetManager } from '../Core/AssetManager';
import { BaseLocalizationScript } from './BaseLocalizationScript';
const { ccclass, property } = _decorator;

@ccclass('FontLocalizationScript')
export class FontLocalizationScript extends BaseLocalizationScript {
    override InitLocalization () {
        if (AssetManager.instance != null) {
            if (this.node.getComponent(Label) != null && AssetManager?.instance?.GetCurrencyFont() != null) {
                let font = AssetManager?.instance?.GetCurrencyFont();

                font.fontDefDictionary = this.node.getComponent(Label).font.fontDefDictionary;
                font.fontDefDictionary.letterDefinitions = AssetManager?.instance?.GetCurrencyFontLetterDefinitions();
                // font.fontDefDictionary.texture = font.spriteFrame._texture;

                this.node.getComponent(Label).font = font;

                log("Font localized for this node:", this.node.name);
            } else {
                log("Font not localized for this node:", this.node.name);
            }
        }
    }
}