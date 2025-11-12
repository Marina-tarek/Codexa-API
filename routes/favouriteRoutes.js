import express from "express";
import { toggleFavourite, getMyFavourites } from "../controllers/favouriteController.js";
import { protectStudent } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/toggle", protectStudent, toggleFavourite);
router.get("/", protectStudent, getMyFavourites);

export default router;


