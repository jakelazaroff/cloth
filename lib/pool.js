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

    while (Object.keys(this.workers).length < this.options.workers) {
      const child = cp.fork(this.path, this.options.arguments);

      this.workers[child.pid] = child;
      this.idle.unshift(child.pid);
    }
  }

  available () {
    return this.idle.length;
  }

  total () {
    return Object.keys(this.workers).length;
  }

  _start (pid, task) {
    task
      .on('end', message => {
        this._allocate(pid);
        this._notify('end', message, task);
      })
      .on('error', err => {
        this._allocate(pid);
        this._notify('error', err, task);
      })
      .run(this.workers[pid]);

    this._notify('start', task);
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
    } else {
      const task = new Task(command);

      this.tasks.unshift(task);
    }

    return task;
  }

  drain () {
    this.tasks = [];
    Object.keys(this.workers).forEach(key => {
      this.workers[key].kill();
    });
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

module.exports = Pool;
