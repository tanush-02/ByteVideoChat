import { Router } from "express";
import { 
    getFinanceRecord, 
    updateFinanceRecord, 
    addTransaction, 
    addSavingsAccount, 
    addStock, 
    addMutualFund,
    addSIPPlan,
    deleteItem
} from "../controllers/finance.controller.js";

const router = Router();

router.route("/").get(getFinanceRecord);
router.route("/").put(updateFinanceRecord);
router.route("/transaction").post(addTransaction);
router.route("/savings").post(addSavingsAccount);
router.route("/stock").post(addStock);
router.route("/mutual-fund").post(addMutualFund);
router.route("/sip").post(addSIPPlan);
router.route("/delete").delete(deleteItem);

export default router;

