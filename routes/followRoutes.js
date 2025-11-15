
import express from "express";
import { toggleFollow, getFollowStatus, getFollowers, getMyFollowing, getCounts, getMyFollowingCount } from "../controllers/followController.js";
import { protectStudent } from "../middleware/authMiddleware.js";

const router = express.Router();

// Student follows/unfollows an instructor
router.post("/toggle", protectStudent, toggleFollow);

// Status and lists
router.get("/status/:instructorId", protectStudent, getFollowStatus);
router.get("/followers/:instructorId", getFollowers);
router.get("/following/me", protectStudent, getMyFollowing);
router.get("/counts/:instructorId", getCounts);
router.get("/counts/me", protectStudent, getMyFollowingCount);

export default router;