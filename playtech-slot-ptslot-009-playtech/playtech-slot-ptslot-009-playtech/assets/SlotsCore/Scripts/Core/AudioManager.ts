import { _decorator, AudioClip, AudioSource, Component, Enum, tween, Node, log, game, Game, instantiate, Prefab, NodePool } from 'cc';
import { GameState, GameStateAction, GameStateEvent, GameType, UIButtonEvent } from '../Model/GameStateData';
import Utils from '../Util/Utils';
import GameData from '../Model/GameData';
import { AudioProperties } from './AudioProperties';
const { ccclass, property } = _decorator;

@ccclass('AudioManager')
export default class AudioManager extends Component {
    public static instance: AudioManager = null;

    protected audioSources: AudioSource[] = [];
    protected generalAudioSources: AudioSource[] = [];

    @property(Node) featureAudioSourceNode: Node = null;
    @property(AudioSource) normalGameBGM: AudioSource = null;
    @property(AudioSource) freegameBGM: AudioSource = null;
    @property(AudioSource) generalClickSound: AudioSource = null;
    @property(AudioSource) reelStartSound: AudioSource = null;
    @property(AudioSource) reelSpinStopSound: AudioSource = null;
    @property(AudioSource) spinButtonClickSound: AudioSource = null;
    @property(AudioSource) buyFeatureClickSound: AudioSource = null;
    @property(AudioSource) confirmBuyFeatureSound: AudioSource = null;
    @property(AudioSource) scatterTrigger: AudioSource = null;
    @property(AudioSource) fiveOfAKindSound: AudioSource = null;
    @property(AudioSource) freeSpinTotalWinSound: AudioSource = null;
    @property(AudioSource) transitionSound: AudioSource = null;
    @property(AudioSource) collectCoinSound: AudioSource = null;
    @property(AudioSource) lineWinSound: AudioSource = null;
    @property(AudioSource) bigWinLevelLoopSound: AudioSource[] = [];
    @property(AudioSource) bigWinLevelOutroSound: AudioSource[] = [];
    @property(AudioSource) reelScatterSound: AudioSource[] = [];
    @property(AudioSource) reelScatterSlowSound: AudioSource[] = [];
    @property(AudioSource) reelScatterSlowHitSound: AudioSource[] = [];
    @property(AudioSource) openMenuPanelClickSound: AudioSource = null;
    @property(AudioSource) closeMenuPanelClickSound: AudioSource = null;
    @property(AudioSource) wildAppear: AudioSource = null;

    @property(Number) fadeDuration: number = 0;
    @property(Number) volumeOfGame: number = 0;

    private currentBGM = null;
    private currentlyDimmedBGM = null;
    private currentVolume = 0;
    private currentSoundMuteState = true;
    private isScatterReelSound = false;
    private currentScatterCount = 0;
    private totalPSCount = 0;
    private psCount = 0;
    private isPlayingSound = false;

    onLoad() {
        if (AudioManager.instance == null) {
            AudioManager.instance = this;
        }

        game.on(Game.EVENT_HIDE, this.onGameHide.bind(this));
        game.on(Game.EVENT_SHOW, this.onGameShow.bind(this));

        addEventListener(GameStateEvent.play_audio, this.PlayAudio.bind(this));
        addEventListener(GameStateEvent.stop_audio, this.StopAudio.bind(this));
        addEventListener(GameStateEvent.game_initialize, this.Init.bind(this));
        addEventListener(GameStateEvent.game_state_changed, this.OnGameStateChange.bind(this));
        // addEventListener(GameStateEvent.reel_stopped_spin , this.PlayOneReelSound.bind(this));
        addEventListener(GameStateEvent.all_reel_stopped_spin, this.PlayAllReelStopSound.bind(this));
        addEventListener(GameStateEvent.check_sound_mute, this.IsSoundMute.bind(this));
        // addEventListener("focus", this.OnFocusWindow.bind(this));
        // addEventListener("blur", this.OnBlurWindow.bind(this));

        addEventListener(UIButtonEvent[UIButtonEvent.spin_stop_clicked], this.CheckPSRemain.bind(this));
    }

    Init() {
        if (this.featureAudioSourceNode.children != null) {
            this.audioSources.push(...this.featureAudioSourceNode.getComponentsInChildren(AudioSource));
        }
        // this.PlayNormalBGM();
    }

