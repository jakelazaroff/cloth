'use strict';

class Task {

  constructor (command) {
    this.listeners = {};
    this.command = command;
    this.state = 'queued';
  }

  run (thread) {
    this.thread = thread;

    const handleMessage = data => {
      this._notify(data.type, data.message);

      if (data.type === 'end' || data.type === 'error') {
        this.state = data.type === 'end' ? 'finished' : 'error';
        this.thread.removeListener('message', handleMessage);
      }
    };

    this.thread.on('message', handleMessage);

    this.thread.send(this.command);
    this.state = 'processing';
  }

  on (type, callback) {
    this.listeners[type] = this.listeners[type] || [];
    this.listeners[type].push(callback);

    return this;
  }

  _notify (type, message) {
    (this.listeners[type] || []).forEach(listener => listener(message));
  }
}

module.exports = Task;
