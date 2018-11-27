'use strict';

const inspector = require('inspector');
const util = require('util');

let uuid = 0;

module.exports = async function getFunctionLocation(needle) {
  let scripts = {};
  let globalPath = `__getFunctionLocation_${++uuid}`;
  global[globalPath] = needle;

  let session = new inspector.Session();
  session.post = util.promisify(session.post);

  session.connect();

  session.on('Debugger.scriptParsed', result => {
    scripts[result.params.scriptId] = result;
  });

  await session.post('Debugger.enable');

  let output = await session.post('Runtime.evaluate', {
    expression: `global.${globalPath}`,
  });

  output = await session.post('Runtime.getProperties', {
    objectId: output.result.objectId,
  });

  let location = output.internalProperties.find(prop => prop.name === '[[FunctionLocation]]');

  let scriptForNode = scripts[location.value.value.scriptId];

  return {
    source: scriptForNode.params.url,
    line: location.value.value.lineNumber + 1,
    column: location.value.value.columnNumber + 1,
  };
};
