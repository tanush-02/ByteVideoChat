import { Router } from "express";
import { addComment, getComments } from "../controllers/comment.controller.js";

const router = Router();

// Public: list comments by section
router.route("/").get(getComments);

// Auth: add comment (with token in body)
router.route("/").post(addComment);

export default router;



