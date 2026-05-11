const express = require('express'); 
const router = express.Router();

const UserController = require('../controller/UserController');
const ClientController = require('../controller/ClientController');
const LawyerController = require('../controller/LawyerController');
const ChatController = require('../controller/ChatController'); 

const AuthMiddleware = require('../middleware/AuthMiddleware');
const UploadMiddleware = require('../middleware/UploadMiddleware');
const DocUploadMiddleware = require('../middleware/DocUploadMiddleware');
const NotificationController = require('../controller/NotificationController');
const EventController = require("../controller/EventController");
const AnnouncementController = require("../controller/AnnouncementController");

// PUBLIC
router.post("/registration", UserController.Registration);
// router.post("/verify-otp", UserController.VerifyOTP);
router.post("/login", UserController.Login);
router.post("/refresh-token", UserController.RefreshToken);

// PRIVATE
router.post("/logout", AuthMiddleware, UserController.Logout);

router.patch(
  "/update-profile", 
  AuthMiddleware, 
  UploadMiddleware.single('avatar'), 
  UserController.UpdateProfile
);
router.get("/GetClients", AuthMiddleware, UserController.GetClients);
router.get("/GetAllLawyers", AuthMiddleware, UserController.GetAllLawyers);
router.get("/me", AuthMiddleware, UserController.GetProfile);

// =========================
 // ADMIN ROUTES
 // =========================

router.get(
  "/GetAdminDashboard",
  AuthMiddleware,
  UserController.GetAdminDashboard
);

// Get all users (Admin only)
router.get(
  "/all-users",
  AuthMiddleware,
  UserController.GetAllUsers
);

// Block user
router.patch(
  "/block-user/:id",
  AuthMiddleware,
  UserController.BlockUser
);

// Unblock user
router.patch(
  "/unblock-user/:id",
  AuthMiddleware,
  UserController.UnblockUser
);  

router.get(
  "/GetSystemLogs",
  AuthMiddleware,
  UserController.GetSystemLogs
);


router.get("/GetPendingLawyers", AuthMiddleware, UserController.GetPendingLawyers);
router.post("/ApproveLawyer/:id", AuthMiddleware, UserController.ApproveLawyer);
router.post("/RejectLawyer/:id", AuthMiddleware, UserController.RejectLawyer);

// CLIENT
router.get("/GetClientDashboard", AuthMiddleware, ClientController.GetClientDashboard);
router.post("/SendConsultationRequest", AuthMiddleware, ClientController.SendConsultationRequest);
router.get("/GetMyCases", AuthMiddleware, ClientController.GetMyCases);
router.get("/GetLegalTeam", AuthMiddleware, ClientController.GetLegalTeam);
router.get("/GetCaseById/:id", AuthMiddleware, ClientController.GetCaseById);
router.get(
  "/GetMyConsultations",
  AuthMiddleware,
  ClientController.GetMyConsultations
);    

// LAWYER
router.get("/GetLawyerDashboard", AuthMiddleware, LawyerController.GetLawyerDashboard);
router.get("/GetLawyerCases", AuthMiddleware, LawyerController.GetLawyerCases);
router.get("/GetAllCases", AuthMiddleware, LawyerController.GetAllCases);

router.get("/GetConsultationRequests", AuthMiddleware, LawyerController.GetConsultationRequests);
router.post("/UpdateConsultationRequest", AuthMiddleware, LawyerController.UpdateConsultationRequest);
router.post("/DeleteConsultationRequest", AuthMiddleware, LawyerController.DeleteConsultationRequest);

// CASE
router.post("/CreateCase", AuthMiddleware, LawyerController.CreateCase);
router.post("/UpdateCase", AuthMiddleware, LawyerController.UpdateCase);
router.post("/DeleteCase", AuthMiddleware, LawyerController.DeleteCase);

// DOCUMENT
router.post("/UpdateMilestone", AuthMiddleware, LawyerController.UpdateMilestone);

router.post(
  "/UploadCaseDocument",
  AuthMiddleware,
  DocUploadMiddleware.single('caseDoc'),
  LawyerController.UploadCaseDocument
);

router.post("/DeleteDocument", AuthMiddleware, LawyerController.DeleteDocument);
router.post("/UpdateDocumentStatus", AuthMiddleware, LawyerController.UpdateDocumentStatus);

//PAYMENT   
router.post("/CreateOrder", AuthMiddleware, LawyerController.CreateOrder);
router.post("/MakePayment", AuthMiddleware, LawyerController.MakePayment);
router.get("/GetAcceptedClients", AuthMiddleware, LawyerController.GetAcceptedClients);

// CHAT
router.post("/SendMessage", AuthMiddleware, ChatController.SendMessage);
router.get("/GetMessages/:caseId", AuthMiddleware, ChatController.GetMessages);
router.get("/GetChatList", AuthMiddleware, ChatController.GetChatList);

// CALENDAR EVENTS
router.get("/events", AuthMiddleware, EventController.GetEvents);
router.post("/events/create", AuthMiddleware, EventController.CreateEvent);
router.post("/events/update", AuthMiddleware, EventController.UpdateEvent);
router.post("/events/delete", AuthMiddleware, EventController.DeleteEvent);


// =========================
// ANNOUNCEMENTS
// =========================

router.post("/announcements", AuthMiddleware, AnnouncementController.CreateAnnouncement);
router.get("/announcements", AuthMiddleware, AnnouncementController.GetAnnouncements);
router.delete("/announcements/:id", AuthMiddleware, AnnouncementController.DeleteAnnouncement);

module.exports = router;  