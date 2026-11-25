// List, add, and remove saved movies within the authenticated user's watchlist.
const pool = require("../db");
const Movie = require("../models/Movie");

async function getWatchlist(req, res) {
    // The watchlist stores movie IDs. Join the catalog to return full movie details.
    try {
        const [rows] = await pool.execute(
            `SELECT movies.id, movies.title, movies.genre, movies.release_year
             FROM watchlist
             JOIN movies ON movies.id = watchlist.movie_id
             WHERE watchlist.user_id = ?
             ORDER BY movies.title`,
            [req.user.id]
        );

        return res.status(200).json(rows.map((row) => new Movie(row).toJSON()));
    } catch (error) {
        console.error("Failed to get watchlist:", error);
        return res.status(500).json({ error: "Could not get watchlist." });
    }
}

async function addToWatchlist(req, res) {
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

        const [savedMovies] = await pool.execute(
            "SELECT movie_id FROM watchlist WHERE user_id = ? AND movie_id = ?",
            [req.user.id, movieId]
        );

        if (savedMovies.length > 0) {
            return res.status(409).json({ error: "Movie is already in your watchlist." });
        }

        await pool.execute(
            "INSERT INTO watchlist (user_id, movie_id) VALUES (?, ?)",
            [req.user.id, movieId]
        );

        return res.status(201).json({ message: "Movie added to your watchlist." });
    } catch (error) {
        // The composite key also catches a concurrent save after the lookup above.
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ error: "Movie is already in your watchlist." });
        }

        console.error("Failed to add movie to watchlist:", error);
        return res.status(500).json({ error: "Could not add movie to watchlist." });
    }
}

async function removeFromWatchlist(req, res) {
    const movieId = Number(req.params.movieId);

    if (!Number.isInteger(movieId) || movieId < 1) {
        return res.status(400).json({ error: "Movie ID must be a positive integer." });
    }

    try {
        const [result] = await pool.execute(
            "DELETE FROM watchlist WHERE user_id = ? AND movie_id = ?",
            [req.user.id, movieId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Movie is not in your watchlist." });
        }

        return res.status(200).json({ message: "Movie removed from your watchlist." });
    } catch (error) {
        console.error("Failed to remove movie from watchlist:", error);
        return res.status(500).json({ error: "Could not remove movie from watchlist." });
    }
}

module.exports = { getWatchlist, addToWatchlist, removeFromWatchlist };
