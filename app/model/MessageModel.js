const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  caseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "cases",
    required: true,
  },

  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },

  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },

  text: {
    type: String,
    required: true,
  },

  type: {
    type: String,
    enum: ["text", "file"],
    default: "text",
  },

  isRead: {
    type: Boolean,
    default: false,
  },

}, { timestamps: true });

// 🔥 IMPORTANT INDEX
MessageSchema.index({ caseId: 1, createdAt: 1 });

module.exports = mongoose.model("messages", MessageSchema);