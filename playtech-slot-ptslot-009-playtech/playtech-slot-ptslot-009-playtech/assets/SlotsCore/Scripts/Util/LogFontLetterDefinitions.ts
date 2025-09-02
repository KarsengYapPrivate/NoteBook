import { _decorator, Component, Font } from 'cc';
const { ccclass, property, executeInEditMode } = _decorator;

@ccclass('LogFontLetterDefinitions') @executeInEditMode(true)
export class LogFontLetterDefinitions extends Component {
    @property(Font) font : Font = null;
    @property(Boolean) tickToLog : boolean = false;

    protected update(): void {
        if(this.tickToLog) {
            console.log("font letter definitions", JSON.stringify(this.font.fontDefDictionary.letterDefinitions));
            this.tickToLog = false;
        }
    }
}