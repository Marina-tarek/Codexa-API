import Stripe from "stripe";
import Order from "../models/orderModel.js";
import Cart from "../models/cartModel.js";
import Student from "../models/studentModel.js";
import Course from "../models/courseModel.js";
import dotenv from "dotenv";

dotenv.config();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// @desc    Create Stripe Checkout Session
// @route   POST /api/orders/checkout-session
// @access  Private (Student)
export const createCheckoutSession = async (req, res) => {
    try {
        const studentId = req.user._id;

        // Get student's cart
        const cart = await Cart.findOne({ student: studentId }).populate("courses");

        if (!cart || cart.courses.length === 0) {
            return res.status(400).json({ message: "Cart is empty" });
        }

        // Create line items for Stripe
        const lineItems = cart.courses.map((course) => ({
            price_data: {
                currency: "usd",
                product_data: {
                    name: course.title,
                    images: course.coverImage?.url ? [course.coverImage.url] : [],
                },
                unit_amount: Math.round(course.price * 100), // Stripe expects cents
            },
            quantity: 1,
        }));

        // Create Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: lineItems,
            mode: "payment",
            success_url: `${process.env.CLIENT_URL}/payment-success`,
            cancel_url: `${process.env.CLIENT_URL}/cart`,
            customer_email: req.user.email,
            client_reference_id: studentId.toString(),
            metadata: {
                cartId: cart._id.toString(),
            },
        });

        res.status(200).json({ id: session.id, url: session.url });
    } catch (error) {
        console.error("Stripe Checkout Error:", error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Stripe Webhook to handle successful payment
// @route   POST /api/orders/webhook
// @access  Public
export const webhook = async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    console.log("🔔 Webhook received!");

    try {
        // Verify webhook signature
        event = stripe.webhooks.constructEvent(
            req.rawBody,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
        console.log("✅ Webhook signature verified:", event.type);
    } catch (err) {
        console.error(`❌ Webhook Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    if (event.type === "checkout.session.completed") {
        const session = event.data.object;

        try {
            const studentId = session.client_reference_id;
            const cartId = session.metadata.cartId;

            console.log(`Processing order for student: ${studentId}, cart: ${cartId}`);

            // Find the cart to get course details
            const cart = await Cart.findById(cartId).populate("courses");

            if (cart) {
                // Create Order
                const order = await Order.create({
                    student: studentId,
                    items: cart.courses.map((course) => ({
                        course: course._id,
                        price: course.price,
                    })),
                    totalAmount: session.amount_total / 100,
                    status: "completed",
                    stripeSessionId: session.id,
                });

                // Enroll student in courses
                const courseIds = cart.courses.map((c) => c._id);

                // Update Student: add to purchasedCourses and enrolledCourses
                await Student.findByIdAndUpdate(studentId, {
                    $addToSet: {
                        purchasedCourses: { $each: courseIds },
                        enrolledCourses: { $each: courseIds },
                    },
                });

                // Update Courses: add student to enrolledStudents
                await Course.updateMany(
                    { _id: { $in: courseIds } },
                    { $addToSet: { enrolledStudents: studentId } }
                );

                // Clear Cart
                cart.courses = [];
                cart.totalPrice = 0;
                await cart.save();

                console.log(`✅ Order created and courses enrolled for student ${studentId}`);
            } else {
                console.error(`❌ Cart not found: ${cartId}`);
            }
        } catch (error) {
            console.error("❌ Error processing webhook:", error);
            return res.status(500).send("Internal Server Error");
        }
    }

    res.status(200).send();
};
