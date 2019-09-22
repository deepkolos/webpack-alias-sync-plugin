# webpack-alias-sync-plugin

把 webpack alias 配置同步到 jsconfig/tsconfig.json 的插件

目前支持简单的 alias 规则, 目录对应目录, 文件对应文件

# 使用

```shell
> npm i -D webpack-alias-sync-plugin
```

webpack.config.js

```js
const WebpackAliasSyncPlugin = require('webpack-alias-sync-plugin');

module.export = {
  plugins: [new WebpackAliasSyncPlugin()],
};
```

# TODO

1. 兼容完全 webpack resolve 规则
2. 完善单元测试
