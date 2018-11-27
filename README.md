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

getFunctionLocation(someFunction);
// => { source: 'file:///Users/rjackson/src/rwjblue/get-function-location/this-file.js', line: 3, column: 22 }
```

## License

MIT © [Robert Jackson](https://www.rwjblue.com)
