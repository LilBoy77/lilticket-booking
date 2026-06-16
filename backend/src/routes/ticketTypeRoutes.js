import { Router } from "express";
import {
  createTicketType,
  deleteTicketType,
  getTicketTypes,
  getTicketTypesByEvent,
  updateTicketType,
} from "../controllers/ticketTypeController.js";
import { adminMiddleware, authMiddleware } from "../middleware/authMiddleware.js";

const router = Router();

router.use(authMiddleware, adminMiddleware);

router.get("/", getTicketTypes);
router.get("/event/:eventId", getTicketTypesByEvent);
router.post("/", createTicketType);
router.put("/:id", updateTicketType);
router.delete("/:id", deleteTicketType);

export default router;
