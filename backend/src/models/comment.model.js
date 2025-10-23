import mongoose, { Schema } from "mongoose";

const commentSchema = new Schema({
    userId: { type: String, required: true }, // username for simplicity (token maps to user)
    section: { type: String, enum: ['healthcare','finance','study','travelling'], required: true },
    text: { type: String, required: true },
}, { timestamps: true });

const Comment = mongoose.model("Comment", commentSchema);

export { Comment };



