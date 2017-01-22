'use strict';

const thread = require('../../lib/thread');

thread.run((command, callback) => {

  if (command === 'error') {
    return callback(new Error());
  }

  callback(null, 'test');
});
