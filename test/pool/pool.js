'use strict';

// system
const os = require('os');

// libraries
require('chai').should();
const sinon = require('sinon');

// modules
const Pool = require('../../lib/pool');

describe('Pool', () => {

  let pool, path;

  beforeEach(() => {
    path = `${__dirname}/worker`;
  });

  afterEach(() => {
    pool.drain();
  });

  describe('constructor', () => {

    beforeEach(() => {
      sinon.stub(os, 'cpus').returns([{}, {}, {}, {}, {}]);
    });

    afterEach(() => {
      os.cpus.restore();
    });

    it('should default to the number of workers returned by os.cpus()', () => {
      pool = new Pool(path);

      pool.options.workers.should.equal(5);
      os.cpus.should.be.calledOnce;
    });

    describe('options', () => {
      it('should use the number of workers passed in if specified', () => {
        const num = 7;

        pool = new Pool(path, {
          workers: num
        });

        pool.options.workers.should.equal(num);
      });

      it('should pass arguments to the workers', () => {
        const argument = '--test';
        pool = new Pool(path, {
          arguments: [argument]
        });

        Object.keys(pool.workers).forEach(key => {
          pool.workers[key].spawnargs[2].should.equal(argument);
        });
      });
    });
  });

  describe('.run', () => {

    it('should create a new worker if there are no idle workers and fewer workers exist than the worker limit', () => {

      pool = new Pool(path);
      Object.keys(pool.workers).length.should.equal(0);

      pool.run('');

      const workers = Object.keys(pool.workers);

      workers.length.should.equal(1);
      workers.forEach(key => {
        pool.workers[key].spawnargs[1].should.equal(path);
      });
    });

    it('should run the task immediately if there are idle workers', done => {
      pool = new Pool(path, {
        workers: 1
      });

      pool.run('').on('end', () => {
        const task = pool.run('wait');

        task.state.should.equal('processing');
        Object.keys(pool.workers).length.should.equal(1);

        done();
      });
    });

    describe('queue', () => {

      it('should queue the task if every worker is busy', () => {
        pool = new Pool(path, {
          workers: 1
        });

        const task1 = pool.run('wait'),
              task2 = pool.run('test');

        task2.state.should.equal('queued');
        pool.tasks[0].should.equal(task2);
      });

      it('should run a queued task as soon as a worker becomes idle', done => {
        pool = new Pool(path, {
          workers: 1
        });

        const task1 = pool.run('wait'),
              task2 = pool.run('wait').on('start', done);

        task1._send('go');
      });
    });
  });

  describe('.on', () => {

    let task;

    beforeEach(() => {
      pool = new Pool(path, {
        workers: 1
      });
    });

    it('should proxy task "start" events', done => {
      pool.on('start', _task => {
        _task.should.equal(task);
        done();
      });

      task = pool.run('');
    });

    it('should proxy task "end" events', done => {
      pool.on('end', (message, _task) => {
        message.should.equal('return');
        _task.should.equal(task);
        done();
      });

      task = pool.run('');
    });

    it('should proxy task "error" events', done => {
      pool.on('error', (err, _task) => {
        _task.should.equal(task);
        done();
      });

      task = pool.run('error');
    });

    it('should proxy arbitrary events', done => {
      pool.on('test', (message, _task) => {
        message.should.equal('test');
        _task.should.equal(task);
        done();
      });

      task = pool.run('');
    });
  });

  describe('.available()', () => {

    it('should return the number of idle workers', done => {
      pool = new Pool(path, {
        workers: 1
      });

      pool.available().should.equal(1);

      const task = pool.run('wait').on('end', () => {
        pool.available().should.equal(1);
        done();
      });

      pool.available().should.equal(0);
      task._send('go');
    });
  });

  describe('.total()', () => {

    it('should return the total number workers', done => {
      pool = new Pool(path, {
        workers: 1
      });

      pool.total().should.equal(1);

      const task = pool.run('wait').on('end', () => done());

      pool.total().should.equal(1);
      task._send('go');
    });
  });

  describe('.drain()', () => {

    it('should kill all workers', done => {

      pool = new Pool(path, {
        workers: 1
      });

      pool.run('');
      pool.workers[Object.keys(pool.workers)[0]].on('exit', done);

      pool.drain();
    });

    it('should remove all tasks from the queue', () => {
      pool = new Pool(path, {
        workers: 0
      });

      pool.run('');
      pool.drain();
      pool.tasks.length.should.equal(0);
    });
  });
});
