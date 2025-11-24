import mongoose from "mongoose";

const cartSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      unique: true,
    },
    courses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
    ],
    totalPrice: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Calculate total price before saving
cartSchema.pre("save", async function (next) {
  if (this.isModified("courses")) {
    // We need to populate courses to calculate total price
    // However, in a pre-save hook, 'this' refers to the document being saved.
    // If we just pushed IDs, we might not have the price info here unless we populate.
    // A better approach for total price might be calculation on retrieval or
    // explicit calculation in the controller before saving.
    // For now, let's leave it to the controller to update totalPrice or
    // use a method to recalculate it.
  }
  next();
});

const Cart = mongoose.model("Cart", cartSchema);
export default Cart;
