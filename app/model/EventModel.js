const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema(
  {

    // Linked Case
    caseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "cases",
      required: true,
    },

    caseCode: {
      type: String,
      required: true,
    },

    // Client
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },

    // Lawyer
    lawyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },

    // Schedule
    scheduleDateTime: {
      type: Date,
      required: true,
    },

    // Priority
    priority: {
      type: String,
      enum: ["High", "Medium", "Normal"],
      default: "Normal",
    },

    // Creator
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },

  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("events", EventSchema);