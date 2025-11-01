import ToDo from "../models/todoModel.js";

// Create
export const createTodo = async (req, res) => {
  try {
    const { title, body, linkUrl, imageUrl, audioUrl, priority, dueDate } = req.body;
    const todo = await ToDo.create({
      owner: req.user._id,
      ownerType: req.userType,
      title,
      body: body || "",
      linkUrl: linkUrl || null,
      imageUrl: imageUrl || null,
      audioUrl: audioUrl || null,
      priority: priority || "medium",
      dueDate: dueDate || null,
    });
    res.status(201).json(todo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// List (with filters)
export const listTodos = async (req, res) => {
  try {
    const { done, page = 1, limit = 20 } = req.query;
    const filter = { owner: req.user._id };
    if (done === "true") filter.isDone = true; else if (done === "false") filter.isDone = false;
    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      ToDo.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      ToDo.countDocuments(filter),
    ]);
    res.json({ total, page: Number(page), pageSize: items.length, items });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update
export const updateTodo = async (req, res) => {
  try {
    const todo = await ToDo.findById(req.params.id);
    if (!todo) return res.status(404).json({ message: "Not found" });
    if (todo.owner.toString() !== req.user._id.toString()) return res.status(403).json({ message: "Forbidden" });

    const { title, body, linkUrl, imageUrl, audioUrl, priority, dueDate } = req.body;
    if (title !== undefined) todo.title = title;
    if (body !== undefined) todo.body = body;
    if (linkUrl !== undefined) todo.linkUrl = linkUrl;
    if (imageUrl !== undefined) todo.imageUrl = imageUrl;
    if (audioUrl !== undefined) todo.audioUrl = audioUrl;
    if (priority !== undefined) todo.priority = priority;
    if (dueDate !== undefined) todo.dueDate = dueDate;

    await todo.save();
    res.json(todo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Done toggle
export const setDone = async (req, res) => {
  try {
    const { isDone } = req.body;
    const todo = await ToDo.findById(req.params.id);
    if (!todo) return res.status(404).json({ message: "Not found" });
    if (todo.owner.toString() !== req.user._id.toString()) return res.status(403).json({ message: "Forbidden" });
    todo.isDone = !!isDone;
    await todo.save();
    res.json(todo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete
export const deleteTodo = async (req, res) => {
  try {
    const todo = await ToDo.findById(req.params.id);
    if (!todo) return res.status(404).json({ message: "Not found" });
    if (todo.owner.toString() !== req.user._id.toString()) return res.status(403).json({ message: "Forbidden" });
    await todo.deleteOne();
    res.json({ message: "Deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Stats
export const getStats = async (req, res) => {
  try {
    const total = await ToDo.countDocuments({ owner: req.user._id });
    const done = await ToDo.countDocuments({ owner: req.user._id, isDone: true });
    const notDone = total - done;
    res.json({ total, done, notDone });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



