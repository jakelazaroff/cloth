'use strict';

// libraries
const serializeError = require('serialize-error');

class Thread {

  constructor () {
    this.arguments = process.argv.slice(2);

    process.on('message', message => {
      _start();

      try {
        if (this.run.length === 1) {
          _end(this.run(message));
        } else {
          this.run(message, (err, result) => {
            if (err) { return _error(err); }
            _end(result);
          });
        }
      } catch (err) {
        _error(err);
      }
    });
  }

  run () {
    throw new Error('Must implement run!');
  }

  send (type, message) {
    if (['start', 'end', 'error'].indexOf(type !== -1)) {
      throw new Error(`Event type "${type}" is reserved!`);
    }
    _send(type, message);
  }
}

const _send = (type, message) => {
        process.send({
          type: type,
          message: message
        });
      },

      _start = () => {
        _send('start');
      },

      _end = (result) => {
        _send('end', result);
      },

      _error = (err) => {
        _send('error', serializeError(err));
      };

module.exports = Thread;
