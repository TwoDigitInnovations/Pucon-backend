const mongoose = require("mongoose");

// Single settings document that holds the app home (language selection) screen.
const homeScreenSchema = new mongoose.Schema(
    {
        image: {
            type: String,
            default: null
        },
        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active",
        },
    }, { timestamps: true, }
);

module.exports = mongoose.model("HomeScreen", homeScreenSchema);
