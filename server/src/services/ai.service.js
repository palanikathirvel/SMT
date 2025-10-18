const axios = require('axios');
const Student = require('../models/Student');
const Mentor = require('../models/Mentor');

class AIService {
    constructor() {
        this.apiKey = process.env.HUGGINGFACE_API_KEY;
        this.model = process.env.AI_MODEL || 'microsoft/DialoGPT-medium';
        this.baseURL = 'https://api-inference.huggingface.co/models/';
    }

    async generateResponse(message, context = '') {
        try {
            // If no API key, use simple rule-based responses
            if (!this.apiKey) {
                return this.getRuleBasedResponse(message, context);
            }

            const response = await axios.post(
                `${this.baseURL}${this.model}`,
                {
                    inputs: `${context}\nUser: ${message}\nMentAI:`,
                    parameters: {
                        max_length: 150,
                        temperature: 0.7,
                        do_sample: true
                    }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return response.data[0]?.generated_text?.split('MentAI:')[1]?.trim() || 
                   this.getRuleBasedResponse(message, context);
        } catch (error) {
            console.error('AI API Error:', error.message);
            return this.getRuleBasedResponse(message, context);
        }
    }

    getRuleBasedResponse(message, context) {
        const lowerMessage = message.toLowerCase();
        
        // Mentor recommendation responses
        if (lowerMessage.includes('mentor') && (lowerMessage.includes('recommend') || lowerMessage.includes('suggest'))) {
            return "I can help you find the perfect mentor! Please tell me about your skills or interests, and I'll suggest mentors who match your profile.";
        }
        
        // Skill-based responses
        if (lowerMessage.includes('skill') || lowerMessage.includes('learn')) {
            return "Great! Learning new skills is important. What specific skills are you interested in? I can help connect you with mentors who specialize in those areas.";
        }
        
        // General mentoring responses
        if (lowerMessage.includes('help') || lowerMessage.includes('guidance')) {
            return "I'm here to help! As MentAI, I can assist you with finding mentors, answering questions about the mentoring system, and providing guidance on your academic journey.";
        }
        
        // Default responses
        const defaultResponses = [
            "Hello! I'm MentAI, your AI assistant. How can I help you today?",
            "I'm here to assist you with mentoring-related questions. What would you like to know?",
            "Feel free to ask me about mentors, skills, or any guidance you need!",
            "I can help you find mentors based on your interests and skills. What are you looking for?"
        ];
        
        return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
    }

    async findMentorsBySkills(skills) {
        try {
            const skillsArray = Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim());
            
            const mentors = await Mentor.find({
                isBanned: false,
                $or: [
                    { expertise: { $in: skillsArray.map(skill => new RegExp(skill, 'i')) } },
                    { specialization: { $in: skillsArray.map(skill => new RegExp(skill, 'i')) } },
                    { department: { $in: skillsArray.map(skill => new RegExp(skill, 'i')) } }
                ]
            }).select('firstname lastname department designation expertise specialization studentCount avatar');

            return mentors;
        } catch (error) {
            console.error('Error finding mentors by skills:', error);
            return [];
        }
    }

    async getSystemContext(userId, userType) {
        try {
            let context = "You are MentAI, an AI assistant for a student mentoring system. ";
            
            if (userType === 'Student') {
                const student = await Student.findById(userId);
                context += `The user is a student named ${student.firstname} ${student.lastname} `;
                context += `studying ${student.department} in semester ${student.semester}. `;
                if (student.skills && student.skills.length > 0) {
                    context += `Their skills include: ${student.skills.join(', ')}. `;
                }
            } else if (userType === 'Mentor') {
                const mentor = await Mentor.findById(userId);
                context += `The user is a mentor named ${mentor.firstname} ${mentor.lastname} `;
                context += `from ${mentor.department} department with designation ${mentor.designation}. `;
                if (mentor.expertise && mentor.expertise.length > 0) {
                    context += `Their expertise includes: ${mentor.expertise.join(', ')}. `;
                }
            }
            
            context += "Help them with mentoring-related questions and guidance.";
            return context;
        } catch (error) {
            console.error('Error getting system context:', error);
            return "You are MentAI, an AI assistant for a student mentoring system.";
        }
    }
}

module.exports = new AIService();