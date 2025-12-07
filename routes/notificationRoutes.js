import express from "express";
import {
    getNotifications,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    getUnreadCount,
} from "../controllers/notificationController.js";
import { protectInstructor, protectStudent } from "../middleware/authMiddleware.js";

const router = express.Router();

// Instructor routes
router.get("/", protectInstructor, getNotifications);
router.get("/unread-count", protectInstructor, getUnreadCount);
router.put("/:id/read", protectInstructor, markAsRead);
router.put("/read-all", protectInstructor, markAllAsRead);
router.delete("/", protectInstructor, clearNotifications);

// Student routes
router.get("/student", protectStudent, getNotifications);
router.get("/student/unread-count", protectStudent, getUnreadCount);
router.put("/student/:id/read", protectStudent, markAsRead);
router.put("/student/read-all", protectStudent, markAllAsRead);
router.delete("/student", protectStudent, clearNotifications);

export default router;