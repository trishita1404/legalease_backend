const bcrypt = require("bcryptjs");
const UserModel = require("../model/UserModel");
const TokenHelper = require("../helper/TokenHelper");
// const SendEmail = require("../helper/EmailHelper");
const { createNotification } = require("../helper/NotificationHelper");

// Cookie helper
const getCookieOptions = () => {
    const isProduction = process.env.NODE_ENV === "production";

    return {
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        httpOnly: true,
        sameSite: isProduction ? "none" : "lax",
        secure: isProduction,
    };
};

class UserController {

    // =========================
    // UPDATE PROFILE
    // =========================
    async UpdateProfile(req, res) {
        try {
            const user_id = req.user?.user_id || req.user?.id;

            if (!user_id) {
                return res.status(403).json({ status: "fail", message: "Unauthorized" });
            }

            const { fullName, phoneNumber, bio, specialization, barId } = req.body;

            let updateData = {
                fullName,
                phoneNumber,
                bio,
                specialization,
                barId
            };

            if (req.file) {
                updateData.avatar = `/uploads/${req.file.filename}`;
            }

            const updatedUser = await UserModel.findByIdAndUpdate(
                user_id,
                { $set: updateData },
                { new: true, runValidators: true }
            ).select("-password -otp");

            return res.status(200).json({
                status: "success",
                data: updatedUser
            });

        } catch (err) {
            return res.status(500).json({ status: "fail", message: err.message });
        }
    }

 
// =========================
// REGISTRATION
// =========================
async Registration(req, res) {
    try {

        const { fullName, email, password, role, phone, identification } = req.body;

        const cleanEmail = email.toLowerCase().trim();

        // =========================
        // CHECK EXISTING USER
        // =========================
        const existingUser = await UserModel.findOne({
            email: cleanEmail
        });

        if (existingUser) {
            return res.status(400).json({
                status: "fail",
                message: "User already exists"
            });
        }

        // =========================
        // HASH PASSWORD
        // =========================
        const hashedPassword = await bcrypt.hash(password, 10);

        // =========================
        // CREATE USER
        // =========================
        await UserModel.create({
            fullName,
            email: cleanEmail,
            password: hashedPassword,
            role,
            phoneNumber: phone,
            barId: identification,

            // IMPORTANT: KEEP THIS
            approvalStatus: role === "lawyer"
                ? "pending"
                : "approved"
        });

        // =========================
        // NOTIFY ADMIN FOR LAWYERS
        // =========================
        if (role === "lawyer") {

            const admins = await UserModel.find({
                role: "admin"
            });

            for (let admin of admins) {

                await createNotification(
                    admin._id,
                    "New Lawyer Registration",
                    `${fullName} has registered and is waiting for approval.`,
                    "warning"
                );
            }
        }

        // =========================
        // SUCCESS RESPONSE
        // =========================
        return res.status(201).json({
            status: "success",
            message: "Registration successful"
        });

    } catch (err) {

        console.log("REGISTRATION ERROR:");
        console.log(err);

        return res.status(500).json({
            status: "fail",
            message: err.message
        });
    }
}
// =========================
// VERIFY OTP (FINAL FIXED)
// =========================
// async VerifyOTP(req, res) {
//     try {
//         const { email, otp } = req.body;
//         const cleanEmail = email.toLowerCase().trim();

//         const user = await UserModel.findOne({ email: cleanEmail });

//         // ❌ USER NOT FOUND
//         if (!user) {
//             return res.status(404).json({
//                 status: "fail",
//                 message: "User not found"
//             });
//         }

//         // ❌ OTP MISMATCH (robust check)
//         const dbOtp = String(user.otp).trim();
//         const enteredOtp = String(otp).trim();

//         if (dbOtp !== enteredOtp) {
//             console.log("DB OTP:", dbOtp);
//             console.log("Entered OTP:", enteredOtp);

//             return res.status(400).json({
//                 status: "fail",
//                 message: "Invalid OTP"
//             });
//         }

//         // 🔥 CHECK LAWYER APPROVAL FIRST
//         if (user.role === "lawyer" && user.approvalStatus !== "approved") {
//             return res.status(200).json({
//                 status: "pending",
//                 message: "Your account is under admin approval. Please wait."
//             });
//         }

//         // ✅ NOW VERIFY USER (ONLY AFTER SUCCESS FLOW)
//         user.otp = "0";
//         user.isVerified = true;
//         await user.save();

//         // ✅ GENERATE TOKENS
//         const accessToken = TokenHelper.EncodeAccessToken(
//             user.email,
//             user._id,
//             user.role
//         );

//         const refreshToken = TokenHelper.EncodeRefreshToken(
//             user.email,
//             user._id,
//             user.role
//         );

//         res.cookie("refreshToken", refreshToken, getCookieOptions());

//         // ✅ FINAL RESPONSE
//         return res.status(200).json({
//             status: "success",
//             accessToken,
//             data: {
//                 id: user._id,
//                 email: user.email,
//                 role: user.role,
//                 fullName: user.fullName,
//                 avatar: user.avatar || "",
//                 phoneNumber: user.phoneNumber || "",
//                 barId: user.barId || "",
//                 specialization: user.specialization || "",
//                 bio: user.bio || "",
//             }
//         });

//     } catch (err) {
//         return res.status(500).json({
//             status: "fail",
//             message: err.message
//         });
//     }
// }

