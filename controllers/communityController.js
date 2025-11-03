// controllers/communityController.js
import CommunityPost from "../models/communityPostModel.js";
import Notification from "../models/notificationModel.js";
import Report from "../models/reportModel.js";

export const createPost = async (req, res) => {
  try {
    const { content, image, type, linkUrl, attachments, poll } = req.body;
    const newPost = await CommunityPost.create({
      author: req.user._id,
      authorType: req.userType,
      type: type || "text",
      content,
      image: image || null,
      linkUrl: linkUrl || null,
      attachments: attachments || [],
      poll: poll || null
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

// Reply to a comment
export const addReply = async (req, res) => {
  try {
    const { text } = req.body;
    const { id, commentId } = req.params;
    const post = await CommunityPost.findById(id).populate("author", "name profileImage role");
    if (!post) return res.status(404).json({ message: "Post not found" });

    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    comment.replies.push({ user: req.user._id, userType: req.userType, text });
    await post.save();

    // notify original commenter if different user
    if (comment.user?.toString() !== req.user._id.toString()) {
      try {
        await Notification.create({
          receiver: comment.user,
          receiverType: comment.userType || "Student",
          sender: req.user._id,
          senderType: req.userType,
          type: "comment-reply",
          message: `${req.user.name} replied to your comment`,
          link: `/community/${post._id}`,
        });
      } catch {}
    }

    const populated = await post.populate("comments.user", "name profileImage").populate("comments.replies.user", "name profileImage");
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ====== Post Edit/Delete with ownership or admin ======
export const editPost = async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    const isOwner = post.author.toString() === req.user._id.toString();
    const isAdmin = req.userType === "Admin";
    if (!isOwner && !isAdmin) return res.status(403).json({ message: "Forbidden" });

    const { content, type, image, linkUrl, attachments, poll } = req.body;
    if (content !== undefined) post.content = content;
    if (type !== undefined) post.type = type;
    if (image !== undefined) post.image = image;
    if (linkUrl !== undefined) post.linkUrl = linkUrl;
    if (attachments !== undefined) post.attachments = attachments;
    if (poll !== undefined) post.poll = poll;
    await post.save();
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deletePost = async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    const isOwner = post.author.toString() === req.user._id.toString();
    const isAdmin = req.userType === "Admin";
    if (!isOwner && !isAdmin) return res.status(403).json({ message: "Forbidden" });
    await post.deleteOne();
    res.json({ message: "Post deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ====== Comment Edit/Delete ======
export const editComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const { text } = req.body;
    const post = await CommunityPost.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });
    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });
    const isOwner = comment.user.toString() === req.user._id.toString();
    const isAdmin = req.userType === "Admin";
    if (!isOwner && !isAdmin) return res.status(403).json({ message: "Forbidden" });
    if (text !== undefined) comment.text = text;
    await post.save();
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const post = await CommunityPost.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });
    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });
    const isOwner = comment.user.toString() === req.user._id.toString();
    const isAdmin = req.userType === "Admin";
    if (!isOwner && !isAdmin) return res.status(403).json({ message: "Forbidden" });
    comment.deleteOne();
    await post.save();
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ====== Reply Edit/Delete ======
export const editReply = async (req, res) => {
  try {
    const { postId, commentId, replyId } = req.params;
    const { text } = req.body;
    const post = await CommunityPost.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });
    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });
    const reply = comment.replies.id(replyId);
    if (!reply) return res.status(404).json({ message: "Reply not found" });
    const isOwner = reply.user.toString() === req.user._id.toString();
    const isAdmin = req.userType === "Admin";
    if (!isOwner && !isAdmin) return res.status(403).json({ message: "Forbidden" });
    if (text !== undefined) reply.text = text;
    await post.save();
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteReply = async (req, res) => {
  try {
    const { postId, commentId, replyId } = req.params;
    const post = await CommunityPost.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });
    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });
    const reply = comment.replies.id(replyId);
    if (!reply) return res.status(404).json({ message: "Reply not found" });
    const isOwner = reply.user.toString() === req.user._id.toString();
    const isAdmin = req.userType === "Admin";
    if (!isOwner && !isAdmin) return res.status(403).json({ message: "Forbidden" });
    reply.deleteOne();
    await post.save();
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ====== Reports ======
export const reportPost = async (req, res) => {
  try {
    const { reason, details } = req.body;
    const post = await CommunityPost.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: "Post not found" });
    const report = await Report.create({
      post: post._id,
      reporter: req.user._id,
      reporterType: req.userType,
      reason,
      details: details || "",
    });
    res.status(201).json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};