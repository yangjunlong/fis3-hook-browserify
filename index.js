var fs = require('fs');
var path = require('path');
var browserify = require('browserify');
var deasync = require('deasync');

function onFileLookUp(info, file, silent, opts) {
  var id = info.rest;
  var isDone = false;

  opts = Object.assign({}, {
  commonModuleRoot: fis.project.getProjectPath(), // common模块目录
  browserifyDir: '/client/browserify/',
  commonModuleNs: 'common', // common模块命名空间
  //isMod: true,

  }, opts);

  if (!silent && /^([a-zA-Z0-9@][a-zA-Z0-9@\.\-_]*)(?:\/([a-zA-Z0-9@\/\.\-_]*))?$/.test(id) && !info.file && !info.isFISID) {
    var commonModuleRoot = opts.commonModuleRoot;
    var commonModuleNs = opts.commonModuleNs;

    var currentModuleDir = fis.project.getProjectPath();
    var currentModuleNs = fis.media().get('namespace');

    commonModuleRoot = path.resolve(commonModuleRoot);

    fis.project.setProjectRoot(commonModuleRoot);
    fis.media().set('namespace', commonModuleNs);

    var browserifyDir = path.resolve(commonModuleRoot + opts.browserifyDir + id + '.js');
    var tmp = {};

    if(fs.existsSync(browserifyDir)) {
      tmp = uri(browserifyDir);
    } else {
      fs.writeFileSync(browserifyDir, '');
      tmp = uri(browserifyDir);

      var b = browserify();
      b.require(id);
      b.bundle(function(test, ret) {
        fs.open(browserifyDir, 'w', function(err, fd){
          fs.writeSync(fd, "define('" + tmp.file.id + "', function(require, exports, module) {");

          fs.writeSync(fd, 'var bundle = ');
          fs.writeSync(fd,ret, 8);
          fs.writeSync(fd, 'module.exports = bundle(\''+id+'\');');

          fs.writeSync(fd, '})');
          isDone = true;
        });
      });

      // 同步输出到文件
      deasync.loopWhile(function() {
        return !isDone;
      });
    }

    fis.project.setProjectRoot(currentModuleDir);
    fis.media().set('namespace', currentModuleNs);

    tmp.file.moduleId = tmp.file.id;
    info.file = tmp.file;

  }
}


function uri(file) {
  var info = fis.util.stringQuote(file),
      qInfo = fis.util.query(info.rest);

  info.query = qInfo.query;
  info.hash = qInfo.hash;
  info.rest = qInfo.rest;

  if (info.rest) {
    info.isFISID = true;

    if (file && fis.util.isFile(file)) {
      info.file = fis.file(file);
    }
  }

  return info;
};

module.exports = function(fis, opts) {
  opts.shutup || fis.on('release:start', function() {
    fis.removeListener('lookup:file', onFileLookUp);
    fis.on('lookup:file', function(info, file, silent) {
      onFileLookUp(info, file, silent, opts);
    });
  });
}
