import { _decorator, Component, math, Node, Quat, UIOpacity, UITransform, Vec3, Vec4 } from 'cc';
import { GameStateEvent } from '../Model/GameStateData';
import { EDITOR } from 'cc/env';
const { ccclass, property, executeInEditMode } = _decorator;

@ccclass('NodeOrientation')
@executeInEditMode(true)
export class NodeOrientation extends Component {

    @property(Boolean) isNeedTwoNode : boolean = false;
    @property({type: Node , visible:function(this:NodeOrientation){ return this.isNeedTwoNode}}) HNode : Node = null;
    @property({type: Node , visible:function(this:NodeOrientation){ return this.isNeedTwoNode}}) VNode : Node = null;
    @property({type: Boolean , visible:function(this:NodeOrientation){ return this.isNeedTwoNode}}) isOpacity : boolean = false;

    @property(Boolean) isNeedChangeParent : boolean = false;
    // @property({type: Node , visible:function(this:OrientationScript){ return this.isNeedChangeParent}}) node : Node = null;
    @property({type: Node , visible:function(this:NodeOrientation){ return this.isNeedChangeParent}}) HParent : Node = null;
    @property({type: Node , visible:function(this:NodeOrientation){ return this.isNeedChangeParent}}) VParent : Node = null;

    @property(Boolean) applyAllHValueToNode : boolean = false;
    @property(Boolean) applyAllVValueToNode : boolean = false;

    @property({type: Boolean ,group:'position'}) affectPosition : boolean = false;
    @property({type: Vec3 ,group:'position', visible:function(this:NodeOrientation){ return this.affectPosition}}) HPosition : Vec3 = new Vec3;
    @property({type: Vec3 ,group:'position', visible:function(this:NodeOrientation){ return this.affectPosition}}) VPosition : Vec3 = new Vec3;
    @property({type: Boolean ,group:'position', visible:function(this:NodeOrientation){ return this.affectPosition}}) updateNodeToHPosition : boolean = false;
    @property({type: Boolean ,group:'position', visible:function(this:NodeOrientation){ return this.affectPosition}}) updateNodeToVPosition : boolean = false;
    @property({type: Boolean ,group:'position', visible:function(this:NodeOrientation){ return this.affectPosition}}) updateHPositionToNode : boolean = false;
    @property({type: Boolean ,group:'position', visible:function(this:NodeOrientation){ return this.affectPosition}}) updateVPositionToNode : boolean = false;

    @property({type: Boolean ,group:'scale'}) affectScale : boolean = false;
    @property({type: Vec3 ,group:'scale', visible:function(this:NodeOrientation){ return this.affectScale}}) HScale : Vec3 = new Vec3;
    @property({type: Vec3 ,group:'scale', visible:function(this:NodeOrientation){ return this.affectScale}}) VScale : Vec3 = new Vec3;
    @property({type: Boolean ,group:'scale', visible:function(this:NodeOrientation){ return this.affectScale}}) updateNodeToHScale : boolean = false;
    @property({type: Boolean ,group:'scale', visible:function(this:NodeOrientation){ return this.affectScale}}) updateNodeToVScale : boolean = false;
    @property({type: Boolean ,group:'scale', visible:function(this:NodeOrientation){ return this.affectScale}}) updateHScaleToNode : boolean = false;
    @property({type: Boolean ,group:'scale', visible:function(this:NodeOrientation){ return this.affectScale}}) updateVScaleToNode : boolean = false;

    @property({type: Boolean ,group:'contentSize'}) affectContentSize : boolean = false;
    @property({type: math.Size ,group:'contentSize', visible:function(this:NodeOrientation){ return this.affectContentSize}}) HContentSize : math.Size = new math.Size;
    @property({type: math.Size ,group:'contentSize', visible:function(this:NodeOrientation){ return this.affectContentSize}}) VContentSize : math.Size = new math.Size;
    @property({type: Boolean ,group:'contentSize', visible:function(this:NodeOrientation){ return this.affectContentSize}}) updateNodeToHContentSize : boolean = false;
    @property({type: Boolean ,group:'contentSize', visible:function(this:NodeOrientation){ return this.affectContentSize}}) updateNodeToVContentSize : boolean = false;
    @property({type: Boolean ,group:'contentSize', visible:function(this:NodeOrientation){ return this.affectContentSize}}) updateHContentSizeToNode : boolean = false;
    @property({type: Boolean ,group:'contentSize', visible:function(this:NodeOrientation){ return this.affectContentSize}}) updateVContentSizeToNode : boolean = false;

