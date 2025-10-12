import Instructor from "../models/instructorModel.js";
import Course from "../models/courseModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cloudinary from "../utils/cloudinary.js";

// export const registerInstructor = async (req, res) => {
//   try {
//     const { name, email, password } = req.body;
//     const exists = await Instructor.findOne({ email });
//     if (exists) return res.status(400).json({ message: "Email already registered" });

//     const instructor = await Instructor.create({ name, email, password });
//     const token = jwt.sign({ id: instructor._id, role: "Instructor" }, process.env.JWT_SECRET, { expiresIn: "30d" });

//     res.json({ token, instructor });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };
export const registerInstructor = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const exists = await Instructor.findOne({ email });
    if (exists) return res.status(400).json({ message: "Email already registered" });

    const instructor = await Instructor.create({
      name,
      email,
      password, // الـ model هيشفره تلقائي
    });

    const token = jwt.sign(
      { id: instructor._id, role: "Instructor" },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.json({ token, instructor });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const loginInstructor = async (req, res) => {
  
  try {
    const { email, password } = req.body;
    const instructor = await Instructor.findOne({ email });
    if (!instructor) return res.status(400).json({ message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, instructor.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: instructor._id, role: "Instructor" }, process.env.JWT_SECRET, { expiresIn: "30d" });

    res.json({ token, instructor });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

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

// export const getInstructorStats = async (req, res) => {
//   try {
//     const courses = await Course.find({ instructor: req.user._id });
//     const totalStudents = courses.reduce((acc, c) => acc + c.students.length, 0);
//     const totalSales = courses.reduce((acc, c) => acc + c.sales, 0);
//     res.json({ totalCourses: courses.length, totalStudents, totalSales });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };
export const getInstructorStats = async (req, res) => {
  try {
    const courses = await Course.find({ instructor: req.user._id });

    // ✅ استخدمي enrolledStudents بدل students
    const totalStudents = courses.reduce((acc, c) => acc + (c.enrolledStudents?.length || 0), 0);

    // ✅ لو مفيش حقل sales في الموديل، خليه صفر مؤقتاً
    const totalSales = courses.reduce((acc, c) => acc + (c.sales || 0), 0);

    res.json({
      totalCourses: courses.length,
      totalStudents,
      totalSales
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

