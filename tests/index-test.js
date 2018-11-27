'use strict';

const getFunctionLocation = require('../index');

let foo = () => {};
function bar() {}

function buildFunction() {
  return function() {};
}

QUnit.module('get-function-location', function() {
  QUnit.test('works for anonymous functions', async function(assert) {
    let location = await getFunctionLocation(buildFunction());

    assert.deepEqual(location, {
      source: `file://${__filename}`,
      line: 9,
      column: 18,
    });
  });
  QUnit.test('works for normal functions', async function(assert) {
    let location = await getFunctionLocation(bar);

    assert.deepEqual(location, {
      source: `file://${__filename}`,
      line: 6,
      column: 13,
    });
  });

  QUnit.test('works for arrow functions', async function(assert) {
    let location = await getFunctionLocation(foo);

    assert.deepEqual(location, {
      source: `file://${__filename}`,
      line: 5,
      column: 11,
    });
  });
});
