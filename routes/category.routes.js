const express = require('express');
const router = express.Router();
const controller = require('../controllers/category.controller');
const uploadToS3 = require('../utils/aws/uploadToS3.middleware');
const multer = require('multer');
const upload = multer();

// router.post('/', controller.addCategory);
router.post(
  '/',
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'video', maxCount: 1 },
  ]),
  uploadToS3,
  controller.addCategory
);
router.get('/', controller.getAllCategories);
router.get('/:id', controller.getCategoryById);
// router.put('/:id', controller.updateCategory);
router.put(
  '/:id',
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'video', maxCount: 1 },
  ]),
  uploadToS3,
  controller.updateCategory
);
router.delete('/:id', controller.deleteCategory);

module.exports = router;
