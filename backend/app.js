import express from "express";
import { createServer } from "node:http";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import { connectToSocket } from "./src/controllers/socketManager.js";
import userRoutes from "./src/routes/users.routes.js";
import commentRoutes from "./src/routes/comments.routes.js";
import geminiRoutes from "./src/routes/gemini.routes.js";

dotenv.config();

const app = express();
const server = createServer(app);
const io = connectToSocket(server);


app.set("port", (process.env.PORT || 8000));
app.use(cors());
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

app.use("/api/v1/users", userRoutes);
app.use("/api/v1/comments", commentRoutes);
app.use("/api/v1/ai", geminiRoutes);

const start = async () => {
    // Validate required environment variables
    if (!process.env.MONGO_URL) {
        console.error("ERROR: MONGO_URL is not set in environment variables!");
        console.error("Please create a .env file in the backend directory with:");
        console.error("MONGO_URL=your_mongodb_connection_string");
        process.exit(1);
    }

    if (!process.env.GEMINI_API_KEY) {
        console.error("ERROR: GEMINI_API_KEY is not set in environment variables!");
        console.error("Please create a .env file in the backend directory with:");
        console.error("GEMINI_API_KEY=your_gemini_api_key");
        process.exit(1);
    }

    try {
        const connectionDb = await mongoose.connect(process.env.MONGO_URL);
        console.log(`MONGO Connected DB : ${connectionDb.connection.host}`)
        
        server.listen(app.get("port"), () => {
            console.log(`Server listening on port ${app.get("port")}`)
        });
    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
}



start();