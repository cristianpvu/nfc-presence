const { Schema, model } = require('mongoose');

const manualAttendanceSchema = new Schema(
  {
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    studentName: { type: String, required: true, trim: true },
    studentId: { type: String, trim: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = model('ManualAttendance', manualAttendanceSchema);
