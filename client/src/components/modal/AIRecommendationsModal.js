import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { getAIRecommendations } from "../../actions/aiRecommendations";
import { sendMentorRequest } from "../../actions/student";
import ModalOverlay from "./ModalOverlay";

const AIRecommendationsModal = ({ isOpen, onClose }) => {
    const dispatch = useDispatch();
    const [recommendations, setRecommendations] = useState([]);
    const [context, setContext] = useState({});
    const [algorithm, setAlgorithm] = useState('cosine');
    const [loading, setLoading] = useState(false);
    const [selectedMentor, setSelectedMentor] = useState(null);
    const [message, setMessage] = useState("");

    useEffect(() => {
        if (isOpen) {
            fetchRecommendations();
        }
    }, [isOpen, algorithm]);

    const fetchRecommendations = () => {
        setLoading(true);
        dispatch(getAIRecommendations(
            { algorithm, limit: 10 },
            (mentors) => {
                setRecommendations(mentors);
                setLoading(false);
            },
            setContext
        ));
    };

    const handleSendRequest = () => {
        if (!selectedMentor) return;
        
        dispatch(sendMentorRequest(
            { mentorId: selectedMentor._id, message },
            () => {
                setSelectedMentor(null);
                setMessage("");
                onClose();
            }
        ));
    };

    const getMatchColor = (matchType) => {
        switch (matchType) {
            case 'high': return 'text-green-600 bg-green-100';
            case 'medium': return 'text-yellow-600 bg-yellow-100';
            case 'low': return 'text-gray-600 bg-gray-100';
            default: return 'text-blue-600 bg-blue-100';
        }
    };

    if (!isOpen) return null;

    return (
        <ModalOverlay>
            <div className="bg-white rounded-lg p-6 w-full max-w-5xl max-h-[85vh] overflow-y-auto shadow-xl">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h2 className="text-xl font-bold">🤖 AI Mentor Recommendations</h2>
                        <p className="text-sm text-gray-600">{context.recommendation}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl">✕</button>
                </div>

                {/* Algorithm Selector */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <label className="block text-sm font-medium mb-2">AI Algorithm:</label>
                    <div className="flex space-x-4">
                        <label className="flex items-center">
                            <input
                                type="radio"
                                value="cosine"
                                checked={algorithm === 'cosine'}
                                onChange={(e) => setAlgorithm(e.target.value)}
                                className="mr-2"
                            />
                            Cosine Similarity (Vector-based)
                        </label>
                        <label className="flex items-center">
                            <input
                                type="radio"
                                value="keyword"
                                checked={algorithm === 'keyword'}
                                onChange={(e) => setAlgorithm(e.target.value)}
                                className="mr-2"
                            />
                            Keyword Overlap (Jaccard)
                        </label>
                    </div>
                </div>

                {/* Context Stats */}
                {context.totalMentors > 0 && (
                    <div className="mb-4 grid grid-cols-4 gap-4 text-center">
                        <div className="bg-green-50 p-2 rounded">
                            <div className="text-lg font-bold text-green-600">{context.highMatches}</div>
                            <div className="text-xs text-green-600">High Match</div>
                        </div>
                        <div className="bg-yellow-50 p-2 rounded">
                            <div className="text-lg font-bold text-yellow-600">{context.mediumMatches}</div>
                            <div className="text-xs text-yellow-600">Medium Match</div>
                        </div>
                        <div className="bg-gray-50 p-2 rounded">
                            <div className="text-lg font-bold text-gray-600">{context.lowMatches}</div>
                            <div className="text-xs text-gray-600">Low Match</div>
                        </div>
                        <div className="bg-blue-50 p-2 rounded">
                            <div className="text-lg font-bold text-blue-600">{context.totalMentors}</div>
                            <div className="text-xs text-blue-600">Total Found</div>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="text-center py-8">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        <p className="mt-2 text-gray-600">Analyzing with AI...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {recommendations.map((mentor) => (
                            <div
                                key={mentor._id}
                                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                                    selectedMentor?._id === mentor._id
                                        ? "border-blue-500 bg-blue-50 shadow-md"
                                        : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                                }`}
                                onClick={() => setSelectedMentor(mentor)}
                            >
                                <div className="flex items-start space-x-3">
                                    <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                                        {mentor.avatar?.url ? (
                                            <img src={mentor.avatar.url} alt="Avatar" className="w-12 h-12 rounded-full object-cover" />
                                        ) : (
                                            <span className="text-gray-600 font-semibold">
                                                {mentor.firstname?.charAt(0)}{mentor.lastname?.charAt(0)}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold">{mentor.firstname} {mentor.lastname}</h3>
                                        <p className="text-sm text-gray-600">{mentor.department}</p>
                                        <p className="text-sm text-gray-500">{mentor.designation}</p>
                                        
                                        <div className="flex items-center space-x-2 mt-2">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMatchColor(mentor.matchType)}`}>
                                                {mentor.similarityScore > 0 ? `${Math.round(mentor.similarityScore * 100)}% Match` : 'General'}
                                            </span>
                                            <span className="text-xs text-blue-600">
                                                AI Score: {mentor.matchScore}/10
                                            </span>
                                        </div>

                                        {mentor.expertise && mentor.expertise.length > 0 && (
                                            <div className="mt-2">
                                                <div className="flex flex-wrap gap-1">
                                                    {mentor.expertise.slice(0, 3).map((skill, idx) => (
                                                        <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded">
                                                            {skill}
                                                        </span>
                                                    ))}
                                                    {mentor.expertise.length > 3 && (
                                                        <span className="text-xs text-gray-400">+{mentor.expertise.length - 3}</span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {selectedMentor && (
                    <div className="border-t pt-4 mt-4">
                        <h3 className="font-semibold mb-2">
                            Send Request to {selectedMentor.firstname} {selectedMentor.lastname}
                        </h3>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Optional message to the mentor..."
                            className="w-full p-3 border rounded-lg resize-none"
                            rows="3"
                        />
                        <div className="flex justify-end space-x-2 mt-3">
                            <button
                                onClick={() => { setSelectedMentor(null); setMessage(""); }}
                                className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSendRequest}
                                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                            >
                                Send AI-Recommended Request
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </ModalOverlay>
    );
};

export default AIRecommendationsModal;