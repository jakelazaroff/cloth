'use strict';

const worker = require('../../lib/worker');

worker.run((command, callback) => {

  if (command === 'error') {
    return callback(new Error());
  }

  callback(null, 'test');
});
