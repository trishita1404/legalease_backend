const CaseModel = require('../model/CaseModel');
const UserModel = require('../model/UserModel');
const ConsultationRequestModel = require('../model/ConsultationRequestModel');
const { createNotification } = require('../helper/NotificationHelper');

// ================= HELPER FUNCTION =================
function generateMilestones(caseStatus) {
    const steps = [
        "Case Filed",
        "Investigation",
        "Hearing",
        "Final Decision"
    ];

    const statusMap = {
        filed: 1,
        investigation: 2,
        hearing: 3,
        closed: 4,
    };

    const normalizedStatus = caseStatus?.toLowerCase();
    const completedCount = statusMap[normalizedStatus] || 1;

    return steps.map((label, index) => {
        let status = "pending";

        if (index < completedCount) status = "done";

        return {
            label,
            date: status === "done"
                ? new Date().toLocaleDateString()
                : "Pending",
            status,
        };
    });
}

// ================= CONTROLLER =================

class ClientController {

    // ================= DASHBOARD =================
    async GetClientDashboard(req, res) {
        try {
            const user_id = req.user._id.toString(); // ✅ FIXED

            const caseData = await CaseModel.findOne({ client: user_id })
                .sort({ createdAt: -1 })
                .populate({
                    path: 'lawyer',
                    select: 'fullName specialization avatar phoneNumber'
                });

            // ✅ FIX: DO NOT RETURN 404
            if (!caseData) {
                return res.status(200).json({
                    status: "success",
                    data: null
                });
            }

            const dynamicMilestones = generateMilestones(caseData.caseStatus);

            const response = {
                stats: {
                    totalBilled: caseData.totalBilled,
                    totalPaid: caseData.totalPaid,
                    nextHearing: caseData.nextHearing,
                    caseStatus: caseData.caseStatus,
                    amountDue: caseData.totalBilled - caseData.totalPaid
                },
                lawyer: caseData.lawyer,
                milestones: dynamicMilestones,
                activities: caseData.activities
            };

            return res.status(200).json({
                status: "success",
                data: response
            });

        } catch (error) {
            return res.status(500).json({
                status: "fail",
                message: error.toString()
            });
        }
    }

    // ================= MY CASES =================
    async GetMyCases(req, res) {
        try {
            const user_id = req.user._id.toString(); // ✅ FIXED

            const cases = await CaseModel.find({ client: user_id })
                .populate('lawyer', 'fullName specialization avatar')
                .sort({ createdAt: -1 });

            return res.status(200).json({
                status: "success",
                data: cases
            });

        } catch (error) {
            return res.status(500).json({
                status: "fail",
                message: error.toString()
            });
        }
    }

    // ================= LEGAL TEAM =================
    async GetLegalTeam(req, res) {
        try {
            const user_id = req.user._id.toString(); // ✅ FIXED

            const userCase = await CaseModel.findOne({ client: user_id });

            if (!userCase) {
                return res.status(200).json({   // ✅ FIXED (no 404)
                    status: "success",
                    data: null
                });
            }

            const lawyerProfile = await UserModel.findById(userCase.lawyer)
                .select('fullName email avatar phoneNumber specialization bio barId');

            return res.status(200).json({
                status: "success",
                data: lawyerProfile
            });

        } catch (error) {
            return res.status(500).json({
                status: "fail",
                message: error.toString()
            });
        }
    }

    // ================= SINGLE CASE =================
    async GetCaseById(req, res) {
        try {
            const { id } = req.params;

            const caseData = await CaseModel.findById(id)
                .populate('client', 'fullName email avatar')
                .populate('lawyer', 'fullName email avatar');

            if (!caseData) {
                return res.status(404).json({
                    status: "fail",
                    message: "Case not found"
                });
            }

            return res.status(200).json({
                status: "success",
                data: caseData
            });

        } catch (error) {
            return res.status(500).json({
                status: "fail",
                message: error.toString()
            });
        }
    }

    // ================= SEND CONSULTATION REQUEST =================
    async SendConsultationRequest(req, res) {
        try {
            const client_id = req.user._id.toString(); // ✅ FIXED
            const { lawyerId } = req.body;

            if (!lawyerId) {
                return res.status(400).json({
                    status: "fail",
                    message: "Lawyer ID is required"
                });
            }

            const existing = await ConsultationRequestModel.findOne({
                client: client_id,
                lawyer: lawyerId,
                status: "pending"
            });

            if (existing) {
                return res.status(400).json({
                    status: "fail",
                    message: "Request already sent"
                });
            }

            const newRequest = await ConsultationRequestModel.create({
    client: client_id,
    lawyer: lawyerId
});

// 🔔 NOTIFY LAWYER
await createNotification(
    lawyerId,
    "New Consultation Request",
    "A client has requested a consultation with you.",
    "info"
);

            return res.status(201).json({
                status: "success",
                message: "Request sent successfully",
                data: newRequest
            });

        } catch (error) {
            return res.status(500).json({
                status: "fail",
                message: error.toString()
            });
        }
    }

    // ================= MY CONSULTATIONS =================
async GetMyConsultations(req, res) {
    try {
        const user_id = req.user._id; // ✅ IMPORTANT (no toString)

        const consultations = await ConsultationRequestModel.find({
            client: user_id
        })
        .populate("lawyer", "fullName specialization avatar")
        .sort({ createdAt: -1 });

        return res.status(200).json({
            status: "success",
            data: consultations
        });

    } catch (error) {
        return res.status(500).json({
            status: "fail",
            message: error.toString()
        });
    }
}

}

module.exports = new ClientController();    