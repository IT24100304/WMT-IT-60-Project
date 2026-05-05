const express = require("express");

const {
  getHospitals,
  createHospital,
  getHospitalById,
  updateHospital,
  deleteHospital
} = require("../controllers/hospitalController");
const { protect, authorize } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

// Public reads support hospital discovery in registration and emergency forms.
router.get("/", getHospitals);
router.get("/:id", getHospitalById);
// Admin writes manage the hospital directory and optional profile image.
router.post("/", protect, authorize("ADMIN"), upload.single("image"), createHospital);
router.put("/:id", protect, authorize("ADMIN"), upload.single("image"), updateHospital);
router.delete("/:id", protect, authorize("ADMIN"), deleteHospital);

module.exports = router;
