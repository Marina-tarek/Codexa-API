import LiveSession from "../models/liveSessionModel.js";
import Course from "../models/courseModel.js";
import Student from "../models/studentModel.js";
import cloudinary from "../utils/cloudinary.js";
import axios from "axios";
import jwt from "jsonwebtoken";

// 100ms Configuration
const HMS_APP_ACCESS_KEY = process.env.HMS_APP_ACCESS_KEY;
const HMS_APP_SECRET = process.env.HMS_APP_SECRET;
const HMS_API_URL = "https://api.100ms.live/v2";

// Helper: Create 100ms Auth Token
const create100msToken = async (roomId, userId, role) => {

    const payload = {
        access_key: HMS_APP_ACCESS_KEY,
        room_id: roomId,
        user_id: userId,
        role: role, // "host" or "guest"
        type: "app",
        version: 2,
        iat: Math.floor(Date.now() / 1000),
        nbf: Math.floor(Date.now() / 1000),
    };

    const token = jwt.sign(payload, HMS_APP_SECRET, {
        algorithm: "HS256",
        expiresIn: "24h",
        jwtid: `${userId}-${Date.now()}`,
    });

    return token;
};

// Helper: Create 100ms Management Token
const createManagementToken = () => {
    const payload = {
        access_key: HMS_APP_ACCESS_KEY,
        type: "management",
        version: 2,
        iat: Math.floor(Date.now() / 1000),
        nbf: Math.floor(Date.now() / 1000),
    };

    return jwt.sign(payload, HMS_APP_SECRET, {
        algorithm: "HS256",
        expiresIn: "24h",
        jwtid: `management-${Date.now()}`,
    });
};

