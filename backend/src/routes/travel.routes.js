import { Router } from "express";
import { getTravelRecord, updateTravelRecord } from "../controllers/travel.controller.js";

const router = Router();

router.route("/").get(getTravelRecord).post(updateTravelRecord);

export default router;

