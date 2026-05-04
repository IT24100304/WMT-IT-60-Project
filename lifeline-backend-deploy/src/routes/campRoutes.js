const express = require("express");

const { getCamps, createCamp, updateCamp, deleteCamp, markInterest } = require("../controllers/campController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// Public API to fetch all camps for donor and admin views.
router.get("/", getCamps);
// Admin-only API to create a new camp after controller validation passes.
router.post("/create", protect, authorize("ADMIN"), createCamp);
// Admin-only API to update an existing camp by id.
router.put("/:id", protect, authorize("ADMIN"), updateCamp);
// Admin-only API to remove a camp by id.
router.delete("/:id", protect, authorize("ADMIN"), deleteCamp);
// Authenticated donor API to register interest in a camp.
router.post("/:id/interest", protect, markInterest);

module.exports = router;
