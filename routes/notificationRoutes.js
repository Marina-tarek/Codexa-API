// // routes/notificationRoutes.js
// import express from "express";
// import { protect } from "../middleware/authMiddleware.js";
// import Notification from "../models/Notification.js";

// const router = express.Router();

// router.get("/", protect, async (req, res) => {
//   const notifications = await Notification.find({ receiver: req.user._id }).sort({ createdAt: -1 }).populate("sender", "name profileImage");
//   res.json(notifications);
// });

// router.put("/:id/read", protect, async (req, res) => {
//   const notif = await Notification.findById(req.params.id);
//   if (!notif) return res.status(404).json({ message: "Not found" });
//   notif.isRead = true;
//   await notif.save();
//   res.json({ message: "Marked read" });
// });

// router.delete("/clear", protect, async (req, res) => {
//   await Notification.deleteMany({ receiver: req.user._id });
//   res.json({ message: "Cleared" });
// });

// export default router;
// import express from "express";
// import { getNotifications, markRead, clearNotifications } from "../controllers/notificationController.js";
// import { protect } from "../middleware/authMiddleware.js";

// const router = express.Router();

// router.get("/", protect, getNotifications);
// router.put("/:id/read", protect, markRead);
// router.delete("/clear", protect, clearNotifications);

// export default router;
//==
import express from "express";
import { getNotifications } from "../controllers/notificationController.js";
import { protectInstructor, protectStudent } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protectInstructor, getNotifications);
router.get("/student", protectStudent, getNotifications);

export default router;