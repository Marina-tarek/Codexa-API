import Cart from "../models/cartModel.js";
import Course from "../models/courseModel.js";

// @desc    Add course to cart
// @route   POST /api/cart
// @access  Private (Student)
export const addToCart = async (req, res) => {
    try {
        const { courseId } = req.body;
        const studentId = req.user._id;

        // Check if course exists
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }

        // Find cart for student or create new one
        let cart = await Cart.findOne({ student: studentId });

        if (!cart) {
            cart = await Cart.create({
                student: studentId,
                courses: [courseId],
                totalPrice: course.price,
            });
        } else {
            // Check if course already in cart
            if (cart.courses.includes(courseId)) {
                return res.status(400).json({ message: "Course already in cart" });
            }

            cart.courses.push(courseId);
            cart.totalPrice += course.price;
            await cart.save();
        }

        await cart.populate("courses", "title price instructor coverImage");
        res.status(200).json(cart);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private (Student)
export const getCart = async (req, res) => {
    try {
        const studentId = req.user._id;
        let cart = await Cart.findOne({ student: studentId }).populate(
            "courses",
            "title price instructor coverImage"
        );

        if (!cart) {
            return res.status(200).json({ courses: [], totalPrice: 0 });
        }

        res.status(200).json(cart);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Remove course from cart
// @route   DELETE /api/cart/:courseId
// @access  Private (Student)
export const removeFromCart = async (req, res) => {
    try {
        const { courseId } = req.params;
        const studentId = req.user._id;

        const cart = await Cart.findOne({ student: studentId });

        if (!cart) {
            return res.status(404).json({ message: "Cart not found" });
        }

        // Check if course is in cart
        if (!cart.courses.includes(courseId)) {
            return res.status(404).json({ message: "Course not found in cart" });
        }

        // Get course price to deduct
        const course = await Course.findById(courseId);
        if (course) {
            cart.totalPrice -= course.price;
        }

        // Remove course from array
        cart.courses = cart.courses.filter(
            (id) => id.toString() !== courseId.toString()
        );

        // Ensure total price doesn't go below 0 (just in case)
        if (cart.totalPrice < 0) cart.totalPrice = 0;

        await cart.save();
        await cart.populate("courses", "title price instructor coverImage");

        res.status(200).json(cart);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