    OnGameStateChange(customEvent: CustomEvent) {
        let eventDetail = customEvent.detail;
        // if(GameData.instance.IsSoundOn() == false) return;
        if (Utils.CheckGameTypeTransition(GameType.normal_game, GameType.free_game, eventDetail) && Utils.CheckCurrentGameState(GameStateAction.enter, GameState.idle, eventDetail)) {
            this.PlayFreeGameBGM();
        }
        else if (Utils.CheckGameTypeTransition(GameType.free_game, GameType.normal_game, eventDetail) && Utils.CheckCurrentGameState(GameStateAction.enter, GameState.idle, eventDetail)) {
            this.PlayNormalBGM();
        }
        if (Utils.CheckCurrentGameState(GameStateAction.enter, GameState.idle, eventDetail) && Utils.CheckCurrentGameType(GameType.normal_game)) {
            if (this.normalGameBGM?.playing == false) {
                this.PlayNormalBGM();
            }
        }

        if (Utils.CheckCurrentGameState(GameStateAction.enter, GameState.idle, eventDetail)) {
            this.currentScatterCount = 0;
            this.totalPSCount = 0;
            this.psCount = 0;
        } else if (Utils.CheckCurrentGameState(GameStateAction.exit, GameState.spin, eventDetail)) {
            if(GameData.instance.GetResult() != null) {
                for (let i = 0; i < GameData.instance.GetResult().array[0].length; i++) {
                    for (let j = 0; j < GameData.instance.GetResult().array[0][i].length; j++) {
                        if (GameData.instance.GetResult().array[0][i][j] == 'PS') {
                            this.totalPSCount++;
                        }
                    }
                }
            }
        }
    }

    PlayAudio(customEvent: CustomEvent) {
        let data = customEvent.detail;
        this.isPlayingSound = false;
        let found = false;
        if (GameData.instance.IsSoundOn() == false) return;
        for (var i = 0; i < this.audioSources.length; i++) {
            if (this.audioSources[i].node.name == data.audioName && !this.audioSources[i].node.getComponent(AudioProperties).muteSound) {
                if (!this.audioSources[i].playing) {
                    this.isPlayingSound = false;
                    found = true;
                    if (!this.audioSources[i].node.getComponent(AudioProperties).isMultiplePlay) {
                        this.audioSources[i].play();
                    } else {
                        this.audioSources[i].playOneShot(this.audioSources[i].clip);
                    }
                    this.CheckAndDimBGM(this.audioSources[i]);
                    break;
                } else {
                    this.isPlayingSound = true;
                }

            }
        }
        if (this.isPlayingSound && !found) {
            for (var i = 0; i < this.audioSources.length; i++) {
                if (this.audioSources[i].node.name == data.audioName && !this.audioSources[i].node.getComponent(AudioProperties).muteSound) {
                    this.isPlayingSound = false;
                    let newAudioSource = instantiate(this.audioSources[i].node);
                    newAudioSource.setParent(this.featureAudioSourceNode);
                    newAudioSource.getComponent(AudioSource).play();
                    this.audioSources.push(newAudioSource.getComponent(AudioSource))
                    this.CheckAndDimBGM(this.audioSources[i]);
                    break;
                }
            }
        }
    }

    StopAudio(customEvent: CustomEvent) {
        let data = customEvent.detail;
        if (GameData.instance.IsSoundOn() == false) return;
        let audioStopped = false;
        for (var i = 0; i < this.audioSources.length; i++) {
            if (this.audioSources[i].node.name == data.audioName) {
                this.audioSources[i].stop();
                audioStopped = true;
            }
        }

        if (audioStopped) {
            this.CheckAndUnDimBGM();
        }
    }

    PlayNormalBGM() {
        if (this.normalGameBGM.getComponent(AudioProperties).muteSound) {
            return;
        }
        if (this.normalGameBGM != null) {
            this.currentBGM = this.normalGameBGM;
        }
        if (GameData.instance.IsSoundOn() == false) return;
        if (this.normalGameBGM != null) {
            this.FadeInSound(this.normalGameBGM);
            this.currentBGM = this.normalGameBGM;

        }

        if (this.freegameBGM != null) {
            this.FadeOutSound(this.freegameBGM);
        }
    }

    PlayFreeGameBGM() {
        if (this.freegameBGM.getComponent(AudioProperties).muteSound) {
            return;
        }
        if (this.normalGameBGM != null) {
            this.currentBGM = this.freegameBGM;
        }
        if (GameData.instance.IsSoundOn() == false) return;

        if (this.normalGameBGM != null) {
            this.FadeOutSound(this.normalGameBGM);
        }

        if (this.freegameBGM != null) {
            this.FadeInSound(this.freegameBGM);
        }
    }

