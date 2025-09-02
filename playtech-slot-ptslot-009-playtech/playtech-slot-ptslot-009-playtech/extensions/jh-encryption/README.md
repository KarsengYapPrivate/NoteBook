# jh-encryption
- This product is edited to work for Cocos Creator version 3.8.1.
- This product is not a final version, there might be future work to add new functionality or improve current functionality.
- Current encryption features:
    * web-mobile build
        - most images file format (e.g. png, jpg, ...)
        - most text file format (e.g. json, txt, ...)

## Use procedure
1. Make sure your cocos creator is not open.
2. Copy this folder and paste it into project/extensions/
    - example: testproject123/extensions/jh-encryption
3. Open your testproject123 on Cocos Creator
4. You should find an Encryption tab in the menu bar
    - If the menu bar did not have Encryption, do the following:
        1. In the menu bar, open Extension > Extension Manger 
        2. On top left, select Installed tab
        3. Find jh-encryption and make sure it is toggled on
        4. Restart Cocos Creator
5. In the menu bar, open Encryption > Open Panel
6. Click on Encrypt button and it will process the encryption on your testproject123/build/web-mobile built files

## Changing Config and sign key
- Currently only support editing config through Config.json file.
    - WIP for better preview of config through the editor panel.


