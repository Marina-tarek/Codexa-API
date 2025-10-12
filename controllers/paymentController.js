import Stripe from "stripe";
import Payment from "../models/paymentModel.js";
import Course from "../models/courseModel.js";
import Notification from "../models/notificationModel.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const buyCourse = async (req, res) => {
  try {
    const { courseId } = req.body;
    const course = await Course.findById(courseId).populate("instructor");

    if (!course) return res.status(404).json({ message: "Course not found" });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(course.price * 100),
      currency: "usd",
      metadata: { courseId, studentId: req.user._id.toString() },
    });

    await Payment.create({
      student: req.user._id,
      course: courseId,
      instructor: course.instructor._id,
      amount: course.price,
      status: "pending",
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};