import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { getAvailableMentors, sendMentorRequest } from "../../actions/student";
import ModalOverlay from "./ModalOverlay";

const MentorListModal = ({ isOpen, onClose }) => {
    const dispatch = useDispatch();
    const [mentors, setMentors] = useState([]);
    const [selectedMentor, setSelectedMentor] = useState(null);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [fetchingMentors, setFetchingMentors] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setFetchingMentors(true);
            console.log('Fetching mentors...');
            dispatch(getAvailableMentors((mentorsList) => {
                console.log('Mentors received:', mentorsList);
                setMentors(mentorsList);
                setFetchingMentors(false);
            }));
        }
    }, [isOpen, dispatch]);

    const handleSendRequest = () => {
        if (!selectedMentor) return;
        
        setLoading(true);
        dispatch(sendMentorRequest(
            { mentorId: selectedMentor._id, message },
            () => {
                setLoading(false);
                onClose();
                setSelectedMentor(null);
                setMessage("");
            }
        ));
    };

    console.log('MentorListModal render - isOpen:', isOpen, 'mentors:', mentors.length);
    
    if (!isOpen) return null;

    return (
        <ModalOverlay>
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto shadow-xl">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Available Mentors</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        ✕
                    </button>
                </div>

                {fetchingMentors ? (
                    <div className="text-center py-8">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        <p className="mt-2 text-gray-600">Loading mentors...</p>
                    </div>
                ) : mentors.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <p className="text-lg mb-2">No mentors available at the moment.</p>
                        <p className="text-sm">Please check back later or contact the administrator.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {mentors.map((mentor) => (
                        <div
                            key={mentor._id}
                            className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                                selectedMentor?._id === mentor._id
                                    ? "border-blue-500 bg-blue-50"
                                    : "border-gray-200 hover:border-gray-300"
                            }`}
                            onClick={() => setSelectedMentor(mentor)}
                        >
                            <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                                    {mentor.avatar?.url ? (
                                        <img
                                            src={mentor.avatar.url}
                                            alt="Avatar"
                                            className="w-12 h-12 rounded-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-gray-600 font-semibold">
                                            {mentor.firstname?.charAt(0)}
                                            {mentor.lastname?.charAt(0)}
                                        </span>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold">
                                        {mentor.firstname} {mentor.lastname}
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        {mentor.department}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {mentor.designation}
                                    </p>
                                    <p className="text-xs text-blue-600">
                                        Current Students: {mentor.studentCount}
                                    </p>
                                </div>
                            </div>
                        </div>
                        ))}
                    </div>
                )}

                {selectedMentor && (
                    <div className="border-t pt-4">
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
                                onClick={() => {
                                    setSelectedMentor(null);
                                    setMessage("");
                                }}
                                className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSendRequest}
                                disabled={loading}
                                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                            >
                                {loading ? "Sending..." : "Send Request"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </ModalOverlay>
    );
};

export default MentorListModal;