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
    updatedBy: '64f000000000000000000001',
    ...overrides,
  });

test('calendar event accepts a valid scheduled range', async () => {
  const event = validEvent();
  await assert.doesNotReject(() => event.validate());
});

test('calendar event rejects an end before the start', async () => {
  const event = validEvent({
    endsAt: new Date('2026-09-24T07:00:00.000Z'),
  });

  await assert.rejects(
    () => event.validate(),
    (error) => /greater than or equal to startsAt/.test(error?.errors?.endsAt?.message || '')
  );
});

test('calendar event rejects unsupported event types', async () => {
  const event = validEvent({ type: 'holiday' });

  await assert.rejects(
    () => event.validate(),
    (error) => /not a valid enum value/.test(error?.errors?.type?.message || '')
  );
});

test('calendar event requires creator and updater identity', async () => {
  const event = validEvent({ createdBy: undefined, updatedBy: undefined });

  await assert.rejects(
    () => event.validate(),
    (error) => Boolean(error?.errors?.createdBy && error?.errors?.updatedBy)
  );
});
