import React, { useState, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { sendAiMessage, getChatHistory } from "../../actions/ai";
import ModalOverlay from "./ModalOverlay";

const MentAiChatModal = ({ isOpen, onClose }) => {
    const dispatch = useDispatch();
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const [recommendedMentors, setRecommendedMentors] = useState([]);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (isOpen && !sessionId) {
            // Start with welcome message
            setMessages([{
                role: 'assistant',
                content: "Hello! I'm MentAI, your AI assistant. I can help you find mentors based on your skills, answer questions about the mentoring system, and provide guidance. How can I help you today?",
                timestamp: new Date()
            }]);
        }
    }, [isOpen, sessionId]);

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
                <div className="flex justify-between items-center p-4 border-b bg-blue-500 text-white rounded-t-lg">
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
                    <div className="border-t p-4 bg-gray-50">
                        <h4 className="font-semibold mb-2">Recommended Mentors:</h4>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                            {recommendedMentors.map((mentor) => (
                                <div key={mentor._id} className="flex items-center space-x-2 text-sm">
                                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
                                        {mentor.firstname?.charAt(0)}{mentor.lastname?.charAt(0)}
                                    </div>
                                    <span className="font-medium">{mentor.firstname} {mentor.lastname}</span>
                                    <span className="text-gray-600">- {mentor.department}</span>
                                </div>
                            ))}
                        </div>
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
                        Try: "Recommend mentors for JavaScript and React skills"
                    </p>
                </div>
            </div>
        </ModalOverlay>
    );
};

export default MentAiChatModal;