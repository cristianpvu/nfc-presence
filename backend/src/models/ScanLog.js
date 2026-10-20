const { Schema, model } = require('mongoose');

const EVENTS = [
  'scan_ok',
  'attendance_ok',
  'link_missing',
  'link_invalid',
  'tag_unknown',
  'no_course',
  'browser_used',
  'seat_taken',
  'token_invalid',
  'course_ended',
  'verify_down',
];

const scanLogSchema = new Schema({
  at: { type: Date, default: Date.now },
  event: { type: String, enum: EVENTS, required: true },
  browserId: String,
  ip: String,
  userAgent: String,
  tagUid: String,
  desk: { type: Schema.Types.ObjectId, ref: 'Desk' },
  course: { type: Schema.Types.ObjectId, ref: 'Course' },
  studentName: String,
  studentId: String,
}, { versionKey: false });

scanLogSchema.index({ at: -1 });
scanLogSchema.index({ event: 1, at: -1 });
scanLogSchema.index({ course: 1, at: -1 });
scanLogSchema.index({ browserId: 1 });
scanLogSchema.index({ studentId: 1 });

module.exports = model('ScanLog', scanLogSchema);
module.exports.EVENTS = EVENTS;
