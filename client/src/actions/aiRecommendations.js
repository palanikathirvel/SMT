import * as api from "../api/aiRecommendations";
import { showToast } from "../components/toast/toast";
import { toast } from "react-toastify";

export const getAIRecommendations = (params, setRecommendations, setContext) => async (dispatch) => {
    try {
        const { data } = await api.getAIRecommendations(params);
        console.log("AI recommendations:", data);

        if (data && data.code === 200) {
            setRecommendations(data.data.mentors || []);
            if (setContext) setContext(data.data.context || {});
        } else {
            setRecommendations([]);
            showToast("error", data?.msg || "Failed to get recommendations", 10000, toast.POSITION.TOP_RIGHT);
        }
    } catch (error) {
        console.error("AI recommendations error:", error);
        setRecommendations([]);
        showToast("error", "Network error while getting recommendations", 10000, toast.POSITION.TOP_RIGHT);
    }
};