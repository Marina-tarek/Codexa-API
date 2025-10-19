// import Student from "../models/studentModel.js";
// import Course from "../models/courseModel.js";
// import bcrypt from "bcryptjs";
// import jwt from "jsonwebtoken";

// export const registerStudent = async (req, res) => {
//   try {
//     const { name, email, password } = req.body;
//     const exists = await Student.findOne({ email });
//     if (exists) return res.status(400).json({ message: "Email already registered" });

//     const student = await Student.create({ name, email, password });
//     const token = jwt.sign({ id: student._id, role: "Student" }, process.env.JWT_SECRET, { expiresIn: "30d" });

//     res.json({ token, student });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// export const loginStudent = async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     const student = await Student.findOne({ email });
//     if (!student) return res.status(400).json({ message: "Invalid credentials" });

//     const isMatch = await bcrypt.compare(password, student.password);
//     if (!isMatch) return res.status(400).json({ message: "Invalid password" });

//     const token = jwt.sign({ id: student._id, role: "Student" }, process.env.JWT_SECRET, { expiresIn: "30d" });

//     res.json({ token, student });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // 📝 إنشاء أو تعديل ملاحظات الطالب داخل كورس معين
// export const addOrUpdateNotes = async (req, res) => {
//   try {
//     const { courseId, note } = req.body;
//     const student = await Student.findById(req.user._id);

//     const existing = student.notes.find((n) => n.course.toString() === courseId);
//     if (existing) {
//       existing.text = note;
//     } else {
//       student.notes.push({ course: courseId, text: note });
//     }

//     await student.save();
//     res.json(student.notes);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // 📈 متابعة التقدم في الكورس
// export const updateProgress = async (req, res) => {
//   try {
//     const { courseId, progress } = req.body;
//     const student = await Student.findById(req.user._id);
//     const existing = student.progress.find((p) => p.course.toString() === courseId);

//     if (existing) {
//       existing.percent = progress;
//     } else {
//       student.progress.push({ course: courseId, percent: progress });
//     }

//     await student.save();
//     res.json({ message: "Progress updated", progress: student.progress });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };
// // 📚 عرض الكورسات اللي الطالب مشترك فيها فعليًا
// export const getMyCourses = async (req, res) => {
//   try {
//     const student = await Student.findById(req.user._id)
//       .populate({
//         path: "enrolledCourses",
//         select: "title description price instructor", // اختياري
//         populate: { path: "instructor", select: "name email" }
//       });

//     if (!student) return res.status(404).json({ message: "Student not found" });

//     res.json(student.enrolledCourses);
//   } catch (error) {
//     console.error("❌ Error fetching enrolled courses:", error);
//     res.status(500).json({ message: "Error fetching enrolled courses", error: error.message });
//   }
// }

// // 🧑‍🎓 تسجيل طالب في كورس
// export const enrollInCourse = async (req, res) => {
//   try {
//     const { courseId } = req.params;
//     const studentId = req.user._id;

//     const course = await Course.findById(courseId);
//     if (!course) return res.status(404).json({ message: "Course not found" });

//     // تأكدي إنه مش مسجّل قبل كده
//     if (course.enrolledStudents.includes(studentId)) {
//       return res.status(400).json({ message: "Student already enrolled in this course" });
//     }

//     // ضيف الطالب للكورس
//     course.enrolledStudents.push(studentId);
//     await course.save();

//     // ضيف الكورس لقائمة الطالب
//     const student = await Student.findById(studentId);
//     student.enrolledCourses.push(courseId);
//     await student.save();

//     res.json({ message: "Enrolled successfully", course });
//   } catch (error) {
//     console.error("❌ Enrollment error:", error);
//     res.status(500).json({ message: "Error enrolling in course", error: error.message });
//   }
// };


import Student from "../models/studentModel.js";
import Course from "../models/courseModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { verifyFirebaseToken } from "../utils/verifyFirebaseToken.js"; // 👈 new helper

// Helper to create JWT
const generateToken = (student) => {
  return jwt.sign(
    { id: student._id, role: "Student" },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
};

// ------------------- 📧 Email Register -------------------
export const registerStudent = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const exists = await Student.findOne({ email });
    if (exists) return res.status(400).json({ message: "Email already registered" });

    const student = await Student.create({
      name,
      email,
      password,
      authProvider: "email",
    });

    const token = generateToken(student);
    res.json({ token, student });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ------------------- 🔐 Email Login -------------------
export const loginStudent = async (req, res) => {
  try {
    const { email, password } = req.body;
    const student = await Student.findOne({ email });
    if (!student) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid password" });

    const token = generateToken(student);
    res.json({ token, student });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ------------------- 🌐 Social Login (Google / GitHub) -------------------
export const socialLoginStudent = async (req, res) => {
  try {
    const { token } = req.body; // Firebase ID token
    if (!token) return res.status(400).json({ message: "No token provided" });

    const decoded = await verifyFirebaseToken(token);
    if (!decoded) return res.status(401).json({ message: "Invalid Firebase token" });

    const { email, name, picture } = decoded;
    let provider = decoded.firebase?.sign_in_provider || "google";

    // Map Firebase provider to your enum values
    if (provider === "google.com") provider = "google";
    else if (provider === "github.com") provider = "github";


    let student = await Student.findOne({ email });

    if (!student) {
      // create if first time social login
      student = await Student.create({
        name: name || "New User",
        email,
        profileImage: picture || "/uploads/default-avatar.png",
        authProvider: provider,
        emailVerified: true,
      });
    } else {
      // update profile if changed
      if (!student.profileImage && picture) student.profileImage = picture;
      if (!student.emailVerified) student.emailVerified = true;
      if (student.authProvider !== provider) student.authProvider = provider;
      await student.save();
    }

    const jwtToken = generateToken(student);
    res.json({ token: jwtToken, student });
  } catch (err) {
    console.error("🔥 Social Login Error:", err);
    res.status(500).json({ message: err.message });
  }
};

// ------------------- 📝 Notes -------------------
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

// ------------------- 📈 Progress -------------------
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

// ------------------- 📚 My Courses -------------------
export const getMyCourses = async (req, res) => {
  try {
    const student = await Student.findById(req.user._id)
      .populate({
        path: "enrolledCourses",
        select: "title description price instructor",
        populate: { path: "instructor", select: "name email" },
      });

    if (!student) return res.status(404).json({ message: "Student not found" });

    res.json(student.enrolledCourses);
  } catch (error) {
    res.status(500).json({ message: "Error fetching courses", error: error.message });
  }
};

// ------------------- 🧑‍🎓 Enroll -------------------
export const enrollInCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user._id;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    if (course.enrolledStudents.includes(studentId)) {
      return res.status(400).json({ message: "Already enrolled" });
    }

    course.enrolledStudents.push(studentId);
    await course.save();

    const student = await Student.findById(studentId);
    student.enrolledCourses.push(courseId);
    await student.save();

    res.json({ message: "Enrolled successfully", course });
  } catch (error) {
    res.status(500).json({ message: "Error enrolling", error: error.message });
  }
};