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
                // Get user's current skills from database
                let userSkills = [];
                let userProfile = {};
                
                if (userType === 'Student') {
                    const student = await Student.findById(userId).select('skills department semester firstname lastname');
                    userSkills = student?.skills || [];
                    userProfile = {
                        skills: userSkills,
                        department: student?.department,
                        semester: student?.semester,
                        name: `${student?.firstname} ${student?.lastname}`
                    };
                } else {
                    const mentor = await Mentor.findById(userId).select('expertise department designation firstname lastname');
                    userSkills = mentor?.expertise || [];
                    userProfile = {
                        skills: userSkills,
                        department: mentor?.department,
                        designation: mentor?.designation,
                        name: `${mentor?.firstname} ${mentor?.lastname}`
                    };
                }
                
                // Extract additional skills from message if mentioned
                const skillsMatch = message.match(/(?:skills?|interested in|looking for):?\s*([^.!?]+)/i);
                let messageSkills = [];
                if (skillsMatch) {
                    messageSkills = skillsMatch[1].split(/[,&and]+/).map(s => s.trim()).filter(s => s.length > 0);
                }
                
                // Combine user skills with message skills
                const allSkills = [...new Set([...userSkills, ...messageSkills])];

                if (allSkills.length > 0) {
                    recommendedMentors = await aiService.findMentorsBySkills(allSkills);
                    
                    // Generate smart AI recommendation
                    aiResponse = await aiService.generateSmartRecommendation(userProfile, recommendedMentors, allSkills);
                } else {
                    aiResponse = userType === 'Student' 
                        ? "I notice you haven't added any skills to your profile yet. Please update your skills in your profile settings to get personalized mentor recommendations, or tell me what skills you're interested in learning!"
                        : "I can help you find mentors based on specific skills. What skills or areas of expertise are you looking for in a mentor?";
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


};