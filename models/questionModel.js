// // models/QA.js
// import mongoose from "mongoose";

// const answerSchema = new mongoose.Schema({
//   user: { type: mongoose.Schema.Types.ObjectId, refPath: "userType" },
//   userType: { type: String, enum: ["Student", "Instructor"] },
//   text: String,
//   createdAt: { type: Date, default: Date.now },
// });

// const qaSchema = new mongoose.Schema({
//   course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
//   user: { type: mongoose.Schema.Types.ObjectId, refPath: "userType", required: true },
//   userType: { type: String, enum: ["Student", "Instructor"], required: true },
//   question: { type: String, required: true },
//   answers: [answerSchema],
//   createdAt: { type: Date, default: Date.now },
// });

// export default mongoose.model("QA", qaSchema);

import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  questionText: { type: String, required: true },
  answers: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, refPath: "answers.userType" },
      userType: { type: String, enum: ["Instructor", "Student"], required: true },
      answerText: String,
      createdAt: { type: Date, default: Date.now }
    }
  ]
}, { timestamps: true });

const Question = mongoose.model("Question", questionSchema);
export default Question;