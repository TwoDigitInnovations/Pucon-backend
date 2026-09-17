const express = require('express');
const router = express.Router();
const regionController = require('../controllers/regionController');
const upload = require('../middlewares/upload');

router.post('/', upload.single('image'), regionController.createRegion);
router.get('/', regionController.getAllRegions);
router.get('/getAllRegion', regionController.getAllRegion);
router.get('/getRegionsByLang/:lang_id', regionController.getRegionsByLang);
router.get('/:id', regionController.getRegionById);
router.put('/:id', upload.single('image'), regionController.updateRegion);
router.delete('/:id', regionController.deleteRegion);

module.exports = router;
