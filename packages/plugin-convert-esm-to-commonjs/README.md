# @putout/plugin-convert-esm-to-commonjs [![NPM version][NPMIMGURL]][NPMURL] [![Dependency Status][DependencyStatusIMGURL]][DependencyStatusURL]

[NPMIMGURL]: https://img.shields.io/npm/v/@putout/plugin-convert-esm-to-commonjs.svg?style=flat&longCache=true
[NPMURL]: https://npmjs.org/package/@putout/plugin-convert-esm-to-commonjs"npm"
[DependencyStatusURL]: https://david-dm.org/coderaiser/putout?path=packages/plugin-convert-esm-to-commonjs
[DependencyStatusIMGURL]: https://david-dm.org/coderaiser/putout.svg?path=packages/plugin-convert-esm-to-commonjs

`putout` plugin adds ability to convert `EcmaScript Modules` to `CommonJS`

## Install

```
npm i @putout/plugin-convert-esm-to-commonjs
```

## Rule

```json
{
    "rules": {
        "convert-esm-to-commonjs": "on"
    }
}
```

## ❌ Incorrect code example

```js
import hello from 'world';
```

## ✅ Correct code Example

```js
const hello = require('world');
```

## License

MIT
