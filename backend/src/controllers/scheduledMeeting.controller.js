import httpStatus from "http-status";
import { ScheduledMeeting } from "../models/scheduledMeeting.model.js";
import { User } from "../models/user.model.js";

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";

const getUserFromToken = async (token) => {
    if (!token) {
        throw new Error("Token is required");
    }
    const user = await User.findOne({ token });
    if (!user) {
        throw new Error("Invalid token");
    }
    if (!user.role) {
        user.role = user.username.toLowerCase() === ADMIN_USERNAME.toLowerCase() ? "admin" : "user";
        await user.save();
    }
    return user;
};

const ensureAdmin = (user) => {
    if (user.role !== "admin" && user.username.toLowerCase() !== ADMIN_USERNAME.toLowerCase()) {
        const err = new Error("Admin access required");
        err.statusCode = httpStatus.FORBIDDEN;
        throw err;
    }
};

const scheduleMeeting = async (req, res) => {
    try {
        const { token, meetingCode, scheduledFor } = req.body;

        if (!meetingCode) {
            return res.status(httpStatus.BAD_REQUEST).json({ message: "Meeting code is required" });
        }

        const user = await getUserFromToken(token);

        const existing = await ScheduledMeeting.findOne({
            meetingCode: meetingCode.toUpperCase(),
            status: { $in: ["pending", "accepted"] }
        });

        if (existing) {
            return res.status(httpStatus.CONFLICT).json({ message: "Meeting code already scheduled" });
        }

        const meeting = await ScheduledMeeting.create({
            meetingCode: meetingCode.toUpperCase(),
            initiator: user.username,
            scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined
        });

        return res.status(httpStatus.CREATED).json({
            message: "Meeting scheduled. Waiting for admin confirmation.",
            meeting
        });
    } catch (error) {
        const status = error.statusCode || httpStatus.INTERNAL_SERVER_ERROR;
        return res.status(status).json({ message: error.message || "Failed to schedule meeting" });
    }
};

const listPendingMeetings = async (req, res) => {
    try {
        const { token } = req.query;
        const user = await getUserFromToken(token);
        ensureAdmin(user);

        const meetings = await ScheduledMeeting.find({ status: "pending" }).sort({ createdAt: -1 });

        return res.status(httpStatus.OK).json({ meetings });
    } catch (error) {
        const status = error.statusCode || httpStatus.INTERNAL_SERVER_ERROR;
        return res.status(status).json({ message: error.message || "Failed to load meetings" });
    }
};

const acceptMeeting = async (req, res) => {
    try {
        const { token } = req.body;
        const { meetingId } = req.params;

        const user = await getUserFromToken(token);
        ensureAdmin(user);

        const meeting = await ScheduledMeeting.findById(meetingId);
        if (!meeting) {
            return res.status(httpStatus.NOT_FOUND).json({ message: "Meeting not found" });
        }

        if (meeting.status !== "pending") {
            return res.status(httpStatus.BAD_REQUEST).json({ message: "Meeting already processed" });
        }

        meeting.status = "accepted";
        meeting.acceptedAt = new Date();
        meeting.acceptedBy = user.username;
        await meeting.save();

        return res.status(httpStatus.OK).json({
            message: "Meeting accepted",
            meeting
        });
    } catch (error) {
        const status = error.statusCode || httpStatus.INTERNAL_SERVER_ERROR;
        return res.status(status).json({ message: error.message || "Failed to accept meeting" });
    }
};

export { scheduleMeeting, listPendingMeetings, acceptMeeting };

