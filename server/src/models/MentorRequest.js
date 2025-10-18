const mongoose = require("mongoose");

const mentorRequestSchema = new mongoose.Schema(
    {
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student",
            required: true,
        },
        mentor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Mentor",
            required: true,
        },
        status: {
            type: String,
            enum: ["pending", "accepted", "rejected"],
            default: "pending",
        },
        message: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

// Ensure a student can only have one pending request to a mentor
mentorRequestSchema.index({ student: 1, mentor: 1, status: 1 }, { unique: true });

const MentorRequest = mongoose.model("MentorRequest", mentorRequestSchema);

module.exports = MentorRequest;