import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { sendAiMessage, getChatHistory } from "../../actions/ai";
import ModalOverlay from "./ModalOverlay";

const MentAiChatModal = ({ isOpen, onClose }) => {
    const dispatch = useDispatch();
    const authState = useSelector(state => state.auth || {});
    const user = authState.user;
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const [recommendedMentors, setRecommendedMentors] = useState([]);
    const messagesEndRef = useRef(null);
    
    // Get user skills based on role
    const userSkills = user?.role === 'Student' ? user?.skills : user?.expertise;

    useEffect(() => {
        if (isOpen && !sessionId) {
            // Start with personalized welcome message
            let welcomeMessage = `Hello${user?.firstname ? ` ${user.firstname}` : ''}! I'm MentAI, your AI assistant. `;
            
            if (userSkills && userSkills.length > 0) {
                welcomeMessage += `I can see you have skills in ${userSkills.slice(0, 3).join(', ')}${userSkills.length > 3 ? ' and more' : ''}. I can help you find mentors based on your skills, answer questions about the mentoring system, and provide guidance. Try asking me to 'recommend mentors' for personalized suggestions!`;
            } else {
                welcomeMessage += "I can help you find mentors, answer questions about the mentoring system, and provide guidance. For personalized mentor recommendations, consider updating your profile with your skills and interests. How can I help you today?";
            }
            
            setMessages([{
                role: 'assistant',
                content: welcomeMessage,
                timestamp: new Date()
            }]);
        }
    }, [isOpen, sessionId, user, userSkills]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleSendMessage = () => {
        if (!inputMessage.trim() || loading) return;

        const userMessage = {
            role: 'user',
            content: inputMessage,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setLoading(true);

        dispatch(sendAiMessage(
            { message: inputMessage, sessionId },
            (response) => {
                const aiMessage = {
                    role: 'assistant',
                    content: response.message,
                    timestamp: new Date()
                };

                setMessages(prev => [...prev, aiMessage]);
                setSessionId(response.sessionId);
                
                if (response.recommendedMentors) {
                    setRecommendedMentors(response.recommendedMentors);
                }
                
                setLoading(false);
                setInputMessage("");
            }
        ));
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    if (!isOpen) return null;

    return (
        <ModalOverlay>
            <div className="bg-white rounded-lg w-full max-w-2xl h-[600px] flex flex-col shadow-xl">
                {/* Header */}
                <div className="bg-blue-500 text-white rounded-t-lg">
                    <div className="flex justify-between items-center p-4 border-b border-blue-400">
                        <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                                <span className="text-sm font-bold">AI</span>
                            </div>
                            <h2 className="text-lg font-bold">MentAI Assistant</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white hover:text-gray-200 text-xl"
                        >
                            ✕
                        </button>
                    </div>
                    
                    {/* User Skills Display */}
                    {user && userSkills && userSkills.length > 0 && (
                        <div className="px-4 pb-3">
                            <div className="text-xs text-blue-100 mb-1">
                                Your {user.role === 'Student' ? 'Skills' : 'Expertise'}:
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {userSkills.slice(0, 5).map((skill, index) => (
                                    <span key={index} className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded-full">
                                        {skill}
                                    </span>
                                ))}
                                {userSkills.length > 5 && (
                                    <span className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded-full">
                                        +{userSkills.length - 5} more
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((message, index) => (
                        <div
                            key={index}
                            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                    message.role === 'user'
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-gray-200 text-gray-800'
                                }`}
                            >
                                <p className="text-sm">{message.content}</p>
                                <p className="text-xs opacity-70 mt-1">
                                    {new Date(message.timestamp).toLocaleTimeString()}
                                </p>
                            </div>
                        </div>
                    ))}
                    
                    {loading && (
                        <div className="flex justify-start">
                            <div className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg">
                                <div className="flex space-x-1">
                                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                </div>

                {/* Recommended Mentors */}
                {recommendedMentors.length > 0 && (
                    <div className="border-t p-4 bg-gradient-to-r from-blue-50 to-indigo-50">
                        <h4 className="font-semibold mb-2 text-blue-800">🤖 AI Recommended Mentors:</h4>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                            {recommendedMentors.map((mentor) => (
                                <div key={mentor._id} className="flex items-center justify-between p-2 bg-white rounded-lg shadow-sm">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                            {mentor.firstname?.charAt(0)}{mentor.lastname?.charAt(0)}
                                        </div>
                                        <div>
                                            <span className="font-medium text-gray-800">{mentor.firstname} {mentor.lastname}</span>
                                            <p className="text-xs text-gray-600">{mentor.department}</p>
                                            {mentor.expertise && (
                                                <p className="text-xs text-blue-600">
                                                    {mentor.expertise.slice(0, 2).join(', ')}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    {mentor.matchScore && (
                                        <div className="text-right">
                                            <div className="text-xs font-bold text-green-600">
                                                {mentor.matchScore}/10
                                            </div>
                                            <div className="text-xs text-gray-500">Match</div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        <button 
                            onClick={() => window.dispatchEvent(new CustomEvent('openAIRecommendations'))}
                            className="mt-2 w-full text-xs bg-blue-500 text-white py-1 px-2 rounded hover:bg-blue-600 transition-colors"
                        >
                            View All AI Recommendations
                        </button>
                    </div>
                )}

                {/* Input */}
                <div className="border-t p-4">
                    <div className="flex space-x-2">
                        <textarea
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Ask MentAI anything..."
                            className="flex-1 border rounded-lg px-3 py-2 resize-none"
                            rows="2"
                            disabled={loading}
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={loading || !inputMessage.trim()}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                        >
                            Send
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        {user && userSkills && userSkills.length > 0 
                            ? "Try: 'Recommend mentors' or 'Find mentors for machine learning'"
                            : "Try: 'Recommend mentors for JavaScript and React' or update your profile skills"
                        }
                    </p>
                </div>
            </div>
        </ModalOverlay>
    );
};

export default MentAiChatModal;