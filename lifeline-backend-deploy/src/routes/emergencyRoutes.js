const express = require("express");

const { createEmergencyRequest, getAllRequests, fulfillRequest } = require("../controllers/emergencyController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// Hospitals and admins can raise emergency blood requests.
router.post("/request", protect, authorize("HOSPITAL", "ADMIN"), createEmergencyRequest);
// Admin/lab views use the shared request queue and fulfillment actions.
router.get("/requests/all", protect, authorize("ADMIN", "LAB"), getAllRequests);
router.put("/requests/:id/fulfill", protect, authorize("ADMIN", "LAB"), fulfillRequest);

module.exports = router;
