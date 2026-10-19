const { Schema, model } = require('mongoose');

const roomSchema = new Schema({
  name: { type: String, required: true, unique: true, trim: true },
});

module.exports = model('Room', roomSchema);
