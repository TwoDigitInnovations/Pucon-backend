const express = require('express');
const router = express.Router();
const contentController = require('../controllers/contentController');
const upload = require('../middlewares/upload');

router.post('/', upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'carouselImage', maxCount: 5 }]), contentController.createContent);
router.get('/', contentController.getAllContent);
router.put('/:id', upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'carouselImage', maxCount: 5 }]), contentController.updateContent);
router.delete('/:id', contentController.deleteContent);
router.post("/contentBySubCategoryId", contentController.contentBySubCategoryId);

module.exports = router;
