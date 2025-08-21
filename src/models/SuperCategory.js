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
    // description: {
    //   type: String,
    //   default: '',
    // },
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

module.exports = mongoose.model("SuperCategory", superCategorySchema);
