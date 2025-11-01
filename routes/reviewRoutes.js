import express from "express";
import { upsertReview, deleteReview, listReviews, getAverage } from "../controllers/reviewController.js";
import { protectStudent } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protectStudent, upsertReview);
router.delete("/:id", protectStudent, deleteReview);
router.get("/:itemType/:itemId", listReviews);
router.get("/:itemType/:itemId/average", getAverage);

export default router;



