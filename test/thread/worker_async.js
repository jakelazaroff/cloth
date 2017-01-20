'use strict';

const Thread = require('../../lib/thread');

class Worker extends Thread {

  run (command, callback) {

    if (command === 'error') {
      return callback(new Error());
    }

    callback(null, 'test');
  }

}

new Worker();
