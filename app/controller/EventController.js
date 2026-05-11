const EventModel = require("../model/EventModel");
const CaseModel = require("../model/CaseModel");

class EventController {

  // ===============================
  // GET EVENTS
  // ===============================
  async GetEvents(req, res) {

    try {

      const role = req.user.role;
      const userId = req.user._id;

      let query = {};

      // CLIENT → ONLY OWN CASE EVENTS
      if (role === "client") {

        const myCases = await CaseModel.find({
          client: userId,
        }).select("_id");

        const caseIds = myCases.map(
          (item) => item._id
        );

        query.caseId = {
          $in: caseIds,
        };
      }

      // LAWYER → ONLY OWN CASE EVENTS
      if (role === "lawyer") {

        const lawyerCases = await CaseModel.find({
          lawyer: userId,
        }).select("_id");

        const caseIds = lawyerCases.map(
          (item) => item._id
        );

        query.caseId = {
          $in: caseIds,
        };
      }

      const events = await EventModel.find(query)
        .sort({
          scheduleDateTime: 1,
        });

      return res.status(200).json({
        status: "success",
        data: events,
      });

    } catch (error) {

      console.log("GET EVENTS ERROR:", error);

      return res.status(500).json({
        status: "fail",
        message: error.message,
      });
    }
  }

  // ===============================
  // CREATE EVENT
  // ===============================
  async CreateEvent(req, res) {

    try {

      const role = req.user.role;

      // ONLY ADMIN & LAWYER
      if (
        !["admin", "lawyer"].includes(role)
      ) {

        return res.status(403).json({
          status: "fail",
          message: "Access denied",
        });
      }

      const {
        caseId,
        caseCode,
        scheduleDateTime,
        priority,
      } = req.body;

      console.log("REQ BODY:", req.body);

      // VALIDATION
      if (
        !caseId ||
        !caseCode ||
        !scheduleDateTime
      ) {

        return res.status(400).json({
          status: "fail",
          message: "Missing required fields",
        });
      }

      const event = await EventModel.create({

        caseId,

        caseCode,

        scheduleDateTime,

        priority,

        createdBy: req.user._id,
      });

      return res.status(201).json({
        status: "success",
        data: event,
      });

    } catch (error) {

      console.log(
        "CREATE EVENT ERROR:",
        error
      );

      return res.status(500).json({
        status: "fail",
        message: error.message,
      });
    }
  }

  // ===============================
  // UPDATE EVENT
  // ===============================
  async UpdateEvent(req, res) {

    try {

      const role = req.user.role;

      if (
        !["admin", "lawyer"].includes(role)
      ) {

        return res.status(403).json({
          status: "fail",
          message: "Access denied",
        });
      }

      const {
        eventId,
        scheduleDateTime,
        priority,
      } = req.body;

      const updated =
        await EventModel.findByIdAndUpdate(

          eventId,

          {
            scheduleDateTime,
            priority,
          },

          {
            new: true,
          }
        );

      return res.status(200).json({
        status: "success",
        data: updated,
      });

    } catch (error) {

      console.log(
        "UPDATE EVENT ERROR:",
        error
      );

      return res.status(500).json({
        status: "fail",
        message: error.message,
      });
    }
  }

  // ===============================
  // DELETE EVENT
  // ===============================
  async DeleteEvent(req, res) {

    try {

      const role = req.user.role;

      if (
        !["admin", "lawyer"].includes(role)
      ) {

        return res.status(403).json({
          status: "fail",
          message: "Access denied",
        });
      }

      const { eventId } = req.body;

      await EventModel.findByIdAndDelete(
        eventId
      );

      return res.status(200).json({
        status: "success",
        message: "Event deleted",
      });

    } catch (error) {

      console.log(
        "DELETE EVENT ERROR:",
        error
      );

      return res.status(500).json({
        status: "fail",
        message: error.message,
      });
    }
  }

  // ===============================
  // GET CASES FOR DROPDOWN
  // ===============================
  async GetCalendarCases(req, res) {

    try {

      const role = req.user.role;
      const userId = req.user._id;

      let query = {};

      // CLIENT → OWN CASES
      if (role === "client") {
        query.client = userId;
      }

      // LAWYER → OWN CREATED CASES
      if (role === "lawyer") {
        query.lawyer = userId;
      }

      const cases = await CaseModel.find(query)

        .select("_id caseCode")

        .sort({
          createdAt: -1,
        });

      return res.status(200).json({
        status: "success",
        data: cases,
      });

    } catch (error) {

      console.log(
        "GET CALENDAR CASES ERROR:",
        error
      );

      return res.status(500).json({
        status: "fail",
        message: error.message,
      });
    }
  }
}

module.exports = new EventController();