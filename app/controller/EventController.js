const EventModel = require("../model/EventModel");

class EventController {

  
  // ✅ GET EVENTS
async GetEvents(req, res) {
  try {

    const role = req.user.role;
    const userId = req.user._id;

    let query = {};

    // CLIENT → only own schedules
    if (role === "client") {
      query.clientId = userId;
    }

    // LAWYER → only assigned schedules
    if (role === "lawyer") {
      query.lawyerId = userId;
    }

    const events = await EventModel.find(query)
      .sort({ scheduleDateTime: 1 });

    return res.status(200).json({
      status: "success",
      data: events,
    });

  } catch (error) {

    return res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
}

  // ✅ CREATE EVENT (ADMIN & LAWYER ONLY)
  // ✅ CREATE EVENT
async CreateEvent(req, res) {

  try {

    const role = req.user.role;

    if (!["admin", "lawyer"].includes(role)) {

      return res.status(403).json({
        status: "fail",
        message: "Access denied",
      });
    }

    const {
      caseId,
      caseCode,
      clientId,
      lawyerId,
      scheduleDateTime,
      priority,
    } = req.body;

    const event = await EventModel.create({

      caseId,
      caseCode,
      clientId,
      lawyerId,

      scheduleDateTime,

      priority,

      createdBy: req.user._id,
    });

    return res.status(201).json({
      status: "success",
      data: event,
    });

  } catch (error) {

    return res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
}

  // ✅ UPDATE EVENT (ADMIN & LAWYER ONLY)
  async UpdateEvent(req, res) {
    try {
      const role = req.user.role;

      if (!["admin", "lawyer"].includes(role)) {
        return res.status(403).json({
          status: "fail",
          message: "Access denied",
        });
      }

      const { eventId, title, description, date } = req.body;

      const updated = await EventModel.findByIdAndUpdate(
        eventId,
        { title, description, date },
        { new: true }
      );

      return res.status(200).json({
        status: "success",
        data: updated,
      });

    } catch (error) {
      return res.status(500).json({
        status: "fail",
        message: error.message,
      });
    }
  }

  // ✅ DELETE EVENT
  // ✅ DELETE EVENT
async DeleteEvent(req, res) {

  try {

    const role = req.user.role;

    if (!["admin", "lawyer"].includes(role)) {

      return res.status(403).json({
        status: "fail",
        message: "Access denied",
      });
    }

    const { eventId } = req.body;

    await EventModel.findByIdAndDelete(eventId);

    return res.status(200).json({
      status: "success",
      message: "Event deleted",
    });

  } catch (error) {

    return res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
}

// ✅ GET CASES FOR CALENDAR DROPDOWN
async GetCalendarCases(req, res) {

  try {

    const CaseModel = require("../model/CaseModel");

    const role = req.user.role;
    const userId = req.user._id;

    let query = {};

    // CLIENT → only own cases
    if (role === "client") {
      query.client = userId;
    }

    // LAWYER → only assigned cases
    if (role === "lawyer") {
      query.lawyer = userId;
    }

    const cases = await CaseModel.find(query)
      .select("_id caseCode client lawyer")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      status: "success",
      data: cases,
    });

  } catch (error) {

    return res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
}
}

module.exports = new EventController();