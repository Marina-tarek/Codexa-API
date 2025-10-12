// // // models/Course.js
// // import mongoose from "mongoose";

// // const courseSchema = new mongoose.Schema({
// //   instructor: { type: mongoose.Schema.Types.ObjectId, ref: "Instructor", required: true },
// //   title: { type: String, required: true },
// //   description: String,
// //   price: { type: Number, default: 0 },
// //   videos: [String], // URLs
// //   students: [{ type: mongoose.Schema.Types.ObjectId, ref: "Student" }],
// // }, { timestamps: true });

// // export default mongoose.model("Course", courseSchema);

import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
  title: String,
  description: String,
  price: Number,
  videoUrl: String,
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: "Instructor" },
  enrolledStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: "Student" }],
  progress: [{
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
    percentage: { type: Number, default: 0 }
  }]
}, { timestamps: true });

const Course = mongoose.model("Course", courseSchema);
export default Course;

