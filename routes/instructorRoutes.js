import express from "express";
import { 
  registerInstructor, 
  loginInstructor, 
  createCourse, 
  getInstructorStats, 
  socialLoginInstructor, 
  updateInstructorProfile, 
  changeInstructorPassword, 
  getInstructorProfile,
  forgotPasswordInstructor,
  verifyResetCodeInstructor,
  resetPasswordInstructor
} from "../controllers/instructorController.js";
import { protectInstructor } from "../middleware/authMiddleware.js";
import { uploadProfile } from "../middleware/uploadMiddleware.js";

const router = express.Router();
// use existing uploadVideo from course creation via previous code (kept multer import earlier). For profile we use uploadProfile.

router.post("/register", registerInstructor);
router.post("/login", loginInstructor);
router.post("/social-login", socialLoginInstructor);
router.post("/courses", protectInstructor, (req, res, next) => next(), createCourse);
router.get("/stats", protectInstructor, getInstructorStats);

// Profile endpoints
router.put("/profile", protectInstructor, uploadProfile.single("profileImage"), updateInstructorProfile);
router.put("/change-password", protectInstructor, changeInstructorPassword);
router.get("/profile/:id", getInstructorProfile);

// Forget Password Routes
router.post("/forgot-password", forgotPasswordInstructor);
router.post("/verify-reset-code", verifyResetCodeInstructor);
router.post("/reset-password", resetPasswordInstructor);

export default router;
