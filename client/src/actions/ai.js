import * as api from "../api/ai";
import { showToast } from "../components/toast/toast";
import { toast } from "react-toastify";

export const sendAiMessage = (fields, onSuccess) => async (dispatch) => {
    try {
        const { data } = await api.sendMessage(fields);
        console.log("AI message response:", data);

        if (data && data.code === 200) {
            if (onSuccess) onSuccess(data.data);
        } else {
            showToast("error", data?.msg || "Failed to send message", 10000, toast.POSITION.TOP_RIGHT);
        }
    } catch (error) {
        console.error("AI message error:", error);
        showToast("error", "Network error while sending message", 10000, toast.POSITION.TOP_RIGHT);
    }
};

export const getChatHistory = (sessionId, setMessages) => async (dispatch) => {
    try {
        const { data } = await api.getChatHistory(sessionId);
        console.log("Chat history:", data);

        if (data && data.code === 200) {
            setMessages(data.data.messages || []);
        } else {
            setMessages([]);
        }
    } catch (error) {
        console.error("Get chat history error:", error);
        setMessages([]);
    }
};

export const getChatSessions = (setSessions) => async (dispatch) => {
    try {
        const { data } = await api.getChatSessions();
        console.log("Chat sessions:", data);

        if (data && data.code === 200) {
            setSessions(data.data.sessions || []);
        } else {
            setSessions([]);
        }
    } catch (error) {
        console.error("Get chat sessions error:", error);
        setSessions([]);
    }
};

