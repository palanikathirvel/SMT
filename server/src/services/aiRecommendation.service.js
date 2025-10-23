const { cosine } = require('ml-distance');
const Mentor = require('../models/Mentor');

class AIRecommendationService {
    constructor() {
        this.skillVocabulary = new Set();
        this.skillToIndex = new Map();
    }

    // Step 2: Build vocabulary from all skills
    async buildVocabulary() {
        const mentors = await Mentor.find({ isBanned: false });
        this.skillVocabulary.clear();
        
        mentors.forEach(mentor => {
            if (mentor.expertise) {
                mentor.expertise.forEach(skill => {
                    this.skillVocabulary.add(skill.toLowerCase().trim());
                });
            }
        });

        // Create skill-to-index mapping
        this.skillToIndex.clear();
        Array.from(this.skillVocabulary).forEach((skill, index) => {
            this.skillToIndex.set(skill, index);
        });
    }

    // Step 2: Convert skills to vector representation
    skillsToVector(skills) {
        const vector = new Array(this.skillVocabulary.size).fill(0);
        
        if (skills && skills.length > 0) {
            skills.forEach(skill => {
                const normalizedSkill = skill.toLowerCase().trim();
                const index = this.skillToIndex.get(normalizedSkill);
                if (index !== undefined) {
                    vector[index] = 1;
                }
            });
        }
        
        return vector;
    }

    // Step 3: Calculate cosine similarity between mentee and mentor
    calculateSimilarity(menteeSkills, mentorSkills) {
        try {
            const menteeVector = this.skillsToVector(menteeSkills);
            const mentorVector = this.skillsToVector(mentorSkills);
            
            // Handle edge cases
            const menteeSum = menteeVector.reduce((a, b) => a + b, 0);
            const mentorSum = mentorVector.reduce((a, b) => a + b, 0);
            
            if (menteeSum === 0 || mentorSum === 0) {
                return 0;
            }
            
            // Calculate dot product
            let dotProduct = 0;
            for (let i = 0; i < menteeVector.length; i++) {
                dotProduct += menteeVector[i] * mentorVector[i];
            }
            
            // Calculate magnitudes
            const menteeMagnitude = Math.sqrt(menteeVector.reduce((sum, val) => sum + val * val, 0));
            const mentorMagnitude = Math.sqrt(mentorVector.reduce((sum, val) => sum + val * val, 0));
            
            if (menteeMagnitude === 0 || mentorMagnitude === 0) {
                return 0;
            }
            
            // Calculate cosine similarity
            return dotProduct / (menteeMagnitude * mentorMagnitude);
        } catch (error) {
            console.error('Error calculating cosine similarity:', error);
            return this.calculateKeywordOverlap(menteeSkills, mentorSkills);
        }
    }

    // Alternative: Simple keyword overlap percentage
    calculateKeywordOverlap(menteeSkills, mentorSkills) {
        if (!menteeSkills || !mentorSkills || menteeSkills.length === 0 || mentorSkills.length === 0) {
            return 0;
        }

        const menteeSet = new Set(menteeSkills.map(s => s.toLowerCase().trim()));
        const mentorSet = new Set(mentorSkills.map(s => s.toLowerCase().trim()));
        
        const intersection = new Set([...menteeSet].filter(x => mentorSet.has(x)));
        const union = new Set([...menteeSet, ...mentorSet]);
        
        return intersection.size / union.size; // Jaccard similarity
    }

    // Step 3: Main recommendation function
    async recommendMentors(menteeSkills, options = {}) {
        const { 
            limit = 10, 
            useCosineSimilarity = true,
            includeGeneralMentors = true 
        } = options;

        await this.buildVocabulary();
        
        const mentors = await Mentor.find({ isBanned: false })
            .select('firstname lastname department designation expertise studentCount avatar');

        // Calculate similarity scores
        const recommendations = mentors.map(mentor => {
            let similarityScore = 0;
            
            if (useCosineSimilarity) {
                similarityScore = this.calculateSimilarity(menteeSkills, mentor.expertise);
            } else {
                similarityScore = this.calculateKeywordOverlap(menteeSkills, mentor.expertise);
            }

            // Boost score based on mentor availability (lower student count = higher boost)
            const availabilityBoost = Math.max(0, (10 - mentor.studentCount) * 0.05);
            const finalScore = similarityScore + availabilityBoost;

            return {
                mentor: mentor.toObject(),
                similarityScore: Math.round(similarityScore * 100) / 100,
                availabilityBoost: Math.round(availabilityBoost * 100) / 100,
                finalScore: Math.round(finalScore * 100) / 100,
                matchType: similarityScore > 0.3 ? 'high' : similarityScore > 0.1 ? 'medium' : 'low'
            };
        });

        // Sort by final score
        let sortedRecommendations = recommendations
            .filter(rec => includeGeneralMentors || rec.similarityScore > 0)
            .sort((a, b) => b.finalScore - a.finalScore)
            .slice(0, limit);

        // If no good matches and mentee has skills, include some general mentors
        if (sortedRecommendations.length < 3 && menteeSkills && menteeSkills.length > 0) {
            const generalMentors = recommendations
                .filter(rec => rec.similarityScore === 0)
                .sort((a, b) => a.mentor.studentCount - b.mentor.studentCount)
                .slice(0, 3 - sortedRecommendations.length);
            
            sortedRecommendations = [...sortedRecommendations, ...generalMentors];
        }

        return sortedRecommendations.map(rec => ({
            ...rec.mentor,
            similarityScore: rec.similarityScore,
            matchScore: Math.round(rec.finalScore * 10), // Convert to 0-10 scale
            matchType: rec.matchType
        }));
    }

    // Enhanced recommendation with AI context
    async getAIRecommendationContext(menteeSkills, topMentors) {
        const context = {
            totalMentors: topMentors.length,
            highMatches: topMentors.filter(m => m.matchType === 'high').length,
            mediumMatches: topMentors.filter(m => m.matchType === 'medium').length,
            lowMatches: topMentors.filter(m => m.matchType === 'low').length,
            topSkills: this.extractTopMatchingSkills(menteeSkills, topMentors),
            recommendation: this.generateRecommendationText(menteeSkills, topMentors)
        };

        return context;
    }

    extractTopMatchingSkills(menteeSkills, mentors) {
        const skillCount = new Map();
        
        mentors.forEach(mentor => {
            if (mentor.expertise) {
                mentor.expertise.forEach(skill => {
                    const normalizedSkill = skill.toLowerCase().trim();
                    if (menteeSkills.some(ms => ms.toLowerCase().trim() === normalizedSkill)) {
                        skillCount.set(skill, (skillCount.get(skill) || 0) + 1);
                    }
                });
            }
        });

        return Array.from(skillCount.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([skill, count]) => ({ skill, mentorCount: count }));
    }

    generateRecommendationText(menteeSkills, mentors) {
        if (!menteeSkills || menteeSkills.length === 0) {
            return "Add your skills to get personalized mentor recommendations!";
        }

        const highMatches = mentors.filter(m => m.matchType === 'high').length;
        
        if (highMatches > 0) {
            return `Found ${highMatches} highly compatible mentors based on your skills: ${menteeSkills.slice(0, 3).join(', ')}`;
        } else {
            return `Based on your skills (${menteeSkills.slice(0, 3).join(', ')}), here are mentors who can help you grow in related areas.`;
        }
    }
}

module.exports = new AIRecommendationService();