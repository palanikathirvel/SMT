import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { getMentorRequests, acceptMentorRequest, rejectMentorRequest } from "../../actions/mentor";
import ModalOverlay from "./ModalOverlay";

const MentorRequestsModal = ({ isOpen, onClose }) => {
    const dispatch = useDispatch();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState({});

    useEffect(() => {
        if (isOpen) {
            dispatch(getMentorRequests(setRequests));
        }
    }, [isOpen, dispatch]);

    const handleAccept = (requestId) => {
        setLoading(prev => ({ ...prev, [requestId]: 'accepting' }));
        dispatch(acceptMentorRequest(requestId, () => {
            setLoading(prev => ({ ...prev, [requestId]: null }));
            // Refresh requests
            dispatch(getMentorRequests(setRequests));
        }));
    };

    const handleReject = (requestId) => {
        setLoading(prev => ({ ...prev, [requestId]: 'rejecting' }));
        dispatch(rejectMentorRequest(requestId, () => {
            setLoading(prev => ({ ...prev, [requestId]: null }));
            // Refresh requests
            dispatch(getMentorRequests(setRequests));
        }));
    };

    if (!isOpen) return null;

    return (
        <ModalOverlay>
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Mentor Requests</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        ✕
                    </button>
                </div>

                {requests.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        No pending requests
                    </div>
                ) : (
                    <div className="space-y-4">
                        {requests.map((request) => (
                            <div
                                key={request._id}
                                className="border rounded-lg p-4 bg-gray-50"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center space-x-3 flex-1">
                                        <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                                            {request.student.avatar?.url ? (
                                                <img
                                                    src={request.student.avatar.url}
                                                    alt="Avatar"
                                                    className="w-12 h-12 rounded-full object-cover"
                                                />
                                            ) : (
                                                <span className="text-gray-600 font-semibold">
                                                    {request.student.firstname?.charAt(0)}
                                                    {request.student.lastname?.charAt(0)}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold">
                                                {request.student.firstname} {request.student.lastname}
                                            </h3>
                                            <p className="text-sm text-gray-600">
                                                {request.student.email}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {request.student.department} - Semester {request.student.semester}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                Enrollment: {request.student.enrollment_no}
                                            </p>
                                            {request.message && (
                                                <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                                                    <strong>Message:</strong> {request.message}
                                                </div>
                                            )}
                                            <p className="text-xs text-gray-400 mt-1">
                                                Requested: {new Date(request.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex space-x-2 ml-4">
                                        <button
                                            onClick={() => handleAccept(request._id)}
                                            disabled={loading[request._id]}
                                            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 text-sm"
                                        >
                                            {loading[request._id] === 'accepting' ? 'Accepting...' : 'Accept'}
                                        </button>
                                        <button
                                            onClick={() => handleReject(request._id)}
                                            disabled={loading[request._id]}
                                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 text-sm"
                                        >
                                            {loading[request._id] === 'rejecting' ? 'Rejecting...' : 'Reject'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </ModalOverlay>
    );
};

export default MentorRequestsModal;