const { Schema, model } = require('mongoose');

const deviceTestSchema = new Schema(
  {
    label: { type: String, required: true, trim: true },
    data: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = model('DeviceTest', deviceTestSchema);
