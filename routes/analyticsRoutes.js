import express from "express";
import {
	getInstructorAnalytics,
	getStudentAnalytics,
	getAdminAnalytics,
} from "../controllers/analyticsController.js";
import {
	protectInstructor,
	protectStudent,
	protectAdmin,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/instructor", protectInstructor, getInstructorAnalytics);
router.get("/student", protectStudent, getStudentAnalytics);
router.get("/admin", protectAdmin, getAdminAnalytics);

export default router;


