'use strict';

// system
const cp = require('child_process');

describe('Worker', () => {

  let worker;

  afterEach(() => {
    worker.kill();
  });

  const on = (type, callback) => worker.on('message', data => {
    if (data.type === type) {
      callback(data.message);
    }
  });

  const send = (type, message) => worker.send({
    type: type,
    message: message
  });

  describe('run', () => {

    it('should send a "start" message when it starts running', done => {
      worker = cp.fork(`${__dirname}/worker_sync`);
      on('start', () => done());
      send('run', '');
    });

    describe('synchronous', () => {

      beforeEach(() => {
        worker = cp.fork(`${__dirname}/worker_sync`);
      });

      it('should send an "end" with the return value', done => {
        on('end', message => {
          message.should.equal('test');
          done()
        });
        send('run', '');
      });

      it('should send an "error" if it throws an error', done => {
        on('error', () => {
          done()
        });
        send('run', 'error');
      });
    });

    describe('asynchronous', () => {

      beforeEach(() => {
        worker = cp.fork(`${__dirname}/worker_async`);
      });

      it('should send an "end" if called back with no error', done => {
        on('end', message => {
          message.should.equal('test');
          done()
        });
        send('run', '');
      });

      it('should send an "error" if called back with an error', done => {
        on('error', () => {
          done()
        });
        send('run', 'error');
      });
    });
  });

  describe('send', () => {

    beforeEach(() => {
      worker = cp.fork(`${__dirname}/worker_sync`);
    });

    it('should send a message back to the parent', done => {
      on('test', message => {
        message.should.equal('test');
        done();
      });
      send('run', '');
    });

    it('should not let messages with types "start", "end", "error" or "*" be sent', done => {
      let remaining = 4;
      const handleError = () => --remaining || done();

      on('start_error', handleError);
      on('end_error', handleError);
      on('error_error', handleError);
      on('*_error', handleError);

      send('run', '');

    });
  });

  describe('arguments', () => {

    let args;

    beforeEach(() => {
      args = ['testarg', 'testarg2'];
      worker = cp.fork(`${__dirname}/worker_sync`, args);
    });

    it('should set thread.arguments', done => {
      on('args', message => {
        message.should.eql(args);
        done();
      });
      send('run', '');
    });
  });

});
