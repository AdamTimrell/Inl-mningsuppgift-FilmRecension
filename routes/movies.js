const express = require("express");
const authenticateToken = require("../middleware/auth");
const {
    getMovies,
    getMovie,
    getMovieReviews,
    addMovieReview,
} = require("../controllers/movieController");

const router = express.Router();

router.get("/", getMovies);
router.get("/:id", getMovie);
router.get("/:movieId/reviews", getMovieReviews);
router.post("/:movieId/reviews", authenticateToken, addMovieReview);

module.exports = router;
