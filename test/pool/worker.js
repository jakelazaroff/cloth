'use strict';

const thread = require('../../lib/thread');

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
    thread.send('test', 'test');
    callback(null, 'return');
  }
};

thread.run((command, callback) => {

  thread.send('command', command);

  if (command === 'error') {
    throw new Error();
  }

  wait = command === 'wait';
  busyWait(callback);
});
