# Cocos Creator V3

## Initial Setup
1. Go to https://nodejs.org/en and download the current nodejs version.
2. Install the downloaded nodejs.
3. Open File Explorer and go to the project folder.
    - e.g. C:\Work\Git\playtech-slot
4. Right click on File Explorer empty space and select Open in Terminal option.
5. In the opened Window Powershell terminal from (5), type in "npm install" (without ") and hit enter
6. Open the project with Cocos Creator v3.8.1.
7. Done.

## Test run scene with default code framework
1. Create an empty scene.
2. In the empty scene, add a node name "SlotsCore" under the scene.
3. Under SlotsCore node, create node "GameMaster" and attach script from assets/SlotsCore/core/GameMaster.ts
4. Under SlotsCore node, create node "NetworkController" and attach script from assets/SlotsCore/Network/NetworkController.ts
5. Under SlotsCore node, create node "GameConfig" and attach script from assets/SlotsCore/Model/GameConfig.ts
6. Under SlotsCore node, create node "GameData" and attach script from assets/SlotsCore/Model/GameData.ts
7. Press Play button in editor to test run the scene.
8. You can then inspect the browser and look for logs from GameMaster and NetworkController, which means the scene worked.



