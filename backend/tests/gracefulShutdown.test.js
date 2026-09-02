import assert from 'node:assert/strict';
import test from 'node:test';

import { createShutdownHandler } from '../services/gracefulShutdown.js';

const createHarness = () => {
  const events = [];
  const exits = [];
  const timers = [];
  let closeCallback;

  const shutdown = createShutdownHandler({
    socketServer: {
      disconnectSockets(closeTransport) {
        events.push(['disconnectSockets', closeTransport]);
      },
    },
    httpServer: {
      close(callback) {
        events.push(['httpClose']);
        closeCallback = callback;
      },
    },
    logger: {
      info(message, metadata) {
        events.push(['info', message, metadata]);
      },
      error(message, metadata) {
        events.push(['error', message, metadata]);
      },
    },
    exit(code) {
      exits.push(code);
    },
    scheduleTimeout(callback, timeoutMs) {
      const timer = {
        callback,
        timeoutMs,
        unrefCalled: false,
        unref() {
          this.unrefCalled = true;
        },
      };
      timers.push(timer);
      return timer;
    },
    cancelTimeout(timer) {
      timer.cancelled = true;
    },
  });

  return {
    events,
    exits,
    shutdown,
    timers,
    close: (error) => closeCallback(error),
  };
};

test('disconnects active Socket.IO transports before closing HTTP', () => {
  const harness = createHarness();

  assert.equal(harness.shutdown('SIGTERM'), true);
  assert.deepEqual(harness.events.slice(1, 3), [
    ['disconnectSockets', true],
    ['httpClose'],
  ]);
  assert.equal(harness.timers[0].timeoutMs, 10_000);
  assert.equal(harness.timers[0].unrefCalled, true);

  harness.close();

  assert.deepEqual(harness.exits, [0]);
  assert.equal(harness.timers[0].cancelled, true);
  assert.equal(
    harness.events.some((event) => event[0] === 'info' && event[1] === 'WaveLab API stopped'),
    true
  );
});

test('reports an HTTP close failure and exits non-zero', () => {
  const harness = createHarness();
  const error = new Error('close failed');

  harness.shutdown('SIGTERM');
  harness.close(error);

  assert.deepEqual(harness.exits, [1]);
  assert.equal(harness.timers[0].cancelled, true);
  assert.equal(
    harness.events.some(
      (event) =>
        event[0] === 'error' &&
        event[1] === 'WaveLab API shutdown failed' &&
        event[2].message === error.message
    ),
    true
  );
});

test('keeps the bounded forced-shutdown failure path', () => {
  const harness = createHarness();

  harness.shutdown('SIGTERM');
  harness.timers[0].callback();
  harness.close();

  assert.deepEqual(harness.exits, [1]);
  assert.equal(
    harness.events.some(
      (event) => event[0] === 'error' && event[1] === 'WaveLab API shutdown timed out'
    ),
    true
  );
});

test('ignores duplicate shutdown signals', () => {
  const harness = createHarness();

  assert.equal(harness.shutdown('SIGTERM'), true);
  assert.equal(harness.shutdown('SIGINT'), false);
  assert.equal(
    harness.events.filter((event) => event[0] === 'disconnectSockets').length,
    1
  );
  assert.equal(harness.timers.length, 1);
});

test('reports a synchronous Socket.IO disconnect failure', () => {
  const exits = [];
  const errors = [];
  const shutdown = createShutdownHandler({
    socketServer: {
      disconnectSockets() {
        throw new Error('disconnect failed');
      },
    },
    httpServer: {
      close() {
        assert.fail('HTTP close must not run after Socket.IO disconnect throws');
      },
    },
    logger: {
      info() {},
      error(message, metadata) {
        errors.push([message, metadata]);
      },
    },
    exit(code) {
      exits.push(code);
    },
  });

  shutdown('SIGTERM');

  assert.deepEqual(exits, [1]);
  assert.equal(errors[0][0], 'WaveLab API shutdown failed');
  assert.equal(errors[0][1].message, 'disconnect failed');
});
