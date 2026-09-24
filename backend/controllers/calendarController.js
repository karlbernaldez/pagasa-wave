import asyncHandler from '../utils/asyncHandler.js';
import { throwError } from '../utils/errorHelper.js';
import CalendarEvent, {
  CALENDAR_EVENT_STATUSES,
  CALENDAR_EVENT_TYPES,
} from '../models/CalendarEvent.js';

const MAX_RANGE_DAYS = 370;
const MAX_RANGE_MS = MAX_RANGE_DAYS * 24 * 60 * 60 * 1000;

const normalizeText = (value, maxLength = 2000) =>
  String(value || '')
    .trim()
    .slice(0, maxLength);

const parseDate = (value, label) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throwError(`${label} must be a valid date/time`, 400);
  return date;
};

const parseOptionalDate = (value, label) => {
  if (value === undefined || value === null || value === '') return null;
  return parseDate(value, label);
};

const parseBoolean = (value) => value === true || value === 'true';

function parseEventInput(body = {}, { partial = false } = {}) {
  const patch = {};

  if (!partial || body.title !== undefined) {
    const title = normalizeText(body.title, 160);
    if (!title) throwError('title is required', 400);
    patch.title = title;
  }

  if (!partial || body.type !== undefined) {
    const type = String(body.type || '').trim().toLowerCase();
    if (!CALENDAR_EVENT_TYPES.includes(type)) {
      throwError(`type must be one of: ${CALENDAR_EVENT_TYPES.join(', ')}`, 400);
    }
    patch.type = type;
  }

  if (body.status !== undefined) {
    const status = String(body.status || '').trim().toLowerCase();
    if (!CALENDAR_EVENT_STATUSES.includes(status)) {
      throwError(`status must be one of: ${CALENDAR_EVENT_STATUSES.join(', ')}`, 400);
    }
    patch.status = status;
  }

  if (!partial || body.startsAt !== undefined) {
    patch.startsAt = parseDate(body.startsAt, 'startsAt');
  }

  if (body.endsAt !== undefined) patch.endsAt = parseOptionalDate(body.endsAt, 'endsAt');
  if (body.description !== undefined) patch.description = normalizeText(body.description, 2000);
  if (body.ownerLabel !== undefined) patch.ownerLabel = normalizeText(body.ownerLabel, 120);
  if (body.location !== undefined) patch.location = normalizeText(body.location, 240);
  if (body.allDay !== undefined) patch.allDay = parseBoolean(body.allDay);

  if (patch.startsAt && patch.endsAt && patch.endsAt < patch.startsAt) {
    throwError('endsAt must be greater than or equal to startsAt', 400);
  }

  return patch;
}

function serializeEvent(event) {
  const plain = typeof event?.toObject === 'function' ? event.toObject() : event;
  return {
    id: String(plain._id),
    title: plain.title,
    description: plain.description || '',
    type: plain.type,
    status: plain.status,
    allDay: Boolean(plain.allDay),
    startsAt: plain.startsAt,
    endsAt: plain.endsAt,
    ownerLabel: plain.ownerLabel || '',
    location: plain.location || '',
    createdBy: plain.createdBy || null,
    updatedBy: plain.updatedBy || null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
}

function parseRange(query = {}) {
  const start = parseDate(query.start, 'start');
  const end = parseDate(query.end, 'end');

  if (end <= start) throwError('end must be after start', 400);
  if (end.getTime() - start.getTime() > MAX_RANGE_MS) {
    throwError(`Calendar range cannot exceed ${MAX_RANGE_DAYS} days`, 400);
  }

  return { start, end };
}

export const listCalendarEvents = asyncHandler(async (req, res) => {
  const { start, end } = parseRange(req.query);

  const events = await CalendarEvent.find({
    deletedAt: null,
    startsAt: { $lt: end },
    $or: [{ endsAt: null }, { endsAt: { $gte: start } }],
  })
    .populate('createdBy', 'firstName lastName username email')
    .populate('updatedBy', 'firstName lastName username email')
    .sort({ startsAt: 1, createdAt: 1 })
    .lean();

  res.json({
    events: events.map(serializeEvent),
    range: { start, end },
  });
});

export const createCalendarEvent = asyncHandler(async (req, res) => {
  const patch = parseEventInput(req.body);
  const event = await CalendarEvent.create({
    ...patch,
    status: patch.status || 'scheduled',
    description: patch.description || '',
    ownerLabel: patch.ownerLabel || '',
    location: patch.location || '',
    allDay: patch.allDay || false,
    createdBy: req.user.id,
    updatedBy: req.user.id,
  });

  const populated = await CalendarEvent.findById(event._id)
    .populate('createdBy', 'firstName lastName username email')
    .populate('updatedBy', 'firstName lastName username email');

  res.status(201).json(serializeEvent(populated));
});

export const updateCalendarEvent = asyncHandler(async (req, res) => {
  const event = await CalendarEvent.findOne({ _id: req.params.id, deletedAt: null });
  if (!event) throwError('Calendar event not found', 404);

  const patch = parseEventInput(req.body, { partial: true });
  Object.assign(event, patch, { updatedBy: req.user.id });

  if (event.endsAt && event.startsAt && event.endsAt < event.startsAt) {
    throwError('endsAt must be greater than or equal to startsAt', 400);
  }

  await event.save();

  const populated = await CalendarEvent.findById(event._id)
    .populate('createdBy', 'firstName lastName username email')
    .populate('updatedBy', 'firstName lastName username email');

  res.json(serializeEvent(populated));
});

export const deleteCalendarEvent = asyncHandler(async (req, res) => {
  const event = await CalendarEvent.findOneAndUpdate(
    { _id: req.params.id, deletedAt: null },
    {
      $set: {
        deletedAt: new Date(),
        deletedBy: req.user.id,
        updatedBy: req.user.id,
      },
    },
    { new: true }
  );

  if (!event) throwError('Calendar event not found', 404);
  res.status(204).end();
});
