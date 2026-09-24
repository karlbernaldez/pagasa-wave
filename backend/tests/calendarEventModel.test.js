import assert from 'node:assert/strict';
import test from 'node:test';

import CalendarEvent from '../models/CalendarEvent.js';

const validEvent = (overrides = {}) =>
  new CalendarEvent({
    title: 'CWA coordination',
    type: 'meeting',
    status: 'scheduled',
    startsAt: new Date('2026-09-24T08:00:00.000Z'),
    endsAt: new Date('2026-09-24T09:00:00.000Z'),
    createdBy: '64f000000000000000000001',
    updatedBy: '64f000000000000000000000001',
    ...overrides,
  });

test('calendar event accepts a valid scheduled range', () => {
  const event = validEvent();
  const error = event.validateSync();
  assert.equal(error, undefined);
});

test('calendar event rejects an end before the start', () => {
  const event = validEvent({
    endsAt: new Date('2026-09-24T07:00:00.000Z'),
  });
  const error = event.validateSync();
  assert.match(error?.errors?.endsAt?.message || '', /greater than or equal to startsAt/);
});

test('calendar event rejects unsupported event types', () => {
  const event = validEvent({ type: 'holiday' });
  const error = event.validateSync();
  assert.match(error?.errors?.type?.message || '', /not a valid enum value/);
});

test('calendar event requires creator and updater identity', () => {
  const event = validEvent({ createdBy: undefined, updatedBy: undefined });
  const error = event.validateSync();
  assert.ok(error?.errors?.createdBy);
  assert.ok(error?.errors?.updatedBy);
});
