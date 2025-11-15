import mongoose from "mongoose";

const followSchema = new mongoose.Schema({
  follower: { 
    type: mongoose.Schema.Types.ObjectId, 
    refPath: "followerType", 
    required: true 
  },
  followerType: { 
    type: String, 
    enum: ["Student", "Instructor"], 
    required: true 
  },
  following: { 
    type: mongoose.Schema.Types.ObjectId, 
    refPath: "followingType", 
    required: true 
  },
  followingType: { 
    type: String, 
    enum: ["Instructor"], // حالياً المتابعة بتكون للمدرسين فقط
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// منع التكرار (علشان نفس الشخص ما يتابعش المدرس مرتين)
followSchema.index({ follower: 1, following: 1 }, { unique: true });

const Follow = mongoose.model("Follow", followSchema);
export default Follow;