import express from "express";
import { createServer } from "node:http";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import { connectToSocket } from "./src/controllers/socketManager.js";
import userRoutes from "./src/routes/users.routes.js";
import commentRoutes from "./src/routes/comments.routes.js";
import geminiRoutes from "./src/routes/gemini.routes.js";

// Load environment variables from .env file (for local development)
// On Render, environment variables are set in the dashboard
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
    // Log environment status for debugging
    console.log("Environment check:");
    console.log("- NODE_ENV:", process.env.NODE_ENV || "not set");
    console.log("- MONGO_URL:", process.env.MONGO_URL ? "✓ Set" : "✗ Not set");
    console.log("- GEMINI_API_KEY:", process.env.GEMINI_API_KEY ? "✓ Set" : "✗ Not set");
    console.log("- PORT:", process.env.PORT || "8000 (default)");
    
    // Validate required environment variables
    if (!process.env.MONGO_URL) {
        console.error("\n❌ ERROR: MONGO_URL is not set in environment variables!");
        console.error("\n📝 To fix this:");
        console.error("   For LOCAL development:");
        console.error("   1. Create a .env file in the backend directory");
        console.error("   2. Add: MONGO_URL=your_mongodb_connection_string");
        console.error("   Example: MONGO_URL=mongodb://localhost:27017/yourdb");
        console.error("\n   For RENDER deployment:");
        console.error("   1. Go to Render dashboard → Your service → Environment");
        console.error("   2. Click 'Add Environment Variable'");
        console.error("   3. Key: MONGO_URL");
        console.error("   4. Value: your_mongodb_connection_string");
        console.error("   5. Click 'Save Changes' and redeploy");
        process.exit(1);
    }

    if (!process.env.GEMINI_API_KEY) {
        console.error("\n❌ ERROR: GEMINI_API_KEY is not set in environment variables!");
        console.error("\n📝 To fix this:");
        console.error("   For LOCAL development:");
        console.error("   1. Create a .env file in the backend directory");
        console.error("   2. Add: GEMINI_API_KEY=your_gemini_api_key");
        console.error("   Get your key from: https://makersuite.google.com/app/apikey");
        console.error("\n   For RENDER deployment:");
        console.error("   1. Go to Render dashboard → Your service → Environment");
        console.error("   2. Click 'Add Environment Variable'");
        console.error("   3. Key: GEMINI_API_KEY");
        console.error("   4. Value: your_gemini_api_key");
        console.error("   5. Click 'Save Changes' and redeploy");
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