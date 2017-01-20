[![npm](https://img.shields.io/npm/v/cloth.svg)](https://www.npmjs.com/package/cloth) [![Travis](https://img.shields.io/travis/jakelazaroff/cloth.svg)](https://travis-ci.org/jakelazaroff/cloth)

# Cloth

Cloth is a simple thread pool and task queue for Node. It's a lightweight abstraction of Node's `child_process` and `EventEmitter` modules.

```javascript
// index.js

const Pool = require('cloth').Pool;

const pool = new Pool(`${__dirname}/worker`);

pool.run('Hello, world!').on('end', data => {
  console.log(data);
});
```

```javascript
// worker.js

const Thread = require('cloth').Thread;

class Worker extends Thread {
  run (command) {
    console.log(command);
    return 'Goodbye, world!';
  }
}

new Worker();
```

## Getting Started

### Installation:

```bash
npm install cloth --save
```

### Usage:

Instantiate a pool with the path to the worker file:

```javascript
const Pool = require('cloth').Pool;

const pool = new Pool(`${__dirname}/worker`);
```

Run

```javascript
const task = pool.run('Hello, world!');
```

The argument we're passing is the task's command. When the task is picked up by a worker, the worker receives that command as input. Here, the. command is a string, but it can be an array, object or any other data structure.

Since this is the first task we're running, all the workers are idle and the task will be run immediately. If we try to run tasks faster than our workers finish them, tasks will start getting put into a queue, where they'll run as soon as a worker finishes its current task.

What if we want to get information back from a task? We can listen to events it sends back:

```javascript
task.on('end', data => {
  console.log(data);
});
```

The `end` event occurs when the worker finishes processing the task. But what happens if an error prevents it from finishing?

```javascript
task
  .on('end', data => {
    console.log(data);
  })
  .on('error', err => {
    console.log(err);
  });
```

We can chain together as many `on` calls as we'd like this way. Other than `start`, `end` and `error` (which are sent automatically) we can have the worker trigger any events we want.

All of this brings us to:

```javascript
// worker.js

const Thread = require('cloth/thread');

class Worker extends Thread {
  run (command) {
    console.log(command);
    return 'Goodbye, world!';
  }
}

new Worker();
```

Remember how we instantiated the pool with the path to the worker file? This is that file! Let's dive in.

Cloth provides a base class called Thread for our workers. We extend that class with a class called Worker (or whatever other name we want), and then instantiate it.

In our subclass, there's one method we have to override: `run`, which gets called with a command every time the worker picks up a task. We process the command however we want and return the result, and the worker will take care of the event.

If we encounter an error while we're processing, all we have to do is throw an error and the worker will take care of the error event:

```javascript
run (command) {
  if (!command) {
    throw new Error('No command!');
  }
  console.log(command);
  return 'Goodbye, world!';
}
```

If our task is asynchronous, we can add a callback parameter and deal with things in normal Node style:

```javascript
run (command, callback) {
  if (!command) {
    callback(new Error('No command!'));
  }
  console.log(command);
  callback(null, 'Goodbye, world!');
}
```

##API

### Pool

A Pool is the main program's interface to Cloth. It manages the worker pool and task queue.

#### constructor(worker, [options])

Creates a new pool with a given worker file. By default, it will create the same number of workers as CPU cores (`require('os').cpus().length`) but this can be overridden in the options.

**options**

- `workers`: the number of workers to create
- `arguments`: an array of string arguments to be sent to each worker on creation as `process.argv`

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

### Thread

A Thread is the workers' interface to Cloth. It manages lifecycle events and error handling, and provides a method for the worker to process tasks. This should be subclassed in the worker file.

#### run(command, [callback])

Gets called with the task's command whenever the worker picks up a task. It must always be overridden (the Thread implementation of this method will throw an error). If this method doesn't take a callback, returning any value will cause the task to end successfully; If this method **does** take a callback, errors can be sent with `callback(err)` and successful results with `callback(null, results)`. Throwing an error will also make the worker send an error back to the main process.

#### send(event, message)

Sends an event with the supplied type and message back to the main process. Any listeners for that event type on either the task or the pool will get triggered.

### Task

A set of instructions that get run as soon as a worker frees up. Tasks are picked up in the order they're sent.

#### on(event, listener)

Calls the supplied listener with the event message and task whenever an event of the specified type is triggered by this specific task.

#### state

One of four possibilities:

- `queued`: the task hasn't yet been picked up
- `processing`: the task is currently running
- `finished`: the task completed successfully
- `error`: the task couldn't complete because of an error
