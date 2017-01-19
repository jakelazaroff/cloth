'use strict';

// libraries
const serializeError = require('serialize-error');

const _send = (type, message) => {
        process.send({
          type: type,
          message: message
        });
      },

      _sendStart = () => {
        _send('start');
      },

      _sendEnd = (result) => {
        _send('end', result);
      },

      _sendError = (err) => {
        _send('error', serializeError(err));
      };

class Thread {

  constructor () {
    this.arguments = process.argv.slice(2);

    process.on('message', data => {
      const type = data.type,
            message = data.message;

      if (type === 'run') {
        this._start(message);
      }
    });
  }

  _start (command) {
    _sendStart();

    try {
      if (this.run.length === 1) {
        _sendEnd(this.run(command));
      } else {
        this.run(command, (err, result) => {
          if (err) { return _sendError(err); }
          _sendEnd(result);
        });
      }
    } catch (err) {
      _sendError(err);
    }
  }

  run () {
    throw new Error('Thread subclasses must implement run!');
  }

  send (type, message) {
    if (['start', 'end', 'error', '*'].indexOf(type) !== -1) {
      throw new Error(`Event type "${type}" is reserved!`);
    }
    _send(type, message);
  }
}

module.exports = Thread;
