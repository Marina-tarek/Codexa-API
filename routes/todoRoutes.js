import express from "express";
import { protectAny } from "../middleware/authMiddleware.js";
import { createTodo, listTodos, updateTodo, setDone, deleteTodo, getStats } from "../controllers/todoController.js";

const router = express.Router();

router.post("/", protectAny, createTodo);
router.get("/", protectAny, listTodos);
router.put("/:id", protectAny, updateTodo);
router.patch("/:id/done", protectAny, setDone);
router.delete("/:id", protectAny, deleteTodo);
router.get("/stats/summary", protectAny, getStats);

export default router;



