// // routes/communityRoutes.js
// import express from "express";
// import CommunityPost from "../models/CommunityPost.js";
// import Notification from "../models/Notification.js";
// import { protect } from "../middleware/authMiddleware.js";
// import { uploadProfile, uploadVideo } from "../middleware/uploadMiddleware.js";

// const router = express.Router();

// // create post (content required, image optional)
// router.post("/", protect, async (req, res) => {
//   try {
//     const { content, image } = req.body; // frontend can send image URL (uploaded separately)
//     const newPost = await CommunityPost.create({
//       author: req.user._id,
//       authorType: req.userType,
//       content,
//       image: image || null,
//     });
//     const populated = await newPost.populate("author", "name profileImage");
//     res.json(populated);
//   } catch (err) {
//     res.status(500).json({ message: "Error creating post", err });
//   }
// });

// // list posts
// router.get("/", async (req, res) => {
//   const posts = await CommunityPost.find().populate("author", "name profileImage").populate("comments.user", "name profileImage").sort({ createdAt: -1 });
//   res.json(posts);
// });

// // like/unlike
// router.post("/like/:id", protect, async (req, res) => {
//   const post = await CommunityPost.findById(req.params.id).populate("author", "name profileImage");
//   if (!post) return res.status(404).json({ message: "Post not found" });
//   const userId = req.user._id.toString();
//   const already = post.likes.find(l => l.user.toString() === userId);
//   if (already) {
//     post.likes = post.likes.filter(l => l.user.toString() !== userId);
//   } else {
//     post.likes.push({ user: req.user._id, userType: req.userType });
//     if (post.author._id.toString() !== userId) {
//       const notif = await Notification.create({
//         receiver: post.author._id,
//         receiverType: post.authorType,
//         sender: req.user._id,
//         senderType: req.userType,
//         type: "like",
//         message: `${req.user.name} liked your post`,
//         link: `/community/${post._id}`,
//       });
//       const io = req.app.get("io");
//       io.to(post.author._id.toString()).emit("notification", notif);
//     }
//   }
//   await post.save();
//   res.json(post);
// });

// // comment
// router.post("/comment/:id", protect, async (req, res) => {
//   const { text } = req.body;
//   const post = await CommunityPost.findById(req.params.id).populate("author", "name profileImage");
//   if (!post) return res.status(404).json({ message: "Post not found" });
//   post.comments.push({ user: req.user._id, userType: req.userType, text });
//   await post.save();

//   if (post.author._id.toString() !== req.user._id.toString()) {
//     const notif = await Notification.create({
//       receiver: post.author._id,
//       receiverType: post.authorType,
//       sender: req.user._id,
//       senderType: req.userType,
//       type: "comment",
//       message: `${req.user.name} commented on your post`,
//       link: `/community/${post._id}`,
//     });
//     const io = req.app.get("io");
//     io.to(post.author._id.toString()).emit("notification", notif);
//   }

//   const populated = await post.populate("comments.user", "name profileImage");
//   res.json(populated);
// });

// // export default router;
// import express from "express";
// import { createPost, getPosts, toggleLike, addComment } from "../controllers/communityController.js";
// import { protect } from "../middleware/authMiddleware.js";

// const router = express.Router();

// router.post("/", protect, createPost);
// router.get("/", getPosts);
// router.post("/like/:id", protect, toggleLike);
// router.post("/comment/:id", protect, addComment);

// export default router;

import express from "express";
import { createPost, getPosts, toggleLike, addComment } from "../controllers/communityController.js";
import { protectInstructor, protectStudent } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protectInstructor, createPost);
router.get("/", getPosts);
router.post("/:id/like", protectInstructor, toggleLike);
router.post("/:id/comment", protectInstructor, addComment);
router.post("/:id/comment/student", protectStudent, addComment);

export default router;