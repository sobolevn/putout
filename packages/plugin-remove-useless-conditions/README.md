# @putout/plugin-remove-useless-conditions [![NPM version][NPMIMGURL]][NPMURL] [![Dependency Status][DependencyStatusIMGURL]][DependencyStatusURL]

[NPMIMGURL]: https://img.shields.io/npm/v/@putout/plugin-remove-useless-conditions.svg?style=flat&longCache=true
[NPMURL]: https://npmjs.org/package/@putout/plugin-remove-useless-conditions "npm"
[DependencyStatusURL]: https://david-dm.org/coderaiser/putout?path=packages/plugin-remove-useless-conditions
[DependencyStatusIMGURL]: https://david-dm.org/coderaiser/putout.svg?path=packages/plugin-remove-useless-conditions

`putout` plugin adds ability to remove useless `conditions`.

## Install

```
npm i @putout/plugin-remove-useless-conditions
```

## Rule

```json
{
    "rules": {
        "remove-useless-conditions": "on"
    }
}
```

## ❌ Incorrect code example

```js
if (zone?.tooltipCallback) {
    zone.tooltipCallback(e);
}

if (a)
    alert('hello');
else
    alert('hello');
```

## ✅ Correct code Example

```js
zone?.tooltipCallback(e);

alert('hello');
```

## License

MIT
