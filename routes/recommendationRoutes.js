// // routes/recommendationRoutes.js
// import express from "express";
// import { protect } from "../middleware/authMiddleware.js";
// import Course from "../models/Course.js";
// import Student from "../models/Student.js";

// const router = express.Router();

// router.get("/for-me", protect, async (req, res) => {
//   if (req.userType !== "Student") return res.status(400).json({ message: "Students only" });
//   const student = await Student.findById(req.user._id);
//   const enrolled = (student.enrolledCourses || []).map(id => id.toString());
//   const all = await Course.find().lean();
//   const filtered = all.filter(c => !enrolled.includes(c._id.toString()));
//   // sort by popularity (students length)
//   filtered.sort((a, b) => (b.students?.length || 0) - (a.students?.length || 0));
//   res.json(filtered.slice(0, 10));
// });

// export default router;
import express from "express";
import { recommendForMe } from "../controllers/recommendationController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/for-me", protect, recommendForMe);

export default router;