    PlayOneReelSound() {
        if (GameData.instance.IsSoundOn() == false) return;
        if (GameData.instance.IsTurboSpin() == false && this.reelSpinStopSound != null) {
            if (this.reelSpinStopSound.getComponent(AudioProperties).muteSound) {
                return;
            }
            this.reelSpinStopSound.play();
            this.CheckAndDimBGM(this.reelSpinStopSound);
        }
    }

    PlayAllReelStopSound() {
        if (GameData.instance.IsSoundOn() == false) return;
        if (GameData.instance.IsTurboSpin() == true && this.reelSpinStopSound != null) {
            if (this.reelSpinStopSound.getComponent(AudioProperties).muteSound) {
                return;
            }
            this.reelSpinStopSound.play();
            this.CheckAndDimBGM(this.reelSpinStopSound);

        }
    }

    PlayGeneralBtnSound(uiButtonEvent: UIButtonEvent = UIButtonEvent.none) {
        if (GameData.instance.IsSoundOn() == false) return;
        if (uiButtonEvent == UIButtonEvent.open_buy_free_spin_panel_clicked && this.buyFeatureClickSound != null) {
            if (this.buyFeatureClickSound.getComponent(AudioProperties).muteSound) {
                return;
            }
            this.buyFeatureClickSound.play();
            this.CheckAndDimBGM(this.buyFeatureClickSound);
        }
        else if (uiButtonEvent == UIButtonEvent.confirm_buy_free_spin_clicked && this.confirmBuyFeatureSound != null) {
            if (this.confirmBuyFeatureSound.getComponent(AudioProperties).muteSound) {
                return;
            }
            this.confirmBuyFeatureSound.play();
            this.CheckAndDimBGM(this.confirmBuyFeatureSound);

        }
        else if (uiButtonEvent == UIButtonEvent.spin_clicked && this.spinButtonClickSound != null) {
            if (this.spinButtonClickSound.getComponent(AudioProperties).muteSound) {
                return;
            }
            this.spinButtonClickSound.play();
            this.CheckAndDimBGM(this.spinButtonClickSound);

        }
        else if (uiButtonEvent == UIButtonEvent.open_menu_panel_clicked && this.openMenuPanelClickSound != null) {
            if (this.openMenuPanelClickSound.getComponent(AudioProperties).muteSound) {
                return;
            }
            this.openMenuPanelClickSound.play();
            this.CheckAndDimBGM(this.openMenuPanelClickSound);
        }
        else if (uiButtonEvent == UIButtonEvent.close_menu_panel_clicked && this.closeMenuPanelClickSound != null) {
            if (this.closeMenuPanelClickSound.getComponent(AudioProperties).muteSound) {
                return;
            }
            this.closeMenuPanelClickSound.play();
            this.CheckAndDimBGM(this.closeMenuPanelClickSound);
        }
        else if (this.generalClickSound != null) {
            if (this.generalClickSound.getComponent(AudioProperties).muteSound) {
                return;
            }
            this.generalClickSound.play();
            this.CheckAndDimBGM(this.generalClickSound);
        }
    }

    PlayFiveOfAKindSound() {
        if (GameData.instance.IsSoundOn() == false) return;
        if (this.fiveOfAKindSound != null) {
            if (this.fiveOfAKindSound.getComponent(AudioProperties).muteSound) {
                return;
            }
            this.fiveOfAKindSound.play();
        }
        this.DimBGM();
    }

    StopFiveOfAKindSound() {
        if (GameData.instance.IsSoundOn() == false) return;
        if (this.fiveOfAKindSound != null) {
            this.fiveOfAKindSound.stop();
        }
        this.UnDimBGM();
    }

    PlayBigWinSound(index) {
        if (GameData.instance.IsSoundOn() == false) return;
        if (this.bigWinLevelLoopSound != null && this.bigWinLevelLoopSound.length > 0) {
            if (index > 0) {
                this.bigWinLevelLoopSound[index].stop();
            }
            this.bigWinLevelLoopSound[index].play()
        }
        this.DimBGM();
    }

    StopBigWinSound(index) {
        if (GameData.instance.IsSoundOn() == false) return;
        let audioStopped: boolean = false;
        if (this.bigWinLevelLoopSound.length > 0) {
            this.bigWinLevelLoopSound[index].stop()
            audioStopped = true;
        }
        if (audioStopped) {
            this.CheckAndUnDimBGM();
        }
    }

