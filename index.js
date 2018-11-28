'use strict';

const semver = require('semver');
const util = require('util');

// used to ensure that we only create a single session at a time
let _sessionCompleted = Promise.resolve();
let uuid = 0;

module.exports = function getFunctionLocation(needle) {
  // node versions older than 8 do not support `inspector` module
  // instead of failing "hard" here we resolve with `null`
  if (semver.lt(process.version, '8.0.0')) {
    return Promise.resolve(null);
  }

  /* eslint node/no-unsupported-features/node-builtins: ["error", { "version": ">= 8" } ] */

  _sessionCompleted = _sessionCompleted.then(function() {
    // create a "unique" path so that we can easily reference this object on the global
    let globalPath = `__getFunctionLocation_${++uuid}`;
    global[globalPath] = needle;

    const inspector = require('inspector');

    let session = new inspector.Session();
    session.post = util.promisify(session.post);

    let scripts = {};

    let ensureCleanup = () => {
      return new Promise(resolve => {
        // ensure that the RemoteObject that we created in `Runtime.evaluate` to
        // use for grabbing the function location is properly released
        resolve(
          session.post('Runtime.releaseObjectGroup', {
            objectGroup: globalPath,
          })
        );
      }).then(() => {
        session.disconnect();
        delete global[globalPath];
      });
    };

    return Promise.resolve()
      .then(() => {
        session.connect();

        session.on('Debugger.scriptParsed', result => {
          scripts[result.params.scriptId] = result;
        });

        return session.post('Debugger.enable');
      })
      .then(() => {
        // in order to get the function location we must have the internal objectId for the function
        return session.post('Runtime.evaluate', {
          expression: `global.${globalPath}`,
          objectGroup: globalPath,
        });
      })
      .then(output => {
        return session.post('Runtime.getProperties', {
          objectId: output.result.objectId,
        });
      })
      .then(output => {
        let location = output.internalProperties.find(prop => prop.name === '[[FunctionLocation]]');

        let scriptForNode = scripts[location.value.value.scriptId];

        let source = scriptForNode.params.url;

        // Node 8 does not prefix the source with `file://` (but Node 10 and 11 do)
        // this normalizes to ensure consistent result
        if (!source.startsWith('file://')) {
          source = 'file://' + source;
        }

        return {
          source,
          line: location.value.value.lineNumber + 1,
          column: location.value.value.columnNumber + 1,
        };
      })
      .then(
        value => ensureCleanup().then(() => value),
        error =>
          ensureCleanup().then(() => {
            throw error;
          })
      );
  });

  return _sessionCompleted;
};
