'use strict';

const inspector = require('inspector');
const util = require('util');

let uuid = 0;
let _sessionCompleted = Promise.resolve();

module.exports = async function getFunctionLocation(needle) {
  _sessionCompleted = _sessionCompleted.then(async function() {

    // create a "unique" path so that we can easily reference this object on the global
    let globalPath = `__getFunctionLocation_${++uuid}`;
    global[globalPath] = needle;

    let session = new inspector.Session();
    session.post = util.promisify(session.post);

    try {
      session.connect();

      let scripts = {};
      session.on('Debugger.scriptParsed', result => {
        scripts[result.params.scriptId] = result;
      });

      await session.post('Debugger.enable');

      // in order to get the function location we must have the internal objectId for the function
      let output = await session.post('Runtime.evaluate', {
        expression: `global.${globalPath}`,
        objectGroup: globalPath,
      });

      output = await session.post('Runtime.getProperties', {
        objectId: output.result.objectId,
      });

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
    } finally {
      // ensure that the RemoteObject that we created in `Runtime.evaluate` to
      // use for grabbing the function location is properly released
      await session.post('Runtime.releaseObjectGroup', {
        objectGroup: globalPath,
      });

      session.disconnect();
      delete global[globalPath];
    }
  });

  return _sessionCompleted;
};
