'use strict';

const worker = require('../../lib/worker');

worker.run((command) => {

  if (command === 'error') {
    throw new Error();
  }

  worker.send('test', 'test');
  worker.send('args', worker.arguments);

  try { worker.send('start') } catch (e) { worker.send('start_error'); }
  try { worker.send('end') } catch (e) { worker.send('end_error'); }
  try { worker.send('error') } catch (e) { worker.send('error_error'); }
  try { worker.send('*') } catch (e) { worker.send('*_error'); }

  return 'test';
});
