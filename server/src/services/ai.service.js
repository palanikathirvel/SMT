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
            // Try OpenAI first if available
            if (process.env.OPENAI_API_KEY) {
                return await this.getOpenAIResponse(message, context);
            }
            
            // Fallback to Hugging Face
            if (this.apiKey) {
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
            }
            
            return this.getRuleBasedResponse(message, context);
        } catch (error) {
            console.error('AI API Error:', error.message);
            return this.getRuleBasedResponse(message, context);
        }
    }

    async getOpenAIResponse(message, context) {
        try {
            const response = await axios.post(
                'https://api.openai.com/v1/chat/completions',
                {
                    model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
                    messages: [
                        {
                            role: 'system',
                            content: `You are MentAI, an AI assistant for a student mentoring system. ${context} Provide helpful, concise responses about mentoring, learning, and academic guidance.`
                        },
                        {
                            role: 'user',
                            content: message
                        }
                    ],
                    max_tokens: 150,
                    temperature: 0.7
                },
                {
                    headers: {
                        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return response.data.choices[0]?.message?.content?.trim() || 
                   this.getRuleBasedResponse(message, context);
        } catch (error) {
            console.error('OpenAI API Error:', error.message);
            throw error;
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
            const aiRecommendationService = require('./aiRecommendation.service');
            return await aiRecommendationService.recommendMentors(skills, { limit: 5 });
        } catch (error) {
            console.error('Error finding mentors by skills:', error);
            return [];
        }
    }



    async generateSmartRecommendation(userProfile, mentors, skills = []) {
        if (!process.env.OPENAI_API_KEY) {
            return this.generateBasicRecommendation(userProfile, mentors, skills);
        }

        try {
            const userSkills = skills.length > 0 ? skills : (userProfile.skills || []);
            const prompt = `Based on this user profile:
Name: ${userProfile.name}
Skills: ${userSkills.join(', ') || 'None specified'}
Department: ${userProfile.department}
${userProfile.semester ? `Semester: ${userProfile.semester}` : ''}
${userProfile.designation ? `Designation: ${userProfile.designation}` : ''}

And these recommended mentors:
${mentors.slice(0, 3).map(m => `- ${m.firstname} ${m.lastname} (${m.department}, Expertise: ${m.expertise?.join(', ') || 'General'}, Match Score: ${m.matchScore}/10)`).join('\n')}

Provide a brief, personalized recommendation (2-3 sentences) explaining why these mentors are good matches and how they can help.`;

            const response = await this.getOpenAIResponse(prompt, 'You are an AI mentor matching expert. Be concise and helpful.');
            return response;
        } catch (error) {
            console.error('Smart recommendation error:', error);
            return this.generateBasicRecommendation(userProfile, mentors, skills);
        }
    }

    generateBasicRecommendation(userProfile, mentors, skills = []) {
        const userSkills = skills.length > 0 ? skills : (userProfile.skills || []);
        
        if (userSkills.length === 0) {
            return "I recommend updating your profile with your skills and interests to get personalized mentor matches. These mentors can help you explore different areas and guide your learning journey.";
        }
        
        const topSkills = userSkills.slice(0, 3).join(', ');
        const matchCount = mentors.filter(m => m.matchScore > 5).length;
        
        if (matchCount > 0) {
            return `Great! I found ${matchCount} mentors with strong expertise in your areas of interest (${topSkills}). These mentors have relevant experience and can provide valuable guidance for your learning goals.`;
        } else {
            return `Based on your skills in ${topSkills}, I've found mentors who can help you develop in related areas and expand your knowledge. They bring diverse expertise that complements your current skillset.`;
        }
    }

    async getSystemContext(userId, userType) {
        try {
            let context = "You are MentAI, an AI assistant for a student mentoring system. ";
            
            if (userType === 'Student') {
                const student = await Student.findById(userId).select('firstname lastname department semester skills');
                if (student) {
                    context += `The user is a student named ${student.firstname} ${student.lastname} `;
                    context += `studying ${student.department} in semester ${student.semester}. `;
                    if (student.skills && student.skills.length > 0) {
                        context += `Their skills include: ${student.skills.join(', ')}. `;
                    }
                }
            } else if (userType === 'Mentor') {
                const mentor = await Mentor.findById(userId).select('firstname lastname department designation expertise');
                if (mentor) {
                    context += `The user is a mentor named ${mentor.firstname} ${mentor.lastname} `;
                    context += `from ${mentor.department} department with designation ${mentor.designation}. `;
                    if (mentor.expertise && mentor.expertise.length > 0) {
                        context += `Their expertise includes: ${mentor.expertise.join(', ')}. `;
                    }
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