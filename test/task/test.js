'use strict';

const Task = require('../../lib/task');

describe('Task', () => {

  describe('constructor', () => {

    it('should set its command', () => {
      const command = 'test';
      new Task(command).command.should.equal(command);
    });

    it('should set its state to "queued"', () => {
      new Task().state.should.equal('queued');
    });
  });
});
