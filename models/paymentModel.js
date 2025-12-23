import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: "Instructor", required: true },
  amount: { type: Number, required: true },
  paymentStatus: { type: String, enum: ["pending", "completed", "failed"], default: "pending" },
  paymentMethod: { type: String, enum: ["stripe", "paypal"], default: "stripe" },
  transactionId: { type: String, unique: true, sparse: true },

  // Revenue Split
  platformFeePercentage: { type: Number, default: 20 }, // Admin takes 20%
  platformFee: { type: Number, default: 0 }, // Admin's share in dollars
  instructorRevenue: { type: Number, default: 0 }, // Instructor's share in dollars
}, { timestamps: true });

// Calculate revenue split before saving
paymentSchema.pre("save", function (next) {
  if (this.isModified("amount") || this.isNew) {
    this.platformFee = (this.amount * this.platformFeePercentage) / 100;
    this.instructorRevenue = this.amount - this.platformFee;
  }
  next();
});

const Payment = mongoose.model("Payment", paymentSchema);
export default Payment;