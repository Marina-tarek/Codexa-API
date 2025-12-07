import express from "express";
import {
    createLiveSession,
    getAllLiveSessions,
    getLiveSessionById,
    joinLiveSession,
    endLiveSession,
    handle100msWebhook,
    updateLiveSession,
    deleteLiveSession,
    getInstructorSessions,
    createPoll,
    votePoll,
    getPollResults,
    closePoll,
    getSessionAnalytics,
    getInstructorDashboard,
    addComment,
    replyToComment,
    editComment,
    deleteComment,
    deleteAllLiveSessions
} from "../controllers/liveSessionController.js";
import { protectInstructor, protectStudent, protect, protectAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.get("/", getAllLiveSessions);
router.get("/:id", getLiveSessionById);

// Webhook (public but should validate 100ms signature in production)
router.post("/webhook", handle100msWebhook);

// Protected routes (Student or Instructor)
router.post("/:id/join", protect, joinLiveSession);
router.post("/:id/polls/:pollId/vote", protect, votePoll);
router.get("/:id/polls/:pollId", getPollResults);

// Chat Routes (Protected)
router.post("/:id/comments", protect, addComment);
router.post("/:id/comments/:commentId/reply", protect, replyToComment);
router.put("/:id/comments/:commentId", protect, editComment);
router.delete("/:id/comments/:commentId", protect, deleteComment);

// Instructor only routes (specific routes first!)
router.get("/instructor/my-sessions", protectInstructor, getInstructorSessions);
router.get("/instructor/dashboard", protectInstructor, getInstructorDashboard);

router.post("/", protectInstructor, createLiveSession);
router.put("/:id", protectInstructor, updateLiveSession);
router.put("/:id/end", protectInstructor, endLiveSession);
router.delete("/:id", protect, deleteLiveSession);

// Polls management (Instructor only)
router.post("/:id/polls", protectInstructor, createPoll);
router.put("/:id/polls/:pollId/close", protectInstructor, closePoll);

// Analytics (Instructor only)
router.get("/:id/analytics", protectInstructor, getSessionAnalytics);

// TEMPORARY: Delete all sessions (Admin only - for cleanup)
router.delete("/delete-all-sessions", protectAdmin, deleteAllLiveSessions);

export default router;
