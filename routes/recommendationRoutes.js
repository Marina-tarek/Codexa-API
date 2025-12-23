import express from "express";
import { recommendForMe } from "../controllers/recommendationController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/for-me", protect, recommendForMe);

export default router;