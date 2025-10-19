// // // routes/studentRoutes.js
// // import express from "express";
// // import Student from "../models/Student.js";
// // import Course from "../models/Course.js";
// // import Purchase from "../models/Purchase.js";
// // import generateToken from "../utils/generateToken.js";
// // import { protect } from "../middleware/authMiddleware.js";
// // import { uploadProfile } from "../middleware/uploadMiddleware.js";

// // const router = express.Router();

// // router.post("/register", uploadProfile.single ? uploadProfile.single("profileImage") : uploadProfile, async (req, res) => {
// //   try {
// //     const { name, email, password } = req.body;
// //     const exists = await Student.findOne({ email });
// //     if (exists) return res.status(400).json({ message: "Student already exists" });
// //     const profileImage = req.file ? (req.file.path || req.file.secure_url) : "/uploads/default-avatar.png";
// //     const student = await Student.create({ name, email, password, profileImage });
// //     const token = generateToken(student._id, "Student");
// //     res.status(201).json({ token, student });
// //   } catch (error) {
// //     res.status(500).json({ message: "Error registering student", error });
// //   }
// // });

// // router.post("/login", async (req, res) => {
// //   try {
// //     const { email, password } = req.body;
// //     const user = await Student.findOne({ email });
// //     if (user && (await user.matchPassword(password))) {
// //       const token = generateToken(user._id, "Student");
// //       return res.json({ token, user });
// //     }
// //     res.status(401).json({ message: "Invalid credentials" });
// //   } catch (error) {
// //     res.status(500).json({ message: "Login error", error });
// //   }
// // });

// // // add note
// // router.post("/notes/:courseId", protect, async (req, res) => {
// //   try {
// //     if (req.userType !== "Student") return res.status(403).json({ message: "Only students" });
// //     const { content } = req.body;
// //     const student = await Student.findById(req.user._id);
// //     student.notes = student.notes || [];
// //     student.notes.push({ course: req.params.courseId, content });
// //     await student.save();
// //     res.json({ message: "Note added" });
// //   } catch (err) {
// //     res.status(500).json({ message: "Error adding note", err });
// //   }
// // });

// // // progress update
// // router.post("/progress/:courseId", protect, async (req, res) => {
// //   try {
// //     if (req.userType !== "Student") return res.status(403).json({ message: "Only students" });
// //     const { videoUrl } = req.body;
// //     const student = await Student.findById(req.user._id);
// //     const course = await Course.findById(req.params.courseId);
// //     if (!course) return res.status(404).json({ message: "Course not found" });

// //     let progress = student.progress.find(p => p.course.toString() === req.params.courseId);
// //     if (!progress) {
// //       return res.status(400).json({ message: "Student not enrolled or no progress record" });
// //     }
// //     if (!progress.completedVideos.includes(videoUrl)) progress.completedVideos.push(videoUrl);
// //     progress.percentage = Math.round((progress.completedVideos.length / (course.videos.length || 1)) * 100);
// //     await student.save();
// //     res.json({ message: "Progress updated", percentage: progress.percentage });
// //   } catch (err) {
// //     res.status(500).json({ message: "Error updating progress", err });
// //   }
// // });

// // export default router;
// import express from "express";
// import { registerStudent, loginStudent, addNote, getProgress } from "../controllers/studentController.js";
// import { protect } from "../middleware/authMiddleware.js";
// import { uploadProfile } from "../middleware/uploadMiddleware.js";

// const router = express.Router();

// router.post("/register", uploadProfile, registerStudent);
// router.post("/login", loginStudent);
// router.post("/notes/:courseId", protect, addNote);
// router.get("/progress/:courseId", protect, getProgress);

// export default router;
//-------------------------new---------------mustafa updates------------------------
import express from "express";
import {
  registerStudent,
  loginStudent,
  addOrUpdateNotes,
  updateProgress,
  getMyCourses,
  enrollInCourse,
  socialLoginStudent
} from "../controllers/studentController.js";
import { protectStudent } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerStudent);
router.post("/login", loginStudent);
router.post("/social-login", socialLoginStudent);
router.post("/notes", protectStudent, addOrUpdateNotes);
router.post("/progress", protectStudent, updateProgress);

// الطالب يسجل في كورس
router.post("/enroll/:courseId", protectStudent, enrollInCourse);
router.get("/my-courses", protectStudent, getMyCourses);

export default router;