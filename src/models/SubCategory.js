const mongoose = require('mongoose');

const subCategorySchema = new mongoose.Schema({
  language_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Language',
    required: true,
  },
  category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
  super_category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SuperCategory",
    required: true,
  },
  country: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Country",
    required: true,
  },
  order: {
    type: Number,
    required: true,
    default: 0,
  },
}, { timestamps: true });

module.exports = mongoose.model('SubCategory', subCategorySchema);
