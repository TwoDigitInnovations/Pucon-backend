const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
  language_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Language',
    required: true,
  },
  // country_id: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'Country',
  //   required: true,
  // },
  super_category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SuperCategory',
    required: true,
  },
  category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  sub_category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubCategory',
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
  country: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Country",
    required: true,
  },
  logo: {
    type: String,
    // default: null,
    required: true,
  },
  carouselImage: {
    type: Array,
  }
}, { timestamps: true });

module.exports = mongoose.model('Content', contentSchema);
