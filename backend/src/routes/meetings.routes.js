import { Router } from "express";
import { scheduleMeeting, listPendingMeetings, acceptMeeting } from "../controllers/scheduledMeeting.controller.js";

const router = Router();

router.route("/schedule").post(scheduleMeeting);
router.route("/pending").get(listPendingMeetings);
router.route("/:meetingId/accept").post(acceptMeeting);

export default router;

