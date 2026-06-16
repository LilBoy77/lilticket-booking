import { Router } from "express";
import {
  createBooking,
  getAllBookingsAdmin,
  getBookingById,
  getMyBookings,
} from "../controllers/bookingController.js";
import { getTicketsByBookingId } from "../controllers/ticketController.js";
import { adminMiddleware, authMiddleware } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/", authMiddleware, createBooking);
router.get("/my", authMiddleware, getMyBookings);
router.get("/admin/all", authMiddleware, adminMiddleware, getAllBookingsAdmin);
router.get("/:bookingId/tickets", authMiddleware, getTicketsByBookingId);
router.get("/:id", authMiddleware, getBookingById);

export default router;
