import API from "./index";

export const sendMessage = (fields) =>
    API.post("/ai/chat", fields).catch((error) => {
        return error.response;
    });

export const getChatHistory = (sessionId) =>
    API.get(`/ai/chat/${sessionId}`).catch((error) => {
        return error.response;
    });

export const getChatSessions = () =>
    API.get("/ai/sessions").catch((error) => {
        return error.response;
    });

export const updateSkills = (fields) =>
    API.post("/ai/skills", fields).catch((error) => {
        return error.response;
    });