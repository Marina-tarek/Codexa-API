// // // controllers/adminController.js
// // import Instructor from "../models/Instructor.js";
// // import Student from "../models/Student.js";
// // import Course from "../models/Course.js";
// // import CommunityPost from "../models/CommunityPost.js";
// // import Purchase from "../models/Purchase.js";
// // import Notification from "../models/Notification.js";

// // export const getStats = async (req, res) => {
// //   try {
// //     const totalInstructors = await Instructor.countDocuments();
// //     const totalStudents = await Student.countDocuments();
// //     const totalCourses = await Course.countDocuments();
// //     const purchases = await Purchase.find().lean();
// //     const totalRevenue = purchases.reduce((acc, p) => acc + (p.price || 0), 0);

// //     const courses = await Course.find().select("title price students").lean();
// //     const coursesStats = courses.map(c => ({ _id: c._id, title: c.title, studentsCount: (c.students||[]).length, price: c.price || 0, revenue: ((c.students||[]).length)*(c.price || 0) }));

// //     res.json({ totalInstructors, totalStudents, totalCourses, totalRevenue, courses: coursesStats });
// //   } catch (error) {
// //     res.status(500).json({ message: error.message });
// //   }
// // };

// // export const listInstructors = async (req, res) => {
// //   try {
// //     const instructors = await Instructor.find().select("name email profileImage isActive").lean();
// //     const purchases = await Purchase.find().lean();
// //     const revenueMap = {};
// //     purchases.forEach(p => { revenueMap[p.instructor.toString()] = (revenueMap[p.instructor.toString()] || 0) + (p.price || 0); });
// //     const result = instructors.map(i => ({ ...i, revenue: revenueMap[i._id.toString()] || 0 }));
// //     res.json(result);
// //   } catch (error) {
// //     res.status(500).json({ message: error.message });
// //   }
// // };

// // export const listStudents = async (req, res) => {
// //   try {
// //     const students = await Student.find().select("name email profileImage isActive enrolledCourses").lean();
// //     res.json(students);
// //   } catch (error) {
// //     res.status(500).json({ message: error.message });
// //   }
// // };

// // export const deleteCourse = async (req, res) => {
// //   try {
// //     const course = await Course.findById(req.params.id);
// //     if (!course) return res.status(404).json({ message: "Course not found" });
// //     await course.deleteOne();
// //     await Notification.create({ receiver: course.instructor, receiverType: "Instructor", sender: req.user._id, senderType: req.userType, type: "admin", message: `Admin removed course "${course.title}" `});
// //     res.json({ message: "Course removed" });
// //   } catch (error) {
// //     res.status(500).json({ message: error.message });
// //   }
// // };

// // export const getCommunity = async (req, res) => {
// //   try {
// //     const posts = await CommunityPost.find().populate("author", "name profileImage").populate("comments.user", "name profileImage").sort({ createdAt: -1 });
// //     res.json(posts);
// //   } catch (error) {
// //     res.status(500).json({ message: error.message });
// //   }
// // };

// // export const deletePost = async (req, res) => {
// //   try {
// //     await CommunityPost.findByIdAndDelete(req.params.id);
// //     res.json({ message: "Post deleted" });
// //   } catch (error) {
// //     res.status(500).json({ message: error.message });
// //   }
// // };
// import Admin from "../models/adminModel.js";
// import Instructor from "../models/instructorModel.js";
// import Student from "../models/studentModel.js";
// import Course from "../models/courseModel.js";
// import Payment from "../models/paymentModel.js";
// import bcrypt from "bcryptjs";
// import jwt from "jsonwebtoken";

// export const loginAdmin = async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     const admin = await Admin.findOne({ email });
//     if (!admin) return res.status(404).json({ message: "Admin not found" });

//     const isMatch = await bcrypt.compare(password, admin.password);
//     if (!isMatch) return res.status(400).json({ message: "Invalid password" });

//     const token = jwt.sign({ id: admin._id, role: "Admin" }, process.env.JWT_SECRET, { expiresIn: "30d" });
//     res.json({ token, admin });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// export const getDashboardStats = async (req, res) => {
//   try {
//     const instructors = await Instructor.countDocuments();
//     const students = await Student.countDocuments();
//     const courses = await Course.countDocuments();
//     const payments = await Payment.find();

//     const totalRevenue = payments.reduce((acc, p) => acc + (p.amount || 0), 0);

//     res.json({ instructors, students, courses, totalRevenue });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };
//====
import Admin from "../models/adminModel.js";
import Instructor from "../models/instructorModel.js";
import Student from "../models/studentModel.js";
import Course from "../models/courseModel.js";
import Payment from "../models/paymentModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid password" });

    const token = jwt.sign({ id: admin._id, role: "Admin" }, process.env.JWT_SECRET, { expiresIn: "30d" });
    res.json({ token, admin });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const instructors = await Instructor.countDocuments();
    const students = await Student.countDocuments();
    const courses = await Course.countDocuments();
    const payments = await Payment.find();

    const totalRevenue = payments.reduce((acc, p) => acc + (p.amount || 0), 0);

    res.json({ instructors, students, courses, totalRevenue });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};