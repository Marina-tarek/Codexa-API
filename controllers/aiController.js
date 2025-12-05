import { personalizedAI } from "../services/aiService.js";

export const chatAI = async (req, res) => {
    try {
        const { message, history } = req.body;

        // history = array of previous messages from frontend
        const isFirst = !history || history.length === 0;

        const response = await personalizedAI(message, req.user, isFirst);

        res.json({ success: true, response });

    } catch (error) {
        console.error("AI Error:", error);
        res.status(500).json({ success: false, response: "AI Error" });
    }
};


export default { chatAI };
