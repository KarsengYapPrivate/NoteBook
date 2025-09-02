System.register(["./application.js"], function (_export, _context) {
  "use strict";

  var Application, canvas, $p, bcr, application;

  function topLevelImport(url) {
    return System["import"](url);
  }

  return {
    setters: [function (_applicationJs) {
      Application = _applicationJs.Application;
    }],
    execute: function () {
      canvas = document.getElementById('GameCanvas');
      $p = canvas.parentElement;
      bcr = $p.getBoundingClientRect();
      canvas.width = bcr.width;
      canvas.height = bcr.height;
      application = new Application();
      topLevelImport('cc').then(function (engine) {
        return application.init(engine);
      }).then(function () {
        return new Promise((resolve) => {
          function loadScript (moduleName, cb) {
            function scriptLoaded () {
                document.body.removeChild(domScript);
                domScript.removeEventListener('load', scriptLoaded, false);
                cb && cb();
            };
            var domScript = document.createElement('script');
            domScript.async = true;
            domScript.src = moduleName;
            domScript.addEventListener('load', scriptLoaded, false);
            document.body.appendChild(domScript);
          }
          
          loadScript("assets/md5_util.js",function () {
            loadScript("assets/web_downloader.js",function () {
              jhec.register_decrypt_downloader({
                _encryptSign : "<_encryptSign>",
                _encryptKey : "<_encryptKey>",
                _needMixFilename : "<_needMixFilename>",
                _nameMixSign : "<_nameMixSign>"
              });
              resolve();
            })
          });
        });
      }).then(function () {
        return application.start();
      })["catch"](function (err) {
        console.error(err);
      });
    }
  };
});