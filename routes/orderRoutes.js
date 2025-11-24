import express from "express";
import { createCheckoutSession, webhook } from "../controllers/orderController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/checkout-session", protect, createCheckoutSession);
router.post(
    "/webhook",
    webhook
);

export default router;
