var fs = require('fs');
var path = require('path');
var browserify = require('browserify');
var deasync = require('deasync');
var resolve = require('resolve');
const mkdirp = require('mkdirp');

// common 模块名称
const COMMON_MODULE_NAME = 'common';
// common 模块路径
const COMMON_MODULE_PATH = fis.project.getProjectPath(path.join('..', COMMON_MODULE_NAME));
// 工作目录
const CWD = process.cwd();

// 当前模块/项目地址
const currentModulePath = fis.project.getProjectPath();
// 当前模块/项目名称
const currentModuleName = fis.media().get('namespace');

function onFileLookUp(info, file, silent, opts) {
  const { isFISID, rest } = info;

  if (isFISID || info.file) {
    return;
  }

  var id = info.rest;
  var isSync = false;

  opts = Object.assign({}, {
    // common模块命名空间，默认为common
    commonModuleName: COMMON_MODULE_NAME,
    // common模块目录，默认为当前模块目录
    commonModulePath: COMMON_MODULE_PATH,

    // browserify 资源存储路径
    commonBrowserify: '/client/browserify/',
  }, opts);

  var tmp = {};

  try {
    let res = resolve.sync(rest, { basedir: CWD });
    const { commonModuleName, commonModulePath, commonBrowserify } = opts;
    // 设置命名空间
    fis.project.setProjectRoot(commonModulePath);
    fis.media().set('namespace', commonModuleName);
    let browserifyFile = path.join(commonModulePath, commonBrowserify, rest + '.js');

    if (fs.existsSync(browserifyFile)) {
      tmp = uri(browserifyFile);
    } else {


      fs.writeFileSync(browserifyFile, '');
      tmp = uri(browserifyFile);
      let module_id = tmp.file.getId();

      var b = browserify();
      b.require(id);
      b.bundle(function (test, chunk) {
        if (!chunk) {
          chunk = '';
        }
        var content = chunk.toString();
        // content = content.substr(8);
        //content = UglifyJS.minify(content);

        fs.open(browserifyFile, 'w', function (err, fd) {
          fs.writeSync(fd, "define('" + module_id + "', function(require, exports, module) {");

          fs.writeSync(fd, 'var mix = ');
          fs.writeSync(fd, content);
          fs.writeSync(fd, 'module.exports = mix(\'' + rest + '\');');

          fs.writeSync(fd, '})');
          isSync = true;
        });
      });

      // 同步输出
      deasync.loopWhile(function () {
        return !isSync;
      });
    }

    tmp.file.moduleId = tmp.file.getId();
    info.file = tmp.file;

  } catch (e) {
    // todo
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

module.exports = function (fis, opts) {
  opts.shutup || fis.on('release:start', function () {
    fis.removeListener('lookup:file', onFileLookUp);
    fis.on('lookup:file', function (info, file, silent) {
      onFileLookUp(info, file, silent, opts);
    });
  });
}
