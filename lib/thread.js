'use strict';

// libraries
const serializeError = require('serialize-error');

class Thread {

  constructor () {
    this.arguments = process.argv.slice(2);

    process.on('message', message => {
      this.start();

      try {
        if (this.run.length === 1) {
          this.end(this.run(message));
        } else {
          this.run(message, (err, result) => {
            if (err) { return this.error(err); }
            this.end(result);
          });
        }
      } catch (err) {
        this.error(err);
      }
    });
  }

  run () {
    throw new Error('Must implement run!');
  }

  send (type, message) {
    process.send({
      type: type,
      message: message
    });
  }

  start () {
    this.send('start');
  }

  end (result) {
    this.send('end', result);
  }

  error (err) {
    this.send('error', serializeError(err));
  }
}

module.exports = Thread;
