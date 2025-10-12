// // models/Purchase.js
// import mongoose from "mongoose";

// const purchaseSchema = new mongoose.Schema({
//   course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
//   student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
//   instructor: { type: mongoose.Schema.Types.ObjectId, ref: "Instructor", required: true },
//   price: { type: Number, required: true },
//   createdAt: { type: Date, default: Date.now },
// });

// export default mongoose.model("Purchase", purchaseSchema);
import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: "Instructor", required: true },
  amount: { type: Number, required: true },
  paymentStatus: { type: String, enum: ["pending", "completed", "failed"], default: "completed" },
  paymentMethod: { type: String, enum: ["stripe", "paypal"], default: "stripe" },
  transactionId: { type: String, unique: true },
}, { timestamps: true });

const Payment = mongoose.model("Payment", paymentSchema);
export default Payment;