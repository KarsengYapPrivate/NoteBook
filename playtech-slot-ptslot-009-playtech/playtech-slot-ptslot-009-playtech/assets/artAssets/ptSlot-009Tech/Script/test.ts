import { _decorator, Component, Node, sp } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('test')
export class test extends Component {
    @property(Node) bg : Node = null;

    backgroundCheck() {
        this.bg.getComponent(sp.Skeleton).animation = 'feature_toNormal';
        this.bg.getComponent(sp.Skeleton).setCompleteListener((function(data) {
            if(data.animation.name == 'feature_toNormal') {
                this.bg.getComponent(sp.Skeleton).animation = 'normal_idle';
        }}).bind(this))
    }
}


