import express from "express";
import { createServer } from "node:http";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import { connectToSocket } from "./src/controllers/socketManager.js";
import userRoutes from "./src/routes/users.routes.js";
import commentRoutes from "./src/routes/comments.routes.js";

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

const start = async () => {
    const connectionDb = await mongoose.connect(process.env.MONGO_URL);

    console.log(`MONGO Connected DB : ${connectionDb.connection.host}`)
    server.listen(app.get("port"), () => {
        console.log("LISTENIN ON PORT 8000")
    });



}



start();