import axios from "axios";
import FormData from "form-data";
import { personalizedAI } from "../services/aiService.js";

//  Voice → Text
export const voiceToText = async (req, res) => {
    try {
        console.log("REQ.FILE:", req.file);

        if (!req.file) {
            return res.status(400).json({ error: "No audio file provided" });
        }

        const audioBuffer = req.file.buffer;

        // ElevenLabs requires:
        // - field: "file"
        // - field: "model_id"
        const formData = new FormData();
        formData.append("file", audioBuffer, "audio.webm");
        formData.append("model_id", "scribe_v1"); // BEST model for STT

        const response = await axios.post(
            "https://api.elevenlabs.io/v1/speech-to-text",
            formData,
            {
                headers: {
                    "xi-api-key": process.env.ELEVENLABS_API_KEY,
                    ...formData.getHeaders()
                }
            }
        );

        // ElevenLabs response → { text: "..." }
        return res.json({ text: response.data.text });

    } catch (error) {
        console.error(
            "STT Error:",
            error.response?.data || error.message
        );
        return res.status(500).json({ error: "STT failed" });
    }
};


// Text → Voice
export const textToVoice = async (req, res) => {
    try {
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({ error: "Text is required" });
        }

        const response = await axios.post(
            `https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID}`,
            { text },
            {
                responseType: "arraybuffer",
                headers: {
                    "xi-api-key": process.env.ELEVENLABS_API_KEY,
                    "Content-Type": "application/json"
                },
            }
        );

        res.setHeader("Content-Type", "audio/mpeg");
        return res.send(response.data);

    } catch (error) {
        console.error("🔥 ElevenLabs TTS ERROR RAW:", error?.response?.data?.toString());
        console.error("🔥 STATUS:", error?.response?.status);
        console.error("🔥 HEADERS:", error?.response?.headers);

        res.status(500).json({ error: "TTS failed", details: error.response?.data });


    }
};

// Chat Ai
export const chatAI = async (req, res) => {
    try {
        const { message, history } = req.body;

        const isFirst = !history || history.length === 0;
        const response = await personalizedAI(message, req.user, isFirst);

        return res.json({ success: true, response });

    } catch (error) {
        console.error("AI Error:", error);
        return res.status(500).json({ success: false, response: "AI Error" });
    }
};

export default { chatAI, textToVoice, voiceToText };
