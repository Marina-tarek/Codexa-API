// // // routes/qaRoutes.js
// // import express from "express";
// // import { protect } from "../middleware/authMiddleware.js";
// // import QA from "../models/QA.js";

// // const router = express.Router();

// // router.post("/:courseId", protect, async (req, res) => {
// //   const { question } = req.body;
// //   const newQA = await QA.create({
// //     course: req.params.courseId,
// //     user: req.user._id,
// //     userType: req.userType,
// //     question,
// //   });
// //   const populated = await newQA.populate("user", "name profileImage");
// //   res.json(populated);
// // });

// // router.get("/:courseId", async (req, res) => {
// //   const qas = await QA.find({ course: req.params.courseId })
// //     .populate("user", "name profileImage")
// //     .populate("answers.user", "name profileImage");
// //   res.json(qas);
// // });

// // router.post("/answer/:qaId", protect, async (req, res) => {
// //   const { text } = req.body;
// //   const qa = await QA.findById(req.params.qaId);
// //   if (!qa) return res.status(404).json({ message: "Question not found" });
// //   qa.answers.push({ user: req.user._id, userType: req.userType, text });
// //   await qa.save();
// //   const populated = await qa.populate("answers.user", "name profileImage");
// //   res.json(populated);
// // });

// // export default router;
// import express from "express";
// import { addQuestion, getQAs, addAnswer } from "../controllers/qaController.js";
// import { protect } from "../middleware/authMiddleware.js";

// const router = express.Router();

// router.post("/:courseId", protect, addQuestion);
// router.get("/:courseId", getQAs);
// router.post("/answer/:qaId", protect, addAnswer);

// export default router;

// import Question from "../models/questionModel.js";
// import Course from "../models/courseModel.js";

// export const askQuestion = async (req, res) => {
//   try {
//     const { courseId, text } = req.body;
//     const question = await Question.create({
//       course: courseId,
//       student: req.user._id,
//       text
//     });
//     res.json(question);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// export const answerQuestion = async (req, res) => {
//   try {
//     const { answer } = req.body;
//     const question = await Question.findById(req.params.id);
//     if (!question) return res.status(404).json({ message: "Question not found" });

//     question.answers.push({
//       instructor: req.user._id,
//       text: answer
//     });

//     await question.save();
//     res.json(question);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// export const getCourseQuestions = async (req, res) => {
//   try {
//     const questions = await Question.find({ course: req.params.courseId })
//       .populate("student", "name profileImage")
//       .populate("answers.instructor", "name profileImage");
//     res.json(questions);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };
// ===
import express from "express";
import { askQuestion, answerQuestion, getCourseQuestions } from "../controllers/qaController.js";
import { protectInstructor, protectStudent } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/ask", protectStudent, askQuestion);
router.post("/answer/:id", protectInstructor, answerQuestion);
router.get("/:courseId", getCourseQuestions);

export default router;