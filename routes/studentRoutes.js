import express from "express";
import {
  registerStudent,
  loginStudent,
  addOrUpdateNotes,
  updateProgress,
  getMyCourses,
  enrollInCourse,
  getStudentCourseById,
  socialLoginStudent,
  forgotPasswordStudent,
  verifyResetCodeStudent,
  resetPasswordStudent,
  updateStudentProfile
} from "../controllers/studentController.js";
import { protectStudent } from "../middleware/authMiddleware.js";
import { uploadProfile } from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.post("/register", registerStudent);
router.post("/login", loginStudent);
router.post("/social-login", socialLoginStudent);
router.post("/notes", protectStudent, addOrUpdateNotes);
router.post("/progress", protectStudent, updateProgress);

// الطالب يسجل في كورس
router.post("/enroll/:courseId", protectStudent, enrollInCourse);
router.get("/my-courses", protectStudent, getMyCourses);
router.get("/my-courses/:courseId", protectStudent, getStudentCourseById);

// Forget Password Routes
router.post("/forgot-password", forgotPasswordStudent);
router.post("/verify-reset-code", verifyResetCodeStudent);
router.post("/reset-password", resetPasswordStudent);

// Profile endpoints
router.put("/profile", protectStudent, uploadProfile.single("profileImage"), updateStudentProfile);

export default router;