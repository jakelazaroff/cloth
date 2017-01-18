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

    it('should create a worker with the given path', () => {

      pool = new Pool(path);

      Object.keys(pool.workers).forEach(key => {
        pool.workers[key].spawnargs[1].should.equal(path);
      });
    });

    it('should default to the number of workers returned by os.cpus()', () => {

      Object.keys(new Pool(path).workers).length.should.equal(5);
    });

    describe('options', () => {
      it('should use the number of workers passed in if specified', () => {
        const num = 7;

        Object.keys(new Pool(path, {
          workers: num
        }).workers).length.should.equal(num);
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

  describe('.available()', () => {

    it('should return the number of idle workers', done => {
      pool = new Pool(path, {
        workers: 1
      });

      pool.available().should.equal(1);

      pool.on('start', () => {
        pool.available().should.equal(0);
      });

      pool.on('end', () => {
        pool.available().should.equal(1);
        done();
      });

      pool.run('');
    });
  });

  describe('.total()', () => {

    it('should return the total number workers', done => {
      pool = new Pool(path, {
        workers: 1
      });

      pool.total().should.equal(1);

      pool.on('start', () => {
        pool.total().should.equal(1);
        done();
      });

      pool.run('');
    });
  });

  describe('.drain()', () => {

    it('should kill all workers', done => {

      pool = new Pool(path, {
        workers: 1
      });

      pool.workers[pool.idle[0]].on('exit', done);

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
