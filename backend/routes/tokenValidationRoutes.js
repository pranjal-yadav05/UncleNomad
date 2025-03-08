import express from "express";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

router.get("/validate-token", authenticateToken, (req, res) => {
  res.json({ valid: true, user: req.user });
});

export default router;