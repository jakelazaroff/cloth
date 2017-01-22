'use strict';

const thread = require('../../lib/thread');

thread.run((command) => {

  if (command === 'error') {
    throw new Error();
  }

  thread.send('test', 'test');
  thread.send('args', thread.arguments);

  try { thread.send('start') } catch (e) { thread.send('start_error'); }
  try { thread.send('end') } catch (e) { thread.send('end_error'); }
  try { thread.send('error') } catch (e) { thread.send('error_error'); }
  try { thread.send('*') } catch (e) { thread.send('*_error'); }

  return 'test';
});