    @property({type: Boolean ,group:'rotation'}) affectRotation : boolean = false;
    @property({type: Vec3 ,group:'rotation', visible:function(this:NodeOrientation){ return this.affectRotation}}) HRotation : Vec3 = new Vec3;
    @property({type: Vec3 ,group:'rotation', visible:function(this:NodeOrientation){ return this.affectRotation}}) VRotation : Vec3 = new Vec3;
    @property({type: Boolean ,group:'rotation', visible:function(this:NodeOrientation){ return this.affectRotation}}) updateNodeToHRotation : boolean = false;
    @property({type: Boolean ,group:'rotation', visible:function(this:NodeOrientation){ return this.affectRotation}}) updateNodeToVRotation : boolean = false;
    @property({type: Boolean ,group:'rotation', visible:function(this:NodeOrientation){ return this.affectRotation}}) updateHRotationToNode : boolean = false;
    @property({type: Boolean ,group:'rotation', visible:function(this:NodeOrientation){ return this.affectRotation}}) updateVRotationToNode : boolean = false;

    private orientationChange = null;
    Initialize() {
        this.orientationChange = this.OrientationChange.bind(this);
        addEventListener(GameStateEvent.orientation_changed , this.orientationChange);
    }

    protected onDestroy(): void {
        removeEventListener(GameStateEvent.orientation_changed , this.orientationChange)
    }

    OrientationChange(customEvent : CustomEvent) {
        let eventDetail = customEvent.detail;

        if(this.isNeedTwoNode) {
            if (eventDetail.orientation == 0) {
                if (!this.isOpacity) {

                    if (this.HNode != null) {
                        this.HNode.active = true;
                    }
                    if (this.VNode != null) {
                        this.VNode.active = false;
                    }
                    
                } else {
                    if (this.HNode != null) {
                        if(this.HNode.getComponent(UIOpacity) != null) {
                            this.HNode.getComponent(UIOpacity).opacity = 255;
                        }
                    }
                    if(this.VNode != null) {
                        if(this.VNode.getComponent(UIOpacity) != null) {
                            this.VNode.getComponent(UIOpacity).opacity = 1;
                        }
                    }
                }
            }
            else if(eventDetail.orientation == 1){
                if (!this.isOpacity) {

                    if (this.HNode != null) {
                        this.HNode.active = false;
                    }
                    if (this.VNode != null) {
                        this.VNode.active = true;
                    }
                } else {
                    if (this.HNode != null) {
                        if(this.HNode.getComponent(UIOpacity) != null) {
                            this.HNode.getComponent(UIOpacity).opacity = 1;
                        }
                    }
                    if(this.VNode != null) {
                        if(this.VNode.getComponent(UIOpacity) != null) {
                            this.VNode.getComponent(UIOpacity).opacity = 255;
                        }
                    }
                }
            }
        }
        if(this.isNeedChangeParent) {
            if(eventDetail.orientation == 0) {
                if(this.HParent != null) {
                    this.node.setParent(this.HParent);
                }
            } 
            else if(eventDetail.orientation == 1){
                if(this.VParent != null) {
                    this.node.setParent(this.VParent);
                } 
            }
        }
        if(this.affectPosition) {
            if (eventDetail.orientation == 0) {
                this.node.setPosition(this.HPosition);
            }
            else if (eventDetail.orientation == 1) {
                this.node.setPosition(this.VPosition);
            }
        }
        if (this.affectScale) {
            if (eventDetail.orientation == 0) {
                this.node.setScale(this.HScale);
            }
            else if (eventDetail.orientation == 1) {
                this.node.setScale(this.VScale);
            }

        }
        if (this.affectContentSize) {
            if (eventDetail.orientation == 0) {
                if (this.node.getComponent(UITransform) != null) {
                    this.node.getComponent(UITransform).setContentSize(this.HContentSize);
                }
            }
            else if (eventDetail.orientation == 1) {
                if (this.node.getComponent(UITransform) != null) {
                    this.node.getComponent(UITransform).setContentSize(this.VContentSize);
                }
            }

        }
        if(this.affectRotation) {
            if(eventDetail.orientation == 0) {
                this.node.eulerAngles = this.HRotation;
            } 
            else if(eventDetail.orientation == 1){
                this.node.eulerAngles = this.VRotation;
            }
        }
    }

