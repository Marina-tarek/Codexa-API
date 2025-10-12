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
import Question from "../models/questionModel.js";
import Course from "../models/courseModel.js";

export const askQuestion = async (req, res) => {
  try {
    const { courseId, text } = req.body;
    const question = await Question.create({
      course: courseId,
      student: req.user._id,
      text
    });
    res.json(question);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const answerQuestion = async (req, res) => {
  try {
    const { answer } = req.body;
    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ message: "Question not found" });

    question.answers.push({
      instructor: req.user._id,
      text: answer
    });

    await question.save();
    res.json(question);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCourseQuestions = async (req, res) => {
  try {
    const questions = await Question.find({ course: req.params.courseId })
      .populate("student", "name profileImage")
      .populate("answers.instructor", "name profileImage");
    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};