const mongoose = require('mongoose');
const CaseModel = require('./app/model/CaseModel');
require('dotenv').config();

const seedDashboard = async () => {
    await mongoose.connect(process.env.DATABASE_URL);

    // IMPORTANT: Replace these with real ObjectIDs from your 'users' collection
    const clientId = "65f...your_client_id"; 
    const lawyerId = "65f...your_lawyer_id";

    const dummyCase = {
        client: clientId,
        lawyer: lawyerId,
        projectTitle: "Scope Discussion (Verify OTP issue)",
        totalBilled: 12000,
        totalPaid: 8000,
        nextHearing: "2026-05-15",
        milestones: [
            { label: "Case Opened", date: "Oct 24, 2025", status: "done" },
            { label: "Evidence Sub", date: "Nov 12, 2025", status: "done" },
            { label: "Hearing 1", date: "Jan 10, 2026", status: "error", subText: "OVERDUE" },
            { label: "Final Verdict", date: "Pending", status: "pending" }
        ],
        activities: [
            { text: "Lawyer uploaded 'Evidence_A.pdf'", time: "2 hours ago" },
            { text: "Payment of ₹5000 confirmed", time: "Yesterday" }
        ]
    };

    await CaseModel.create(dummyCase);
    console.log("✅ Dashboard Seed Data Created!");
    process.exit();
};

seedDashboard();