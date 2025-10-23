import httpStatus from "http-status";
import { Comment } from "../models/comment.model.js";
import { User } from "../models/user.model.js";

const getComments = async (req, res) => {
    try {
        const { section } = req.query;
        if (!section) return res.status(400).json({ message: "section is required" });
        const comments = await Comment.find({ section }).sort({ createdAt: -1 }).limit(100);
        res.json(comments);
    } catch (e) {
        res.status(500).json({ message: `Something went wrong ${e}` })
    }
}

const addComment = async (req, res) => {
    try {
        const { token, section, text } = req.body;
        if (!token) return res.status(401).json({ message: "Unauthorized" });
        if (!section || !text) return res.status(400).json({ message: "section and text are required" });

        const user = await User.findOne({ token });
        if (!user) return res.status(401).json({ message: "Invalid token" });

        const comment = new Comment({
            userId: user.username,
            section,
            text
        });
        await comment.save();
        res.status(httpStatus.CREATED).json(comment);
    } catch (e) {
        res.status(500).json({ message: `Something went wrong ${e}` })
    }
}

export { getComments, addComment };


