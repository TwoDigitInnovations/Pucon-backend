const express = require("express");
const router = express.Router();
const carouselController = require("../controllers/carouselController");
const upload = require("../middlewares/upload");

router.get('/getAllCarousel', carouselController.getAllCarousel);
router.post('/createCarousel', upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'image', maxCount: 1 }]), carouselController.createCarousel);
router.put('/updateCarousel/:id', upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'image', maxCount: 1 }]), carouselController.updateCarousel);
router.delete('/deleteCarousel/:id', carouselController.deleteCarousel);
router.get('/getAllCarouse', carouselController.getAllCarouse);
module.exports = router;