import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { getAIRecommendations } from "../../../../../actions/aiRecommendations";

const AIInsightsCard = ({ userSkills = [] }) => {
    const dispatch = useDispatch();
    const [insights, setInsights] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (userSkills.length > 0) {
            fetchInsights();
        }
    }, [userSkills]);

    const fetchInsights = () => {
        setLoading(true);
        dispatch(getAIRecommendations(
            { algorithm: 'cosine', limit: 3 },
            (mentors) => {
                generateInsights(mentors);
                setLoading(false);
            }
        ));
    };

    const generateInsights = (mentors) => {
        const highMatches = mentors.filter(m => m.matchType === 'high').length;
        const avgScore = mentors.reduce((sum, m) => sum + (m.matchScore || 0), 0) / mentors.length;
        
        setInsights({
            totalMentors: mentors.length,
            highMatches,
            avgCompatibility: Math.round(avgScore),
            topMentor: mentors[0],
            recommendation: generateRecommendationText(highMatches, avgScore, mentors[0])
        });
    };

    const generateRecommendationText = (highMatches, avgScore, topMentor) => {
        if (highMatches > 0) {
            return `🎯 Great match! ${highMatches} mentors align perfectly with your skills.`;
        } else if (avgScore > 5) {
            return `📈 Good compatibility found. Consider ${topMentor?.firstname} for guidance.`;
        } else {
            return `💡 Expand your skills to find better mentor matches.`;
        }
    };

    if (userSkills.length === 0) {
        return (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">🤖 AI Insights</h4>
                <p className="text-sm text-blue-600">
                    Add your skills to get personalized AI mentor recommendations and insights!
                </p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">🤖 AI Insights</h4>
                <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    <span className="text-sm text-blue-600">Analyzing your profile...</span>
                </div>
            </div>
        );
    }

    if (!insights) return null;

    return (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-3">🤖 AI Insights</h4>
            
            <div className="space-y-2">
                <p className="text-sm text-blue-700 font-medium">
                    {insights.recommendation}
                </p>
                
                <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-white bg-opacity-60 p-2 rounded">
                        <div className="text-lg font-bold text-blue-600">{insights.totalMentors}</div>
                        <div className="text-xs text-blue-500">Matches</div>
                    </div>
                    <div className="bg-white bg-opacity-60 p-2 rounded">
                        <div className="text-lg font-bold text-green-600">{insights.highMatches}</div>
                        <div className="text-xs text-green-500">High Match</div>
                    </div>
                    <div className="bg-white bg-opacity-60 p-2 rounded">
                        <div className="text-lg font-bold text-purple-600">{insights.avgCompatibility}/10</div>
                        <div className="text-xs text-purple-500">Avg Score</div>
                    </div>
                </div>

                {insights.topMentor && (
                    <div className="bg-white bg-opacity-60 p-2 rounded mt-2">
                        <p className="text-xs text-gray-600">Top Match:</p>
                        <p className="text-sm font-medium text-gray-800">
                            {insights.topMentor.firstname} {insights.topMentor.lastname}
                        </p>
                        <p className="text-xs text-gray-500">{insights.topMentor.department}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AIInsightsCard;