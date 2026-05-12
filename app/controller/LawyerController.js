const CaseModel = require('../model/CaseModel');
const ConsultationRequestModel = require('../model/ConsultationRequestModel');
const path = require('path');
const mongoose = require('mongoose');
const { createNotification } = require("../helper/NotificationHelper");

// ✅ NEW
const Razorpay = require("razorpay");

// ✅ NEW INSTANCE
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

class LawyerController {

    // ================= GET LAWYER CASES =================
    async GetLawyerCases(req, res) {    
        try {
            const user_id = req.user.user_id;

            const cases = await CaseModel.find({ lawyer: user_id })
                .populate('client', 'fullName email avatar')
                .sort({ createdAt: -1 });

            return res.status(200).json({ status: "success", data: cases });
        } catch (error) {
            return res.status(500).json({ status: "fail", message: error.toString() });
        }
    }

    // ================= ADMIN ALL CASES =================
    async GetAllCases(req, res) {
        try {
            const role = req.user.role;

            if (role !== "admin") {
                return res.status(403).json({
                    status: "fail",
                    message: "Access denied"
                });
            }

            const cases = await CaseModel.find()
                .populate('client', 'fullName email avatar')
                .populate('lawyer', 'fullName email specialization')
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

    // ================= DASHBOARD =================
    async GetLawyerDashboard(req, res) {
        try {
            const user_id = req.user.user_id;

            const cases = await CaseModel.find({ lawyer: user_id })
                .populate('client', 'fullName')
                .sort({ createdAt: -1 });

            const activeCases = cases.filter(c => c.caseStatus !== "closed").length;
            const closedCases = cases.filter(c => c.caseStatus === "closed").length;

            const uniqueClients = [
                ...new Set(
                    cases
                        .filter(c => c.client?._id)
                        .map(c => c.client._id.toString())
                )
            ];

            let pendingTasks = 0;
            cases.forEach(c => {
                pendingTasks += c.milestones.filter(m => m.status === "pending").length;
            });

            const hearings = cases
                .filter(c => c.nextHearing && c.nextHearing !== "---")
                .sort((a, b) => new Date(a.nextHearing) - new Date(b.nextHearing))
                .slice(0, 3)
                .map(c => ({
                    date: c.nextHearing,
                    caseName: c.projectTitle,
                    court: "District Court",
                    time: "—",
                    status: c.caseStatus
                }));

            return res.status(200).json({
                status: "success",
                data: {
                    stats: {
                        activeCases,
                        totalClients: uniqueClients.length,
                        pendingTasks,
                        closedCases
                    },
                    hearings
                }
            });

        } catch (error) {
            return res.status(500).json({
                status: "fail",
                message: error.toString()
            });
        }
    }

    // ================= CREATE CASE =================
    async CreateCase(req, res) {
        try {
            const lawyer_id = req.user.user_id;
            const { caseCode, clientId, projectTitle, nextHearing, caseStatus, totalBilled } = req.body;

            if (!caseCode || !clientId || !projectTitle) {
                return res.status(400).json({
                    status: "fail",
                    message: "Missing required fields"
                });
            }

            if (!mongoose.Types.ObjectId.isValid(clientId)) {
                return res.status(400).json({
                    status: "fail",
                    message: "Invalid Client ID"
                });
            }

            const existing = await CaseModel.findOne({ caseCode });
            if (existing) {
                return res.status(400).json({
                    status: "fail",
                    message: "Case Code already exists"
                });
            }

            const newCase = await CaseModel.create({
                caseCode,
                client: clientId,
                lawyer: lawyer_id,
                projectTitle,
                nextHearing: nextHearing || "---",
                caseStatus: caseStatus || "filed",
                totalBilled: totalBilled || 0,

                activities: [
                    {
                        text: `Case ${caseCode} created`,
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }
                ]
            });
            // 🔔 NOTIFY CLIENT
await createNotification(
    clientId,
    "Case Created",
    `A new case (${caseCode}) has been created for you.`,
    "success"
);

            return res.status(201).json({
                status: "success",
                data: newCase
            });

        } catch (error) {
            return res.status(500).json({
                status: "fail",
                message: error.toString()
            });
        }
    }

    // ================= UPDATE CASE =================
    async UpdateCase(req, res) {
        try {
            const { caseId, projectTitle, nextHearing, caseStatus } = req.body;

            const updatedCase = await CaseModel.findByIdAndUpdate(
    caseId,
    { projectTitle, nextHearing, caseStatus },
    { new: true }
);

// 🔔 NOTIFY CLIENT
if (updatedCase?.client) {
    await createNotification(
        updatedCase.client,
        "Case Updated",
        "Your case has been updated. Please check latest details.",
        "info"
    );
}
            return res.status(200).json({
                status: "success",
                data: updatedCase
            });

        } catch (error) {
            return res.status(500).json({
                status: "fail",
                message: error.toString()
            });
        }
    }

    // ================= DELETE CASE =================
    async DeleteCase(req, res) {
        try {
            const { caseId } = req.body;

            await CaseModel.findByIdAndDelete(caseId);

            return res.status(200).json({
                status: "success",
                message: "Case deleted"
            });

        } catch (error) {
            return res.status(500).json({
                status: "fail",
                message: error.toString()
            });
        }
    }

    // ================= CREATE RAZORPAY ORDER =================
    async CreateOrder(req, res) {
        try {
            const { amount } = req.body;

            if (!amount) {
                return res.status(400).json({
                    status: "fail",
                    message: "Amount is required"
                });
            }

            const options = {
                amount: amount * 100,
                currency: "INR",
                receipt: `receipt_${Date.now()}`
            };

            const order = await razorpay.orders.create(options);

            return res.status(200).json({
                status: "success",
                data: order
            });

        } catch (error) {
            return res.status(500).json({
                status: "fail",
                message: error.toString()
            });
        }
    }

    // ================= PAYMENT =================
    async MakePayment(req, res) {
        try {
            const { caseId, amount } = req.body;

            if (!amount || amount <= 0) {
                return res.status(400).json({
                    status: "fail",
                    message: "Invalid amount"
                });
            }

            const caseData = await CaseModel.findById(caseId);

            if (!caseData) {
                return res.status(404).json({
                    status: "fail",
                    message: "Case not found"
                });
            }

            const amountDue = caseData.totalBilled - caseData.totalPaid;

            if (amount > amountDue) {
                return res.status(400).json({
                    status: "fail",
                    message: "Amount exceeds due"
                });
            }

            caseData.payments.push({
                amount,
                status: "completed"
            });

            caseData.totalPaid += amount;

            caseData.activities.push({
                text: `Payment of ₹${amount} received`,
                time: new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit"
                })
            });

            await caseData.save();

            // 🔔 NOTIFY CLIENT
await createNotification(
    caseData.client,
    "Payment Successful",
    `Your payment of ₹${amount} has been recorded.`,
    "success"
);

// 🔔 NOTIFY LAWYER
await createNotification(
    caseData.lawyer,
    "Payment Received",
    `You received ₹${amount} for a case.`,
    "success"
);

            return res.status(200).json({
                status: "success",
                message: "Payment successful",
                data: caseData
            });

        } catch (error) {
            return res.status(500).json({
                status: "fail",
                message: error.toString()
            });
        }
    }

