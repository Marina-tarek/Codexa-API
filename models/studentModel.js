// // models/Student.js
// import mongoose from "mongoose";
// import bcrypt from "bcryptjs";

// const studentSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   email: { type: String, required: true, unique: true },
//   password: { type: String, required: true },
//   profileImage: { type: String, default: "/uploads/default-avatar.png" },
//   isActive: { type: Boolean, default: true },
//   enrolledCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
//   progress: [
//     {
//       course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
//       completedVideos: [String],
//       percentage: { type: Number, default: 0 },
//     },
//   ],
// }, { timestamps: true });

// studentSchema.pre("save", async function (next) {
//   if (!this.isModified("password")) return next();
//   const salt = await bcrypt.genSalt(10);
//   this.password = await bcrypt.hash(this.password, salt);
// });

// studentSchema.methods.matchPassword = async function (enteredPassword) {
//   return await bcrypt.compare(enteredPassword, this.password);
// };

// export default mongoose.model("Student", studentSchema);
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const studentSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  profileImage: { type: String, default: "/uploads/default-avatar.png" },
  role: { type: String, default: "Student" },
  notes: [{ course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" }, content: String }],
  purchasedCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
  enrolledCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
  progress: [
    {
      course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
      percent: { type: Number, default: 0 }
    }
  ]
}, { timestamps: true });

studentSchema.pre("save", async function(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

const Student = mongoose.model("Student", studentSchema);
export default Student;