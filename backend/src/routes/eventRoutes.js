import { Router } from "express";
import {
  createEvent,
  deleteEvent,
  getAdminEvents,
  getEventDetail,
  getEvents,
  updateEvent,
} from "../controllers/eventController.js";
import { adminMiddleware, authMiddleware } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", getEvents);
router.get("/admin/all", authMiddleware, adminMiddleware, getAdminEvents);
router.get("/:id", getEventDetail);
router.post("/", authMiddleware, adminMiddleware, createEvent);
router.put("/:id", authMiddleware, adminMiddleware, updateEvent);
router.delete("/:id", authMiddleware, adminMiddleware, deleteEvent);

export default router;
