import Follow from "../models/followModel.js";

export const toggleFollow = async (req, res) => {
  try {
    const { instructorId } = req.body;
    const existing = await Follow.findOne({
      student: req.user._id,
      instructor: instructorId,
    });

    if (existing) {
      await existing.deleteOne();
      res.json({ message: "Unfollowed" });
    } else {
      await Follow.create({ student: req.user._id, instructor: instructorId });
      res.json({ message: "Followed" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};