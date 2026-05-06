const AnnouncementModel = require("../model/AnnouncementModel");

class AnnouncementController {

  // =========================
  // CREATE ANNOUNCEMENT (ADMIN ONLY)
  // =========================
  async CreateAnnouncement(req, res) {
    try {
      const user_id = req.user?._id || req.user?.user_id;
      const role = req.user?.role;

      // 🔒 ROLE CHECK
      if (role !== "admin") {
        return res.status(403).json({
          status: "fail",
          message: "Only admin can add announcements",
        });
      }

      const { title, message } = req.body;

      // 🔍 VALIDATION
      if (!title || !message) {
        return res.status(400).json({
          status: "fail",
          message: "Title and message are required",
        });
      }

      const newAnnouncement = await AnnouncementModel.create({
        title,
        message,
        createdBy: user_id,
      });

      return res.status(201).json({
        status: "success",
        message: "Announcement created successfully",
        data: newAnnouncement,
      });

    } catch (error) {
      return res.status(500).json({
        status: "fail",
        message: error.message,
      });
    }
  }

  // =========================
  // GET ALL ANNOUNCEMENTS (ALL USERS)
  // =========================
  async GetAnnouncements(req, res) {
    try {
      const announcements = await AnnouncementModel.find()
        .populate("createdBy", "fullName role")
        .sort({ createdAt: -1 });

      return res.status(200).json({
        status: "success",
        data: announcements,
      });

    } catch (error) {
      return res.status(500).json({
        status: "fail",
        message: error.message,
      });
    }
  }

  // =========================
  // DELETE ANNOUNCEMENT (ADMIN ONLY)
  // =========================
  async DeleteAnnouncement(req, res) {
    try {
      const role = req.user?.role;

      // 🔒 ROLE CHECK
      if (role !== "admin") {
        return res.status(403).json({
          status: "fail",
          message: "Only admin can delete announcements",
        });
      }

      const { id } = req.params;

      const deleted = await AnnouncementModel.findByIdAndDelete(id);

      if (!deleted) {
        return res.status(404).json({
          status: "fail",
          message: "Announcement not found",
        });
      }

      return res.status(200).json({
        status: "success",
        message: "Announcement deleted successfully",
      });

    } catch (error) {
      return res.status(500).json({
        status: "fail",
        message: error.message,
      });
    }
  }
}

module.exports = new AnnouncementController();