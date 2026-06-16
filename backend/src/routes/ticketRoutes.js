import { Router } from "express";
import { checkInTicket, getMyTickets, getTicketByCode, getTicketById } from "../controllers/ticketController.js";
import { adminMiddleware, authMiddleware } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/my", authMiddleware, getMyTickets);
router.get("/code/:ticketCode", authMiddleware, getTicketByCode);
router.post("/check-in", authMiddleware, adminMiddleware, checkInTicket);
router.get("/:ticketId", authMiddleware, getTicketById);

export default router;
