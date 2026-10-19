const { Schema, model } = require('mongoose');

const courseSchema = new Schema({
  name: { type: String, required: true, trim: true },
  room: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
  professor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  startsAt: { type: Date, required: true },
  endsAt: { type: Date, required: true },
});

courseSchema.index({ room: 1, startsAt: 1 });
courseSchema.index({ professor: 1, startsAt: 1 });

module.exports = model('Course', courseSchema);
