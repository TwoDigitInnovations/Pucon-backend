const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    language_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Language",
      required: true,
    },
    super_category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SuperCategory",
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
      enum: ["active", "inactive"],
      default: "active",
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
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Category", categorySchema);
