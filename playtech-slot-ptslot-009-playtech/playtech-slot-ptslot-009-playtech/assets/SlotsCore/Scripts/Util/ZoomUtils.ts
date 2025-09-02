import { _decorator, Camera, Component, Node, tween, UITransform, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ZoomUtils')
export class ZoomUtils extends Component {
    @property(Node) zoomNode: Node = null;
    @property([Node]) zoomNodeArray: Node[] = [];
    @property(Camera) cameraNode: Camera = null;
    private startZoom : boolean = false;
    private tempNode : Node = null;

    start() {
        this.testmove()
        this.ZoomSpecificNode(this.zoomNode,3,5,300,"sineIn");
        // this.ZoomArray(this.zoomNodeArray,0.5,0.5,300,"sineIn");
    }

    // ZoomSpecificNode(nodeToZoom, zoomDuration = 0, zoomStayTime = 0, targetOrthoHeight, easingType){
    //     if(!nodeToZoom || !this.cameraNode)
    //     {
    //         return;
    //     }

    //     if(!easingType)
    //     {
    //         easingType = "sineOut";
    //     }

    //     let originalCameraPos = this.cameraNode.node.worldPosition.clone();
    //     let nodeWorldPos = nodeToZoom.getWorldPosition();
    //     let newCameraPos = this.cameraNode.node.parent.getComponent(UITransform).convertToNodeSpaceAR(nodeWorldPos);

    //     let originalOrthoHeight = this.cameraNode.orthoHeight;

    //     tween(this.cameraNode.node)
    //     .to(zoomDuration,{position:new Vec3(newCameraPos.x,newCameraPos.y,originalCameraPos.z)},{easing: easingType})
    //     .call(()=>{
    //         if(zoomStayTime>0)
    //         {
    //             this.scheduleOnce(function(){
    //                 tween(this.cameraNode.node)
    //                 .to(zoomDuration, {position:new Vec3(0,0,1000)},{easing: easingType})
    //                 .start();
    //             },zoomStayTime)
    //         }
    //     })
    //     .start();

    //     tween(this.cameraNode)
    //     .to(zoomDuration, {orthoHeight:targetOrthoHeight},{easing: easingType})
    //     .call(()=>{
    //         if(zoomStayTime>0)
    //         {
    //             this.scheduleOnce(function(){
    //                 tween(this.cameraNode)
    //                 .to(zoomDuration, {orthoHeight:originalOrthoHeight},{easing: easingType})
    //                 .start();
    //             },zoomStayTime)
    //         }
    //     })
    //     .start();

    // }

    updateCameraPosition()
    {
        let originalCameraPos = this.cameraNode.node.worldPosition.clone();
        let nodeWorldPos = this.tempNode.getWorldPosition();
        let newCameraPos = this.cameraNode.node.parent.getComponent(UITransform).convertToNodeSpaceAR(nodeWorldPos);
        return new Vec3(newCameraPos.x,newCameraPos.y, originalCameraPos.z);
    }

    ZoomSpecificNode(nodeToZoom, zoomDuration = 0, zoomStayTime = 0, targetOrthoHeight, easingType){
        if(!nodeToZoom || !this.cameraNode)
        {
            return;
        }

        if(!easingType)
        {
            easingType = "sineOut";
        }

        let originalOrthoHeight = this.cameraNode.orthoHeight;
        this.tempNode = nodeToZoom;
        this.startZoom = true;

        let stopFollowing = () => {
            this.startZoom = false;
            tween(this.cameraNode.node)
                .to(zoomDuration, { position: new Vec3(0, 0, 1000) }, { easing: easingType })
                .start();
    
            tween(this.cameraNode)
                .to(zoomDuration, { orthoHeight: originalOrthoHeight }, { easing: easingType })
                .start();
        };    

        // tween(this.cameraNode.node)
        // .to(zoomDuration,{position: this.updateCameraPosition()},{easing: easingType})
        // .call(()=>{
        //     if(zoomStayTime>0)
        //     {
        //         this.scheduleOnce(stopFollowing, zoomStayTime);
        //     }
        // })
        // .start();

        tween(this.cameraNode)
        .to(zoomDuration, {orthoHeight:targetOrthoHeight},{easing: easingType})
        .call(()=>{
            if(zoomStayTime>0)
            {
                this.scheduleOnce(stopFollowing, zoomStayTime);
            }
        })
        .start();
    }

    

    ZoomArray(arrayToZoom, zoomDuration = 0, zoomStayTime = 0, targetOrthoHeight, easingType)
    {
        let processNextNode = (index) => {
            if (index >= arrayToZoom.length) return;
            if(index != 0)
            {
                this.scheduleOnce(function(){
                    this.ZoomSpecificNode(arrayToZoom[index], zoomDuration, zoomStayTime, targetOrthoHeight, easingType);
                    processNextNode(index + 1);
                },(zoomDuration*2)+zoomStayTime+0.3)
            }
            else
            {
                this.ZoomSpecificNode(arrayToZoom[index], zoomDuration, zoomStayTime, targetOrthoHeight, easingType);
                processNextNode(index + 1);
            }
        };
    
        processNextNode(0);
    }

    testmove()
    {
        let targetPos = new Vec3(this.zoomNode.position.x,this.zoomNode.position.y+500,this.zoomNode.position.z);
        tween(this.zoomNode)
        .to(5,{position: targetPos})
        .start();
    }

    update(deltaTime: number) {
        if(this.startZoom == true)
        {
            let newCameraPos = this.updateCameraPosition();
            this.cameraNode.node.setPosition(newCameraPos);
        }
    }
}


