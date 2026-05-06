const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const UserModel = require('../model/UserModel');

module.exports = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                status: "fail",
                message: "Unauthorized: No token provided"
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_ACCESS_KEY);

        // ✅ ALWAYS USE ONE FIELD (IMPORTANT)
        const userId = decoded.user_id;

        // =========================
        // ✅ ADMIN CASE
        // =========================
        if (userId === "ADMIN_001") {
            req.user = {
                id: "ADMIN_001",
                email: decoded.email,
                role: "admin"
            };

            req.headers.user_id = "ADMIN_001";
            req.headers.role = "admin";
            req.headers.email = decoded.email;

            return next();
        }

        // =========================
        // ✅ VALIDATE OBJECT ID
        // =========================
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                status: "fail",
                message: "Invalid user ID"
            });
        }

        // =========================
        // ✅ FETCH USER
        // =========================
        const user = await UserModel.findById(userId);

        if (!user) {
            return res.status(404).json({
                status: "fail",
                message: "User not found"
            });
        }

        // =========================
        // 🔥 BLOCK CHECK
        // =========================
        if (user.isBlocked) {
            return res.status(403).json({
                status: "blocked",
                message: "You are blocked by admin"
            });
        }

        // =========================
        // ✅ ATTACH USER
        // =========================
        req.user = user;

        // 🔥🔥 CRITICAL FIX: ALWAYS STRING
        req.headers.user_id = user._id.toString();
        req.headers.role = user.role;
        req.headers.email = user.email;

        next();

    } catch (error) {
        return res.status(403).json({
            status: "fail",
            message: "Invalid or expired token"
        });
    }
};