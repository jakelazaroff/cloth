'use strict';

// system
const cp = require('child_process'),
      os = require('os'),
      EventEmitter = require('events');
      
// modules
const Task = require('./task');

class Pool extends EventEmitter {

  constructor (path, options) {
    super();
    this.path = path;
    this.options = Object.assign({
      workers: os.cpus().length,
      arguments: []
    }, options);

    this.workers = {};
    this.idle = [];
    this.tasks = [];
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

    // Wait for child to be ready to receive messages.
    var self = this;
    child.on('message', function readyListener(msg) {
      if (msg.type === 'ready') {
        child.removeListener('message', readyListener);
        self._allocate(child.pid);
      }
    });

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
          this.emit(type, task);
        } else {
          this.emit(type, message, task);
        }
      })
      .run(this.workers[pid]);
  }

  _allocate (pid) {
    if (this.tasks.length) {
      this.emit('empty');
      this._start(pid, this.tasks.pop());
    } else {
      this.idle.unshift(pid);
      if (Object.keys(this.workers).length === this.idle.length) {
        // Emit all work is drained.
        this.emit('drain');
      }
    }
  }

  run (command) {
    const task = new Task(command);
    if (this.idle.length) {
      this._start(this.idle.pop(), task);
    } else if (Object.keys(this.workers).length < this.options.workers) {
      this.tasks.unshift(task);
      this._spawn();
    } else {
      // Emit pool workers are saturated.
      this.emit('saturated');
      this.tasks.unshift(task);
    }

    return task;
  }

  drain () {
    this.tasks = [];
    this.removeAllListeners();
    Object.keys(this.workers).forEach(key => {
      this.workers[key].kill();
    });
  }
}

module.exports = Pool;
