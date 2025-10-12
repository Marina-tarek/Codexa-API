// // models/Notification.js
// import mongoose from "mongoose";

// const notificationSchema = new mongoose.Schema({
//   receiver: { type: mongoose.Schema.Types.ObjectId, refPath: "receiverType", required: true },
//   receiverType: { type: String, enum: ["Instructor", "Student"], required: true },
//   sender: { type: mongoose.Schema.Types.ObjectId, refPath: "senderType" },
//   senderType: { type: String, enum: ["Instructor", "Student"] },
//   type: { type: String, enum: ["like", "comment", "post", "follow", "purchase", "admin"], required: true },
//   message: String,
//   link: String,
//   isRead: { type: Boolean, default: false },
//   createdAt: { type: Date, default: Date.now },
// });

// export default mongoose.model("Notification", notificationSchema);
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  receiver: { type: mongoose.Schema.Types.ObjectId, refPath: "receiverType" },
  receiverType: String,
  sender: { type: mongoose.Schema.Types.ObjectId, refPath: "senderType" },
  senderType: String,
  type: String,
  message: String,
  link: String,
  isRead: { type: Boolean, default: false }
}, { timestamps: true });

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;