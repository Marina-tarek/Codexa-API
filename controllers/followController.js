import Follow from "../models/followModel.js";
import Notification from "../models/notificationModel.js";

// POST /api/follows/toggle  { instructorId }
export const toggleFollow = async (req, res) => {
  try {
    const { instructorId } = req.body;
    if (!instructorId) return res.status(400).json({ message: "instructorId is required" });

    // unify with model: follower/following with refPaths
    const existing = await Follow.findOne({
      follower: req.user._id,
      following: instructorId,
    });

    if (existing) {
      await existing.deleteOne();
      return res.json({ message: "Unfollowed" });
    }

    const created = await Follow.create({
      follower: req.user._id,
      followerType: req.userType, // Student expected
      following: instructorId,
      followingType: "Instructor",
    });

    // optional notification
    try {
      await Notification.create({
        receiver: instructorId,
        receiverType: "Instructor",
        sender: req.user._id,
        senderType: req.userType,
        type: "follow",
        message: `${req.user.name} started following you`,
        link: `/instructors/${instructorId}`,
      });
    } catch {}

    return res.status(201).json({ message: "Followed", follow: created });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/follows/status/:instructorId
export const getFollowStatus = async (req, res) => {
  try {
    const { instructorId } = req.params;
    const existing = await Follow.findOne({ follower: req.user._id, following: instructorId });
    res.json({ following: !!existing });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/follows/followers/:instructorId
export const getFollowers = async (req, res) => {
  try {
    const { instructorId } = req.params;
    const list = await Follow.find({ following: instructorId }).sort({ createdAt: -1 }).populate("follower", "name profileImage");
    res.json({ count: list.length, followers: list });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/follows/following/me
export const getMyFollowing = async (req, res) => {
  try {
    const list = await Follow.find({ follower: req.user._id }).sort({ createdAt: -1 }).populate("following", "name profileImage bio");
    res.json({ count: list.length, following: list });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/follows/counts/:instructorId
export const getCounts = async (req, res) => {
  try {
    const { instructorId } = req.params;
    const followers = await Follow.countDocuments({ following: instructorId });
    res.json({ followers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/follows/counts/me (Student)
export const getMyFollowingCount = async (req, res) => {
  try {
    const following = await Follow.countDocuments({ follower: req.user._id });
    res.json({ following });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};