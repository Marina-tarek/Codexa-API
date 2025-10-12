// // models/CommunityPost.js
// import mongoose from "mongoose";

// const commentSchema = new mongoose.Schema({
//   user: { type: mongoose.Schema.Types.ObjectId, refPath: "userType" },
//   userType: { type: String, enum: ["Student", "Instructor"] },
//   text: String,
//   createdAt: { type: Date, default: Date.now },
// });

// const likeSchema = new mongoose.Schema({
//   user: { type: mongoose.Schema.Types.ObjectId, refPath: "userType" },
//   userType: { type: String, enum: ["Student", "Instructor"] },
// });

// const communityPostSchema = new mongoose.Schema({
//   author: { type: mongoose.Schema.Types.ObjectId, refPath: "authorType", required: true },
//   authorType: { type: String, enum: ["Student", "Instructor"], required: true },
//   content: { type: String, required: true },
//   image: String,
//   likes: [likeSchema],
//   comments: [commentSchema],
//   createdAt: { type: Date, default: Date.now },
// });

// export default mongoose.model("CommunityPost", communityPostSchema);
import mongoose from "mongoose";

const communityPostSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, refPath: "authorType" },
  authorType: { type: String, enum: ["Instructor", "Student"] },
  content: String,
  image: String,
  likes: [{ user: { type: mongoose.Schema.Types.ObjectId, refPath: "likes.userType" }, userType: String }],
  comments: [{
    user: { type: mongoose.Schema.Types.ObjectId, refPath: "comments.userType" },
    userType: String,
    text: String,
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

const CommunityPost = mongoose.model("CommunityPost", communityPostSchema);
export default CommunityPost;