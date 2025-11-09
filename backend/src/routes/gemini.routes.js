import { Router } from "express";
import { getDomainInsights, getSolutionProcedure, getDomainInfo, testModels } from "../controllers/gemini.controller.js";

const router = Router();

// Test endpoint to check available models
router.route("/test-models").get(testModels);

// Get AI insights for a domain
router.route("/insights").post(getDomainInsights);

// Get step-by-step solution procedure
router.route("/solution").post(getSolutionProcedure);

// Get comprehensive domain information
router.route("/info/:domain").get(getDomainInfo);

export default router;

