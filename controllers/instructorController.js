import Instructor from "../models/instructorModel.js";
import Course from "../models/courseModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cloudinary from "../utils/cloudinary.js";
import { verifyFirebaseToken } from "../utils/verifyFirebaseToken.js";

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
const generateToken = (instructor) => {
  return jwt.sign(
    { id: instructor._id, role: "Instructor" },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
};
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
    const token = generateToken(instructor);
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

    const token = generateToken(instructor);

    res.json({ token, instructor });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// _____________________Mustafa Edits_____________________
export const socialLoginInstructor = async (req, res) => {
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


    let instructor = await Instructor.findOne({ email });

    if (!instructor) {
      // create if first time social login
      instructor = await Instructor.create({
        name: name || "New User",
        email,
        profileImage: picture || "/uploads/default-avatar.png",
        authProvider: provider,
        emailVerified: true,
      });
    } else {
      // update profile if changed
      if (!instructor.profileImage && picture) instructor.profileImage = picture;
      if (!instructor.emailVerified) instructor.emailVerified = true;
      if (instructor.authProvider !== provider) instructor.authProvider = provider;
      await instructor.save();
    }

    const jwtToken = generateToken(instructor);
    res.json({ token: jwtToken, instructor });
  } catch (err) {
    console.error("🔥 Social Login Error:", err);
    res.status(500).json({ message: err.message });
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
    const courses = await Course.find({ instructor: req.user._id }).select("_id title enrolledStudents");
    const courseIds = courses.map((c) => c._id);

    const totalStudents = courses.reduce((acc, c) => acc + (c.enrolledStudents?.length || 0), 0);

    // completed by course using Student.progress
    const Student = (await import("../models/studentModel.js")).default;
    const completedAgg = await Student.aggregate([
      { $match: { "progress.course": { $in: courseIds } } },
      { $unwind: "$progress" },
      { $match: { "progress.course": { $in: courseIds }, "progress.percent": { $gte: 100 } } },
      { $group: { _id: "$progress.course", count: { $sum: 1 } } },
    ]);
    const completedByCourse = Object.fromEntries(completedAgg.map((x) => [x._id.toString(), x.count]));
    const totalCompleted = Object.values(completedByCourse).reduce((a, b) => a + b, 0);

    // revenue from payments
    const Payment = (await import("../models/paymentModel.js")).default;
    const payments = await Payment.find({ instructor: req.user._id, paymentStatus: "completed" });
    const totalRevenue = payments.reduce((acc, p) => acc + (p.amount || 0), 0);

    // online students (placeholder)
    const onlineStudents = 0;

    res.json({
      totalCourses: courses.length,
      totalStudents,
      totalCompleted,
      totalRevenue,
      onlineStudents,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============== New: Profile endpoints ==============
export const updateInstructorProfile = async (req, res) => {
  try {
    const instructor = await Instructor.findById(req.user._id);
    if (!instructor) return res.status(404).json({ message: "Not found" });
    const { name, bio, links } = req.body;
    if (name) instructor.name = name;
    if (bio !== undefined) instructor.bio = bio;
    if (links) {
      try {
        instructor.links = Array.isArray(links) ? links : JSON.parse(links);
      } catch {
        instructor.links = [];
      }
    }
    if (req.file?.path || req.file?.secure_url) {
      instructor.profileImage = req.file.secure_url || req.file.path;
    }
    await instructor.save();
    res.json({ message: "Profile updated", instructor });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const changeInstructorPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ message: "currentPassword and newPassword required" });
    const instructor = await Instructor.findById(req.user._id);
    if (!instructor) return res.status(404).json({ message: "Not found" });
    if (!instructor.password) return res.status(400).json({ message: "Password not set for social account" });
    const match = await bcrypt.compare(currentPassword, instructor.password);
    if (!match) return res.status(400).json({ message: "Current password incorrect" });
    instructor.password = newPassword;
    await instructor.save();
    res.json({ message: "Password changed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getInstructorProfile = async (req, res) => {
  try {
    const instructor = await Instructor.findById(req.params.id).select("-password");
    if (!instructor) return res.status(404).json({ message: "Not found" });
    const Follow = (await import("../models/followModel.js")).default;
    const Payment = (await import("../models/paymentModel.js")).default;
    const [followers, following] = await Promise.all([
      Follow.countDocuments({ following: instructor._id }),
      Follow.countDocuments({ follower: instructor._id }),
    ]);
    const payments = await Payment.find({ instructor: instructor._id, paymentStatus: "completed" });
    const revenue = payments.reduce((acc, p) => acc + (p.amount || 0), 0);
    res.json({ instructor, followers, following, revenue });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

