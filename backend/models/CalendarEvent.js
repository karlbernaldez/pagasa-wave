import mongoose from 'mongoose';

const { Schema } = mongoose;

export const CALENDAR_EVENT_TYPES = Object.freeze([
  'meeting',
  'maintenance',
  'training',
  'reminder',
  'deployment',
  'other',
]);

export const CALENDAR_EVENT_STATUSES = Object.freeze(['scheduled', 'completed', 'cancelled']);

const CalendarEventSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, trim: true, maxlength: 2000, default: '' },
    type: { type: String, enum: CALENDAR_EVENT_TYPES, required: true },
    status: {
      type: String,
      enum: CALENDAR_EVENT_STATUSES,
      default: 'scheduled',
      required: true,
    },
    allDay: { type: Boolean, default: false },
    startsAt: { type: Date, required: true, index: true },
    endsAt: { type: Date, default: null },
    ownerLabel: { type: String, trim: true, maxlength: 120, default: '' },
    location: { type: String, trim: true, maxlength: 240, default: '' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    deletedAt: { type: Date, default: null, index: true },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

CalendarEventSchema.index({ deletedAt: 1, startsAt: 1 });
CalendarEventSchema.index({ type: 1, startsAt: 1 });

CalendarEventSchema.pre('validate', function validateRange(next) {
  if (this.endsAt && this.startsAt && this.endsAt < this.startsAt) {
    this.invalidate('endsAt', 'endsAt must be greater than or equal to startsAt');
  }
  next();
});

export default mongoose.models.CalendarEvent ||
  mongoose.model('CalendarEvent', CalendarEventSchema);
