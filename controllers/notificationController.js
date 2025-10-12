// // controllers/notificationController.js
// import Notification from "../models/Notification.js";

// export const getNotifications = async (req, res) => {
//   try {
//     const notifications = await Notification.find({ receiver: req.user._id }).sort({ createdAt: -1 }).populate("sender", "name profileImage");
//     res.json(notifications);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// export const markRead = async (req, res) => {
//   try {
//     const notif = await Notification.findById(req.params.id);
//     if (!notif) return res.status(404).json({ message: "Not found" });
//     notif.isRead = true;
//     await notif.save();
//     res.json({ message: "Marked read" });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// export const clearNotifications = async (req, res) => {
//   try {
//     await Notification.deleteMany({ receiver: req.user._id });
//     res.json({ message: "Cleared" });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };
import Notification from "../models/notificationModel.js";

export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      receiver: req.user._id,
      receiverType: req.userType,
    }).sort({ createdAt: -1 });

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};