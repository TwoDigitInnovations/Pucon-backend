const mongoose = require('mongoose');

const countrySchema = new mongoose.Schema({
  language_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Language',
    required: true,
  },
  country_name: {
    type: String,
    required: true
    
  },
  country_code: {
    type: String,
    required: true,
    unique: true
  },
  image: {
    type: String,
    default: null
  },
  map_image: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, { timestamps: true });

module.exports = mongoose.model('Country', countrySchema);
