import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { updateUserSkills } from "../../actions/ai";
import ModalOverlay from "./ModalOverlay";

const SkillsModal = ({ isOpen, onClose, currentSkills = [] }) => {
    const dispatch = useDispatch();
    const [skills, setSkills] = useState(currentSkills);
    const [newSkill, setNewSkill] = useState("");
    const [loading, setLoading] = useState(false);

    const addSkill = () => {
        if (newSkill.trim() && !skills.includes(newSkill.trim())) {
            setSkills([...skills, newSkill.trim()]);
            setNewSkill("");
        }
    };

    const removeSkill = (skillToRemove) => {
        setSkills(skills.filter(skill => skill !== skillToRemove));
    };

    const handleSave = () => {
        setLoading(true);
        dispatch(updateUserSkills(skills, () => {
            setLoading(false);
            onClose();
        }));
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addSkill();
        }
    };

    if (!isOpen) return null;

    return (
        <ModalOverlay>
            <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Manage Your Skills</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        ✕
                    </button>
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Add New Skill
                    </label>
                    <div className="flex space-x-2">
                        <input
                            type="text"
                            value={newSkill}
                            onChange={(e) => setNewSkill(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="e.g., JavaScript, React, Python"
                            className="flex-1 border rounded-lg px-3 py-2"
                        />
                        <button
                            onClick={addSkill}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                        >
                            Add
                        </button>
                    </div>
                </div>

                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Your Skills ({skills.length})
                    </label>
                    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                        {skills.map((skill, index) => (
                            <span
                                key={index}
                                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                            >
                                {skill}
                                <button
                                    onClick={() => removeSkill(skill)}
                                    className="ml-2 text-blue-600 hover:text-blue-800"
                                >
                                    ×
                                </button>
                            </span>
                        ))}
                        {skills.length === 0 && (
                            <p className="text-gray-500 text-sm">No skills added yet</p>
                        )}
                    </div>
                </div>

                <div className="flex justify-end space-x-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                    >
                        {loading ? "Saving..." : "Save Skills"}
                    </button>
                </div>

                <p className="text-xs text-gray-500 mt-3">
                    These skills help MentAI recommend the best mentors for you.
                </p>
            </div>
        </ModalOverlay>
    );
};

export default SkillsModal;