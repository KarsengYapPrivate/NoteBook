let Fs = require('fs');
let Path = require('path');
require("../res/md5_util");

/**ArrayBuffer加密解密 */
class EncryptTool{
    constructor(encryptKey,encryptSign){
        this.setKeySign(encryptKey,encryptSign);
    }

    encryptSign = "";
    encryptKey = "";
    setKeySign(encryptKey,encryptSign){
        this.encryptKey = encryptKey;
        this.encryptSign = encryptSign;
    }

    strToBytes(str){
        let size = str.length;
        let result = [];
        for(let i=0;i<size;i++){
            result.push(str.charCodeAt(i));
        }
        return result;
    }
    
    checkIsEncrypted(arrbuf,sign=this.encryptSign) {
        if(!sign){
            return false;
        }
        
        let signBuf = new Uint8Array(this.strToBytes(sign));
        let buffer = new Uint8Array(arrbuf);
        for(let i=0;i<signBuf.length;i++){
            if(buffer[i]!=signBuf[i]){
                return false;
            }
        }
        return true
    }
    
    encodeArrayBuffer(arrbuf,sign=this.encryptSign,key=this.encryptKey) {
        if(this.checkIsEncrypted(arrbuf,sign)){
            return
        }
        let signBuf = new Uint8Array(this.strToBytes(sign));
        let keyBytes = this.strToBytes(key)
        let buffer = new Uint8Array(arrbuf);
        
        let _outArrBuf = new ArrayBuffer(signBuf.length+buffer.length)
        let outBuffer = new Uint8Array(_outArrBuf)
        for(let i=0;i<signBuf.length;i++){
            outBuffer[i] = signBuf[i]
        }
        let idx = 0;
    
        for(let i=0;i<buffer.length;i++){
            let b = buffer[i];
            let eb = b^keyBytes[idx]
            if(++idx>=keyBytes.length){
                idx = 0
            }
            outBuffer[signBuf.length+i] = eb
        }
        
        return outBuffer;
    }
    
    decodeArrayBuffer(arrbuf,sign=this.encryptSign,key=this.encryptKey){
        if(!this.checkIsEncrypted(arrbuf,sign)){
            return arrbuf;
        }
        let signBuf = new Uint8Array(this.strToBytes(sign));
        let keyBytes = this.strToBytes(key);
        let buffer = new Uint8Array(arrbuf);
    
        let size = buffer.length-signBuf.length;
        let _outArrBuf = new ArrayBuffer(size)
        let outBuffer = new Uint8Array(_outArrBuf)
        let idx = 0;
        for(let i=0;i<size;i++){
            let b = buffer[signBuf.length+i];
            let db = b^keyBytes[idx]
            if(++idx>=keyBytes.length){
                idx = 0
            }
            outBuffer[i] = db;
        }
    
        return outBuffer;
    }
}

/**构建类型 */
var BuildTypeEnum = {
    web_desktop: 0,
    web_mobile: 1,
    jsb_link: 2,
};


