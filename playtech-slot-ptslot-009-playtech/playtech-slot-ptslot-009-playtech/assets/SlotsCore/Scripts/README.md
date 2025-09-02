# SlotsCore architechture documentation

## Main Game

### GameMaster
- init
- addEventListener(s)
- GameStart (spin)

### GameCorePrototype
- when player click on spin button, dispatch spin clicked event
```
pre_spin() {
    ReelController.InitReels();
}

// when init ready (ReelController should callback to here)
spin() {
    ReelController.spin();
    // emit spin event to server
}

// on spin result event from server
stop_spin(resultData) {
    // handle resultData update to reel
    // calls ReelController.stopSpin(result)
}
 
playResultPresentation() {
    // play big win
    // play symbol animation
    // ...
}
```




## Reel


### ReelController class
- init will be called from GameMaster
```
InitReels () {
    // loop through each Reel and call InitReel()
}
spin() {
    // loop through each Reel and call spinReel()
}
stopSpin(result) {
    // loop through each Reel and call stopReel(result)
}
```


### Reel class
```
InitReel () {
    // call ReelSpinPrototype.InitReel();
}
spinReel () {
    // wait init ready then call
    // call ReelSpinPrototype.StartSpin();
}
stopReel (result) {
    // call ReelSpinPrototype.stopSpin(result);
}
```



### ReelSpinPrototype 
- parent class (abstract class)
- to be extends by all spin controller class
- have these functions to make sure all child class will override it
```
abstract class ReelSpinPrototype {
    abstract InitReel () {}
    abstract StartSpin () {}
    abstract stopSpin (result) {}
}
```



#### Sample for reel spin with dropdown
```
ReelDropDownController extends ReelSpinPrototype {
    InitReel () {
        // spawn reel strip symbols
        // after spawn symbol then call symbol init
        // symbol should include sprite + spine
    }
    StartSpin () {
        // spawn symbol on top
        // dropdown symbol
        // move symbol on bottom to top
    }
    stopSpin (result) {
        // set symbols to result
        // drop result symbols to screen
        // stop spinning
    }
}
```


#### Sample for reel spin with spine
```
ReelSpineSpinController extends ReelSpinPrototype {
    InitReel () {
        // spawn symbol on reel
        // initialize spine animation for spin
    }
    StartSpin () {
        // move symbol down
        // move spine animation to reel
        // run spine spin animation
    }
}
```




## Game State Data 
- collection of events
1. GameStateEvent
2. GameNetworkEvent
3. UIStateEvent

