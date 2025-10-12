// // routes/adminRoutes.js
// import express from "express";

// import { protect, protectAdmin } from "../middleware/authMiddleware.js";
// import Instructor from "../models/Instructor.js";
// import Student from "../models/Student.js";
// import Course from "../models/Course.js";
// import CommunityPost from "../models/CommunityPost.js";
// import Purchase from "../models/Purchase.js";
// import Notification from "../models/Notification.js";

// const router = express.Router();

// router.get("/stats", protect, protectAdmin, async (req, res) => {
//   const totalInstructors = await Instructor.countDocuments();
//   const totalStudents = await Student.countDocuments();
//   const totalCourses = await Course.countDocuments();
//   const purchases = await Purchase.find().lean();
//   const totalRevenue = purchases.reduce((acc, p) => acc + (p.price || 0), 0);

//   const courses = await Course.find().select("title price students instructor").lean();
//   const coursesStats = courses.map(c => ({ _id: c._id, title: c.title, studentsCount: (c.students||[]).length, price: c.price || 0, revenue: ((c.students||[]).length)*(c.price || 0) }));
//   res.json({ totalInstructors, totalStudents, totalCourses, totalRevenue, courses: coursesStats });
// });

// // list instructors with revenue
// router.get("/instructors", protect, protectAdmin, async (req, res) => {
//   const instructors = await Instructor.find().select("name email profileImage isActive").lean();
//   const purchases = await Purchase.find().lean();
//   const revenueMap = {};
//   purchases.forEach(p => { revenueMap[p.instructor.toString()] = (revenueMap[p.instructor.toString()] || 0) + (p.price || 0); });
//   const result = instructors.map(i => ({ ...i, revenue: revenueMap[i._id.toString()] || 0 }));
//   res.json(result);
// });

// // list students
// router.get("/students", protect, protectAdmin, async (req, res) => {
//   const students = await Student.find().select("name email profileImage isActive enrolledCourses").lean();
//   res.json(students);
// });

// // remove course
// router.delete("/course/:id", protect, protectAdmin, async (req, res) => {
//   const course = await Course.findById(req.params.id);
//   if (!course) return res.status(404).json({ message: "Course not found" });
//   await course.deleteOne();
//   await Notification.create({ receiver: course.instructor, receiverType: "Instructor", sender: req.user._id, senderType: req.userType, type: "admin", message: `Admin removed course "${course.title}" `});
//   res.json({ message: "Course removed" });
// });

// // manage community
// router.get("/community", protect, protectAdmin, async (req, res) => {
//   const posts = await CommunityPost.find().populate("author", "name profileImage").populate("comments.user", "name profileImage").sort({ createdAt: -1 });
//   res.json(posts);
// });

// router.delete("/community/:id", protect, protectAdmin, async (req, res) => {
//   await CommunityPost.findByIdAndDelete(req.params.id);
//   res.json({ message: "Post deleted" });
// });

// export default router;
// import express from "express";
// import { getStats, listInstructors, listStudents, deleteCourse, getCommunity, deletePost } from "../controllers/adminController.js";
// import { protect, protectAdmin } from "../middleware/authMiddleware.js";

// const router = express.Router();

// router.get("/stats", protect, protectAdmin, getStats);
// router.get("/instructors", protect, protectAdmin, listInstructors);
// router.get("/students", protect, protectAdmin, listStudents);
// router.delete("/course/:id", protect, protectAdmin, deleteCourse);
// router.get("/community", protect, protectAdmin, getCommunity);
// router.delete("/community/:id", protect, protectAdmin, deletePost);

// export default router;
//===
import express from "express";
import { loginAdmin, getDashboardStats } from "../controllers/adminController.js";
import { protectAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/login", loginAdmin);
router.get("/stats", protectAdmin, getDashboardStats);

export default router;