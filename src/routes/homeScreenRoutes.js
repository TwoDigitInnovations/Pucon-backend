const express = require("express");
const router = express.Router();
const homeScreenController = require("../controllers/homeScreenController");
const upload = require("../middlewares/upload");

router.get('/getHomeScreen', homeScreenController.getHomeScreen);
router.put('/updateHomeScreen', upload.single('image'), homeScreenController.updateHomeScreen);

module.exports = router;
