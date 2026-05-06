const NotificationModel = require("../model/NotificationModel");

// =========================
// CREATE NOTIFICATION (FIXED)
// =========================
const createNotification = async (userId, title, message, type = "info") => {
  try {
    if (!userId) return;

    await NotificationModel.create({
      userId: userId,
      title,
      message,
      type,
      isRead: false   // ✅ good practice
    });

  } catch (error) {
    console.error("Notification Error:", error.message);
  }
};

module.exports = { createNotification };