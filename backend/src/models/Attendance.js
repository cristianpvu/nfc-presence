const { Schema, model } = require('mongoose');

const attendanceSchema = new Schema(
  {
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    desk: { type: Schema.Types.ObjectId, ref: 'Desk', required: true },
    studentName: { type: String, required: true, trim: true },
    studentId: { type: String, required: true, trim: true },
    deviceId: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

attendanceSchema.index({ course: 1, desk: 1 }, { unique: true });
attendanceSchema.index({ course: 1, deviceId: 1 }, { unique: true });

module.exports = model('Attendance', attendanceSchema);
