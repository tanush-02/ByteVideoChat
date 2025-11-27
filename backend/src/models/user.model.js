import mongoose, { Schema } from "mongoose";

const userScheme = new Schema(
    {
        name: { type: String, required: true },
        username: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        token: { type: String },
        role: { type: String, enum: ["admin", "user"], default: "user" }
    }
)

const User = mongoose.model("User", userScheme);

export { User };