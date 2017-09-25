'use strict';

const worker = require('../../lib/worker');

// Don't let mocha run this code directly.
if (process.send !== undefined) {
  worker.run((command, callback) => {

    if (command === 'error') {
      return callback(new Error());
    }

    callback(null, 'test');
  });
}