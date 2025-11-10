import express from "express";
import multer from "multer";
import {
  createCourse,
  addVideosToCourse,
  deleteVideoFromCourse,
  deleteCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  getCoursesByInstructor,
} from "../controllers/courseController.js";
import { protectInstructor } from "../middleware/authMiddleware.js";
import Course from "../models/courseModel.js"; // ✅ لازم تستوردي الموديل هنا

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// Middleware لتحديد نوع المحتوى والتعامل مع JSON أو multipart/form-data
const handleCourseCreation = (req, res, next) => {
  const contentType = req.headers["content-type"] || "";
  
  if (contentType.includes("multipart/form-data")) {
    // استخدام multer للملفات
    return upload.fields([
      { name: "coverImage", maxCount: 1 },
      { name: "videos", maxCount: 10 },
    ])(req, res, next);
  } else {
    // للـ JSON، express.json() موجود بالفعل في server.js
    // فقط نتخطى multer ونمرر الطلب
    return next();
  }
};

/* ----------------------- 🧩 إنشاء كورس جديد ----------------------- */
// دعم رفع coverImage (صورة واحدة) + videos (عدة فيديوهات) أو JSON فقط
router.post(
  "/",
  protectInstructor,
  handleCourseCreation,
  createCourse
);

/* ----------------------- ➕ إضافة فيديوهات لكورس ----------------------- */
router.post("/:courseId/videos", protectInstructor, upload.array("videos"), addVideosToCourse);

/* ----------------------- ❌ حذف فيديو ----------------------- */
router.delete("/:courseId/videos/:videoId", protectInstructor, deleteVideoFromCourse);

/* ----------------------- 🗑️ حذف الكورس بالكامل ----------------------- */
router.delete("/:id", protectInstructor, deleteCourse);

/* ----------------------- 📚 جلب كل الكورسات ----------------------- */
router.get("/", getAllCourses);

/* ----------------------- 🧑‍🏫 كورسات المدرب نفسه ----------------------- */
router.get("/my-courses", protectInstructor, async (req, res) => {
  try {
    // يعرض جميع الكورسات للمدرب (حتى private) لأنه صاحبها
    const courses = await Course.find({ instructor: req.user._id })
      .populate("instructor", "name email profileImage")
      .sort({ createdAt: -1 });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ----------------------- 👩‍🎓 كورسات مدرب معين (للطلاب) ----------------------- */
router.get("/instructor/:instructorId", getCoursesByInstructor);

/* ----------------------- 🔍 كورس واحد بالتفصيل ----------------------- */
router.get("/:id", getCourseById);

// Middleware لتحديد نوع المحتوى عند التحديث
const handleCourseUpdate = (req, res, next) => {
  const contentType = req.headers["content-type"] || "";
  
  if (contentType.includes("multipart/form-data")) {
    // استخدام multer للملفات
    return upload.fields([
      { name: "coverImage", maxCount: 1 },
    ])(req, res, next);
  } else {
    // للـ JSON، express.json() موجود بالفعل في server.js
    // فقط نتخطى multer ونمرر الطلب
    return next();
  }
};

/* ----------------------- ✏️ تحديث كورس ----------------------- */
// دعم رفع coverImage جديد (اختياري) + تحديث البيانات أو JSON فقط
router.put(
  "/:id",
  protectInstructor,
  handleCourseUpdate,
  updateCourse
);

export default router;
