'use strict';

const Thread = require('../lib/thread');

class Worker extends Thread {

  constructor () {
    super();

    this.wait = true;

    process.on('message', data => {
      if (data.type === 'go') {
        this.wait = false;
      }
    });
  }

  run (command, callback) {

    if (command === 'error') {
      throw new Error();
    }

    this.wait = command === 'wait';
    this.busyWait(callback);
  }

  busyWait (callback) {
    if (this.wait) {
      setTimeout(() => this.busyWait(callback), 0);
    } else {
      this.send('test');
      callback();
    }
  }

}

new Worker();
