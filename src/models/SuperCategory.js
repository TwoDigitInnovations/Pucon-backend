const mongoose = require("mongoose");

const superCategorySchema = new mongoose.Schema(
  {
    language_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Language",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
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
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("SuperCategory", superCategorySchema);
