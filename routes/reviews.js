const express = require("express");
const authenticateToken = require("../middleware/auth");
const { updateReview } = require("../controllers/reviewController");

const router = express.Router();

router.put("/:id", authenticateToken, updateReview);

module.exports = router;
