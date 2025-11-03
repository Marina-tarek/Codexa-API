import Report from "../models/reportModel.js";
import CommunityPost from "../models/communityPostModel.js";

export const listReports = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;
    const reports = await Report.find(filter).sort({ createdAt: -1 }).populate("post");
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.reportId).populate("post");
    if (!report) return res.status(404).json({ message: "Not found" });
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const resolveReport = async (req, res) => {
  try {
    const { action, notes } = req.body; // delete | warn | ban | dismiss
    const report = await Report.findById(req.params.reportId);
    if (!report) return res.status(404).json({ message: "Not found" });

    if (action === "delete") {
      const post = await CommunityPost.findById(report.post);
      if (post) await post.deleteOne();
      report.status = "resolved";
      report.actionTaken = "delete";
    } else if (action === "dismiss") {
      report.status = "dismissed";
      report.actionTaken = "dismiss";
    } else {
      report.status = "resolved";
      report.actionTaken = action;
    }
    report.notes = notes || null;
    report.resolvedBy = req.user._id;
    await report.save();
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const forceDeletePost = async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: "Post not found" });
    await post.deleteOne();
    res.json({ message: "Post deleted by admin" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


