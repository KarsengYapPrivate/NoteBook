import { _decorator, Component, Node, Quat, tween, Tween, Vec3, Vec4 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('NodeShakeFeature')
export class NodeShakeFeature extends Component {

    @property([Node])
    listOfNodes: Node[] = [];

    
    @property(Node)
    myNode: Node = null;

    @property
    speed: number = 100; // Speed in units per second
    
    @property
    distance: number = 5; // Divide by 2 because we move up and down

    @property
    loopTime: number = 10; // Divide by 2 because we move up and down

    currentPosition: Vec3;
    //initPosition: Vec3;
    movingRight: boolean = false;
    movingUp: boolean = false;

    start() {

        this.nodeShakeFeature(this.myNode, 1, 3, this.distance, this.speed, '', this.test.bind(this));
        // this.moveNodeUpDown(this.listOfNodes, false);
    }

    test()
    {
        console.warn("Ready to play next shake anim");
        this.scheduleOnce(() => {
            this.nodeShakeFeature(this.myNode, 0, 5, this.distance, this.speed, '', null);
        }, 3);
;
  
    }

    nodeShakeFeature(nodeToShake, shakeCase, totalShakeDuration, distance, speed, easingType, callback)
    {
        const duration = distance / speed; 

        let initPosition = nodeToShake.getPosition();
        tween(nodeToShake)
            .to(duration, { 
                position: new Vec3( initPosition.x,  initPosition.y, 0),
            }, { easing: easingType})

            .call(() => {

                ///Shake case: 0: left-right, 1: up-down, 2: randomly
                switch(shakeCase) {
                    case 0: {
                        this.shakeLeftRight(nodeToShake, totalShakeDuration, easingType, 0, initPosition, callback);
                        break;
                    }
                    case 1: {
                        this.shakeUpDown(nodeToShake, totalShakeDuration, easingType, 0, initPosition, callback);
                        break;
                    }
                    case 2: {
                        this.shakeRandomly(nodeToShake, totalShakeDuration, easingType, 0, initPosition, callback);
                        break;
                    }

                }

            })
        .start();
    }

    shakeLeftRight(nodeToShake, totalShakeDuration, easingType, nodeShakeTime, initPosition, callback)
    {
        let min = -this.distance;
        let max =  this.distance;

        let duration = this.distance / this.speed; 
        let randPos = Math.floor(Math.random() * (max - min + 1)) + min;

        nodeShakeTime ++;
        
        tween(nodeToShake)
            .to(duration, { 
                position: new Vec3(initPosition.x - randPos, initPosition.y, 0),
            }, { easing: easingType })

            .call(() => {
                console.warn("timer", min, max, nodeShakeTime, duration* nodeShakeTime);
           
                let totalDuration = duration* nodeShakeTime;
                if(totalDuration >= totalShakeDuration)
                {
                    nodeToShake.setPosition(initPosition.x, initPosition.y, initPosition.z);
                    if (callback) {

                        callback(); // Invoke the callback function when shaking completes
                    }
                    return;
                }
                this.shakeLeftRight(nodeToShake, totalShakeDuration, easingType, nodeShakeTime, initPosition, callback);
            
            })
        .start();

    }

    shakeUpDown(nodeToShake, totalShakeDuration, easingType, nodeShakeTime, initPosition, callback)
    {
        let min = -this.distance;
        let max =  this.distance;

        let duration = this.distance / this.speed; 
        let randPos = Math.floor(Math.random() * (max - min + 1)) + min;

          nodeShakeTime ++;

        tween(nodeToShake)
            .to(duration, { 
                position: new Vec3(initPosition.x, initPosition.y - randPos, 0),
            }, { easing: 'sineInOut' })

            .call(() => {

                console.warn("timer", min, max, nodeShakeTime, duration* nodeShakeTime);
           
                let totalDuration = duration* nodeShakeTime;
                if(totalDuration >= totalShakeDuration)
                {
                    nodeToShake.setPosition(initPosition.x, initPosition.y, initPosition.z);
                    if (callback) {

                        callback(); // Invoke the callback function when shaking completes
                    }
                    return;
                }
                this.shakeUpDown(nodeToShake, totalShakeDuration, easingType, nodeShakeTime, initPosition, callback);
            
            })
        .start();

    }

    shakeRandomly(nodeToShake, totalShakeDuration, easingType, nodeShakeTime, initPosition, callback)
    {
        let minX = -this.distance;
        let maxX =  this.distance;


        let randPosX = Math.floor(Math.random() * (maxX - minX + 1)) + minX;

        let minY = -this.distance/2;
        let maxY =  this.distance/2;
        let randPosY = Math.floor(Math.random() * (maxY - minY + 1)) + minY;

        let duration = this.distance / this.speed; 
        nodeShakeTime ++;

        tween(nodeToShake)
            .to(duration, { 
                position: new Vec3(initPosition.x + randPosX, initPosition.y - randPosY, 0),
            }, { easing: easingType })

            .call(() => {

                console.warn("timer", nodeShakeTime, duration* nodeShakeTime);
                let totalDuration = duration* nodeShakeTime;
                if(totalDuration >= totalShakeDuration)
                {
                    nodeToShake.setPosition(initPosition.x, initPosition.y, initPosition.z);
                    if (callback) {

                        callback(); // Invoke the callback function when shaking completes
                    }
                    return;
                }
                this.shakeRandomly(nodeToShake, totalShakeDuration, easingType, nodeShakeTime, initPosition, callback);
            
            })
        .start();

    }
    
    ///-----------
    ///Testing reference
    // moveNodeUpDown(listOfNodesToShake, isDelayNodeByNode) {

    //     let delay = 0;
    //     let shakeDelay = 3;

    //     listOfNodesToShake.forEach((node, index) => {
       
    //         const duration = this.distance / this.speed; // Calculate duration based on speed and distance
    //         let originalPos: Vec3 = new Vec3();  // Original position of the node
    //         // Store the original position of the node
    //         originalPos.set(node.position);


    //         if(isDelayNodeByNode == true)
    //         {
    //             this.scheduleOnce(() => {

    //                 //Shake
    //                 let a = tween(node);

    //                 // if >0 a.delay()

    //                     a.to(duration, { 
    //                         position: new Vec3(node.position.x + this.distance, node.position.y, 0),
    //                     }, { easing: 'sineInOut' })
    //                     .to(duration, { 
    //                         position: new Vec3(node.position.x -this.distance, node.position.y, 0), 
    //                     }, { easing: 'sineInOut' })
    //                     // .to(duration, { 
    //                     //     position: new Vec3(node.position.x, node.position.y + this.distance, 0),
    //                     // }, { easing: 'sineInOut' })
    //                     // .to(duration, { 
    //                     //     position: new Vec3(node.position.x, node.position.y -this.distance, 0), 
    
    //                     // }, { easing: 'sineInOut' })
    //                     .to(duration, { position: node.position })
    //                     .union()
    //                     .repeat(10)
    //                     .call(() => {
    //                         console.warn("AAAAAAAAAAAAAAAAAAAAA", index);
    //                     })
    //                 .start();
    
    //             }, delay);
    
    //             delay += shakeDelay; // Increment delay for the next node
    //         }
    //         else
    //         {
    //             ///Shake
    //             // tween(node)
    //             //     .to(duration, { 
    //             //         position: new Vec3(node.position.x + this.distance, node.position.y, 0),
    //             //     }, { easing: 'sineInOut' })
    //             //     .to(duration, { 
    //             //         position: new Vec3(node.position.x -this.distance, node.position.y, 0), 
    //             //     }, { easing: 'sineInOut' })
    //             //     .to(duration, { 
    //             //         position: new Vec3(node.position.x, node.position.y + this.distance, 0),
    //             //     }, { easing: 'sineInOut' })
    //             //     .to(duration, { 
    //             //         position: new Vec3(node.position.x, node.position.y -this.distance, 0), 

    //             //     }, { easing: 'sineInOut' })
    //             //     .to(duration, { position: node.position })
    //             //     .repeat(10)
    //             //     .call(() => {
    //             //         console.warn("AAAAAAAAAAAAAAAAAAAAA2", index);
    //             //     })
    //             // .start();
    //         }
   

    //     })
 
    // }

}


