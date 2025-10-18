const mongoose = require("mongoose");

const aiChatSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'userModel',
            required: true,
        },
        userModel: {
            type: String,
            required: true,
            enum: ['Student', 'Mentor']
        },
        messages: [{
            role: {
                type: String,
                enum: ['user', 'assistant'],
                required: true
            },
            content: {
                type: String,
                required: true
            },
            timestamp: {
                type: Date,
                default: Date.now
            }
        }],
        sessionId: {
            type: String,
            required: true
        }
    },
    {
        timestamps: true,
    }
);

const AiChat = mongoose.model("AiChat", aiChatSchema);

module.exports = AiChat;