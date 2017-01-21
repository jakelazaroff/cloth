'use strict';

const cp = require('child_process');

const Task = require('../../lib/task');

describe('Task', () => {

  let thread;

  beforeEach(() => {
    thread = cp.fork(`${__dirname}/worker`);
  });

  afterEach(() => {
    thread.kill();
  });

  describe('constructor', () => {

    it('should set its command', () => {
      const command = 'test';
      new Task(command).command.should.equal(command);
    });

    it('should set its state to "queued"', () => {
      const command = 'test';
      new Task(command).state.should.equal('queued');
    });
  });

  describe('.run', () => {

    let task;

    it('should send the command to the thread', done => {
      task = new Task('wait');
      task.on('command', message => {
        message.should.equal('wait');
        done();
      });
      task.run(thread);
    });
  });

  describe('.state', () => {

    let task;

    it('should be "processing" while the thread is running', () => {
      task = new Task('wait');
      task.run(thread);
      task.state.should.equal('processing');
    });

    it('should be "finished" when done running', () => {
      task = new Task('');
      task.on('end', () => {
        task.state.should.equal('finished');
      });
      task.run(thread);
    });

    it('should be "error" when it results in an error', () => {
      task = new Task('error');
      task.on('error', () => {
        task.state.should.equal('error');
      });
      task.run(thread);
    });
  });

  describe('.on', () => {

    let task;

    it('should send task "start" events', done => {
      task = new Task('');
      task.on('start', done);

      task.run(thread);
    });

    it('should send task "end" events', done => {
      task = new Task('');
      task.on('end', message => {
        message.should.equal('return');
        done();
      });

      task.run(thread);
    });

    it('should send task "error" events', done => {
      task = new Task('error');
      task.on('error', () => done());

      task.run(thread);
    });

    it('should send arbitrary events', done => {
      task = new Task('');
      task.on('test', message => {
        message.should.equal('test');
        done();
      });

      task.run(thread);
    });
  });
});
