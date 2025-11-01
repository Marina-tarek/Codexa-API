import Review from "../models/reviewModel.js";
import Course from "../models/courseModel.js";
import Instructor from "../models/instructorModel.js";

const validateItem = async (itemType, itemId) => {
  if (itemType === "Course") return !!(await Course.exists({ _id: itemId }));
  if (itemType === "Instructor") return !!(await Instructor.exists({ _id: itemId }));
  return false;
};

// POST /api/reviews
export const upsertReview = async (req, res) => {
  try {
    const { itemId, itemType, rating, text } = req.body;
    if (!itemId || !itemType || !rating) return res.status(400).json({ message: "itemId, itemType, rating required" });

    const ok = await validateItem(itemType, itemId);
    if (!ok) return res.status(404).json({ message: `${itemType} not found` });

    const review = await Review.findOneAndUpdate(
      { itemId, itemType, author: req.user._id },
      { rating, text: text || "" },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/reviews/:id
export const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: "Not found" });
    if (review.author.toString() !== req.user._id.toString()) return res.status(403).json({ message: "Forbidden" });
    await review.deleteOne();
    res.json({ message: "Deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/reviews/:itemType/:itemId?page=1&limit=10
export const listReviews = async (req, res) => {
  try {
    const { itemType, itemId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      Review.find({ itemId, itemType }).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).populate("author", "name profileImage"),
      Review.countDocuments({ itemId, itemType }),
    ]);
    res.json({ total, page: Number(page), pageSize: items.length, items });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/reviews/:itemType/:itemId/average
export const getAverage = async (req, res) => {
  try {
    const { itemType, itemId } = req.params;
    const agg = await Review.aggregate([
      { $match: { itemType, itemId: new (Review.db.base.Types.ObjectId)(itemId) } },
      { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]);
    const avg = agg[0]?.avg || 0;
    const count = agg[0]?.count || 0;
    res.json({ average: Number(avg.toFixed(2)), count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



