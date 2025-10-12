import Course from "../models/courseModel.js";
import Instructor from "../models/instructorModel.js";
import Student from "../models/studentModel.js";
import cloudinary from "../utils/cloudinary.js";

// إنشاء كورس جديد (يُستخدم بالفعل من داخل instructorController)
export const createCourse = async (req, res) => {
  try {
    const { title, description, price, category } = req.body;
    let videoUrl = null;

    if (req.file) {
      const uploadRes = await cloudinary.uploader.upload(req.file.path, { resource_type: "video" });
      videoUrl = uploadRes.secure_url;
    }

    const newCourse = await Course.create({
      instructor: req.user._id,
      title,
      description,
      price,
      category,
      videoUrl
    });

    res.json(newCourse);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// عرض كل الكورسات
export const getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find().populate("instructor", "name profileImage");
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// عرض تفاصيل كورس محدد
export const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate("instructor", "name profileImage")
      .populate("students", "name profileImage");
    if (!course) return res.status(404).json({ message: "Course not found" });
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// حذف كورس (Admin فقط)
export const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });
    await course.deleteOne();
    res.json({ message: "Course deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};