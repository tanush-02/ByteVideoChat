import { Router } from "express";
import { 
    getHealthRecord, 
    updateHealthRecord, 
    addDisease, 
    addMedication, 
    addExercise, 
    addDailyMetrics, 
    addDoctor, 
    addCheckup,
    deleteItem
} from "../controllers/health.controller.js";

const router = Router();

router.route("/").get(getHealthRecord);
router.route("/").put(updateHealthRecord);
router.route("/disease").post(addDisease);
router.route("/medication").post(addMedication);
router.route("/exercise").post(addExercise);
router.route("/metrics").post(addDailyMetrics);
router.route("/doctor").post(addDoctor);
router.route("/checkup").post(addCheckup);
router.route("/delete").delete(deleteItem);

export default router;

