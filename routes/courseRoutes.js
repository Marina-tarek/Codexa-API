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

/* ----------------------- 🧩 إنشاء كورس جديد ----------------------- */
router.post("/", protectInstructor, upload.array("videos"), createCourse);

/* ----------------------- ➕ إضافة فيديوهات لكورس ----------------------- */
router.post("/:id/videos", protectInstructor, upload.array("videos"), addVideosToCourse);

/* ----------------------- ❌ حذف فيديو ----------------------- */
router.delete("/:courseId/videos/:videoId", protectInstructor, deleteVideoFromCourse);

/* ----------------------- 🗑️ حذف الكورس بالكامل ----------------------- */
router.delete("/:id", protectInstructor, deleteCourse);

/* ----------------------- 📚 جلب كل الكورسات ----------------------- */
router.get("/", getAllCourses);

/* ----------------------- 🧑‍🏫 كورسات المدرب نفسه ----------------------- */
router.get("/my-courses", protectInstructor, async (req, res) => {
  try {
    // ✅ هنا كنتِ كاتبة `courses.find` بالغلط بدل `Course.find`
    const courses = await Course.find({ instructor: req.user._id });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ----------------------- 👩‍🎓 كورسات مدرب معين (للطلاب) ----------------------- */
router.get("/instructor/:instructorId", getCoursesByInstructor);

/* ----------------------- 🔍 كورس واحد بالتفصيل ----------------------- */
router.get("/:id", getCourseById);

/* ----------------------- ✏️ تحديث كورس ----------------------- */
router.put("/:id", protectInstructor, updateCourse);

export default router;
