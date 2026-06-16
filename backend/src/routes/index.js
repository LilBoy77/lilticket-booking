import { Router } from "express";
import adminRoutes from "./adminRoutes.js";
import authRoutes from "./authRoutes.js";
import bookingRoutes from "./bookingRoutes.js";
import categoryRoutes from "./categoryRoutes.js";
import eventRoutes from "./eventRoutes.js";
import healthRoutes from "./healthRoutes.js";
import paymentRoutes from "./paymentRoutes.js";
import ticketTypeRoutes from "./ticketTypeRoutes.js";
import ticketRoutes from "./ticketRoutes.js";
import venueRoutes from "./venueRoutes.js";

const router = Router();

router.use("/admin", adminRoutes);
router.use("/auth", authRoutes);
router.use("/bookings", bookingRoutes);
router.use("/categories", categoryRoutes);
router.use("/events", eventRoutes);
router.use("/health", healthRoutes);
router.use("/payments", paymentRoutes);
router.use("/ticket-types", ticketTypeRoutes);
router.use("/tickets", ticketRoutes);
router.use("/venues", venueRoutes);

export default router;
