const mongoose = require("mongoose");

const carouselSchema = new mongoose.Schema(
    {
        logo: {
            type: String,
            default: null
        },
        image: {
            type: String,
            default: null
        },
        language_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Language',
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        order: {
            type: Number,
            required: true,
            default: 0,
        },
        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active",
        },
    }, { timestamps: true, }
);

module.exports = mongoose.model("Carousel", carouselSchema);