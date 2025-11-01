import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    itemId: { type: mongoose.Schema.Types.ObjectId, required: true }, // Course or Instructor id
    itemType: { type: String, enum: ["Course", "Instructor"], required: true },
    author: { type: mongoose.Schema.Types.ObjectId, refPath: "authorType", required: true },
    authorType: { type: String, enum: ["Student"], required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    text: { type: String, default: "" },
  },
  { timestamps: true }
);

reviewSchema.index({ itemId: 1, itemType: 1, author: 1 }, { unique: true });

const Review = mongoose.model("Review", reviewSchema);
export default Review;



