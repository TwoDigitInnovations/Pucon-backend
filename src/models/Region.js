const mongoose = require('mongoose');

const regionSchema = new mongoose.Schema({
  language_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Language',
    required: true,
  },
  region_name: {
    type: String,
    required: true,
    trim: true,
  },
  image: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  order: {
    type: Number,
    required: true,
    default: 0,
  },
}, { timestamps: true });

regionSchema.index({ language_id: 1, region_name: 1 }, { unique: true });

module.exports = mongoose.model('Region', regionSchema);
