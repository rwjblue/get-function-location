'use strict';

const inspector = require('inspector');

let uuid = 0;

module.exports = function getFunctionLocation(needle) {
  return new Promise(resolve => {
    let scripts = {};
    let globalPath = `__getFunctionLocation_${++uuid}`;
    global[globalPath] = needle;

    let session = new inspector.Session();

    session.connect();

    session.on('Debugger.scriptParsed', result => {
      scripts[result.params.scriptId] = result;
    });

    session.post('Debugger.enable', () => {
      session.post(
        'Runtime.evaluate',
        {
          expression: `global.${globalPath}`,
        },
        (error, output) => {
          session.post(
            'Runtime.getProperties',
            {
              objectId: output.result.objectId,
            },
            (error, output) => {
              let location = output.internalProperties.find(
                prop => prop.name === '[[FunctionLocation]]'
              );

              let scriptForNode = scripts[location.value.value.scriptId];

              resolve({
                source: scriptForNode.params.url,
                line: location.value.value.lineNumber + 1,
                column: location.value.value.columnNumber + 1,
              });
            }
          );
        }
      );
    });
  });
};