    // =========================
    // LOGIN (FIXED)
    // =========================
    async Login(req, res) {
    try {
        const { email, password } = req.body;
        const cleanEmail = email.toLowerCase().trim();

        // 🔥 ADMIN LOGIN (NO DB REQUIRED)
        if (
            cleanEmail === process.env.ADMIN_EMAIL &&
            password === process.env.ADMIN_PASSWORD
        ) {
            const accessToken = TokenHelper.EncodeAccessToken(
                cleanEmail,
                "ADMIN_001",
                "admin"
            );

            const refreshToken = TokenHelper.EncodeRefreshToken(
                cleanEmail,
                "ADMIN_001",
                "admin"
            );

            res.cookie("refreshToken", refreshToken, getCookieOptions());

            return res.status(200).json({
                status: "success",
                accessToken,
                data: {
                    id: "ADMIN_001",
                    email: cleanEmail,
                    role: "admin",
                    fullName: "Super Admin",
                    avatar: "",
                    phoneNumber: "",
                    barId: "",
                    specialization: "",
                    bio: "",
                }
            });
        }

        // 🔽 NORMAL USER LOGIN (DB)
        const user = await UserModel.findOne({ email: cleanEmail });

        if (!user) {
            return res.status(404).json({ status: "fail", message: "User not found" });
        }

        if (user.role === "lawyer" && user.approvalStatus !== "approved") {
    return res.status(403).json({
        status: "pending",
        message: "Your account is not approved by admin yet"
    });
}

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ status: "fail", message: "Invalid credentials" });
        }

        const accessToken = TokenHelper.EncodeAccessToken(user.email, user._id, user.role);
        const refreshToken = TokenHelper.EncodeRefreshToken(user.email, user._id, user.role);

        res.cookie("refreshToken", refreshToken, getCookieOptions());

        // ✅ FULL USER DATA
        return res.status(200).json({
            status: "success",
            accessToken,
            data: {
                id: user._id,
                email: user.email,
                role: user.role,
                fullName: user.fullName || "",
                avatar: user.avatar || "",
                phoneNumber: user.phoneNumber || "",
                barId: user.barId || "",
                specialization: user.specialization || "",
                bio: user.bio || "",
            }
        });

    } catch (err) {
        return res.status(500).json({ status: "fail", message: err.message });
    }
}

    // =========================
    // LOGOUT
    // =========================
    async Logout(req, res) {
        const isProduction = process.env.NODE_ENV === "production";

        res.clearCookie("refreshToken", {
            httpOnly: true,
            sameSite: isProduction ? "none" : "lax",
            secure: isProduction,
        });

        return res.status(200).json({
            status: "success",
            message: "Logged out"
        });
    }

    // =========================
    // REFRESH TOKEN
    // =========================
    async RefreshToken(req, res) {
        try {
            const refreshToken = req.cookies.refreshToken;

            if (!refreshToken) {
                return res.status(401).json({ status: "fail", message: "No refresh token" });
            }

            const jwt = require("jsonwebtoken");

            jwt.verify(refreshToken, process.env.JWT_REFRESH_KEY, (err, decoded) => {
                if (err) {
                    return res.status(403).json({ status: "fail", message: "Invalid token" });
                }

                const newAccessToken = TokenHelper.EncodeAccessToken(
                    decoded.email,
                    decoded.user_id,
                    decoded.role
                );

                return res.status(200).json({
                    status: "success",
                    accessToken: newAccessToken
                });
            });

        } catch (error) {
            return res.status(500).json({ status: "fail", message: error.toString() });
        }
    }

    // =========================
    // GET CLIENTS
    // =========================
    async GetClients(req, res) {
        try {
            const clients = await UserModel.find({ role: "client" })
                .select("_id fullName email phoneNumber")
                .sort({ createdAt: -1 });

            return res.status(200).json({
                status: "success",
                data: clients
            });

        } catch (error) {
            return res.status(500).json({ status: "fail", message: error.toString() });
        }
    }

   async GetProfile(req, res) {
  try {
    const user_id = req.user?.user_id || req.user?.id;

    // ✅ HANDLE ADMIN (IMPORTANT FIX)
    if (user_id === "ADMIN_001") {
      return res.status(200).json({
        status: "success",
        data: {
          id: "ADMIN_001",
          email: req.user.email,
          role: "admin",
          fullName: "Super Admin",
          avatar: "",
          phoneNumber: "",
          barId: "",
          specialization: "",
          bio: "",
        }
      });
    }

    // ✅ NORMAL USER
    const user = await UserModel.findById(user_id).select("-password -otp");

    return res.status(200).json({
      status: "success",
      data: user
    });

  } catch (error) {
    return res.status(500).json({
      status: "fail",
      message: error.message
    });
  }
}   


