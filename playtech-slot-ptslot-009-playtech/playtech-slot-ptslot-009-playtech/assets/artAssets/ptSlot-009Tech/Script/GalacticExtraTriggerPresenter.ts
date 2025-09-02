import { _decorator, Component, instantiate, Node, sp, v3, Vec3 } from 'cc';
import PresenterPrototype from '../../../SlotsCore/Scripts/Presenter/PresenterPrototype';
import GameData, { GameStateInfo } from '../../../SlotsCore/Scripts/Model/GameData';
import { ReelController } from '../../../SlotsCore/Scripts/Core/ReelController';
import { CacasdingSymbol } from './CacasdingSymbol';
import { GalacticColoniesConfig } from './GalacticColoniesConfig';
import Utils from '../../../SlotsCore/Scripts/Util/Utils';
import AudioManager from 'db://assets/SlotsCore/Scripts/Core/AudioManager';
const { ccclass, property } = _decorator;

@ccclass('GalacticExtraTriggerPresenter')
export class GalacticExtraTriggerPresenter extends PresenterPrototype {
    private resumePresenter = false;
    private totalNumber = 0;
    private currentNumber = 0;
    override CheckTriggerCondition(gameStateInfo: GameStateInfo): boolean {
        let trigger = false;
        if(GameData.instance.GetResult().extraFeatureIsWildChance) {
            trigger = true;
        }
        return trigger;
    }

    override async RunPresenter(): Promise<void> {
        this.totalNumber = 0;
        this.currentNumber = 0;
        this.resumePresenter = false;
        GalacticColoniesConfig.instance.extraFeature.changeToWildNode.active = true;
        GalacticColoniesConfig.instance.extraFeature.changeToWildNode.getComponentInChildren(sp.Skeleton).animation = 'animation';
        AudioManager.instance.PlayEventSound(GalacticColoniesConfig.instance.sound.changeWildFeature);


        GalacticColoniesConfig.instance.extraFeature.changeToWildNode.getComponentInChildren(sp.Skeleton).setCompleteListener((function(data) {
            if(data.animation.name == 'animation') {
                GalacticColoniesConfig.instance.extraFeature.changeToWildNode.active = false;
                this.resumePresenter = true;
            }
        }).bind(this))

        for(let i = 0; i < GameData.instance.GetResult().wildResultArray.length; i++) {
            for (let j = 0; j < GameData.instance.GetResult().wildResultArray[i].length; j++) {
                if(GameData.instance.GetResult().wildResultArray[i][j] == 1) {
                    this.totalNumber++;
                }
            }
        }

        await Utils.WaitForCondition((()=>this.resumePresenter).bind(this))

        this.resumePresenter = false;

        AudioManager.instance.PlayEventSound(GalacticColoniesConfig.instance.sound.changeWild);

        for(let i = 0; i < GameData.instance.GetResult().wildResultArray.length; i++) {
            for (let j = 0; j < GameData.instance.GetResult().wildResultArray[i].length; j++) {
                if(GameData.instance.GetResult().wildResultArray[i][j] == 1) {
                    let linePrefab = instantiate(GalacticColoniesConfig.instance.extraFeature.extraLinePrefab);
                    linePrefab.setParent(GalacticColoniesConfig.instance.extraFeature.extraLineLayer);
                    let startPointWP = GalacticColoniesConfig.instance.extraFeature.extraLineStartPoint.worldPosition.clone();
                    linePrefab.setWorldPosition(v3(startPointWP.x , startPointWP.y , 0));
                    let prefab = instantiate(GalacticColoniesConfig.instance.extraFeature.multiplyPrefab);
                    prefab.setParent(GalacticColoniesConfig.instance.extraFeature.multiplyNodeLayer);   
                    prefab.getComponent(sp.Skeleton).skeletonData = GalacticColoniesConfig.instance.extraFeature.changeToWildSpine;
                    prefab.setPosition(v3(ReelController.instance.reelNormals[i].node.position.x , ReelController.instance.reelNormals[i].node.children[j].position.y , 0))
                    prefab.getComponent(sp.Skeleton).loop = false;

                    //calculate distance between line and prefab
                    let linePrefabPos = linePrefab.worldPosition;
                    let prefabPos = prefab.worldPosition;
                    let distance = Vec3.distance(linePrefabPos, prefabPos);

                    //calculate angle between line and prefab
                    let direction = prefabPos.subtract(linePrefabPos).normalize();
                    let angle = Math.atan2(direction.y, direction.x) * (180 / Math.PI) - 90;
                    linePrefab.setRotationFromEuler(0, 0, angle);

                    let scale = distance / 100;
                    linePrefab.setScale(v3(1, scale, 1));
                    linePrefab.getComponent(sp.Skeleton).animation = 'animation';
                    linePrefab.getComponent(sp.Skeleton).setCompleteListener((function(data) {
                        if(data.animation.name == 'animation') {
                            linePrefab.destroy();
                        }
                    }).bind(this))
                    prefab.getComponent(sp.Skeleton).animation = 'ChangeToWild_1x' + GameData.instance.GetResult().sizeArray[0][i][j];
                    prefab.getComponent(sp.Skeleton).setEventListener((function(data , name) {
                        if(name.data.name == 'change') {
                            this.currentNumber++;
                            ReelController.instance.reelNormals[i].node.children[j].getComponent(CacasdingSymbol).UpdateSymbol('PW');
                            ReelController.instance.reelNormals[i].node.children[j].getComponent(CacasdingSymbol).LoadIdleAnimation();
                            if(this.totalNumber = this.currentNumber) {
                                this.resumePresenter = true;
                            }
                        }
                    }).bind(this));
                    prefab.getComponent(sp.Skeleton).setCompleteListener((function(data) {
                        if(data.animation.name == 'ChangeToWild_1x' + GameData.instance.GetResult().sizeArray[0][i][j]) {
                            prefab.destroy();
                        }
                    }).bind(this))

                    
                }
            }
        }
        await Utils.WaitForCondition((()=>this.resumePresenter).bind(this))

        return;
    }
}