    protected update(dt: number): void {
        if (EDITOR) {
            if (this.updateHPositionToNode) {
                this.node.setPosition(this.HPosition);
                this.updateHPositionToNode = false;
            } else if (this.updateVPositionToNode) {
                this.node.setPosition(this.VPosition);
                this.updateVPositionToNode = false;
            } else if (this.updateNodeToHPosition) {
                this.HPosition = this.node.getPosition();
                this.updateNodeToHPosition = false;
            } else if (this.updateNodeToVPosition) {
                this.VPosition = this.node.getPosition();
                this.updateNodeToVPosition = false;
            }
            else if (this.updateHScaleToNode) {
                this.node.setScale(this.HScale);
                this.updateHScaleToNode = false;
            } else if (this.updateVScaleToNode) {
                this.node.setScale(this.VScale);
                this.updateVScaleToNode = false;
            } else if (this.updateNodeToHScale) {
                this.HScale = this.node.getScale()
                this.updateNodeToHScale = false;
            } else if (this.updateNodeToVScale) {
                this.VScale = this.node.getScale()
                this.updateNodeToVScale = false;
            }
            else if (this.updateHContentSizeToNode) {
                this.node.getComponent(UITransform).setContentSize(this.HContentSize);
                this.updateHContentSizeToNode = false;
            } else if (this.updateVContentSizeToNode) {
                this.node.getComponent(UITransform).setContentSize(this.VContentSize);
                this.updateVContentSizeToNode = false;
            } else if (this.updateNodeToHContentSize) {
                this.HContentSize.width = this.node.getComponent(UITransform).contentSize.width;
                this.HContentSize.height = this.node.getComponent(UITransform).contentSize.height;
                this.updateNodeToHContentSize = false;
            } else if (this.updateNodeToVContentSize) {
                this.VContentSize.width = this.node.getComponent(UITransform).contentSize.width;
                this.VContentSize.height = this.node.getComponent(UITransform).contentSize.height;
                this.updateNodeToVContentSize = false;
            }
            else if (this.updateNodeToHRotation) {
                this.HRotation.x = this.node.eulerAngles.x;
                this.HRotation.y = this.node.eulerAngles.y;
                this.HRotation.z = this.node.eulerAngles.z;
                this.updateNodeToHRotation = false;
            } else if (this.updateNodeToVRotation) {
                this.VRotation.x = this.node.eulerAngles.x;
                this.VRotation.y = this.node.eulerAngles.y;
                this.VRotation.z = this.node.eulerAngles.z;
                this.updateNodeToVRotation = false;
            } else if (this.updateHRotationToNode) {
                this.node.eulerAngles = this.HRotation;
                this.updateHRotationToNode = false;
            } else if (this.updateVRotationToNode) {
                this.node.eulerAngles = this.VRotation;
                this.updateVRotationToNode = false;
            }
            //value to node
            if (this.applyAllHValueToNode) {
                if (this.affectPosition) {
                    this.node.setPosition(this.HPosition);
                }
                if (this.affectScale) {
                    this.node.setScale(this.HScale);
                }
                if (this.affectContentSize) {
                    this.node.getComponent(UITransform).setContentSize(this.HContentSize);
                }
                if (this.affectRotation) {
                    this.node.eulerAngles = this.HRotation;
                }
                if (this.isNeedChangeParent) {
                    if (this.HParent != null) {
                        this.node.setParent(this.HParent)
                    }
                }
                this.applyAllHValueToNode = false;
            }
            else if (this.applyAllVValueToNode) {
                if (this.affectPosition) {
                    this.node.setPosition(this.VPosition);
                }
                if (this.affectScale) {
                    this.node.setScale(this.VScale);
                }
                if (this.affectContentSize) {
                    this.node.getComponent(UITransform).setContentSize(this.VContentSize);
                }
                if (this.affectRotation) {
                    this.node.eulerAngles = this.VRotation;
                }
                if (this.isNeedChangeParent) {
                    if (this.VParent != null) {
                        this.node.setParent(this.VParent)
                    }
                }
                this.applyAllVValueToNode = false;
            }
        }
    }
}


