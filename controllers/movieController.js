// Serve the movie catalog and handle listing and creating reviews for a movie.
const pool = require("../db");
const Movie = require("../models/Movie");
const Review = require("../models/Review");

async function getMovies(req, res) {
    try {
        const [rows] = await pool.execute(
            "SELECT id, title, genre, release_year FROM movies ORDER BY id"
        );

        return res.status(200).json(rows.map((row) => new Movie(row).toJSON()));
    } catch (error) {
        console.error("Failed to get movies:", error);
        return res.status(500).json({ error: "Could not get movies." });
    }
}

async function getMovie(req, res) {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1) {
        return res.status(400).json({ error: "Movie ID must be a positive integer." });
    }

    try {
        const [rows] = await pool.execute(
            "SELECT id, title, genre, release_year FROM movies WHERE id = ?",
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: "Movie not found." });
        }

        return res.status(200).json(new Movie(rows[0]).toJSON());
    } catch (error) {
        console.error("Failed to get movie:", error);
        return res.status(500).json({ error: "Could not get movie." });
    }
}

// Verify the movie exists so an empty list means it has no reviews.
async function getMovieReviews(req, res) {
    const movieId = Number(req.params.movieId);

    if (!Number.isInteger(movieId) || movieId < 1) {
        return res.status(400).json({ error: "Movie ID must be a positive integer." });
    }

    try {
        const [movies] = await pool.execute(
            "SELECT id FROM movies WHERE id = ?",
            [movieId]
        );

        if (movies.length === 0) {
            return res.status(404).json({ error: "Movie not found." });
        }

        const [rows] = await pool.execute(
            "SELECT id, user_id, movie_id, rating, comment FROM reviews WHERE movie_id = ? ORDER BY id",
            [movieId]
        );

        return res.status(200).json(rows.map((row) => new Review(row).toJSON()));
    } catch (error) {
        console.error("Failed to get movie reviews:", error);
        return res.status(500).json({ error: "Could not get reviews." });
    }
}

async function addMovieReview(req, res) {
    const movieId = Number(req.params.movieId);
    const { rating, comment } = req.body || {};

    if (!Number.isInteger(movieId) || movieId < 1) {
        return res.status(400).json({ error: "Movie ID must be a positive integer." });
    }

    const validationError = Review.validationError(rating, comment);

    if (validationError) {
        return res.status(400).json({ error: validationError });
    }

    const trimmedComment = comment.trim();

    try {
        const [movies] = await pool.execute(
            "SELECT id FROM movies WHERE id = ?",
            [movieId]
        );

        if (movies.length === 0) {
            return res.status(404).json({ error: "Movie not found." });
        }

        // Use the verified user ID as the author and allow one review per user and movie.
        const [existingReviews] = await pool.execute(
            "SELECT id FROM reviews WHERE user_id = ? AND movie_id = ?",
            [req.user.id, movieId]
        );

        if (existingReviews.length > 0) {
            return res.status(409).json({ error: "You have already reviewed this movie." });
        }

        const [result] = await pool.execute(
            "INSERT INTO reviews (user_id, movie_id, rating, comment) VALUES (?, ?, ?, ?)",
            [req.user.id, movieId, rating, trimmedComment]
        );

        const review = new Review({
            id: result.insertId,
            user_id: req.user.id,
            movie_id: movieId,
            rating,
            comment: trimmedComment,
        });

        return res.status(201).json(review.toJSON());
    } catch (error) {
        // The unique constraint also catches a concurrent insert after the lookup above.
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ error: "You have already reviewed this movie." });
        }

        console.error("Failed to add review:", error);
        return res.status(500).json({ error: "Could not add review." });
    }
}

module.exports = { getMovies, getMovie, getMovieReviews, addMovieReview };
