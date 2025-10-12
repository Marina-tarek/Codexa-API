// // // routes/instructorRoutes.js
// // import express from "express";
// // import Instructor from "../models/Instructor.js";
// // import Course from "../models/Course.js";
// // import Purchase from "../models/Purchase.js";
// // import Notification from "../models/Notification.js";
// // import generateToken from "../utils/generateToken.js";
// // import { protect } from "../middleware/authMiddleware.js";
// // import { uploadProfile } from "../middleware/uploadMiddleware.js";

// // const router = express.Router();

// // // register (profile image optional)
// // router.post("/register", uploadProfile.single ? uploadProfile.single("profileImage") : uploadProfile, async (req, res) => {
// //   try {
// //     const { name, email, password } = req.body;
// //     const exists = await Instructor.findOne({ email });
// //     if (exists) return res.status(400).json({ message: "Instructor already exists" });

// //     const profileImage = req.file ? (req.file.path || req.file?.secure_url ||`/uploads/profiles/${req.file.filename}` ) : "/uploads/default-avatar.png";

// //     const instructor = await Instructor.create({ name, email, password, profileImage });
// //     const token = generateToken(instructor._id, "Instructor");
// //     res.status(201).json({ token, instructor });
// //   } catch (error) {
// //     res.status(500).json({ message: "Error registering instructor", error: error.message });
// //   }
// // });

// // // login
// // router.post("/login", async (req, res) => {
// //   try {
// //     const { email, password } = req.body;
// //     const user = await Instructor.findOne({ email });
// //     if (user && (await user.matchPassword(password))) {
// //       const token = generateToken(user._id, "Instructor");
// //       return res.json({ token, user });
// //     }
// //     res.status(401).json({ message: "Invalid credentials" });
// //   } catch (error) {
// //     res.status(500).json({ message: "Login error", error });
// //   }
// // });

// // // profile update (name or profileImage)
// // router.put("/profile", protect, uploadProfile.single ? uploadProfile.single("profileImage") : uploadProfile, async (req, res) => {
// //   try {
// //     if (req.userType !== "Instructor") return res.status(403).json({ message: "Only instructors" });
// //     const user = req.user;
// //     if (req.body.name) user.name = req.body.name;
// //     if (req.file) user.profileImage = req.file.path || req.file.secure_url || user.profileImage;
// //     await user.save();
// //     res.json({ message: "Profile updated", user });
// //   } catch (error) {
// //     res.status(500).json({ message: "Error updating profile", error });
// //   }
// // });

// // // dashboard
// // router.get("/dashboard", protect, async (req, res) => {
// //   try {
// //     if (req.userType !== "Instructor") return res.status(403).json({ message: "Only instructors" });
// //     const instructorId = req.user._id;

// //     const totalCourses = await Course.countDocuments({ instructor: instructorId });
// //     const purchases = await Purchase.find({ instructor: instructorId }).populate("student", "name profileImage").populate("course", "title price").lean();

// //     const totalRevenue = purchases.reduce((acc, p) => acc + (p.price || 0), 0);
// //     const uniqueStudents = new Set(purchases.map(p => p.student._id.toString())).size;

// //     const courseMap = {};
// //     purchases.forEach(p => {
// //       const cid = p.course._id.toString();
// //       if (!courseMap[cid]) {
// //         courseMap[cid] = { courseId: cid, title: p.course.title, price: p.course.price || 0, studentsCount: 0, revenue: 0, recentBuyers: [] };
// //       }
// //       courseMap[cid].studentsCount += 1;
// //       courseMap[cid].revenue += (p.price || 0);
// //       courseMap[cid].recentBuyers.unshift({ studentId: p.student._id, name: p.student.name, profileImage: p.student.profileImage, purchasedAt: p.createdAt, price: p.price });
// //     });

// //     const courses = Object.values(courseMap).map(c => ({ ...c, recentBuyers: c.recentBuyers.slice(0, 5) }));

// //     res.json({ totalCourses, totalStudents: uniqueStudents, totalRevenue, courses, recentPurchases: purchases.slice(-10).reverse() });
// //   } catch (error) {
// //     res.status(500).json({ message: "Error loading dashboard", error });
// //   }
// // });

// // export default router;
// import express from "express";
// import { registerInstructor, loginInstructor, updateProfile, dashboard } from "../controllers/instructorController.js";
// import { protect } from "../middleware/authMiddleware.js";
// import { uploadProfile } from "../middleware/uploadMiddleware.js";

// const router = express.Router();

// router.post("/register", uploadProfile, registerInstructor); // form-data optional profileImage
// router.post("/login", loginInstructor);
// router.put("/profile", protect, uploadProfile, updateProfile);
// router.get("/dashboard", protect, dashboard);

// export default router;
import express from "express";
import { registerInstructor, loginInstructor, createCourse, getInstructorStats } from "../controllers/instructorController.js";
import { protectInstructor } from "../middleware/authMiddleware.js";
import multer from "multer";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/register", registerInstructor);
router.post("/login", loginInstructor);
router.post("/courses", protectInstructor, upload.single("video"), createCourse);
router.get("/stats", protectInstructor, getInstructorStats);

export default router;
