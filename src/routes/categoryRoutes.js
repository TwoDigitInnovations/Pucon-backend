const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");
const upload = require("../middlewares/upload");

router.post("/", upload.single('image'), categoryController.create);
router.get("/", categoryController.getAll);
router.put("/:id", upload.single('image'), categoryController.update);
router.delete("/:id", categoryController.delete);

module.exports = router;
