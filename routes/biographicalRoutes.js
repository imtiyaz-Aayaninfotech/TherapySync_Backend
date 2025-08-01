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

router.post("/biographical", createBiographical);
router.get("/biographical", getAllBiographical);
router.delete("/biographical/:id", deleteBiographical);
router.put("/biographical/:id", updateBiographical);
// response
router.post("/biographical-response", submitBiographicalResponse);
router.put("/biographical-response/:id", updateBiographicalResponse);
router.delete("/biographical-response/:id", deleteBiographicalResponse);
router.get("/biographical-responses/all", getAllBiographicalResponses);

module.exports = router;