    PlayBigWinOutroSound(index) {
        if (GameData.instance.IsSoundOn() == false) return;
        if (this.bigWinLevelOutroSound != null && this.bigWinLevelOutroSound.length > 0) {
            this.bigWinLevelLoopSound[index].stop();
            this.bigWinLevelOutroSound[index].play();
        }
    }

    PlayFreeSpinTotalWinSfx() {
        if (GameData.instance.IsSoundOn() == false) return;
        if (this.freeSpinTotalWinSound != null) {
            if (this.freeSpinTotalWinSound.getComponent(AudioProperties).muteSound) {
                return;
            }
            this.freeSpinTotalWinSound.play();
            this.CheckAndDimBGM(this.freeSpinTotalWinSound);
        }
    }

    StopFreeSpinTotalWinSfx() {
        if (GameData.instance.IsSoundOn() == false) return;
        if (this.freeSpinTotalWinSound != null) {
            this.freeSpinTotalWinSound.stop();
        }
        this.UnDimBGM();
    }

    PlayCoinCollectSound() {
        if (GameData.instance.IsSoundOn() == false) return;
        if (this.collectCoinSound != null) {
            if (this.collectCoinSound.getComponent(AudioProperties).muteSound) {
                return;
            }
            this.collectCoinSound.play();
        }
    }

    StopCoinCollectSound() {
        if (GameData.instance.IsSoundOn() == false) return;
        if (this.collectCoinSound != null) {
            this.collectCoinSound.stop();
        }
    }

    PlayWinLineSound() {
        if (GameData.instance.IsSoundOn() == false) return;
        if (this.lineWinSound != null) {
            if (this.lineWinSound.getComponent(AudioProperties).muteSound) {
                return;
            }
            this.lineWinSound.playOneShot(this.lineWinSound.clip);
        }
    }

    PlayTransitionSound() {
        if (GameData.instance.IsSoundOn() == false) return;
        if (this.transitionSound != null) {
            if (this.transitionSound.getComponent(AudioProperties).muteSound) {
                return;
            }
            this.transitionSound.play();
            this.CheckAndDimBGM(this.transitionSound);
        }
    }

    PlayScatterTriggerSound() {
        if (GameData.instance.IsSoundOn() == false) return;
        if (this.scatterTrigger != null) {
            if (this.scatterTrigger.getComponent(AudioProperties).muteSound) {
                return;
            }
            this.scatterTrigger.play();
            this.CheckAndDimBGM(this.scatterTrigger);
        }
    }

    PlayScatterReelSound() {
        if (GameData.instance.IsSoundOn() == false) return;
        if (this.reelScatterSlowSound != null && this.reelScatterSlowSound.length > 0 && !this.reelScatterSlowSound[this.currentScatterCount].getComponent(AudioProperties).muteSound) {
            this.reelScatterSlowSound[this.currentScatterCount].play();
            this.isScatterReelSound = true;
        }
    }

    PlayScatterReelHitSound() {
        if (GameData.instance.IsSoundOn() == false) return;
        if (this.reelScatterSlowHitSound != null && this.reelScatterSlowHitSound.length > 0 && !this.reelScatterSlowHitSound[this.currentScatterCount].getComponent(AudioProperties).muteSound) {
            this.reelScatterSlowHitSound[this.currentScatterCount].play();
            this.isScatterReelSound = true;
            this.currentScatterCount = this.currentScatterCount + 1;
        }
    }

    StopScatterReelSound() {
        if (GameData.instance.IsSoundOn() == false) return;
        if (this.reelScatterSlowSound != null && this.reelScatterSlowSound.length > 0) {
            if (this.isScatterReelSound == true) {
                this.reelScatterSlowSound[this.currentScatterCount].stop();
                this.isScatterReelSound = false;
            }
        }
    }

    PlayWildAppearSound() {
        if (GameData.instance.IsSoundOn() == false) return;
        if (this.wildAppear == null) return;
        if (this.wildAppear.getComponent(AudioProperties).muteSound) {
            return;
        }
        this.wildAppear.play();
        this.CheckAndDimBGM(this.wildAppear);
    }

    FadeInSound(audioSource: AudioSource, callback: () => {} = null) {
        audioSource.play();
        let originalVolume = audioSource.volume;
        audioSource.volume = 0;

        tween(audioSource)
            .to(this.fadeDuration, { volume: originalVolume })
            .call(() => {
                callback?.();
            })
            .start();

    }

