// // // routes/courseRoutes.js
// // import express from "express";
// // import Course from "../models/Course.js";
// // import { protect } from "../middleware/authMiddleware.js";
// // import { uploadVideo } from "../middleware/uploadMiddleware.js"; // use uploadVideo.array for multiple if cloudinary/modal

// // const router = express.Router();

// // // create course (for cloudinary we will accept multiple upload calls or multi-file)
// // router.post("/", protect, async (req, res) => {
// //   try {
// //     if (req.userType !== "Instructor") return res.status(403).json({ message: "Only instructors" });
// //     const { title, description, price, videos } = req.body;
// //     // videos: array of URLs (front-end uploads to cloudinary and sends URLs) OR we can accept uploaded files via multer
// //     const videoUrls = videos || []; // prefer sending URLs from frontend
// //     const course = await Course.create({
// //       instructor: req.user._id,
// //       title,
// //       description,
// //       price,
// //       videos: videoUrls,
// //     });
// //     res.json(course);
// //   } catch (err) {
// //     res.status(500).json({ message: "Error creating course", err });
// //   }
// // });

// // // get instructor courses
// // router.get("/mine", protect, async (req, res) => {
// //   try {
// //     if (req.userType !== "Instructor") return res.status(403).json({ message: "Only instructors" });
// //     const courses = await Course.find({ instructor: req.user._id });
// //     res.json(courses);
// //   } catch (err) {
// //     res.status(500).json({ message: "Error fetching courses", err });
// //   }
// // });

// // // edit and delete handled elsewhere
// // export default router;
// import express from "express";
// import { addCourse, getInstructorCourses, getCourse } from "../controllers/courseController.js";
// import { protect } from "../middleware/authMiddleware.js";
// import { uploadVideos } from "../middleware/uploadMiddleware.js";

// const router = express.Router();

// router.post("/add", protect, uploadVideos, addCourse); // form-data with key "videos" multiple
// router.get("/mine", protect, getInstructorCourses);
// router.get("/:id", getCourse);

// export default router;
// ====================
// import express from "express";
// import { createCourse, getAllCourses, getCourseById, deleteCourse } from "../controllers/courseController.js";
// import { protectInstructor, protectAdmin } from "../middleware/authMiddleware.js";
// import multer from "multer";

// const router = express.Router();
// const upload = multer({ dest: "uploads/" });

// router.post("/", protectInstructor, upload.single("video"), createCourse);
// router.get("/", getAllCourses);
// router.get("/:id", getCourseById);
// router.delete("/:id", protectAdmin, deleteCourse);

// export default router;
// ======
import express from "express";
import multer from "multer";
import {
  createCourse,
  addVideosToCourse,
  deleteVideoFromCourse,
  deleteCourse,
    getAllCourses,
    getCourseById,
    updateCourse
} from "../controllers/courseController.js";
import { protectInstructor } from "../middleware/authMiddleware.js";


const router = express.Router();
const upload = multer({ dest: "uploads/" });

// إنشاء كورس جديد مع أكثر من فيديو
router.post("/", protectInstructor, upload.array("videos"), createCourse);

// إضافة فيديوهات جديدة إلى كورس موجود
router.post("/:id/videos", protectInstructor, upload.array("videos"), addVideosToCourse);

// حذف فيديو من كورس
router.delete("/:courseId/videos/:videoId", protectInstructor, deleteVideoFromCourse);

// حذف الكورس بالكامل
router.delete("/:id", protectInstructor, deleteCourse);


// 🆕 جلب كل الكورسات
router.get("/", getAllCourses);

router.get("/:id", getCourseById);

router.put("/:id", protectInstructor, updateCourse);
export default router;


