const Hospital = require("../models/Hospital");
const asyncHandler = require("../utils/asyncHandler");
const { serializeHospital } = require("../utils/serializers");

const getHospitals = asyncHandler(async (req, res) => {
  const { province, district } = req.query;
  const filter = {};

  if (province) {
    filter.province = province;
  }

  if (district) {
    filter.district = district;
  }

  // Directory read: optional province/district filters support nearby-hospital pickers.
  const hospitals = await Hospital.find(filter).sort({ createdAt: -1 });
  res.status(200).json(hospitals.map(serializeHospital));
});

const createHospital = asyncHandler(async (req, res) => {
  const { name, province, district, address, contactNumber } = req.body;

  if (!name || !province || !district) {
    res.status(400);
    throw new Error("Name, province, and district are required");
  }

  // Admin write: image upload is optional, so keep it undefined when absent.
  const hospital = await Hospital.create({
    name,
    province,
    district,
    address,
    contactNumber,
    image: req.file ? `/uploads/${req.file.filename}` : undefined,
    createdBy: req.user._id
  });

  res.status(201).json(serializeHospital(hospital));
});

const getHospitalById = asyncHandler(async (req, res) => {
  // Detail read: fetch one hospital record for admin editing or inspection.
  const hospital = await Hospital.findById(req.params.id);

  if (!hospital) {
    res.status(404);
    throw new Error("Hospital not found");
  }

  res.status(200).json(serializeHospital(hospital));
});

const updateHospital = asyncHandler(async (req, res) => {
  // Load first so the API can return a clean 404 for missing hospital ids.
  const hospital = await Hospital.findById(req.params.id);

  if (!hospital) {
    res.status(404);
    throw new Error("Hospital not found");
  }

  const fields = ["name", "province", "district", "address", "contactNumber"];
  fields.forEach((field) => {
    if (req.body[field] !== undefined) {
      hospital[field] = req.body[field];
    }
  });

  if (req.file) {
    hospital.image = `/uploads/${req.file.filename}`;
  }

  const updated = await hospital.save();
  res.status(200).json(serializeHospital(updated));
});

const deleteHospital = asyncHandler(async (req, res) => {
  // Delete is only allowed after confirming the referenced hospital still exists.
  const hospital = await Hospital.findById(req.params.id);

  if (!hospital) {
    res.status(404);
    throw new Error("Hospital not found");
  }

  await hospital.deleteOne();
  res.status(200).json({
    success: true,
    message: "Hospital deleted successfully"
  });
});

module.exports = {
  getHospitals,
  createHospital,
  getHospitalById,
  updateHospital,
  deleteHospital
};
