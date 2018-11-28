'use strict';

const getFunctionLocation = require('../index');

let foo = () => {};
function bar() {}

function buildFunction() {
  return function() {};
}

const semver = require('semver');

let GLOBAL_KEYS = Object.keys(global);
QUnit.config.testTimeout = 5000;

QUnit.module('get-function-location', function(hooks) {
  hooks.afterEach(function(assert) {
    assert.deepEqual(Object.keys(global), GLOBAL_KEYS);
  });

  if (semver.lt(process.version, '8.0.0')) {
    QUnit.module('when "inspector" module is not present', function() {
      QUnit.test('does not fail / throw', function(assert) {
        return getFunctionLocation(foo).then(result => {
          assert.strictEqual(result, null);
        });
      });
    });

    // prevent remaining tests from running
    return;
  }

  QUnit.test('works for anonymous functions', function(assert) {
    return getFunctionLocation(buildFunction()).then(location => {
      assert.deepEqual(location, {
        source: `file://${__filename}`,
        line: 9,
        column: 18,
      });
    });
  });

  QUnit.test('works for normal functions', function(assert) {
    return getFunctionLocation(bar).then(location => {
      assert.deepEqual(location, {
        source: `file://${__filename}`,
        line: 6,
        column: 13,
      });
    });
  });

  QUnit.test('works for arrow functions', function(assert) {
    return getFunctionLocation(foo).then(location => {
      assert.deepEqual(location, {
        source: `file://${__filename}`,
        line: 5,
        column: 11,
      });
    });
  });

  QUnit.test('handles concurrent requests without error', function(assert) {
    return Promise.all([getFunctionLocation(foo), getFunctionLocation(bar)]).then(results => {
      assert.deepEqual(results[0], {
        source: `file://${__filename}`,
        line: 5,
        column: 11,
      });

      assert.deepEqual(results[1], {
        source: `file://${__filename}`,
        line: 6,
        column: 13,
      });
    });
  });
});
