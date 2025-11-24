import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
    {
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student",
            required: true,
        },
        items: [
            {
                course: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Course",
                    required: true,
                },
                price: {
                    type: Number,
                    required: true,
                },
            },
        ],
        totalAmount: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            enum: ["pending", "completed", "failed"],
            default: "pending",
        },
        paymentMethod: {
            type: String,
            default: "stripe",
        },
        stripeSessionId: {
            type: String,
            unique: true,
        },
    },
    { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);
export default Order;
