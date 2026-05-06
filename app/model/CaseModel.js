const mongoose = require('mongoose');

const CaseSchema = new mongoose.Schema({

    caseCode: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },

    client: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'users',   
        required: true 
    },

    lawyer: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'users', 
        required: true 
    },

    projectTitle: { 
        type: String, 
        required: true 
    },

    // Financials
    totalBilled: { type: Number, default: 0 },
    totalPaid: { type: Number, default: 0 },

    // ✅ NEW: Payments History
    payments: [
        {
            amount: { type: Number, required: true },
            date: { type: Date, default: Date.now },
            status: { type: String, default: "completed" }
        }
    ],

    // Status & Schedule
    nextHearing: { type: String, default: "---" },
    caseStatus: { type: String, default: "Ongoing" },

    // Progress
    progress: { type: Number, default: 0 },

    // Milestones
    milestones: [{
        label: { type: String, required: true },
        date: { type: String, default: "Pending" },
        status: { 
            type: String, 
            enum: ['done', 'error', 'pending'], 
            default: 'pending' 
        },
        subText: { type: String, default: "" }
    }],

    // Activities
    activities: [{
        text: { type: String, required: true },
        time: { type: String, required: true }
    }],

    // Documents
    documents: [{
        fileName: { type: String, required: true },
        fileUrl: { type: String, required: true },
        fileType: { type: String },
        status: {
            type: String,
            enum: ["pending", "verified", "review", "rejected"],
            default: "pending"
        },
        uploadedAt: { type: Date, default: Date.now }
    }]

}, { 
    timestamps: true, 
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true } 
});

// Virtual Field
CaseSchema.virtual('amountDue').get(function() {
    return this.totalBilled - this.totalPaid;
});

const CaseModel = mongoose.model('cases', CaseSchema);
module.exports = CaseModel;