    // ================= GET CONSULTATION REQUESTS =================
async GetConsultationRequests(req, res) {
    try {
        const lawyer_id = req.user.user_id;

        const requests = await ConsultationRequestModel.find({ lawyer: lawyer_id })
            .populate('client', 'fullName email')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            status: "success",
            data: requests
        });

    } catch (error) {
        return res.status(500).json({
            status: "fail",
            message: error.toString()
        });
    }
}

// ================= UPDATE REQUEST STATUS =================
async UpdateConsultationRequest(req, res) {
    try {
        const { requestId, status } = req.body;

        // ✅ STEP 1: update request
        await ConsultationRequestModel.findByIdAndUpdate(
            requestId,
            { status }
        );

        // ✅ STEP 2: fetch updated with client populated
        const updated = await ConsultationRequestModel.findById(requestId)
            .populate("client");

        // 🔔 NOTIFY CLIENT (FIXED)
        if (updated?.client?._id) {
            await createNotification(
                updated.client._id,
                `Consultation ${status}`,
                `Your consultation request has been ${status}.`,
                status === "accepted" ? "success" : "warning"
            );
        }

        return res.status(200).json({
            status: "success",
            data: updated
        });

    } catch (error) {
        return res.status(500).json({
            status: "fail",
            message: error.toString()
        });
    }
}

// ================= DELETE REQUEST =================
async DeleteConsultationRequest(req, res) {
    try {
        const { requestId } = req.body;

        await ConsultationRequestModel.findByIdAndDelete(requestId);

        return res.status(200).json({
            status: "success",
            message: "Request deleted"
        });

    } catch (error) {
        return res.status(500).json({
            status: "fail",
            message: error.toString()
        });
    }
}

// ================= GET ACCEPTED CLIENTS =================
async GetAcceptedClients(req, res) {
    try {
        const lawyer_id = req.user._id; // ✅ secure way

        const requests = await ConsultationRequestModel.find({
            lawyer: lawyer_id,
            status: "accepted"
        })
        .populate("client", "fullName email");

        // ✅ remove duplicate clients
        const uniqueClientsMap = new Map();

        requests.forEach((reqItem) => {
            if (reqItem.client) {
                uniqueClientsMap.set(
                    reqItem.client._id.toString(),
                    reqItem.client
                );
            }
        });

        const uniqueClients = Array.from(uniqueClientsMap.values());

        return res.status(200).json({
            status: "success",
            data: uniqueClients
        });

    } catch (error) {
        return res.status(500).json({
            status: "fail",
            message: error.toString()
        });
    }
}   

     // ================= DOCUMENT MANAGEMENT =================

