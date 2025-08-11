const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");
const upload = require("../middlewares/upload");

router.post("/", upload.single('image'), categoryController.create);
router.get("/", categoryController.getAll);
router.get("/getAllCategory", categoryController.getAllCategory);
router.put("/:id", upload.single('image'), categoryController.update);
router.delete("/:id", categoryController.delete);
router.post("/getCategoryBySuperCategoryId", categoryController.getCategoryBySuperCategoryId);
module.exports = router;
