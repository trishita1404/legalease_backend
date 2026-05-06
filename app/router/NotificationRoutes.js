const express = require("express");
const router = express.Router();

const NotificationController = require("../controller/NotificationController");
const AuthMiddleware = require("../middleware/AuthMiddleware");

// =========================
// GET MY NOTIFICATIONS
// =========================
router.get(
  "/my",
  AuthMiddleware,
  NotificationController.GetMyNotifications
);

// =========================
// MARK AS READ
// =========================
router.patch(
  "/mark-read",
  AuthMiddleware,
  NotificationController.MarkAsRead
);

module.exports = router;