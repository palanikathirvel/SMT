const Mentor = require('../models/Mentor');

class MentorRecommendationService {
    constructor() {
        this.skillGraph = new Map();
        this.mentorSkillMap = new Map();
    }

    // Build skill graph using BFS for efficient matching
    async buildSkillGraph() {
        const mentors = await Mentor.find({ isBanned: false })
            .select('_id firstname lastname department expertise studentCount avatar');

        this.skillGraph.clear();
        this.mentorSkillMap.clear();

        // Build adjacency list for skills
        mentors.forEach(mentor => {
            const mentorId = mentor._id.toString();
            this.mentorSkillMap.set(mentorId, mentor);

            if (mentor.expertise && mentor.expertise.length > 0) {
                mentor.expertise.forEach(skill => {
                    const normalizedSkill = skill.toLowerCase().trim();
                    
                    if (!this.skillGraph.has(normalizedSkill)) {
                        this.skillGraph.set(normalizedSkill, new Set());
                    }
                    this.skillGraph.get(normalizedSkill).add(mentorId);
                });
            }
        });
    }

    // BFS algorithm to find mentors based on student skills
    async findMentorsBySkillsBFS(studentSkills) {
        if (!studentSkills || studentSkills.length === 0) {
            return [];
        }

        await this.buildSkillGraph();

        const queue = [];
        const visited = new Set();
        const mentorScores = new Map();

        // Normalize student skills
        const normalizedStudentSkills = studentSkills.map(skill => 
            skill.toLowerCase().trim()
        );

        // Initialize BFS with direct skill matches
        normalizedStudentSkills.forEach(skill => {
            if (this.skillGraph.has(skill)) {
                const mentors = this.skillGraph.get(skill);
                mentors.forEach(mentorId => {
                    if (!mentorScores.has(mentorId)) {
                        mentorScores.set(mentorId, 0);
                    }
                    mentorScores.set(mentorId, mentorScores.get(mentorId) + 10); // Direct match score
                    queue.push({ mentorId, skill, depth: 0 });
                });
            }
        });

        // BFS traversal for related skills
        while (queue.length > 0) {
            const { mentorId, skill, depth } = queue.shift();

            if (visited.has(`${mentorId}-${skill}`) || depth > 2) {
                continue;
            }

            visited.add(`${mentorId}-${skill}`);

            // Find related skills (mentors with similar skill combinations)
            if (depth < 2) {
                const mentor = this.mentorSkillMap.get(mentorId);
                if (mentor && mentor.expertise) {
                    mentor.expertise.forEach(relatedSkill => {
                        const normalizedRelated = relatedSkill.toLowerCase().trim();
                        
                        if (this.skillGraph.has(normalizedRelated)) {
                            const relatedMentors = this.skillGraph.get(normalizedRelated);
                            relatedMentors.forEach(relatedMentorId => {
                                if (relatedMentorId !== mentorId) {
                                    if (!mentorScores.has(relatedMentorId)) {
                                        mentorScores.set(relatedMentorId, 0);
                                    }
                                    const score = Math.max(1, 5 - depth * 2); // Decreasing score by depth
                                    mentorScores.set(relatedMentorId, 
                                        mentorScores.get(relatedMentorId) + score
                                    );
                                    queue.push({ 
                                        mentorId: relatedMentorId, 
                                        skill: normalizedRelated, 
                                        depth: depth + 1 
                                    });
                                }
                            });
                        }
                    });
                }
            }
        }

        // Convert scores to ranked mentor list
        const rankedMentors = Array.from(mentorScores.entries())
            .map(([mentorId, score]) => ({
                mentor: this.mentorSkillMap.get(mentorId),
                score
            }))
            .filter(item => item.mentor)
            .sort((a, b) => {
                // Sort by score first, then by student count (lower is better)
                if (b.score !== a.score) {
                    return b.score - a.score;
                }
                return a.mentor.studentCount - b.mentor.studentCount;
            })
            .slice(0, 10) // Top 10 recommendations
            .map(item => ({
                ...item.mentor.toObject(),
                matchScore: item.score
            }));

        return rankedMentors;
    }

    // Quick skill similarity check
    calculateSkillSimilarity(studentSkills, mentorSkills) {
        if (!studentSkills || !mentorSkills) return 0;

        const studentSet = new Set(studentSkills.map(s => s.toLowerCase().trim()));
        const mentorSet = new Set(mentorSkills.map(s => s.toLowerCase().trim()));

        const intersection = new Set([...studentSet].filter(x => mentorSet.has(x)));
        const union = new Set([...studentSet, ...mentorSet]);

        return intersection.size / union.size; // Jaccard similarity
    }
}

module.exports = new MentorRecommendationService();