// controllers/communityController.js
import CommunityPost from "../models/communityPostModel.js";
import Notification from "../models/notificationModel.js";

export const createPost = async (req, res) => {
  try {
    const { content, image } = req.body;
    const newPost = await CommunityPost.create({
      author: req.user._id,
      authorType: req.userType,
      content,
      image: image || null
    });

    const populated = await newPost.populate("author", "name profileImage");
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPosts = async (req, res) => {
  try {
    const posts = await CommunityPost.find()
      .populate("author", "name profileImage")
      .populate("comments.user", "name profileImage")
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const toggleLike = async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.id).populate("author", "name profileImage role");
    if (!post) return res.status(404).json({ message: "Post not found" });

    const userId = req.user._id.toString();
    const already = post.likes.find(l => l.user.toString() === userId);

    if (already) {
      post.likes = post.likes.filter(l => l.user.toString() !== userId);
    } else {
      post.likes.push({ user: req.user._id, userType: req.userType });

      if (post.author._id.toString() !== userId) {
        const notif = await Notification.create({
          receiver: post.author._id,
          receiverType: post.author.role || "Instructor",
          sender: req.user._id,
          senderType: req.userType,
          type: "like",
          message: `${req.user.name} liked your post`,
          link: `/community/${post._id}`
        });
        const io = req.app.get("io");
        if (io) io.to(post.author._id.toString()).emit("notification", notif);
      }
    }

    await post.save();
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    const post = await CommunityPost.findById(req.params.id).populate("author", "name profileImage role");
    if (!post) return res.status(404).json({ message: "Post not found" });

    post.comments.push({ user: req.user._id, userType: req.userType, text });
    await post.save();

    if (post.author._id.toString() !== req.user._id.toString()) {
      const notif = await Notification.create({
        receiver: post.author._id,
        receiverType: post.author.role || "Instructor",
        sender: req.user._id,
        senderType: req.userType,
        type: "comment",
        message: `${req.user.name} commented on your post`,
        link:` /community/${post._id}`
      });
      const io = req.app.get("io");
      if (io) io.to(post.author._id.toString()).emit("notification", notif);
    }

    const populated = await post.populate("comments.user", "name profileImage");
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};