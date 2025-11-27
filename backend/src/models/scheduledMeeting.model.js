import mongoose, { Schema } from "mongoose";

const scheduledMeetingSchema = new Schema(
    {
        meetingCode: { type: String, required: true, unique: true },
        initiator: { type: String, required: true },
        status: {
            type: String,
            enum: ["pending", "accepted", "completed", "cancelled"],
            default: "pending"
        },
        scheduledFor: { type: Date },
        acceptedAt: { type: Date },
        acceptedBy: { type: String }
    },
    { timestamps: true }
);

const ScheduledMeeting = mongoose.model("ScheduledMeeting", scheduledMeetingSchema);

export { ScheduledMeeting };

