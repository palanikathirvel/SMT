import API from "./index";

export const getAIRecommendations = (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return API.get(`/student/ai-recommendations?${queryString}`).catch((error) => {
        return error.response;
    });
};