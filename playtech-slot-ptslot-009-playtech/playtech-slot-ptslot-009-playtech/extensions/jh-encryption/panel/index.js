"use strict";

let Fs = require('fs');
let Path = require('path');

module.exports = Editor.Panel.define ({
    listeners: {
        show () { console.log('show'); },
        hide () { console.log('hide'); },
    },
    
    template: Fs.readFileSync(Path.join(__dirname, "index.html"), 'utf-8'),
    style: Fs.readFileSync(Path.join(__dirname, "index.css"), 'utf-8'),
    
    $: {
      btn: '#btn',
      buildType:"#buildType",
      buildFolder:"#buildFolder",
      input_encryptKey: "#input_encryptKey",
      input_encryptSign: "#input_encryptSign",
      needMixFilename: "#needMixFilename",
      input_nameMixSign: "#input_nameMixSign",
    },

    // setting to toggle encryption to include file name
    get _needMixFilename () {
      return this.$.needMixFilename.value
    },

    get _nameMixSign () {
      return this.$.input_nameMixSign.value
    },

    get _encryptSign () {
      return this.$.input_encryptSign.value
    },

    get _encryptKey () {
      return this.$.input_encryptKey.value
    },

    get _buildFolder () {
      return this.$.buildFolder.value
    },

    get _buildType () {
      return this.$.buildType.value
    },

    methods: {
      hello () {
          console.log("Hello World!");
      },
      
      _doEncryption () {
        console.log("Encryption - starting -------------------------");
        let configPath = Path.join(__dirname, "config.json");
        let recordFile = JSON.parse(Fs.readFileSync(configPath, "utf8"));
        let config = {
          buildType : recordFile.buildType,
          buildFolderPath : this._getBuildPath (),
          configPath : configPath,
          encryptKey : recordFile.encryptKey,
          encryptSign : recordFile.encryptSign,
          needMixFilename : recordFile.needMixFilename,
          nameMixSign: recordFile.nameMixSign,
        }

        console.log("Encryption - config: ", config);

        let Encrypter = require("./encrypter");
        let tool = new Encrypter(config);
        tool.StartBuild ();
        console.log("Encryption - completed ------------------------");
      },
    
      _getBuildPath () {
        // let buildType = this._buildType;
        let buildFolderPath = Path.join(__dirname, "../../../build");
        // let web_desktopPath = Path.join(buildFolderPath, "web-desktop");
        let web_mobilePath = Path.join(buildFolderPath, "web-mobile");
        // let jsb_linkPath = Path.join(buildFolderPath, "jsb-link");
  
        let buildPath = "";
        // if (buildType == 0) {
        //   buildPath = web_desktopPath;
        // } else if (buildType == 1) {
        //   buildPath = web_mobilePath;
        // } else if (buildType == 2) {
        //   buildPath = jsb_linkPath;
        // }

        // TODO: right now it is hardcoded build path to run web_mobile path only
        buildPath = web_mobilePath;
        return buildPath;
      },
    },

    // method executed when template and styles are successfully loaded and initialized
    ready () {
      this.$.btn.addEventListener('confirm', this._doEncryption.bind(this));
      console.log("Encryption - ready");
    },

    beforeClose () { },

    close () { },
});



