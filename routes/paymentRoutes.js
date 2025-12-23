import express from "express";
import { buyCourse } from "../controllers/paymentController.js";
import { protectStudent } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/buy", protectStudent, buyCourse);

export default router;