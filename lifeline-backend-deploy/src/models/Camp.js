const mongoose = require("mongoose");

// Camp collection schema used by the Camp API for create, update, list, and interest flows.
const campSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    province: {
      type: String,
      required: true
    },
    district: {
      type: String,
      required: true
    },
    nearestHospital: String,
    location: String,
    address: String,
    googleMapLink: String,
    date: {
      type: String,
      required: true
    },
    startTime: String,
    endTime: String,
    // Status is restricted here so API writes stay within the supported camp lifecycle.
    campStatus: {
      type: String,
      enum: ["UPCOMING", "ONGOING", "ENDED"],
      default: "UPCOMING"
    },
    interestedCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Camp", campSchema);
