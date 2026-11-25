// Require authentication for all /api/watchlist routes so each request has a user ID.
const express = require("express");
const authenticateToken = require("../middleware/auth");
const {
    getWatchlist,
    addToWatchlist,
    removeFromWatchlist,
} = require("../controllers/watchlistController");

const router = express.Router();

router.get("/", authenticateToken, getWatchlist);
router.post("/:movieId", authenticateToken, addToWatchlist);
router.delete("/:movieId", authenticateToken, removeFromWatchlist);

module.exports = router;
