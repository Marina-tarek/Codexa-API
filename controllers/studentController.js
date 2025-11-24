import Student from "../models/studentModel.js";
import Course from "../models/courseModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { verifyFirebaseToken } from "../utils/verifyFirebaseToken.js"; // 👈 new helper
import { sendResetCodeEmail } from "../utils/emailService.js";

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

// ------------------- 📘 Get Single Course by ID -------------------
export const getStudentCourseById = async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!courseId)
      return res.status(400).json({ message: "Missing course ID" });

    // 1) Find student
    const student = await Student.findById(req.user._id).select("enrolledCourses");

    if (!student)
      return res.status(404).json({ message: "Student not found" });

    console.log("Student enrolledCourses:", student.enrolledCourses);
    console.log("Requested courseId:", courseId);

    // 2) Convert ObjectIds to strings
    const enrolledIds = student.enrolledCourses.map(id => id.toString());

    const isEnrolled = enrolledIds.includes(courseId);

    console.log("Matched?", isEnrolled);

    if (!isEnrolled) {
      return res.status(403).json({
        message: "Access denied. You are not enrolled in this course.",
      });
    }

    // 3) Fetch full course details
    const course = await Course.findById(courseId)
      .select("-enrolledStudents")
      .populate("instructor", "name email profileImage bio")

    if (!course)
      return res.status(404).json({ message: "Course not found" });

    res.json(course);
  } catch (error) {
    console.error("Error fetching course:", error);
    res.status(500).json({
      message: "Error fetching course",
      error: error.message,
    });
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

// ------------------- 🔑 Forgot Password -------------------
export const forgotPasswordStudent = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // البحث عن الطالب
    const student = await Student.findOne({ email: email.toLowerCase() });

    // للأمان: نفس الرسالة سواء المستخدم موجود أو لا
    if (!student) {
      return res.status(200).json({
        message: "If the email exists, a reset code has been sent",
      });
    }

    // التحقق من أن المستخدم مسجل بالإيميل وليس social login
    if (student.authProvider !== "email" || !student.password) {
      return res.status(400).json({
        message: "This account uses social login. Password reset is not available.",
      });
    }

    // توليد كود عشوائي من 6 أرقام
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

    // حفظ الكود وتاريخ انتهاء الصلاحية (10 دقائق)
    student.resetPasswordCode = resetCode;
    student.resetPasswordCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await student.save();

    // إرسال الإيميل
    try {
      await sendResetCodeEmail(student.email, resetCode, student.name);
      res.status(200).json({
        message: "Reset code has been sent to your email",
      });
    } catch (emailError) {
      console.error("Email error:", emailError);
      // حذف الكود في حالة فشل الإرسال
      student.resetPasswordCode = null;
      student.resetPasswordCodeExpires = null;
      await student.save();
      return res.status(500).json({
        message: "Failed to send email. Please try again later.",
      });
    }
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ------------------- ✅ Verify Reset Code -------------------
export const verifyResetCodeStudent = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ message: "Email and code are required" });
    }

    const student = await Student.findOne({ email: email.toLowerCase() });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // التحقق من وجود الكود
    if (!student.resetPasswordCode) {
      return res.status(400).json({ message: "No reset code found. Please request a new one." });
    }

    // التحقق من صحة الكود
    if (student.resetPasswordCode !== code) {
      return res.status(400).json({ message: "Invalid reset code" });
    }

    // التحقق من انتهاء الصلاحية
    if (new Date() > student.resetPasswordCodeExpires) {
      student.resetPasswordCode = null;
      student.resetPasswordCodeExpires = null;
      await student.save();
      return res.status(400).json({ message: "Reset code has expired. Please request a new one." });
    }

    // الكود صحيح
    res.status(200).json({
      message: "Reset code verified successfully",
      verified: true,
    });
  } catch (error) {
    console.error("Verify code error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ------------------- 🔄 Reset Password -------------------
export const resetPasswordStudent = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({
        message: "Email, code, and newPassword are required",
      });
    }

    // التحقق من طول كلمة المرور
    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters long",
      });
    }

    const student = await Student.findOne({ email: email.toLowerCase() });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // التحقق من وجود الكود
    if (!student.resetPasswordCode) {
      return res.status(400).json({
        message: "No reset code found. Please request a new one.",
      });
    }

    // التحقق من صحة الكود
    if (student.resetPasswordCode !== code) {
      return res.status(400).json({ message: "Invalid reset code" });
    }

    // التحقق من انتهاء الصلاحية
    if (new Date() > student.resetPasswordCodeExpires) {
      student.resetPasswordCode = null;
      student.resetPasswordCodeExpires = null;
      await student.save();
      return res.status(400).json({
        message: "Reset code has expired. Please request a new one.",
      });
    }

    // تحديث كلمة المرور
    student.password = newPassword;
    student.resetPasswordCode = null;
    student.resetPasswordCodeExpires = null;
    await student.save(); // الـ pre-save hook سيشفر كلمة المرور تلقائياً

    res.status(200).json({
      message: "Password has been reset successfully",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};