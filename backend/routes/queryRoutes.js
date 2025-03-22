import express from "express";
import {
  submitQuery,
  getQueries,
  updateQueryStatus,
  sendQueryReply,
  deleteQuery,
  exportQueriesToExcel,
} from "../controllers/queryController.js";

const router = express.Router();

// Public routes
router.post("/", submitQuery);

// Protected admin routes
router.get("/admin", getQueries);
router.get("/export", exportQueriesToExcel);
router.post("/reply", sendQueryReply);
router.post("/delete", deleteQuery);
router.patch("/:id/status", updateQueryStatus);

export default router;
