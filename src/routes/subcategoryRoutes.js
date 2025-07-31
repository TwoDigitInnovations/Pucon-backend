const express = require('express');
const router = express.Router();
const subCategoryController = require('../controllers/subcategoryController');
const upload = require('../middlewares/upload');

router.post('/', upload.single('image'), subCategoryController.createSubCategory);
router.get('/', subCategoryController.getAllSubCategories);
router.put('/:id', upload.single('image'), subCategoryController.updateSubCategory);
router.delete('/:id', subCategoryController.deleteSubCategory);

module.exports = router;
