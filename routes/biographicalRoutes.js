const express = require("express");
const {
  createBiographical,
  getAllBiographical,
  deleteBiographical,
  updateBiographical,
  submitBiographicalResponse,
  updateBiographicalResponse,
  deleteBiographicalResponse,
  getAllBiographicalResponses
} = require("../controllers/biographicalController");

const router = express.Router();

// Questionnaire routes
router.post("/biographical", createBiographical);
router.get("/biographical", getAllBiographical);
router.put("/biographical/:id", updateBiographical);
router.delete("/biographical/:id", deleteBiographical);

// Response routes
router.post("/biographical-response", submitBiographicalResponse);
router.put("/biographical-response/:id", updateBiographicalResponse);
router.delete("/biographical-response/:id", deleteBiographicalResponse);
router.get("/biographical-responses/all", getAllBiographicalResponses);

module.exports = router;
