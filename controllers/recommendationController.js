// controllers/recommendationController.js
import Course from "../models/Course.js";
import Student from "../models/Student.js";

export const recommendForMe = async (req, res) => {
  try {
    if (req.userType !== "Student") return res.status(400).json({ message: "Students only" });
    const student = await Student.findById(req.user._id);
    const enrolled = (student.enrolledCourses || []).map(id => id.toString());
    const all = await Course.find().lean();
    const filtered = all.filter(c => !enrolled.includes(c._id.toString()));
    filtered.sort((a, b) => (b.students?.length || 0) - (a.students?.length || 0));
    res.json(filtered.slice(0, 10));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};