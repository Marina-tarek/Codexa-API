import Student from "../models/studentModel.js";
import Course from "../models/courseModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const registerStudent = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const exists = await Student.findOne({ email });
    if (exists) return res.status(400).json({ message: "Email already registered" });

    const student = await Student.create({ name, email, password });
    const token = jwt.sign({ id: student._id, role: "Student" }, process.env.JWT_SECRET, { expiresIn: "30d" });

    res.json({ token, student });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const loginStudent = async (req, res) => {
  try {
    const { email, password } = req.body;
    const student = await Student.findOne({ email });
    if (!student) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid password" });

    const token = jwt.sign({ id: student._id, role: "Student" }, process.env.JWT_SECRET, { expiresIn: "30d" });

    res.json({ token, student });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📝 إنشاء أو تعديل ملاحظات الطالب داخل كورس معين
export const addOrUpdateNotes = async (req, res) => {
  try {
    const { courseId, note } = req.body;
    const student = await Student.findById(req.user._id);

    const existing = student.notes.find((n) => n.course.toString() === courseId);
    if (existing) {
      existing.text = note;
    } else {
      student.notes.push({ course: courseId, text: note });
    }

    await student.save();
    res.json(student.notes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📈 متابعة التقدم في الكورس
export const updateProgress = async (req, res) => {
  try {
    const { courseId, progress } = req.body;
    const student = await Student.findById(req.user._id);
    const existing = student.progress.find((p) => p.course.toString() === courseId);

    if (existing) {
      existing.percent = progress;
    } else {
      student.progress.push({ course: courseId, percent: progress });
    }

    await student.save();
    res.json({ message: "Progress updated", progress: student.progress });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📚 عرض الكورسات اللي اشتراها الطالب
export const getMyCourses = async (req, res) => {
  try {
    const student = await Student.findById(req.user._id).populate("purchasedCourses");
    res.json(student.purchasedCourses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};