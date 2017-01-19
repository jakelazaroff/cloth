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
      this._notify(data.type, data.message);

      if (data.type === 'end' || data.type === 'error') {
        this.state = data.type === 'end' ? 'finished' : 'error';
        this.listeners = Task._initListeners();
        this.thread.removeListener('message', handleMessage);
        this.thread = undefined;
      }
    };

    this.thread.on('message', handleMessage);

    this._send('run', this.command);
    this.state = 'running';
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
