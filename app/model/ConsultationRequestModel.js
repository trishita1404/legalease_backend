const mongoose = require("mongoose");

const ConsultationRequestSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },

    lawyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const ConsultationRequestModel = mongoose.model(
  "consultation_requests",
  ConsultationRequestSchema
);

module.exports = ConsultationRequestModel;