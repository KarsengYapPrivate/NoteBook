import { _decorator, Component, Node, Enum, AudioSource } from 'cc';
const { ccclass, property } = _decorator;

export enum SoundType{
    None,
    BGM,
    SFX,
    UISound,
}

@ccclass('AudioProperties')
export class AudioProperties extends Component {
    @property({type: Enum(SoundType)})
    soundType : SoundType = SoundType.None;

    @property(Boolean) dimBGM : boolean = false;
    @property(Number) repeatDelay : number = 0;
    @property(Number) playDelay : number = 0;

    @property(Boolean) muteSound : boolean = false;
    @property(Boolean) isMultiplePlay : boolean = false;
    
    lastPlayTime : Date = null;

    private audioName : string = null;
    
    onLoad(){
        this.audioName = this.node.getComponent(AudioSource).clip.name;

        this.lastPlayTime = new Date();
    }
}


