const MessageModel = require("../model/MessageModel");
const CaseModel = require("../model/CaseModel");
const UserModel = require("../model/UserModel");
const { createNotification } = require("../helper/NotificationHelper");

class ChatController {

  // ================= SEND MESSAGE =================
  async SendMessage(req, res) {
    try {
      const senderId = req.user._id; // ✅ FIXED (secure)
      const { caseId, text } = req.body;

      if (!caseId || !text) {
        return res.status(400).json({
          status: "fail",
          message: "caseId and text required",
        });
      }

      const caseData = await CaseModel.findById(caseId);

      if (!caseData) {
        return res.status(404).json({
          status: "fail",
          message: "Case not found",
        });
      }

      let receiverId;

      if (caseData.client.toString() === senderId.toString()) {
        receiverId = caseData.lawyer;
      } else if (caseData.lawyer.toString() === senderId.toString()) {
        receiverId = caseData.client;
      } else {
        return res.status(403).json({
          status: "fail",
          message: "Unauthorized",
        });
      }

      // ✅ CREATE MESSAGE
      const message = await MessageModel.create({
        caseId,
        sender: senderId,
        receiver: receiverId,
        text,
      });

      // ✅ UPDATE CASE TIMESTAMP (for chat list sorting)
      await CaseModel.findByIdAndUpdate(caseId, {
        $set: { updatedAt: new Date() }
      });

      // ================= 🔔 NOTIFICATION =================
      const sender = await UserModel.findById(senderId).select("fullName role");

      await createNotification(
        receiverId,
        "New Message",
        `${sender.fullName} sent you a message`,
        "info"
      );

      return res.status(200).json({
        status: "success",
        data: message,
      });

    } catch (error) {
      return res.status(500).json({
        status: "fail",
        message: error.toString(),
      });
    }
  }


  // ================= GET MESSAGES =================
  async GetMessages(req, res) {
    try {
      const userId = req.user._id; // ✅ FIXED
      const { caseId } = req.params;

      const caseData = await CaseModel.findById(caseId);

      if (!caseData) {
        return res.status(404).json({
          status: "fail",
          message: "Case not found",
        });
      }

      // 🔐 SECURITY CHECK
      if (
        caseData.client.toString() !== userId.toString() &&
        caseData.lawyer.toString() !== userId.toString()
      ) {
        return res.status(403).json({
          status: "fail",
          message: "Unauthorized",
        });
      }

      const messages = await MessageModel.find({ caseId })
        .populate("sender", "fullName role")
        .populate("receiver", "fullName role")
        .sort({ createdAt: 1 });

      return res.status(200).json({
        status: "success",
        data: messages,
      });

    } catch (error) {
      return res.status(500).json({
        status: "fail",
        message: error.toString(),
      });
    }
  }


  // ================= GET CHAT LIST =================
  async GetChatList(req, res) {
    try {
      const userId = req.user._id; // ✅ FIXED

      const cases = await CaseModel.find({
        $or: [{ client: userId }, { lawyer: userId }]
      })
        .populate("client", "fullName")
        .populate("lawyer", "fullName")
        .sort({ updatedAt: -1 });

      return res.status(200).json({
        status: "success",
        data: cases,
      });

    } catch (error) {
      return res.status(500).json({
        status: "fail",
        message: error.toString(),
      });
    }
  }
}

module.exports = new ChatController();