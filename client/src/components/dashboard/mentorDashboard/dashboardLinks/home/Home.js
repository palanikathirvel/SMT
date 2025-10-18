import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useHistory } from "react-router-dom";
import { getStats } from "../../../../../actions/stats";
import AcademicCapIcon from "../../../../../assets/icons/AcademicCapIcon";
import AnnotationIcon from "../../../../../assets/icons/AnnotationIcon";
import ChatAltIcon from "../../../../../assets/icons/ChatAltIcon";
import ChartData from "./chartData/ChartData";
import MentorListModal from "../../../../modal/MentorListModal";
import MentorRequestsModal from "../../../../modal/MentorRequestsModal";
import MentAiChatModal from "../../../../modal/MentAiChatModal";
import SkillsModal from "../../../../modal/SkillsModal";

import InfoCards from "./InfoCards";
import RecentActivities from "./recentActivities/RecentActivities";
import UpcomingMeetings from "./UpcomingMeetings";
import { Roles } from "../../../../../utility";

const Home = ({ name }) => {
    const dispatch = useDispatch();
    const history = useHistory();
    const user = JSON.parse(localStorage.getItem("authData"));

    // state for stats
    const [stats, setStats] = useState({
        posts: 0,
        comments: 0,
        mentees: 0,
    });
    
    const [showMentorModal, setShowMentorModal] = useState(false);
    const [showRequestsModal, setShowRequestsModal] = useState(false);
    const [showAiChatModal, setShowAiChatModal] = useState(false);
    const [showSkillsModal, setShowSkillsModal] = useState(false);

    useEffect(() => {
        dispatch(getStats(history, setStats));
    }, []);
    
    const handleMentorCardClick = () => {
        console.log('Mentor card clicked, user role:', user?.role);
        if (user?.role === Roles.STUDENT) {
            console.log('Opening mentor modal for student');
            setShowMentorModal(true);
        } else if (user?.role === Roles.MENTOR) {
            console.log('Opening requests modal for mentor');
            setShowRequestsModal(true);
        }
    };

    return (
        <div className="h-full relative overflow-y-auto">
            <div className={`w-full h-full px-36 py-10 grid grid-cols-5 gap-4`}>
                <div className="w-full col-span-3 flex flex-col justify-start gap-y-10">
                    <h1 className="">Welcome back, {name}!</h1>
                    <div className="flex items-center justify-between">
                        <InfoCards
                            myStyle={"p-4 bg-rose-500 rounded-md bg-right-top w-48 shadow-md"}
                            total={stats.mentees}
                            text={
                                user?.role === Roles.STUDENT 
                                    ? "Available Mentors" 
                                    : user?.role === Roles.MENTOR 
                                        ? "My Mentees" 
                                        : "Total Mentees"
                            }
                            clickable={user?.role === Roles.STUDENT || user?.role === Roles.MENTOR}
                            onClick={handleMentorCardClick}
                        >
                            <AcademicCapIcon alt={true} myStyle={"w-6 h-6 text-white"} />
                        </InfoCards>
                        <InfoCards
                            myStyle={"p-4 bg-purple-500 rounded-md bg-right-top w-48 shadow-md"}
                            total={stats.posts}
                            text={"Total Posts"}
                        >
                            <AnnotationIcon alt={true} myStyle={"w-6 h-6 text-white"} />
                        </InfoCards>
                        <InfoCards
                            myStyle={"p-4 bg-cyan-500 rounded-md bg-right-top w-48 shadow-md"}
                            total={stats.comments}
                            text={"Total Comments"}
                        >
                            <ChatAltIcon alt={true} myStyle={"w-6 h-6 text-white"} />
                        </InfoCards>
                    </div>
                    <div className="w-full bg-white h-64 rounded-md px-4 py-2">
                        <ChartData />
                    </div>
                    <div className="w-full bg-white h-60 rounded-md overflow-y-auto px-4 py-2">
                        <h4 className="mb-3">Activities last 7 days</h4>
                        <RecentActivities />
                    </div>
                </div>
                <div className="col-span-2 py-4 flex flex-col items-end justify-start h-full space-y-4">
                    {/* MentAI Chatbot Button */}
                    <button
                        onClick={() => setShowAiChatModal(true)}
                        className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 py-3 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center space-x-2"
                    >
                        <span className="text-lg">🤖</span>
                        <span className="font-semibold">Chat with MentAI</span>
                    </button>
                    
                    {/* Skills Management Button (for students) */}
                    {user?.role === Roles.STUDENT && (
                        <button
                            onClick={() => setShowSkillsModal(true)}
                            className="bg-gradient-to-r from-green-500 to-teal-500 text-white px-6 py-3 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center space-x-2"
                        >
                            <span className="text-lg">🎨</span>
                            <span className="font-semibold">Manage Skills</span>
                        </button>
                    )}
                    
                    <UpcomingMeetings />

                </div>
            </div>
            
            <MentorListModal 
                isOpen={showMentorModal}
                onClose={() => setShowMentorModal(false)}
            />
            
            <MentorRequestsModal 
                isOpen={showRequestsModal}
                onClose={() => setShowRequestsModal(false)}
            />
            
            <MentAiChatModal 
                isOpen={showAiChatModal}
                onClose={() => setShowAiChatModal(false)}
            />
            
            <SkillsModal 
                isOpen={showSkillsModal}
                onClose={() => setShowSkillsModal(false)}
                currentSkills={[]}
            />
        </div>
    );
};

export default Home;
