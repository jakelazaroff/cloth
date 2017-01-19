'use strict';

// libraries
const serializeError = require('serialize-error');

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

class Thread {

  constructor () {
    this.arguments = process.argv.slice(2);

    process.on('message', command => {
      _start();

      try {
        if (this.run.length === 1) {
          _end(this.run(command));
        } else {
          this.run(command, (err, result) => {
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
    throw new Error('Thread subclasses must implement run!');
  }

  send (type, message) {
    if (['start', 'end', 'error'].indexOf(type !== -1)) {
      throw new Error(`Event type "${type}" is reserved!`);
    }
    _send(type, message);
  }
}

module.exports = Thread;
