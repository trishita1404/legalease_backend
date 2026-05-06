const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    // 👤 Who will receive the notification
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },

    // 📝 Short title
    title: {
      type: String,
      required: true,
    },

    // 📄 Full message
    message: {
      type: String,
      required: true,
    },

    // 🎨 Type (for UI styling)
    type: {
      type: String,
      enum: ["info", "success", "warning"],
      default: "info",
    },

    // 👁 Read status
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // ✅ gives createdAt automatically
    versionKey: false,
  }
);

const NotificationModel = mongoose.model(
  "notifications",
  NotificationSchema
);

module.exports = NotificationModel;