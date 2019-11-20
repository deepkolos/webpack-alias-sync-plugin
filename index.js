const fs = require('fs');
const path = require('path');

class WebpackAliasSyncPlugin {
  constructor(outCfgs = ['js']) {
    // ['js', 'ts', 'jest']
    this.outCfgs = outCfgs;
  }

  apply(complier) {
    complier.hooks.afterResolvers.tap('WebpackAliasSyncPlugin', complation => {
      const {
        resolve: { alias },
        module: { rules },
      } = complation.options;
      const { context: projectRoot } = complation;
      // console.log('TCL: WebpackAliasSyncPlugin -> apply -> alias', alias);
      // console.log(
      // 'TCL: WebpackAliasSyncPlugin -> apply -> projectRoot',
      // projectRoot,
      // );

      if (alias) {
        const paths = this.aliasToPaths(alias, projectRoot);
        // const tsUsed = this.tsUsed(rules);
        this.out('js') && this.writeConfig('js', paths, projectRoot);
        this.out('ts') && this.writeConfig('ts', paths, projectRoot);
        this.out('jest') && this.writeJestConfig(alias, projectRoot);
        // console.log('TCL: WebpackAliasSyncPlugin -> apply -> tsUsed', tsUsed);
        // console.log('TCL: apply -> paths', paths);
      }
    });
  }

  aliasToPaths(alias, root) {
    const { relative, resolve, normalize } = path;
    return Object.keys(alias).reduce((paths, key) => {
      let value = alias[key];
      const isDir = !path.extname(value);
      key = key.endsWith('$') ? key.slice(0, -1) : key;

      if (isDir) {
        key = `${key}\\*`;
        value = relative(root, resolve(root, normalize(value))) + '\\*';
      }

      paths[key.replace(/\\/g, '/')] = [value];
      return paths;
    }, {});
  }

  aliasToJestPaths(alias, root) {
    const { relative, resolve, normalize } = path;
    return Object.keys(alias).reduce((paths, key) => {
      let value = alias[key];
      const isDir = !path.extname(value);
      key = key.endsWith('$') ? key.slice(0, -1) : key;

      if (isDir) {
        key = `^${key}\\/(.*)$`;
        value = `<rootDir>/${relative(
          root,
          resolve(root, normalize(value)),
        )}/$1`;
      }

      paths[key.replace(/\\/g, '/')] = [value];
      return paths;
    }, {});
  }

  out(type) {
    return this.outCfgs.includes(type);
  }

  // tsUsed(rules) {
  //   return (
  //     rules &&
  //     rules.some(({ test }) => {
  //       if (test) {
  //         if (test.test) return test.test('.ts');
  //         if (typeof test.test === 'function') return test.test('.ts');
  //       }
  //     })
  //   );
  // }

  writeConfig(type, paths, root) {
    const configPath = path.resolve(root, `${type}config.json`);
    let config = {};

    if (fs.existsSync(configPath)) {
      try {
        config = require(configPath);
      } catch (error) {
        console.log(`解析${type}config.json错误, 取消写入`);
        return;
      }

      if (config.compilerOptions && config.compilerOptions.paths) {
        const oldPaths = config.compilerOptions.paths;
        const same = Object.keys(paths).every(key => {
          return oldPaths[key] && paths[key][0] === oldPaths[key][0];
        });
        if (same) {
          console.log(`${type}config.json paths已最新`);
          return;
        }
      }
    }

    config.compilerOptions = {
      ...config.compilerOptions,
      baseUrl: '.',
      paths,
    };

    fs.writeFile(configPath, JSON.stringify(config, null, 2), e => {
      console.log(`写入${type}config.json${e ? '失败' : '成功'}`);
    });
  }

  writeJestConfig(alias, root) {
    const paths = this.aliasToJestPaths(alias, root);
    const configPath = path.resolve(root, `jest.config.js`);
    let config = {};

    if (fs.existsSync(configPath)) {
      try {
        config = require(configPath);
      } catch (error) {
        console.log(`解析jest.config.js错误, 取消写入`);
        return;
      }

      if (config.moduleNameMapper) {
        const oldPaths = config.moduleNameMapper;
        const same = Object.keys(paths).every(key => {
          return oldPaths[key] && paths[key][0] === oldPaths[key][0];
        });
        if (same) {
          console.log(`jest.config.js paths已最新`);
          return;
        }
      }
    }

    config.moduleNameMapper = {
      ...config.moduleNameMapper,
      ...paths,
    };

    // 可用性十分有限,还是待定吧
    fs.writeFile(
      configPath,
      `module.exports = ${JSON.stringify(config, null, 2)}`,
      e => {
        console.log(`写入jest.config.json${e ? '失败' : '成功'}`);
      },
    );
  }
}

module.exports = WebpackAliasSyncPlugin;
