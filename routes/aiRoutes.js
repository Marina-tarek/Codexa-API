import express from "express";
// import { protect } from "../middleware/authMiddleware";
import { chatAI } from "../controllers/aiController.js";
import { protectAny } from "../middleware/authMiddleware.js";
const router = express.Router();
// const { chatAI } = require("../controllers/aiController");
// const { protect } = require("../middleware/authMiddleware");

router.post("/chat", protectAny, chatAI);

export default router;
