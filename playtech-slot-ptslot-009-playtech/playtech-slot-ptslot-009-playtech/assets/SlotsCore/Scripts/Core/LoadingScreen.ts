import { _decorator, Component, Node , director, ProgressBar, instantiate, CCInteger, Scene, SceneAsset} from 'cc';
import { GameStateEvent } from '../Model/GameStateData';
import { LoadingProgressDetail } from '../Model/LoadingProgressDetail';
import Utils from '../Util/Utils';
const { ccclass, property } = _decorator;


@ccclass('LoadingScreen')
export class LoadingScreen extends Component {
    @property(String) gameSceneName: string = "";
    @property(ProgressBar) progressBar: ProgressBar = null;

    // protected completedCount: number = 0;
    // protected totalCount: number = 0;
    // protected progress: number = 0;

    protected loadingProgressCollection: any = {};
    protected loadingProgressUpdateSecond: number = 0;
    @property(Number) loadingProgressUpdateIntervalSecond: number = 0.2;

    protected currentLoadingProgress: number = 0;
    protected isLoadingGameScene: boolean = false;

    private onLoadAssetStart = null;
    private onLoadAssetUpdateProgress = null;

    onLoad() {
        this.progressBar.progress = 0;
        
        this.onLoadAssetStart = this.OnLoadAssetStart.bind(this);
        this.onLoadAssetUpdateProgress = this.OnLoadAssetUpdateProgress.bind(this);

        addEventListener(GameStateEvent.load_asset_start, this.onLoadAssetStart);
        addEventListener(GameStateEvent.load_asset_update_progress, this.onLoadAssetUpdateProgress);
    }

    protected onDestroy(): void {
        removeEventListener(GameStateEvent.load_asset_start, this.onLoadAssetStart);
        removeEventListener(GameStateEvent.load_asset_update_progress, this.onLoadAssetUpdateProgress);
    }

    start() {
        dispatchEvent(new CustomEvent(GameStateEvent.load_asset_start));
    }

    update(dt: number): void {
        this.loadingProgressUpdateSecond += dt;

        if (this.loadingProgressUpdateSecond > this.loadingProgressUpdateIntervalSecond) {
            this.loadingProgressUpdateSecond = 0;
            this.UpdateProgressBar();
        }
    }

    protected UpdateProgressBar () {
        let sumCompletedCount = 0;
        let sumTotalCount = 0;
        for (let key in this.loadingProgressCollection) {
            let loadingProgress: LoadingProgressDetail = this.loadingProgressCollection[key];

            sumCompletedCount += loadingProgress.completedCount;
            sumTotalCount += loadingProgress.totalCount;
        }
        
        this.currentLoadingProgress = sumTotalCount > 0? (sumCompletedCount / sumTotalCount) : 0;

        // totalCount will increase by time
        if (this.progressBar.progress < this.currentLoadingProgress) {
            this.progressBar.progress = this.currentLoadingProgress;
        }

        if (this.isLoadingGameScene == false && this.currentLoadingProgress >= 1) {
            this.isLoadingGameScene = true;
            director.loadScene(this.gameSceneName);
        }
    }

    OnLoadAssetStart = (customEvent: CustomEvent) => {
        let gameSceneName = this.gameSceneName;
        director.preloadScene(gameSceneName, 
            // progress
            function (completedCount: number, totalCount: number) {
                let loadSceneProgress = new LoadingProgressDetail().UpdateWithObject({
                    key: LoadingProgressDetail.SCENE_KEY,
                    completedCount: completedCount,
                    totalCount: totalCount
                });

                dispatchEvent(new CustomEvent(GameStateEvent.load_asset_update_progress, {detail: loadSceneProgress}));

            }, 
            // complete call back
            function (err, sceneAsset) {
                if (err) {
                    console.error("Loading Screen - error loading scene:", gameSceneName)
                }
            } // do nothing when complete
        );
    }

    OnLoadAssetUpdateProgress = (customEvent: CustomEvent) => {
        let eventDetail: LoadingProgressDetail = customEvent.detail as LoadingProgressDetail;

        if (this.loadingProgressCollection[eventDetail.key] == null) {
            this.loadingProgressCollection[eventDetail.key] = new LoadingProgressDetail().UpdateWithLoadingProgress(eventDetail);
        } else {
            (this.loadingProgressCollection[eventDetail.key] as LoadingProgressDetail).UpdateWithLoadingProgress(eventDetail);
        }
    };
}

