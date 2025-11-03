import mongoose from "mongoose";

const replySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, refPath: "replies.userType" },
  userType: { type: String, enum: ["Instructor", "Student"] },
  text: String,
  createdAt: { type: Date, default: Date.now }
});

const commentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, refPath: "comments.userType" },
  userType: { type: String, enum: ["Instructor", "Student"] },
  text: String,
  createdAt: { type: Date, default: Date.now },
  replies: [replySchema]
});

const attachmentSchema = new mongoose.Schema({
  url: String,
  type: { type: String, enum: ["image", "video", "file"] },
});

const pollOptionSchema = new mongoose.Schema({
  text: String,
  votes: [{ type: mongoose.Schema.Types.ObjectId, refPath: "poll.options.votesType" }],
});

const pollSchema = new mongoose.Schema({
  question: String,
  options: [pollOptionSchema],
  closesAt: Date,
});

const communityPostSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, refPath: "authorType" },
  authorType: { type: String, enum: ["Instructor", "Student"] },
  type: { type: String, enum: ["text", "image", "link", "poll"], default: "text" },
  content: String,
  image: String,
  linkUrl: String,
  attachments: [attachmentSchema],
  poll: pollSchema,
  likes: [{ user: { type: mongoose.Schema.Types.ObjectId, refPath: "likes.userType" }, userType: String }],
  comments: [commentSchema]
}, { timestamps: true });

const CommunityPost = mongoose.model("CommunityPost", communityPostSchema);
export default CommunityPost;