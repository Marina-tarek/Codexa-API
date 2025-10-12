// // routes/purchaseRoutes.js
// import express from "express";
// import { protect } from "../middleware/authMiddleware.js";
// import Student from "../models/Student.js";
// import Course from "../models/Course.js";
// import Purchase from "../models/Purchase.js";
// import Notification from "../models/Notification.js";

// const router = express.Router();

// router.post("/buy/:courseId", protect, async (req, res) => {
//   try {
//     if (req.userType !== "Student") return res.status(403).json({ message: "Only students can buy" });
//     const course = await Course.findById(req.params.courseId).populate("instructor", "name profileImage");
//     if (!course) return res.status(404).json({ message: "Course not found" });

//     const student = await Student.findById(req.user._id);
//     if (student.enrolledCourses?.some(id => id.toString() === course._id.toString()))
//       return res.status(400).json({ message: "Already enrolled" });

//     // TODO: integrate Stripe payment -> for now assume paid
//     student.enrolledCourses.push(course._id);
//     student.progress.push({ course: course._id, completedVideos: [], percentage: 0 });
//     course.students.push(student._id);
//     await student.save();
//     await course.save();

//     const purchase = await Purchase.create({ course: course._id, student: student._id, instructor: course.instructor._id, price: course.price || 0 });

//     const notif = await Notification.create({
//       receiver: course.instructor._id,
//       receiverType: "Instructor",
//       sender: student._id,
//       senderType: "Student",
//       type: "purchase",
//       message: `${student.name} purchased your course "${course.title}"`,
//       link: `/instructor/courses/${course._id}`,
//     });

//     // realtime
//     const io = req.app.get("io");
//     io.to(course.instructor._id.toString()).emit("notification", {
//       ...notif.toObject(),
//       sender: { name: student.name, profileImage: student.profileImage },
//       course: { _id: course._id, title: course.title, price: course.price },
//     });

//     res.json({ message: "Purchase successful", purchase });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Purchase error", error });
//   }
// });

// export default router;
// import express from "express";
// import { buyCourse } from "../controllers/purchaseController.js";
// import { protect } from "../middleware/authMiddleware.js";

// const router = express.Router();

// router.post("/buy/:courseId", protect, buyCourse);

// export default router;