const mongoose = require('mongoose');

const languageSchema = new mongoose.Schema({
  language_name: {
    type: String,
    required: true,
  },
  language_code: {
    type: String,
    required: true,
    unique: true,
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
  image: {
    type: String,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('Language', languageSchema);
