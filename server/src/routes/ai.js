const express = require("express");
const router = express.Router();
const Auth = require("../middlewares/auth");
const Authorize = require("../middlewares/authorize");
const Role = require("../utils/roles");
const aiController = require("../controllers/ai.controller");
const Logger = require("../middlewares/logger");
const events = require("../utils/logEvents");

// Send message to AI chatbot
router.post(
    "/chat",
    Auth,
    Authorize([Role.Student, Role.Mentor]),
    aiController.sendMessage,
    Logger(events.AI_CHAT_MESSAGE)
);

// Get chat history for a session
router.get(
    "/chat/:sessionId",
    Auth,
    Authorize([Role.Student, Role.Mentor]),
    aiController.getChatHistory
);

// Get all chat sessions for user
router.get(
    "/sessions",
    Auth,
    Authorize([Role.Student, Role.Mentor]),
    aiController.getChatSessions
);

// Update user skills for better recommendations
router.post(
    "/skills",
    Auth,
    Authorize([Role.Student, Role.Mentor]),
    aiController.updateSkills,
    Logger(events.SKILLS_UPDATED)
);

module.exports = router;