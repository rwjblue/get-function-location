'use strict';

const getFunctionLocation = require('../index');

let foo = () => {};
function bar() {}

function buildFunction() {
  return function() {};
}

let GLOBAL_KEYS = Object.keys(global);
QUnit.config.testTimeout = 5000;

QUnit.module('get-function-location', function(hooks) {
  hooks.afterEach(function(assert) {
    assert.deepEqual(Object.keys(global), GLOBAL_KEYS);
  });

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

  QUnit.test('handles concurrent requests without error', async function(assert) {
    let first = getFunctionLocation(foo);
    let second = getFunctionLocation(bar);

    let firstResult = await first;
    let secondResult = await second;

    assert.deepEqual(firstResult, {
      source: `file://${__filename}`,
      line: 5,
      column: 11,
    });

    assert.deepEqual(secondResult, {
      source: `file://${__filename}`,
      line: 6,
      column: 13,
    });
  });
});
