const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,

    date: { type: Date, required: true },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },

    role: {
      type: String,
      enum: ["admin", "lawyer"],
    },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("events", EventSchema);