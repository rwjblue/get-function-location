# get-function-location

A utility function that provides access to a given function's source location.

## Install

```
$ npm install get-function-location
```

## Usage

```js
const getFunctionLocation = require('get-function-location');

function someFunction() {};

let result = await getFunctionLocation(someFunction);

// => { source: 'file:///Users/rjackson/src/rwjblue/get-function-location/this-file.js', line: 3, column: 22 }
```

## Compatibility

This package relies on functionality added in Node 8 to gather function
location information. When using in older Node versions, `getFunctionLocation`
will return a promise that resolves to `null`.

## License

MIT © [Robert Jackson](https://www.rwjblue.com)
