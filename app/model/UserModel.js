const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },

    role: { 
        type: String, 
        enum: ['lawyer', 'client', 'admin'],
        default: 'client' 
    },

    // --- Profile & UI Fields ---
    avatar: { type: String, default: "" },
    phoneNumber: { type: String },

    // --- Lawyer Fields ---
    barId: { type: String },
    specialization: { type: String },
    bio: { type: String },

    // --- Auth ---
    isVerified: { type: Boolean, default: false },
    otp: { type: String },

    // 🔥 EXISTING (KEEP)
    isBlocked: { type: Boolean, default: false },

    // ✅ NEW FIELD (IMPORTANT)
    approvalStatus: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "approved" // default safe for clients
    }

}, { timestamps: true, versionKey: false });

const UserModel = mongoose.model('users', UserSchema);
module.exports = UserModel;