async UpdateMilestone(req, res) {
    try {
        const { caseId, milestoneId, status } = req.body;

        if (!caseId || !milestoneId || !status) {
            return res.status(400).json({
                status: "fail",
                message: "caseId, milestoneId and status are required"
            });
        }

        const caseData = await CaseModel.findById(caseId);

        if (!caseData) {
            return res.status(404).json({
                status: "fail",
                message: "Case not found"
            });
        }

        // 🔍 Find milestone
        const milestone = caseData.milestones.id(milestoneId);

        if (!milestone) {
            return res.status(404).json({
                status: "fail",
                message: "Milestone not found"
            });
        }

        // ✅ Update status
        milestone.status = status;

        // 📌 Add activity log
        caseData.activities.push({
            text: `Milestone "${milestone.title}" marked as ${status}`,
            time: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit"
            })
        });

        await caseData.save();

        // 🔔 Notify client
        if (caseData.client) {
            await createNotification(
                caseData.client,
                "Milestone Updated",
                `Milestone "${milestone.title}" is now ${status}.`,
                status === "completed" ? "success" : "info"
            );
        }

        return res.status(200).json({
            status: "success",
            message: "Milestone updated",
            data: caseData
        });

    } catch (error) {
        return res.status(500).json({
            status: "fail",
            message: error.toString()
        });
    }
}

async UploadCaseDocument(req, res) {
    try {
        const { caseId, fileName } = req.body;

        // ❌ No file uploaded
        if (!req.file) {
            return res.status(400).json({
                status: "fail",
                message: "No file uploaded"
            });
        }

        // ❌ No caseId
        if (!caseId) {
            return res.status(400).json({
                status: "fail",
                message: "Case ID is required"
            });
        }

        // 🔍 Find case
        const caseData = await CaseModel.findById(caseId);

        if (!caseData) {
            return res.status(404).json({
                status: "fail",
                message: "Case not found"
            });
        }

        // 📄 Create document object
        const fileData = {
            fileName: fileName || req.file.originalname,
            fileUrl: `/uploads/documents/${req.file.filename}`,
            fileType: req.file.mimetype,
            status: "pending",
            uploadedAt: new Date()
        };

        // 📌 Push into case documents
        caseData.documents.push(fileData);

        // 💾 Save
        await caseData.save();

        // 🔔 Notify client (optional but good)
        if (caseData.client) {
            await createNotification(
                caseData.client,
                "New Document Uploaded",
                `A new document "${fileData.fileName}" has been uploaded.`,
                "info"
            );
        }

        return res.status(200).json({
            status: "success",
            message: "Document uploaded successfully",
            data: fileData
        });

    } catch (error) {
        console.error("Upload Error:", error);

        return res.status(500).json({
            status: "fail",
            message: error.toString()
        });
    }
}

async DeleteDocument(req, res) {
    try {
        const { caseId, fileUrl } = req.body;

        if (!caseId || !fileUrl) {
            return res.status(400).json({
                status: "fail",
                message: "caseId and fileUrl are required"
            });
        }

        const caseData = await CaseModel.findById(caseId);

        if (!caseData) {
            return res.status(404).json({
                status: "fail",
                message: "Case not found"
            });
        }

        // 🔍 Remove document from array
        caseData.documents = caseData.documents.filter(
            (doc) => doc.fileUrl !== fileUrl
        );

        // 💾 Save changes
        await caseData.save();

        // 🔔 Notify client
        if (caseData.client) {
            await createNotification(
                caseData.client,
                "Document Deleted",
                "A document has been removed from your case.",
                "warning"
            );
        }

        return res.status(200).json({
            status: "success",
            message: "Document deleted successfully"
        });

    } catch (error) {
        return res.status(500).json({
            status: "fail",
            message: error.toString()
        });
    }
}

async UpdateDocumentStatus(req, res) {
    try {
        const { caseId, fileUrl, status } = req.body;

        if (!caseId || !fileUrl || !status) {
            return res.status(400).json({
                status: "fail",
                message: "caseId, fileUrl and status are required"
            });
        }

        const caseData = await CaseModel.findById(caseId);

        if (!caseData) {
            return res.status(404).json({
                status: "fail",
                message: "Case not found"
            });
        }

        // 🔍 Find document
        const document = caseData.documents.find(
            (doc) => doc.fileUrl === fileUrl
        );

        if (!document) {
            return res.status(404).json({
                status: "fail",
                message: "Document not found"
            });
        }

        // ✅ Update status
        document.status = status;

        // 📌 Add activity log
        caseData.activities.push({
            text: `Document "${document.fileName}" marked as ${status}`,
            time: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit"
            })
        });

        // 💾 Save
        await caseData.save();

        // 🔔 Notify client
        if (caseData.client) {
            await createNotification(
                caseData.client,
                "Document Status Updated",
                `Your document "${document.fileName}" is now ${status}.`,
                status === "verified" ? "success" : "info"
            );
        }

        return res.status(200).json({
            status: "success",
            message: "Document status updated",
            data: document
        });

    } catch (error) {
        return res.status(500).json({
            status: "fail",
            message: error.toString()
        });
    }
}

}

module.exports = new LawyerController();    