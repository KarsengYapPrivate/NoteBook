let Fs = require('fs');
let Path = require('path');

let buildFolderPath = null;
let encryptSign = "";
let encryptKey = "";
let needMixFilename = "";
let nameMixSign = "";

// Copy md5 util into built game folder
function copyMD5() {
    let fromPath = Path.join(__dirname, "../res/md5_util.js");
    let toPath = Path.join(buildFolderPath,"assets","md5_util.js");
    
    Fs.copyFile(fromPath, toPath, function (err) {
        if (err) console.error("Failed to copy md5_util.js - error:", err);
    });
}

// Copy web downloader util into built game folder
function copyWebDownloader() {
    let fromPath = Path.join(__dirname, "../res/web_downloader.js");
    let toPath = Path.join(buildFolderPath,"assets","web_downloader.js");

    Fs.copyFile(fromPath,toPath,function (err) {
        if (err) console.error("Failed to copy web_downloader.js - error:", err);
    });
}

// Edit index.js to inject decryption downloader and replace into built folder
function copyIndex() {
    let fromPath = Path.join(__dirname, "../res/index.js");
    let toPath = Path.join(buildFolderPath,"index.js");

    let fileStr = Fs.readFileSync(fromPath,"utf-8");
    
    fileStr = fileStr.replace("\"<_encryptSign>\"", `"${encryptSign}"`);
    fileStr = fileStr.replace("\"<_encryptKey>\"", `"${encryptKey}"`);
    fileStr = fileStr.replace("\"<_needMixFilename>\"", needMixFilename);
    fileStr = fileStr.replace("\"<_nameMixSign>\"", `"${nameMixSign}"`);

    Fs.writeFileSync(toPath, fileStr);
}

module.exports = function applyWeb({_buildFolderPath,_encryptSign,_encryptKey,_needMixFilename,_nameMixSign}) {
    buildFolderPath = _buildFolderPath;
    encryptSign = _encryptSign;
    encryptKey = _encryptKey;
    needMixFilename = _needMixFilename;
    nameMixSign = _nameMixSign;

    copyMD5();
    copyWebDownloader();
    copyIndex();
}