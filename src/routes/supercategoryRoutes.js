const express = require("express");
const router = express.Router();
const superCategoryController = require("../controllers/superCategoryController");
const upload = require("../middlewares/upload");

// Add debugging middleware
router.use((req, res, next) => {
  console.log('=== ROUTE DEBUG ===');
  console.log('Route hit:', req.method, req.path);
  console.log('Content-Type:', req.get('Content-Type'));
  console.log('=== END ROUTE DEBUG ===');
  next();
});

router.post("/", upload.single('image'), superCategoryController.create);
router.get("/", superCategoryController.getAll);
router.put("/:id", upload.single('image'), superCategoryController.update);
router.delete("/:id", superCategoryController.delete);

module.exports = router;
