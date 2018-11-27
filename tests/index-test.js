'use strict';

const getFunctionLocation = require('../index');

function foo() {}

QUnit.module('get-function-location', function() {
  QUnit.test('generally works', async function(assert) {
    let location = await getFunctionLocation(foo);

    assert.deepEqual(location, {
      source: __filename,
      line: 5,
      column: 0,
    });
  });
});
