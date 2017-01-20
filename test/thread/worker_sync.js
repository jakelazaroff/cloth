'use strict';

const Thread = require('../../lib/thread');

class Worker extends Thread {

  run (command) {

    if (command === 'error') {
      throw new Error();
    }

    this.send('test', 'test');

    try { this.send('start') } catch (e) { this.send('start_error'); }
    try { this.send('end') } catch (e) { this.send('end_error'); }
    try { this.send('error') } catch (e) { this.send('error_error'); }
    try { this.send('*') } catch (e) { this.send('*_error'); }

    return 'test';
  }

}

new Worker();
