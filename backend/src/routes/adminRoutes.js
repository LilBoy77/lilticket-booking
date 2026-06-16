import { Router } from "express";
import { getDashboard } from "../controllers/adminController.js";
import { getAllBookingsAdmin } from "../controllers/bookingController.js";
import { checkInTicket } from "../controllers/ticketController.js";
import { adminMiddleware, authMiddleware } from "../middleware/authMiddleware.js";

const router = Router();

router.use(authMiddleware, adminMiddleware);

router.get("/dashboard", getDashboard);
router.get("/bookings", getAllBookingsAdmin);
router.post("/check-in", checkInTicket);

export default router;
