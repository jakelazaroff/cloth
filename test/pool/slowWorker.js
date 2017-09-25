'use strict';

const worker = require('../../lib/worker');

let wait = true;

process.on('message', data => {
  if (data.type === 'go') {
    wait = false;
  }
});

const busyWait = callback => {
  if (wait) {
    setTimeout(() => busyWait(callback), 0);
  } else {
    worker.send('test', 'test');
    callback(null, 'return');
  }
};

// Don't let mocha run this code directly.
if (process.send !== undefined) {
  setTimeout(() => {
    worker.run((command, callback) => {

      worker.send('command', command);

      if (command === 'error') {
        throw new Error();
      }

      wait = command === 'wait';
      busyWait(callback);
    });
  }, 1000);
}