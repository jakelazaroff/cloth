[![npm](https://img.shields.io/npm/v/cloth.svg)](https://www.npmjs.com/package/cloth) [![Travis](https://img.shields.io/travis/jakelazaroff/cloth.svg)](https://travis-ci.org/jakelazaroff/cloth)

# Cloth

Cloth is a simple thread pool and task queue for Node. It's a lightweight abstraction of Node's `child_process` and `EventEmitter` modules.

```javascript
// index.js

const Pool = require('cloth/pool');

const pool = new Pool(`${__dirname}/worker`);

pool.run('Hello, world!').on('end', message => {
  console.log(message);
});
```

```javascript
// worker.js

const worker = require('cloth/worker');

worker.run(command => {
  console.log(command);
  return 'Goodbye, world!';
});
```

## Getting Started

### Installation:

```bash
npm install cloth --save
```

### Usage:

Instantiate a pool with the path to the worker file:

```javascript
const Pool = require('cloth/pool');

const pool = new Pool(`${__dirname}/worker`);
```

Run

```javascript
const task = pool.run('Hello, world!');
```

The argument we're passing is the task's command. Here, the command is a string, but it can be an array, object or any other serializable data structure.

Since this is the first task we're running, all the workers are idle and the task will be run immediately. If we try to run tasks faster than our workers finish them, tasks will be put into a queue where they'll run as soon as a worker finishes its current task.

What if we want information back from a task? We can listen to events it sends back:

```javascript
task.on('end', message => {
  console.log(message);
});
```

The `end` event occurs when the worker finishes processing the task. But what happens if an error prevents it from finishing?

```javascript
task
  .on('end', message => {
    console.log(message);
  })
  .on('error', err => {
    console.log(err);
  });
```

We can chain together as many `on` calls as we'd like this way — and other than `start`, `end` and `error`, we can have our worker send back custom events as well:

```javascript
task
  .on('end', message => {
    console.log(message);
  })
  .on('error', err => {
    console.log(err);
  })
  .on('test', err => {
    console.log(err);
  });
```

All of which brings us to:

```javascript
// worker.js

const worker = require('cloth/worker');

worker.run(command => {
  console.log(command);
  return 'Goodbye, world!';
});
```

Remember how we instantiated the pool with the path to the worker file? This is that file!

The most important worker method is `run`. Every time the worker picks up a task, the callback supplied to this method is invoked with the task's command. We process the command however we want and return the result, and the worker will take care of sending the results back to the main process:

```javascript
worker.run(command => {
  console.log(command);
  return 'Goodbye, world!';
});
```

If we run into problems, we just have to throw an error and the worker will let the main process know:

```javascript
worker.run(command => {
  if (!command) {
    throw new Error('No command!');
  }
  console.log(command);
  return 'Goodbye, world!';
});
```

If our task is asynchronous, we can add a callback parameter and deal with things in traditional Node style:

```javascript
worker.run((command, callback) => {
  if (!command) {
    callback(new Error('No command!'));
  }
  console.log(command);
  callback(null, 'Goodbye, world!');
});
```

Finally, if we need to, we can also send intermediate results back to the main process:

```javascript
worker.run((command, callback) => {
  if (!command) {
    callback(new Error('No command!'));
  }
  worker.send('test', 'message');
  console.log(command);
  callback(null, 'Goodbye, world!');
});
```

That's the quick intro to Cloth! Check out the API docs below for more information. Happy parallelism!

##API

### Pool

A Pool is the main process's interface to the child processes. It manages the worker pool and task queue to optimize concurrency.

#### constructor(worker, [options])

Creates a new pool with a given worker file. By default, it will create the same number of workers as CPU cores (`require('os').cpus().length`) but this can be overridden in the options.

**options**

- `workers`: the number of workers to create
- `arguments`: an array of string arguments to be sent to each worker as it's created

#### run(command)

Creates a task with the given command to be run as soon as a worker is available. Returns the task.

#### on(event, listener)

Calls the supplied listener with the event message and task whenever an event of the specified type is triggered by any task.

#### total()

Returns the number of workers in the pool.

#### available()

Returns the number of workers in the pool that are not currently processing tasks.

#### drain()

Kills all the worker processes and removes all the tasks from the queue.

### worker

A worker is the children processes' interface to the main process. It invokes a user-defined function to process tasks and manages task lifecycle events and error handling.

#### run(fn)

Invokes the supplied function with the task's command whenever the worker picks up a task. The function signature should be `fn(command, [callback])`. If it doesn't take a callback, returning any value will cause the task to end successfully; if it **does** take a callback, errors can be sent with `callback(err)` and successful results with `callback(null, results)`. Throwing an error will also make the worker send an error back to the main process.

#### send(event, message)

Sends an event with the supplied type and message back to the main process. Any listeners for that event type on either the task or the pool will be triggered.

#### arguments

The arguments passed to the Pool when it was instantiated in the main process.

### Task

A set of instructions that are run as soon as a worker frees up. Tasks are picked up in the order they're sent.

#### on(event, listener)

Calls the supplied listener with the event message and task whenever an event of the specified type is triggered by this specific task.

#### state

The state of a task with regard to the queue; one of four possibilities:

- `queued`: the task hasn't yet been picked up
- `processing`: the task is currently running
- `finished`: the task completed successfully
- `error`: the task couldn't complete because of an error
