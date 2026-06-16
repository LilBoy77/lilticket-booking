import { Router } from "express";
import { createXenditPayment, handleXenditWebhook } from "../controllers/paymentController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/xendit/create", authMiddleware, createXenditPayment);
router.post("/xendit/webhook", handleXenditWebhook);

export default router;