    FadeOutSound(audioSource: AudioSource, callback: () => {} = null) {
        let originalVolume = audioSource.volume;
        tween(audioSource)
            .to(this.fadeDuration, { volume: 0 })
            .call(() => {
                audioSource.stop();
                audioSource.volume = originalVolume;
                callback?.();
            })
            .start();

    }

    DimBGM() {
        // let stack = new Error().stack;
        // console.log('asd dim' , stack); 
        if(this.normalGameBGM == null) return;
        if(this.freegameBGM == null) return;
        if (this.normalGameBGM?.playing == true) {
            this.currentlyDimmedBGM = this.normalGameBGM;
            this.currentVolume = this.normalGameBGM.volume;
        } else if (this.freegameBGM?.playing == true) {
            this.currentlyDimmedBGM = this.freegameBGM;
            this.currentVolume = this.freegameBGM.volume;
        }
        tween(this.currentlyDimmedBGM)
            .to(0.5, { volume: 0.4 })
            .start();
    }

    CheckAndDimBGM(audioSource: AudioSource) {
        if (audioSource.node.getComponent(AudioProperties)?.dimBGM) {
            this.DimBGM();
            audioSource.node.on(AudioSource.EventType.ENDED, this.UnDimBGM, this);
        }
    }

    CheckAndUnDimBGM() {
        for (var i = 0; i < this.audioSources.length; i++) {
            if (this.audioSources[i].playing) {
                return;
            }
        }
        this.UnDimBGM();
    }

    UnDimBGM() {
        if (this.currentlyDimmedBGM != null) {
            tween(this.currentlyDimmedBGM)
                .to(0.5, { volume: 1 })
                .call((() => {
                    this.currentlyDimmedBGM = null;
                }).bind(this))
                .start();
        }
    }

    IsSoundMute(event) {
        let isSoundMuted = event.detail;
        if (isSoundMuted == false) {
            this.node.getComponentsInChildren(AudioSource).forEach((audioSource) => {
                audioSource.volume = 0;
                this.currentSoundMuteState = isSoundMuted;
            });
        }
        else {
            this.node.getComponentsInChildren(AudioSource).forEach((audioSource) => {
                audioSource.volume = 1;
                this.currentSoundMuteState = isSoundMuted;

            });
            if (GameData.instance.GetCurrentGameType() == GameType.free_game) {
                if (!this.freegameBGM.playing) {
                    this.PlayFreeGameBGM();
                }
            } else if (GameData.instance.GetCurrentGameType() == GameType.normal_game) {
                if (!this.normalGameBGM.playing) {
                    this.PlayNormalBGM();
                }
            }
        }
    }

    PlayReelScatterSound(index) {
        if (GameData.instance.IsSoundOn() == false) return;
        if (this.reelScatterSound != null && this.reelScatterSound.length > 0 && !this.reelScatterSound[index].getComponent(AudioProperties).muteSound) {
            if (index > 3 && this.reelScatterSound[index].playing) {
                return;
            }
            this.reelScatterSound[index].play();
            this.psCount++;
        }
    }

    CheckPSRemain() {
        if (GameData.instance.IsSoundOn() == false) return;

        if (this.totalPSCount - this.psCount > 0) {
            if (this.psCount > 3) {
                if (this.reelScatterSound != null && this.reelScatterSound.length > 0 && !this.reelScatterSound[3].getComponent(AudioProperties).muteSound) {
                    this.reelScatterSound[3].play();
                }
            }
        }
    }

    PlayEventSound(value: string) {
        let eventDetail = value;
        dispatchEvent(new CustomEvent(GameStateEvent.play_audio, { detail: { audioName: eventDetail } }))
    }

    StopEventSound(value: string) {
        let eventDetail = value;
        dispatchEvent(new CustomEvent(GameStateEvent.stop_audio, { detail: { audioName: eventDetail } }))
    }

    OnFocusWindow() {
        if (this.currentSoundMuteState) {
            GameData.instance.SetSoundOn(true);
        }
    }

    OnBlurWindow() {
        GameData.instance.SetSoundOn(false);
    }

    onGameHide() {
        GameData.instance.SetSoundOn(false);
    }

    onGameShow() {
        if (this.currentSoundMuteState) {
            GameData.instance.SetSoundOn(true);
        }
    }
}

