import express from "express";
import { protectAdmin } from "../middleware/authMiddleware.js";
import { listReports, getReport, resolveReport, forceDeletePost } from "../controllers/adminCommunityController.js";

const router = express.Router();

router.get("/reports", protectAdmin, listReports);
router.get("/reports/:reportId", protectAdmin, getReport);
router.post("/reports/:reportId/resolve", protectAdmin, resolveReport);
router.delete("/:postId", protectAdmin, forceDeletePost);

export default router;