// @desc    Create a new live session
// @route   POST /api/live-sessions
// @access  Private (Instructor)
export const createLiveSession = async (req, res) => {
    try {
        const { title, description, courseId, courseName, sessionType, scheduledAt } = req.body;

        // Validation
        if (!title || !sessionType || !scheduledAt) {
            return res.status(400).json({
                message: "title, sessionType, and scheduledAt are required",
            });
        }

        let courseIdToUse = null;

        // If private session, validate course
        if (sessionType === "private") {
            // Accept either courseName or courseId (for backward compatibility)
            if (!courseName && !courseId) {
                return res.status(400).json({
                    message: "courseName is required for private sessions",
                });
            }

            let course;

            // If courseName is provided, search by name
            if (courseName) {
                course = await Course.findOne({
                    title: courseName,
                    instructor: req.user._id,
                });
            } else {
                // Fallback to courseId for backward compatibility
                course = await Course.findOne({
                    _id: courseId,
                    instructor: req.user._id,
                });
            }

            if (!course) {
                return res.status(404).json({
                    message: "Course not found or you are not the instructor",
                });
            }

            courseIdToUse = course._id;
        }

        // Create room in 100ms
        const roomName = `${title.replace(/\s+/g, "-")}-${Date.now()}`;

        const response = await axios.post(
            `${HMS_API_URL}/rooms`,
            {
                name: roomName,
                description: description || title,
                recording_info: {
                    enabled: true,
                },
            },
            {
                headers: {
                    Authorization: `Bearer ${createManagementToken()}`,
                    "Content-Type": "application/json",
                },
            }
        );

        const roomId = response.data.id;

        // Create session in database
        const session = await LiveSession.create({
            instructor: req.user._id,
            course: sessionType === "private" ? courseIdToUse : null,
            title,
            description,
            sessionType,
            scheduledAt,
            roomId,
        });

        // Populate instructor and course
        await session.populate("instructor", "name profileImage");
        if (sessionType === "private") {
            await session.populate("course", "title coverImage");
        }

        res.status(201).json({
            message: "Live session created successfully",
            session,
        });
    } catch (error) {
        console.error("Error creating live session:", error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all live sessions (with filters)
// @route   GET /api/live-sessions?status=live&type=public
// @access  Public
export const getAllLiveSessions = async (req, res) => {
    try {
        const { status, sessionType, instructorId, courseId } = req.query;

        const filter = {};
        if (status) filter.status = status;
        if (sessionType) filter.sessionType = sessionType;
        if (instructorId) filter.instructor = instructorId;
        if (courseId) filter.course = courseId;

        const sessions = await LiveSession.find(filter)
            .populate("instructor", "name profileImage")
            .populate("course", "title coverImage")
            .sort({ scheduledAt: -1 });

        res.json({
            count: sessions.length,
            sessions,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single live session by ID
// @route   GET /api/live-sessions/:id
// @access  Public
export const getLiveSessionById = async (req, res) => {
    try {
        const session = await LiveSession.findById(req.params.id)
            .populate("instructor", "name profileImage bio")
            .populate("course", "title coverImage enrolledStudents");

        if (!session) {
            return res.status(404).json({ message: "Live session not found" });
        }

        res.json(session);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Join a live session (get auth token)
// @route   POST /api/live-sessions/:id/join
// @access  Private (Student or Instructor)
export const joinLiveSession = async (req, res) => {
    try {
        const session = await LiveSession.findById(req.params.id).populate("course");

        if (!session) {
            return res.status(404).json({ message: "Live session not found" });
        }

        const isAdmin = req.user.role === 'admin' || req.user.isAdmin;

        // Check if session is live or scheduled
        if (session.status === "ended" && !isAdmin) {
            return res.status(400).json({ message: "This session has ended" });
        }

        // Check permissions for private sessions
        if (session.sessionType === "private" && !isAdmin) {
            const isInstructor = session.instructor.toString() === req.user._id.toString();

            if (!isInstructor) {
                // Check if student is enrolled
                const course = await Course.findOne({
                    _id: session.course._id,
                    enrolledStudents: req.user._id,
                });

                if (!course) {
                    return res.status(403).json({
                        message: "You must be enrolled in this course to join",
                    });
                }
            }
        }

        // Determine role
        const isHost = session.instructor.toString() === req.user._id.toString();
        const role = isHost ? "host" : "guest";

        // Generate 100ms auth token
        const token = await create100msToken(
            session.roomId,
            req.user._id.toString(),
            role
        );

        // Update session status to live if instructor is joining
        if (isHost && session.status === "scheduled") {
            session.status = "live";
            session.startedAt = new Date();
        }

        // ✅ Track attendance (Skip for Admin)
        if (!isAdmin) {
            const existingAttendee = session.attendees.find(
                (a) => a.user.toString() === req.user._id.toString()
            );

            if (!existingAttendee) {
                session.attendees.push({
                    user: req.user._id,
                    userType: req.userType, // "Student" or "Instructor"
                    joinedAt: new Date(),
                });

                // Increment viewer count only for new attendees
                session.totalViewers += 1;
            }

            if (session.totalViewers > session.peakViewers) {
                session.peakViewers = session.totalViewers;
            }
        }

        await session.save();

        res.json({
            token,
            roomId: session.roomId,
            role,
            userName: req.user.name,
            userImage: req.user.profileImage,
            userId: req.user._id,
            userRole: isAdmin ? 'admin' : (isHost ? 'instructor' : 'student'), // Send role for frontend
            session: {
                _id: session._id,
                title: session.title,
                status: session.status,
            },
        });
    } catch (error) {
        console.error("Error joining live session:", error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    End a live session
// @route   PUT /api/live-sessions/:id/end
// @access  Private (Instructor only)
export const endLiveSession = async (req, res) => {
    try {
        const { saveOption } = req.body;

        const session = await LiveSession.findById(req.params.id);

        if (!session) {
            return res.status(404).json({ message: "Live session not found" });
        }

        const isAdmin = req.user.role === 'admin' || req.user.isAdmin;

        // Check if user is the instructor or admin
        if (session.instructor.toString() !== req.user._id.toString() && !isAdmin) {
            return res.status(403).json({ message: "Only the instructor can end this session" });
        }

        // Update session
        session.status = "ended";
        session.endedAt = new Date();
        session.saveOption = saveOption || "none";

        // Calculate duration
        if (session.startedAt) {
            const durationMs = session.endedAt - session.startedAt;
            session.duration = Math.round(durationMs / 60000);
        }

        // ✅ Update attendees duration
        session.attendees.forEach((attendee) => {
            if (!attendee.leftAt) {
                attendee.leftAt = new Date();
            }
            const attendeeDuration = attendee.leftAt - attendee.joinedAt;
            attendee.duration = Math.round(attendeeDuration / 60000);
        });

        await session.save();

        res.json({
            message: "Live session ended successfully",
            session,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Handle 100ms webhook for recording
// @route   POST /api/live-sessions/webhook
// @access  Public (100ms only)
export const handle100msWebhook = async (req, res) => {
    try {
        const { type, data } = req.body;

        console.log("📡 100ms Webhook received:", type);

         if (type === "recording.success" || type === "beam.recording.success") {
            const { room_id, location, duration } = data;
            const recording_url = location; // 100ms provides 'location' as the URL

            if (!recording_url) {
                console.error("❌ No recording URL (location) found in webhook data");
                return res.status(400).json({ message: "No recording URL found" });
            }
            const session = await LiveSession.findOne({ roomId: room_id });

            if (!session) {
                console.error("Session not found for room:", room_id);
                return res.status(404).json({ message: "Session not found" });
            }

            console.log(`📹 Recording ready for session: ${session.title}`);

            const response = await axios.get(recording_url, {
                responseType: "arraybuffer",
            });

            const uploadPromise = new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        resource_type: "video",
                        folder: "live-sessions",
                        public_id: `session-${session._id}`,
                    },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );
                uploadStream.end(response.data);
            });

            const uploadResult = await uploadPromise;

            session.recordingUrl = uploadResult.secure_url;
            session.recordingPublicId = uploadResult.public_id;

            if (session.saveOption === "course" && session.course) {
                await Course.findByIdAndUpdate(session.course, {
                    $push: {
                        videos: {
                            title: `[Live Session] ${session.title}`,
                            url: uploadResult.secure_url,
                            public_id: uploadResult.public_id,
                        },
                    },
                });
                session.savedToCourse = true;
            }

            await session.save();

            console.log(`✅ Recording saved for session: ${session.title}`);
        }

        res.status(200).json({ success: true });
    } catch (error) {
        console.error("❌ Webhook error:", error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update live session
// @route   PUT /api/live-sessions/:id
// @access  Private (Instructor only)
export const updateLiveSession = async (req, res) => {
    try {
        const { title, description, scheduledAt } = req.body;

        const session = await LiveSession.findById(req.params.id);

        if (!session) {
            return res.status(404).json({ message: "Live session not found" });
        }

        if (session.instructor.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Only the instructor can update this session" });
        }

        // ✅ Check if session has already started or time has passed
        if (session.status !== "scheduled" || new Date(session.scheduledAt) < new Date()) {
            return res.status(400).json({
                message: "Cannot update a session that is live, ended, or its scheduled time has passed.",
            });
        }

        if (title) session.title = title;
        if (description !== undefined) session.description = description;
        if (scheduledAt) session.scheduledAt = scheduledAt;

        await session.save();

        res.json({
            message: "Live session updated successfully",
            session,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete live session
// @route   DELETE /api/live-sessions/:id
// @access  Private (Instructor only)
export const deleteLiveSession = async (req, res) => {
    try {
        const session = await LiveSession.findById(req.params.id);

        if (!session) {
            return res.status(404).json({ message: "Live session not found" });
        }

        const isAdmin = req.user.role === 'admin' || req.user.isAdmin;

        if (session.instructor.toString() !== req.user._id.toString() && !isAdmin) {
            return res.status(403).json({ message: "Only the instructor or admin can delete this session" });
        }

        // ✅ Check if session has already started or time has passed (Skip for Admin)
        if (!isAdmin) {
            if (session.status === "live") {
                return res.status(400).json({
                    message: "Cannot delete a live session. Please end it first.",
                });
            }

            if (new Date(session.scheduledAt) < new Date() && session.status !== "ended") {
                return res.status(400).json({
                    message: "Cannot delete a session after its scheduled time has passed.",
                });
            }
        }

        if (session.recordingPublicId) {
            await cloudinary.uploader.destroy(session.recordingPublicId, {
                resource_type: "video",
            });
        }

        await session.deleteOne();

        res.json({ message: "Live session deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get instructor's live sessions
// @route   GET /api/live-sessions/instructor/my-sessions
// @access  Private (Instructor)
export const getInstructorSessions = async (req, res) => {
    try {
        const sessions = await LiveSession.find({ instructor: req.user._id })
            .populate("course", "title coverImage")
            .sort({ scheduledAt: -1 });

        res.json({
            count: sessions.length,
            sessions,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ✅ ========== POLLS MANAGEMENT ==========

// @desc    Create a poll in live session
// @route   POST /api/live-sessions/:id/polls
// @access  Private (Instructor only)
export const createPoll = async (req, res) => {
    try {
        const { question, options } = req.body;

        if (!question || !options || options.length < 2) {
            return res.status(400).json({
                message: "Question and at least 2 options are required",
            });
        }

        const session = await LiveSession.findById(req.params.id);

        if (!session) {
            return res.status(404).json({ message: "Live session not found" });
        }

        if (session.instructor.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Only the instructor can create polls" });
        }

        const poll = {
            question,
            options: options.map((opt) => ({ text: opt, count: 0 })),
            isActive: true,
            createdAt: new Date(),
            votes: [],
        };

        session.polls.push(poll);
        await session.save();

        res.status(201).json({
            message: "Poll created successfully",
            poll: session.polls[session.polls.length - 1],
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Vote on a poll
// @route   POST /api/live-sessions/:id/polls/:pollId/vote
// @access  Private (Student or Instructor)
export const votePoll = async (req, res) => {
    try {
        const { optionIndex } = req.body;

        const session = await LiveSession.findById(req.params.id);

        if (!session) {
            return res.status(404).json({ message: "Live session not found" });
        }

        const poll = session.polls.id(req.params.pollId);

        if (!poll) {
            return res.status(404).json({ message: "Poll not found" });
        }

        if (!poll.isActive) {
            return res.status(400).json({ message: "Poll is closed" });
        }

        // Check if user already voted
        const existingVote = poll.votes.find(
            (v) => v.user.toString() === req.user._id.toString()
        );

        if (existingVote) {
            // Update vote
            poll.options[existingVote.optionIndex].count -= 1;
            existingVote.optionIndex = optionIndex;
            poll.options[optionIndex].count += 1;
        } else {
            // New vote
            poll.votes.push({
                user: req.user._id,
                optionIndex,
            });
            poll.options[optionIndex].count += 1;
        }

        await session.save();

        res.json({
            message: "Vote recorded successfully",
            poll,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get poll results
// @route   GET /api/live-sessions/:id/polls/:pollId
// @access  Public
export const getPollResults = async (req, res) => {
    try {
        const session = await LiveSession.findById(req.params.id);

        if (!session) {
            return res.status(404).json({ message: "Live session not found" });
        }

        const poll = session.polls.id(req.params.pollId);

        if (!poll) {
            return res.status(404).json({ message: "Poll not found" });
        }

        res.json({
            poll: {
                question: poll.question,
                options: poll.options,
                totalVotes: poll.votes.length,
                isActive: poll.isActive,
            },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Close a poll
// @route   PUT /api/live-sessions/:id/polls/:pollId/close
// @access  Private (Instructor only)
export const closePoll = async (req, res) => {
    try {
        const session = await LiveSession.findById(req.params.id);

        if (!session) {
            return res.status(404).json({ message: "Live session not found" });
        }

        if (session.instructor.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Only the instructor can close polls" });
        }

        const poll = session.polls.id(req.params.pollId);

        if (!poll) {
            return res.status(404).json({ message: "Poll not found" });
        }

        poll.isActive = false;
        await session.save();

        res.json({
            message: "Poll closed successfully",
            poll,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ✅ ========== CHAT / COMMENTS MANAGEMENT ==========

// @desc    Add a comment
// @route   POST /api/live-sessions/:id/comments
// @access  Private
export const addComment = async (req, res) => {
    try {
        const { text } = req.body;
        const session = await LiveSession.findById(req.params.id);

        if (!session) return res.status(404).json({ message: "Session not found" });

        const newComment = {
            user: req.user._id,
            userType: req.userType,
            userName: req.user.name,
            userImage: req.user.profileImage,
            text,
            createdAt: new Date(),
            replies: []
        };

        session.comments.push(newComment);
        await session.save();

        res.status(201).json(session.comments[session.comments.length - 1]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Reply to a comment
// @route   POST /api/live-sessions/:id/comments/:commentId/reply
// @access  Private
export const replyToComment = async (req, res) => {
    try {
        const { text } = req.body;
        const session = await LiveSession.findById(req.params.id);

        if (!session) return res.status(404).json({ message: "Session not found" });

        const comment = session.comments.id(req.params.commentId);
        if (!comment) return res.status(404).json({ message: "Comment not found" });

        const newReply = {
            user: req.user._id,
            userType: req.userType,
            userName: req.user.name,
            userImage: req.user.profileImage,
            text,
            createdAt: new Date()
        };

        comment.replies.push(newReply);
        await session.save();

        res.status(201).json(newReply);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Edit a comment
// @route   PUT /api/live-sessions/:id/comments/:commentId
// @access  Private
export const editComment = async (req, res) => {
    try {
        const { text } = req.body;
        const session = await LiveSession.findById(req.params.id);

        if (!session) return res.status(404).json({ message: "Session not found" });

        const comment = session.comments.id(req.params.commentId);
        if (!comment) return res.status(404).json({ message: "Comment not found" });

        if (comment.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized to edit this comment" });
        }

        comment.text = text;
        await session.save();

        res.json(comment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a comment
// @route   DELETE /api/live-sessions/:id/comments/:commentId
// @access  Private
export const deleteComment = async (req, res) => {
    try {
        const session = await LiveSession.findById(req.params.id);

        if (!session) return res.status(404).json({ message: "Session not found" });

        const comment = session.comments.id(req.params.commentId);
        if (!comment) return res.status(404).json({ message: "Comment not found" });

        const isAdmin = req.user.role === 'admin' || req.user.isAdmin;

        if (comment.user.toString() !== req.user._id.toString() && !isAdmin) {
            return res.status(403).json({ message: "Not authorized to delete this comment" });
        }

        comment.deleteOne();
        await session.save();

        res.json({ message: "Comment deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// ✅ ========== ANALYTICS DASHBOARD ==========

// @desc    Get session analytics
// @route   GET /api/live-sessions/:id/analytics
// @access  Private (Instructor only)
export const getSessionAnalytics = async (req, res) => {
    try {
        const session = await LiveSession.findById(req.params.id)
            .populate("attendees.user", "name email profileImage")
            .populate("instructor", "name profileImage")
            .populate("course", "title");

        if (!session) {
            return res.status(404).json({ message: "Live session not found" });
        }

        if (session.instructor._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Only the instructor can view analytics" });
        }

        // Calculate analytics
        const analytics = {
            session: {
                title: session.title,
                status: session.status,
                scheduledAt: session.scheduledAt,
                startedAt: session.startedAt,
                endedAt: session.endedAt,
                duration: session.duration,
            },
            attendance: {
                totalAttendees: session.attendees.length,
                peakViewers: session.peakViewers,
                averageDuration:
                    session.attendees.reduce((sum, a) => sum + (a.duration || 0), 0) /
                    (session.attendees.length || 1),
                attendees: session.attendees.map((a) => ({
                    user: a.user,
                    joinedAt: a.joinedAt,
                    leftAt: a.leftAt,
                    duration: a.duration,
                })),
            },
            polls: {
                totalPolls: session.polls.length,
                totalVotes: session.polls.reduce((sum, p) => sum + p.votes.length, 0),
                polls: session.polls.map((p) => ({
                    question: p.question,
                    totalVotes: p.votes.length,
                    options: p.options,
                    isActive: p.isActive,
                })),
            },
            recording: {
                available: !!session.recordingUrl,
                url: session.recordingUrl,
                savedToCourse: session.savedToCourse,
            },
        };

        res.json(analytics);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get instructor dashboard stats
// @route   GET /api/live-sessions/instructor/dashboard
// @access  Private (Instructor)
export const getInstructorDashboard = async (req, res) => {
    try {
        const sessions = await LiveSession.find({ instructor: req.user._id });

        const stats = {
            totalSessions: sessions.length,
            liveSessions: sessions.filter((s) => s.status === "live").length,
            scheduledSessions: sessions.filter((s) => s.status === "scheduled").length,
            endedSessions: sessions.filter((s) => s.status === "ended").length,
            totalAttendees: sessions.reduce((sum, s) => sum + s.attendees.length, 0),
            totalDuration: sessions.reduce((sum, s) => sum + (s.duration || 0), 0),
            averageAttendance:
                sessions.reduce((sum, s) => sum + s.attendees.length, 0) / (sessions.length || 1),
            totalPolls: sessions.reduce((sum, s) => sum + s.polls.length, 0),
            recentSessions: sessions
                .sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt))
                .slice(0, 5)
                .map((s) => ({
                    _id: s._id,
                    title: s.title,
                    status: s.status,
                    scheduledAt: s.scheduledAt,
                    attendees: s.attendees.length,
                    duration: s.duration,
                })),
        };

        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete ALL live sessions (TEMPORARY - for cleanup)
// @route   DELETE /api/live-sessions/delete-all
// @access  Private (Admin only)
export const deleteAllLiveSessions = async (req, res) => {
    try {
        const result = await LiveSession.deleteMany({});
        res.json({
            message: `Successfully deleted ${result.deletedCount} live sessions`,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
