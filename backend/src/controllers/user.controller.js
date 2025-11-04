import httpStatus from "http-status";
import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";   // ✅ Use bcryptjs (pure JS, cross-platform)
import crypto from "crypto";
import { Meeting } from "../models/meeting.model.js";

// ------------------ LOGIN ------------------
const login = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Please provide username and password" });
    }

    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(httpStatus.NOT_FOUND).json({ message: "User not found" });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid username or password" });
        }

        const token = crypto.randomBytes(20).toString("hex");
        user.token = token;
        await user.save();

        return res.status(httpStatus.OK).json({ token });
    } catch (e) {
        return res.status(500).json({ message: `Something went wrong: ${e}` });
    }
};

// ------------------ REGISTER ------------------
const register = async (req, res) => {
    const { name, username, password } = req.body;

    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(httpStatus.FOUND).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            name,
            username,
            password: hashedPassword,
        });

        await newUser.save();
        return res.status(httpStatus.CREATED).json({ message: "User registered successfully" });
    } catch (e) {
        return res.status(500).json({ message: `Something went wrong: ${e}` });
    }
};

// ------------------ GET USER HISTORY ------------------
const getUserHistory = async (req, res) => {
    const { token } = req.query;

    try {
        const user = await User.findOne({ token });
        const meetings = await Meeting.find({ user_id: user.username });
        return res.json(meetings);
    } catch (e) {
        return res.status(500).json({ message: `Something went wrong: ${e}` });
    }
};

// ------------------ ADD TO HISTORY ------------------
const addToHistory = async (req, res) => {
    const { token, meeting_code } = req.body;

    try {
        const user = await User.findOne({ token });

        const newMeeting = new Meeting({
            user_id: user.username,
            meetingCode: meeting_code,
        });

        await newMeeting.save();
        return res.status(httpStatus.CREATED).json({ message: "Added code to history" });
    } catch (e) {
        return res.status(500).json({ message: `Something went wrong: ${e}` });
    }
};

export { login, register, getUserHistory, addToHistory };
