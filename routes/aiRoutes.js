import express from "express";
import { chatAI, textToVoice, voiceToText } from "../controllers/aiController.js";
import { protectAny } from "../middleware/authMiddleware.js";
import multer from "multer";

const router = express.Router();

//  CRITICAL — multer must use memoryStorage()
const upload = multer({ storage: multer.memoryStorage() });

//  AI chat
router.post("/chat", protectAny, chatAI);

//  Text → Voice
router.post("/text-to-voice", protectAny, textToVoice);

//  Voice → Text (field MUST be "file")
router.post("/voice-to-text", protectAny, upload.single("file"), voiceToText);

export default router;
