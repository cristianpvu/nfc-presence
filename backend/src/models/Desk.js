const { Schema, model } = require('mongoose');

const deskSchema = new Schema({
  room: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
  label: { type: String, required: true },
  row: { type: Number, required: true },
  col: { type: Number, required: true },
  x: { type: Number },
  y: { type: Number },
  tagUid: { type: String, uppercase: true, unique: true, sparse: true },
});

deskSchema.index({ room: 1, label: 1 }, { unique: true });

module.exports = model('Desk', deskSchema);