module.exports = class Tools{
    buildType = BuildTypeEnum.web_desktop;
    /**构建目录 */
    buildFolderPath = "";
    /**计数 */
    encryptFinishNum = 0;
    /**加密后缀名排除列表 */
    encrypt_ignore_extList = ["mp3","ogg","wav"];
    /**是否要混淆文件名 */
    needMixFilename = true;
    /**名称混淆后缀名排除列表 */
    changeName_ignore_extList = ["js","jsc"];

    _encryptTool = new EncryptTool();
    constructor({buildType,buildFolderPath,encryptKey,encryptSign,needMixFilename=true,nameMixSign=""}){
        this.buildType = buildType;
        this.buildFolderPath = buildFolderPath;
        this.needMixFilename = needMixFilename;
        this.nameMixSign = nameMixSign;

        this._encryptTool.setKeySign(encryptKey,encryptSign);
        if(this.buildType==BuildTypeEnum.web_desktop||this.buildType==BuildTypeEnum.web_mobile){
            // web build ignore list
            // ignore the other file type for web build
            // only encrypt text and images
            this.encrypt_ignore_extList = [
                "js","jsc",
                "mp3","ogg","wav","m4a",
                "font","eot","ttf","woff","svg","ttc",
                "mp4","avi","mov","mpg","mpeg","rm","rmvb",
                "cconb", // Added .cconb to ignore list because it is one of the core asset file generate by v3
            ];
        }else if(this.buildType==BuildTypeEnum.jsb_link){
            // jsb ignore list
            this.encrypt_ignore_extList = [
                "mp3","ogg","wav","m4a",
            ];
        }
    }

    StartBuild() {
        let assetsPath = Path.join(this.buildFolderPath, "assets")
        this.EncryptDir(assetsPath);
        if(this.buildType==BuildTypeEnum.jsb_link){
            console.log("Encryption - applying jsb encryption");
            require("./apply_jsb")({
                _changeName_ignore_extList  : this.changeName_ignore_extList,
                _buildFolderPath            : this.buildFolderPath,
                _encryptSign                : this._encryptTool.encryptSign,
                _encryptKey                 : this._encryptTool.encryptKey,
                _needMixFilename            : this.needMixFilename,
                _nameMixSign                : this.nameMixSign
            });
            let jsb_adapterPath = Path.join(this.buildFolderPath,"jsb-adapter")
            let srcPath = Path.join(this.buildFolderPath,"src")
            let mainJsPath = Path.join(this.buildFolderPath,"main.js")
            this.EncryptDir(jsb_adapterPath)
            this.EncryptDir(srcPath)
            this.EncryptFile(mainJsPath)
        }else if(this.buildType==BuildTypeEnum.web_desktop||this.buildType==BuildTypeEnum.web_mobile){
            console.log("Encryption - applying web encryption");
            require("./apply_web")({
                _buildFolderPath        : this.buildFolderPath,
                _encryptSign            : this._encryptTool.encryptSign,
                _encryptKey             : this._encryptTool.encryptKey,
                _needMixFilename        : this.needMixFilename,
                _nameMixSign            : this.nameMixSign,
            });
        }
    }

    ChangeName(filePath) {
        if(!this.needMixFilename){
            return filePath;
        }
        let ext = Path.extname(filePath);
        if(this.changeName_ignore_extList.indexOf(ext.slice(1))>=0){
            return filePath;
        }
        let name = Path.basename(filePath);
        let ret = filePath;

        if(name[8]=="-"&&name[13]=="-"&&name[18]=="-"&&name[23]=="-"){
            let md5 = jhec.str_to_md5(name+this.nameMixSign)
            let arr = [8,13,18,23]
            for(let i = arr.length-1;i>=0;i--){
            let idx = arr[i];
            md5 = md5.slice(0, idx) + "-" + md5.slice(idx);
            }
            md5 += ext;

            ret = ret.replace(name.slice(0,2)+"/"+name,md5.slice(0,2)+"/"+md5);
            ret = ret.replace(name.slice(0,2)+"\\"+name,md5.slice(0,2)+"\\"+md5);
            let dir = Path.dirname(ret);

            if(!Fs.existsSync(dir)){
              Fs.mkdirSync(dir)
            }
        }
        // console.log("changeName_", this.nameMixSign || "nil", filePath, "==>>", ret);
        return ret;
    }

    // Encrypt directory
    EncryptDir(dirName){
        if (!Fs.existsSync(dirName)) {
            console.log(`${dirName} 目录不存在`);
            return;
        }
        let files = Fs.readdirSync(dirName);
        files.forEach((fileName) => {
            let filePath = Path.join(dirName, fileName.toString());
            let stat = Fs.statSync(filePath);
            if (stat.isDirectory()) {
                this.EncryptDir(filePath);
            } else {
                this.EncryptFile(filePath)
            }
        });
    }

    // Encrypt file
    EncryptFile(filePath) {
        let ext = Path.extname(filePath);
        if(this.encrypt_ignore_extList.indexOf(ext.slice(1))>=0){
            return;
        }
        
        let newPath = this.ChangeName(filePath)
        let inbuffer = Fs.readFileSync(filePath);

        if(this._encryptTool.checkIsEncrypted(inbuffer)) {
            return;
        }
        
        let outBuffer = this._encryptTool.encodeArrayBuffer(inbuffer);
        Fs.unlinkSync(filePath);
        Fs.writeFileSync(newPath,outBuffer);
        this.encryptFinishNum = this.encryptFinishNum + 1;
    }
}