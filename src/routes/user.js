const express = require("express");
const router = express.Router();
const user = require("../controllers/user");


router.post("/login", user.login);

router.post("/signUp", user.signUp);

module.exports = router;

