import { Router } from "express";
import { 
    getTravelRecord, 
    updateTravelRecord, 
    addFuturePlan,
    addActivePlan,
    addHistoryPlan,
    completePlan,
    activatePlan,
    deletePlan,
    updatePlan
} from "../controllers/travel.controller.js";

const router = Router();

router.route("/").get(getTravelRecord);
router.route("/").put(updateTravelRecord);
router.route("/future").post(addFuturePlan);
router.route("/active").post(addActivePlan);
router.route("/history").post(addHistoryPlan);
router.route("/complete").post(completePlan);
router.route("/activate").post(activatePlan);
router.route("/delete").post(deletePlan);
router.route("/update").put(updatePlan);

export default router;
