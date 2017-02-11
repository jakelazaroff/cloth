'use strict';

// system
const cp = require('child_process'),
      os = require('os');

// modules
const Task = require('./task');

class Pool {

  constructor (path, options) {
    this.path = path;
    this.options = Object.assign({
      workers: os.cpus().length,
      arguments: []
    }, options);

    this.workers = {};
    this.idle = [];
    this.tasks = [];
    this.listeners = {};
  }

  available () {
    const busy = Object.keys(this.workers).length - this.idle.length;
    return this.options.workers - busy;
  }

  total () {
    return this.options.workers;
  }

  _spawn () {
    const child = cp.fork(this.path, this.options.arguments);

    this.workers[child.pid] = child;
    return child.pid;
  }

  _start (pid, task) {
    task
      .on('*', (type, message) => {
        if (type === 'end' || type === 'error') {
          this._allocate(pid);
        }
        if (type === 'start') {
          this._notify(type, task);
        } else {
          this._notify(type, message, task);
        }
      })
      .run(this.workers[pid]);
  }

  _allocate (pid) {
    if (this.tasks.length) {
      this._start(pid, this.tasks.pop());
    } else {
      this.idle.unshift(pid);
    }
  }

  run (command) {
    const task = new Task(command);

    if (this.idle.length) {
      this._start(this.idle.pop(), task);
    } else if (Object.keys(this.workers).length < this.options.workers) {
      this._start(this._spawn(), task);
    } else {
      this.tasks.unshift(task);
    }

    return task;
  }

  drain () {
    this.tasks = [];
    this.listeners = {};
    Object.keys(this.workers).forEach(key => {
      this.workers[key].kill();
    });
  }

  on (type, callback) {
    this.listeners[type] = this.listeners[type] || [];
    this.listeners[type].push(callback);

    return this;
  }

  _notify (type, message, task) {
    (this.listeners[type] || []).forEach(
      listener => listener(message, task)
    );
  }
}

module.exports = Pool;
