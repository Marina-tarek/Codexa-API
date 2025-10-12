// // routes/followRoutes.js
// import express from "express";
// import Follow from "../models/Follow.js";
// import Notification from "../models/Notification.js";
// import { protect } from "../middleware/authMiddleware.js";

// const router = express.Router();

// router.post("/:id/:type", protect, async (req, res) => {
//   const { id, type } = req.params;
//   const existing = await Follow.findOne({ follower: req.user._id, following: id });
//   if (existing) return res.status(400).json({ message: "Already following" });
//   await Follow.create({ follower: req.user._id, followerType: req.userType, following: id, followingType: type });
//   const notif = await Notification.create({ receiver: id, receiverType: type, sender: req.user._id, senderType: req.userType, type: "follow", message: `${req.user.name} started following you `});
//   const io = req.app.get("io");
//   io.to(id.toString()).emit("notification", notif);
//   res.json({ message: "Now following" });
// });

// router.delete("/:id", protect, async (req, res) => {
//   await Follow.findOneAndDelete({ follower: req.user._id, following: req.params.id });
//   res.json({ message: "Unfollowed" });
// });

// router.get("/followers/:id", async (req, res) => {
//   const followers = await Follow.find({ following: req.params.id }).populate("follower", "name profileImage");
//   res.json(followers);
// });

// export default router;

import express from "express";
import { toggleFollow } from "../controllers/followController.js";
import { protectStudent } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protectStudent, toggleFollow);

export default router;