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
      },

      _start = (callback, command) => {
        _sendStart();

        try {
          if (callback.length === 1) {
            _sendEnd(callback(command));
          } else {
            callback(command, (err, result) => {
              if (err) { return _sendError(err); }
              _sendEnd(result);
            });
          }
        } catch (err) {
          _sendError(err);
        }
      };

module.exports = {

  run: callback => {

    process.on('message', data => {
      const type = data.type,
            message = data.message;

      if (type === 'run') {
        _start(callback, message);
      }
    });
  },

  send: (type, message) => {
    if (['start', 'end', 'error', '*'].indexOf(type) !== -1) {
      throw new Error(`Event type "${type}" is reserved!`);
    }
    _send(type, message);
  },

  arguments: process.argv.slice(2)
};
