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