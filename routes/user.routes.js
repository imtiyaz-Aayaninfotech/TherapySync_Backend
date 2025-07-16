const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  updateUser,
  deleteUser,
  getUserById,
} = require("../controllers/user.controller");
const {
  validateUpdateUser,
  validateObjectId,
} = require('../validations/user.validator');
const verifyAuth = require("../middlewares/auth.middleware");


router.get("/all", getAllUsers);
router.put("/edit/:id",validateObjectId,validateUpdateUser,updateUser);
router.delete("/delete/:id",validateObjectId,deleteUser);
router.get('/getById/:id', getUserById);

module.exports = router;
