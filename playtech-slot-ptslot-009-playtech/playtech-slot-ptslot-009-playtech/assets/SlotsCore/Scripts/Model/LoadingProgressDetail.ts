import { _decorator } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('LoadingProgressDetail')
export class LoadingProgressDetail {
    public static SCENE_KEY: string = "SCENE"; // used by scene loading
    public static ASSET_MANAGER_KEY: string = "ASSET_MANAGER"; // used by AssetManager class
    public static ERROR_MESSAGES_KEY: string = "ERROR_MESSAGES_KEY"; // used by AssetManager class

    public key: string;
    public completedCount: number;
    public totalCount: number;

    constructor () { }

    UpdateWithObject (loadingProgressDetail: {key: string, completedCount: number, totalCount: number}) {
        this.key = loadingProgressDetail.key;
        this.completedCount = loadingProgressDetail.completedCount;
        this.totalCount = loadingProgressDetail.totalCount;

        return this;
    }

    UpdateWithLoadingProgress (loadingProgressDetail: LoadingProgressDetail) {
        this.key = loadingProgressDetail.key;
        this.completedCount = loadingProgressDetail.completedCount;
        this.totalCount = loadingProgressDetail.totalCount;

        return this;
    }
}


