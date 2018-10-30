# fis3-hook-browserify

> a fis3 hook plugin for page browserify


## usage
> 可以跨模块使用

需要在当前模块下的fis-conf.js文件里配置如下信息：

```
fis.hook('browserify', {
  // 通用模块目录路径，一般模块命名common
  commonModuleRoot: __dirname + '/common',
  // browserify文件存放路径
  browserifyDir: '/client/browserify/',
  // 通用模块命名空间
  commonModuleNs: 'common'
});
```

## 示例

```
var querystring = require('querystring');
console.log(querystring);
```

编译后代码如下：

```
var querystring = require('common:browserify/querystring.js');
console.log(querystring);
```
同时会在common模块下的`browserifyDir`路径生成browserify文件：`querystring.js`

