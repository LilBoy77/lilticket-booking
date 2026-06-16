import { Router } from "express";
import {
  createVenue,
  deleteVenue,
  getVenues,
  updateVenue,
} from "../controllers/venueController.js";
import { adminMiddleware, authMiddleware } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", getVenues);
router.post("/", authMiddleware, adminMiddleware, createVenue);
router.put("/:id", authMiddleware, adminMiddleware, updateVenue);
router.delete("/:id", authMiddleware, adminMiddleware, deleteVenue);

export default router;
