import express from "express";
import {
  createPost,
  getPosts,
  toggleLike,
  addComment,
  addReply,
  editPost,
  deletePost,
  editComment,
  deleteComment,
  editReply,
  deleteReply,
  reportPost,
} from "../controllers/communityController.js";
import { protectAny } from "../middleware/authMiddleware.js";

const router = express.Router();

// 🟢 أي مستخدم (طالب أو مدرس) يقدر يعمل بوست
router.post("/", protectAny, createPost);

// 🟢 عرض جميع البوستات
router.get("/", getPosts);

// 🟢 لايك - كومنت - ريبلاي (الكل يقدر)
router.post("/:id/like", protectAny, toggleLike);
router.post("/:id/comment", protectAny, addComment);
router.post("/:id/comment/:commentId/reply", protectAny, addReply);

// Edits & Deletes (owner or admin)
router.put("/:id", protectAny, editPost);
router.delete("/:id", protectAny, deletePost);
router.put("/:postId/comment/:commentId", protectAny, editComment);
router.delete("/:postId/comment/:commentId", protectAny, deleteComment);
router.put("/:postId/comment/:commentId/reply/:replyId", protectAny, editReply);
router.delete("/:postId/comment/:commentId/reply/:replyId", protectAny, deleteReply);

// Reporting
router.post("/:postId/report", protectAny, reportPost);

export default router;
