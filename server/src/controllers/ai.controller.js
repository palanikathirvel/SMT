const AiChat = require('../models/AiChat');
const Student = require('../models/Student');
const Mentor = require('../models/Mentor');
const aiService = require('../services/ai.service');
const response = require('../utils/responses.utils');
const roles = require('../utils/roles');

// Simple session ID generator
const generateSessionId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

module.exports = {
    // Send message to AI chatbot
    sendMessage: async (req, res, next) => {
        try {
            const { message, sessionId } = req.body;
            const userId = req.user._id;
            const userType = req.user.role === roles.Student ? 'Student' : 'Mentor';

            if (!message) {
                return response.badrequest(res, "Message is required", {});
            }

            const currentSessionId = sessionId || generateSessionId();

            // Get system context
            const context = await aiService.getSystemContext(userId, userType);

            // Check if message is asking for mentor recommendations
            const lowerMessage = message.toLowerCase();
            let aiResponse;
            let recommendedMentors = [];

            if (lowerMessage.includes('mentor') && (lowerMessage.includes('recommend') || lowerMessage.includes('suggest'))) {
                // Extract skills from message or use user's skills
                const skillsMatch = message.match(/skills?:?\s*([^.!?]+)/i);
                let skills = [];
                
                if (skillsMatch) {
                    skills = skillsMatch[1].split(',').map(s => s.trim());
                } else if (userType === 'Student' && req.user.skills) {
                    skills = req.user.skills;
                }

                if (skills.length > 0) {
                    recommendedMentors = await aiService.findMentorsBySkills(skills);
                    aiResponse = `Based on your skills (${skills.join(', ')}), I found ${recommendedMentors.length} mentors who might be a good match for you. Check the recommendations below!`;
                } else {
                    aiResponse = "To recommend the best mentors for you, please tell me about your skills or interests. For example: 'I'm interested in JavaScript, React, and web development'";
                }
            } else {
                // Generate AI response
                aiResponse = await aiService.generateResponse(message, context);
            }

            // Find or create chat session
            let chatSession = await AiChat.findOne({ 
                user: userId, 
                userModel: userType,
                sessionId: currentSessionId 
            });

            if (!chatSession) {
                chatSession = new AiChat({
                    user: userId,
                    userModel: userType,
                    sessionId: currentSessionId,
                    messages: []
                });
            }

            // Add user message and AI response
            chatSession.messages.push({
                role: 'user',
                content: message
            });

            chatSession.messages.push({
                role: 'assistant',
                content: aiResponse
            });

            await chatSession.save();

            response.success(res, "", { 
                message: aiResponse, 
                sessionId: currentSessionId,
                recommendedMentors: recommendedMentors.length > 0 ? recommendedMentors : undefined
            });
            next();
        } catch (err) {
            console.log(err);
            response.error(res);
        }
    },

    // Get chat history
    getChatHistory: async (req, res, next) => {
        try {
            const { sessionId } = req.params;
            const userId = req.user._id;
            const userType = req.user.role === roles.Student ? 'Student' : 'Mentor';

            const chatSession = await AiChat.findOne({ 
                user: userId, 
                userModel: userType,
                sessionId 
            });

            if (!chatSession) {
                return response.success(res, "", { messages: [] });
            }

            response.success(res, "", { messages: chatSession.messages });
            next();
        } catch (err) {
            console.log(err);
            response.error(res);
        }
    },

    // Get all chat sessions for user
    getChatSessions: async (req, res, next) => {
        try {
            const userId = req.user._id;
            const userType = req.user.role === roles.Student ? 'Student' : 'Mentor';

            const sessions = await AiChat.find({ 
                user: userId, 
                userModel: userType 
            }).select('sessionId createdAt messages').sort({ updatedAt: -1 });

            const sessionList = sessions.map(session => ({
                sessionId: session.sessionId,
                lastMessage: session.messages[session.messages.length - 1]?.content || '',
                messageCount: session.messages.length,
                lastUpdated: session.updatedAt
            }));

            response.success(res, "", { sessions: sessionList });
            next();
        } catch (err) {
            console.log(err);
            response.error(res);
        }
    },

    // Update user skills (for better recommendations)
    updateSkills: async (req, res, next) => {
        try {
            const { skills } = req.body;
            const userId = req.user._id;
            const userType = req.user.role === roles.Student ? 'Student' : 'Mentor';

            console.log('Updating skills for user:', userId, 'Type:', userType, 'Skills:', skills);

            if (!skills || !Array.isArray(skills)) {
                return response.badrequest(res, "Skills array is required", {});
            }

            let updatedUser;
            if (userType === 'Student') {
                updatedUser = await Student.findByIdAndUpdate(
                    userId, 
                    { skills }, 
                    { new: true, runValidators: true }
                );
            } else {
                updatedUser = await Mentor.findByIdAndUpdate(
                    userId, 
                    { expertise: skills }, 
                    { new: true, runValidators: true }
                );
            }

            if (!updatedUser) {
                return response.error(res, "User not found", {});
            }

            console.log('Skills updated successfully for user:', userId);
            response.success(res, "Skills updated successfully", { skills });
            next();
        } catch (err) {
            console.error('Error updating skills:', err);
            response.error(res, "Failed to update skills", {});
        }
    }
};