// =========================
// GET ALL LAWYERS
// =========================
async GetAllLawyers(req, res) {
    try {
        const lawyers = await UserModel.find({ role: "lawyer", isBlocked: false })
            .select("_id fullName email specialization avatar")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            status: "success",
            data: lawyers
        });

    } catch (error) {
        return res.status(500).json({
            status: "fail",
            message: error.toString()
        });
    }
}

// =========================
// ADMIN: GET ALL USERS
// =========================
async GetAllUsers(req, res) {
    try {
        if (req.headers.role !== "admin") {
            return res.status(403).json({
                status: "fail",
                message: "Access denied"
            });
        }

        // 🔥 QUERY PARAMS
        const { page = 1, limit = 5, search = "", role = "" } = req.query;

        const query = {};

        // 🔍 Search by full name (case insensitive)
        if (search) {
            query.fullName = { $regex: search, $options: "i" };
        }

        // 🎯 Filter by role
        if (role) {
            query.role = role;
        }

        // 🔢 TOTAL COUNT
        const total = await UserModel.countDocuments(query);

        // 📄 PAGINATED DATA
        const users = await UserModel.find(query)
            .select("-password -otp")
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        return res.status(200).json({
            status: "success",
            data: users,
            pagination: {
                total,
                page: Number(page),
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        return res.status(500).json({
            status: "fail",
            message: error.message
        });
    }
}

// =========================
// ADMIN: BLOCK USER
// =========================
async BlockUser(req, res) {
    try {
        if (req.headers.role !== "admin") {
            return res.status(403).json({
                status: "fail",
                message: "Access denied"
            });
        }

        const { id } = req.params;

        await UserModel.findByIdAndUpdate(id, {
            $set: { isBlocked: true }       
        });

        return res.status(200).json({
            status: "success",
            message: "User blocked"
        });

    } catch (error) {
        return res.status(500).json({
            status: "fail",
            message: error.message
        });
    }
}


// =========================
// ADMIN: UNBLOCK USER
// =========================
async UnblockUser(req, res) {
    try {
        if (req.headers.role !== "admin") {
            return res.status(403).json({
                status: "fail",
                message: "Access denied"
            });
        }

        const { id } = req.params;

        await UserModel.findByIdAndUpdate(id, {
    $set: { isBlocked: false }
});

        return res.status(200).json({
            status: "success",
            message: "User unblocked"
        });

    } catch (error) {
        return res.status(500).json({
            status: "fail",
            message: error.message
        });
    }
}


// =========================
// ADMIN DASHBOARD
// =========================
async GetAdminDashboard(req, res) {
    try {
        if (req.headers.role !== "admin") {
            return res.status(403).json({
                status: "fail",
                message: "Access denied"
            });
        }

        const CaseModel = require("../model/CaseModel");

        // ================= DATE HELPERS =================
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        // ================= USERS =================
        const totalUsers = await UserModel.countDocuments();

        const activeUsers = await UserModel.countDocuments({
            isBlocked: false
        });

        const blockedUsers = await UserModel.countDocuments({
            isBlocked: true
        });

        const newUsersToday = await UserModel.countDocuments({
            createdAt: { $gte: today, $lt: tomorrow }
        });

        // ================= CASES =================
        const totalCases = await CaseModel.countDocuments();

        const ongoingCases = await CaseModel.countDocuments({
            caseStatus: "Ongoing"
        });

        const closedCases = await CaseModel.countDocuments({
            caseStatus: "Closed"
        });

        const casesToday = await CaseModel.countDocuments({
            createdAt: { $gte: today, $lt: tomorrow }
        });

        // ================= REVENUE (REAL) =================
        const revenueAgg = await CaseModel.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: "$totalPaid" }
                }
            }
        ]);

        const revenue = revenueAgg[0]?.total || 0;

        // ================= GRAPH (Monthly Users) =================
        const monthlyUsers = await UserModel.aggregate([
            {
                $group: {
                    _id: { $month: "$createdAt" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        const graphData = Array(12).fill(0);

        monthlyUsers.forEach(m => {
            graphData[m._id - 1] = m.count;
        });

        // ================= ACTIVITY =================
        const recentUsers = await UserModel.find()
            .sort({ createdAt: -1 })
            .limit(3)
            .select("fullName createdAt role");

        const recentCases = await CaseModel.find()
            .sort({ createdAt: -1 })
            .limit(3)
            .select("projectTitle createdAt");

        const logs = [
            ...recentUsers.map(u => ({
                time: new Date(u.createdAt).toLocaleTimeString(),
                text: `${u.role} registered`,
                user: u.fullName
            })),
            ...recentCases.map(c => ({
                time: new Date(c.createdAt).toLocaleTimeString(),
                text: "case created",
                user: c.projectTitle
            }))
        ].sort((a, b) => new Date(b.time) - new Date(a.time));

        // ================= FINAL RESPONSE =================
        return res.status(200).json({
            status: "success",
            data: {
                stats: {
                    totalUsers,
                    activeUsers,
                    blockedUsers,
                    newUsersToday,

                    totalCases,
                    ongoingCases,
                    closedCases,
                    casesToday,

                    alerts: blockedUsers,
                    revenue
                },
                graphData,
                logs
            }
        });

    } catch (error) {
        return res.status(500).json({
            status: "fail",
            message: error.message
        });
    }
}

// =========================
// ADMIN: SYSTEM LOGS
// =========================
async GetSystemLogs(req, res) {
    try {
        if (req.headers.role !== "admin") {
            return res.status(403).json({
                status: "fail",
                message: "Access denied"
            });
        }

        const MessageModel = require("../model/MessageModel");
        const CaseModel = require("../model/CaseModel");

        const { page = 1, limit = 10 } = req.query;

        // ================= DATA =================
        const users = await UserModel.find().select("fullName createdAt role");
        const messages = await MessageModel.find().select("createdAt sender");
        const cases = await CaseModel.find().select("createdAt projectTitle");

        let logs = [];

        users.forEach(u => {
            logs.push({
                time: u.createdAt,
                user: u.fullName,
                action: `${u.role} registered`,
                module: "User",
                status: "Success"
            });
        });

        messages.forEach(m => {
            logs.push({
                time: m.createdAt,
                user: "User",
                action: "Message Sent",
                module: "Chat",
                status: "Success"
            });
        });

        cases.forEach(c => {
            logs.push({
                time: c.createdAt,
                user: c.projectTitle,
                action: "Case Created",
                module: "Case",
                status: "Success"
            });
        });

        // ================= SORT =================
        logs.sort((a, b) => new Date(b.time) - new Date(a.time));

        // ================= PAGINATION =================
        const start = (page - 1) * limit;
        const paginatedLogs = logs.slice(start, start + Number(limit));

        return res.status(200).json({
            status: "success",
            data: paginatedLogs,
            pagination: {
                total: logs.length,
                page: Number(page),
                pages: Math.ceil(logs.length / limit)
            }
        });

    } catch (error) {
        return res.status(500).json({
            status: "fail",
            message: error.message
        });
    }
}   



// =========================
// ADMIN: GET PENDING LAWYERS
// =========================
async GetPendingLawyers(req, res) {
    try {
        if (req.headers.role !== "admin") {
            return res.status(403).json({
                status: "fail",
                message: "Access denied"
            });
        }

        const lawyers = await UserModel.find({
            role: "lawyer",
            approvalStatus: "pending"
        })
        .select("_id fullName email phoneNumber barId createdAt")
        .sort({ createdAt: -1 });

        return res.status(200).json({
            status: "success",
            data: lawyers
        });

    } catch (error) {
        return res.status(500).json({
            status: "fail",
            message: error.message
        });
    }
}


// =========================
// ADMIN: APPROVE LAWYER
// =========================
async ApproveLawyer(req, res) {
    try {
        if (req.headers.role !== "admin") {
            return res.status(403).json({
                status: "fail",
                message: "Access denied"
            });
        }

        const { id } = req.params;

        const updatedUser = await UserModel.findByIdAndUpdate(id, {
    $set: { approvalStatus: "approved" }
});

if (updatedUser) {
    await createNotification(
        updatedUser._id,
        "Account Approved",
        "Your account has been approved by admin. You can now access the system.",
        "success"
    );
}
        return res.status(200).json({
            status: "success",
            message: "Lawyer approved successfully"
        });

    } catch (error) {
        return res.status(500).json({
            status: "fail",
            message: error.message
        });
    }
}


// =========================
// ADMIN: REJECT LAWYER
// =========================
async RejectLawyer(req, res) {
    try {
        if (req.headers.role !== "admin") {
            return res.status(403).json({
                status: "fail",
                message: "Access denied"
            });
        }

        const { id } = req.params;

       const updatedUser = await UserModel.findByIdAndUpdate(id, {
    $set: { approvalStatus: "rejected" }
});

if (updatedUser) {
    await createNotification(
        updatedUser._id,
        "Account Rejected",
        "Your account has been rejected by admin.",
        "warning"
    );
}

        return res.status(200).json({
            status: "success",
            message: "Lawyer rejected"
        });

    } catch (error) {
        return res.status(500).json({
            status: "fail",
            message: error.message
        });
    }
}   
}

module.exports = new UserController();  