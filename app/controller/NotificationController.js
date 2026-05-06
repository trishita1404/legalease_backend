const mongoose = require("mongoose");
const NotificationModel = require("../model/NotificationModel");

class NotificationController {

  // =========================
  // GET MY NOTIFICATIONS
  // =========================
  async GetMyNotifications(req, res) {

    try {

      const userId = req.user._id || req.user.id;

      // ✅ HANDLE ADMIN
      if (!mongoose.Types.ObjectId.isValid(userId)) {

        return res.status(200).json({
          status: "success",
          data: []
        });
      }

      const notifications =
        await NotificationModel.find({
          userId: userId
        }).sort({ createdAt: -1 });

      return res.status(200).json({
        status: "success",
        data: notifications
      });

    } catch (error) {

      console.log(error);

      return res.status(500).json({
        status: "fail",
        message: error.toString()
      });
    }
  }

  // =========================
  // MARK AS READ
  // =========================
  async MarkAsRead(req, res) {

    try {

      const userId = req.user._id || req.user.id;

      // ✅ HANDLE ADMIN
      if (!mongoose.Types.ObjectId.isValid(userId)) {

        return res.status(200).json({
          status: "success"
        });
      }

      await NotificationModel.updateMany(
        {
          userId,
          isRead: false
        },
        {
          $set: {
            isRead: true
          }
        }
      );

      return res.status(200).json({
        status: "success",
        message: "Notifications marked as read"
      });

    } catch (error) {

      return res.status(500).json({
        status: "fail",
        message: error.toString()
      });
    }
  }
}

module.exports = new NotificationController();