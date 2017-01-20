'use strict';

class Task {

  constructor (command) {
    this.listeners = Task._initListeners();
    this.command = command;
    this.state = 'queued';
  }

  static _initListeners () {
    return {
      '*': []
    };
  }

  run (thread) {
    this.thread = thread;

    const handleMessage = data => {
      if (data.type === 'end' || data.type === 'error') {
        this.state = data.type === 'end' ? 'finished' : 'error';
        this.thread.removeListener('message', handleMessage);

        this._notify(data.type, data.message);

        this.listeners = Task._initListeners();
        this.thread = undefined;
      } else {
        this._notify(data.type, data.message);
      }
    };

    this.thread.on('message', handleMessage);

    this._send('run', this.command);
    this.state = 'processing';
  }

  on (type, callback) {
    this.listeners[type] = this.listeners[type] || [];
    this.listeners[type].push(callback);

    return this;
  }

  _send (type, message) {
    this.thread.send({
      type: type,
      message: message
    });
  }

  _notify (type, message) {
    this.listeners['*'].forEach(listener => listener(type, message));

    (this.listeners[type] || []).forEach(listener => listener(message));
  }
}

module.exports = Task;
