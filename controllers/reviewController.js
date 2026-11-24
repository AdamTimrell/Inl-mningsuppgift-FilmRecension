const pool = require("../db");
const Review = require("../models/Review");

async function updateReview(req, res) {
    const id = Number(req.params.id);
    const { rating, comment } = req.body || {};

    if (!Number.isInteger(id) || id < 1) {
        return res.status(400).json({ error: "Review ID must be a positive integer." });
    }

    try {
        const [reviews] = await pool.execute(
            "SELECT id, user_id, movie_id FROM reviews WHERE id = ?",
            [id]
        );

        if (reviews.length === 0) {
            return res.status(404).json({ error: "Review not found." });
        }

        if (reviews[0].user_id !== req.user.id) {
            return res.status(403).json({ error: "You may only update your own reviews." });
        }

        const validationError = Review.validationError(rating, comment);

        if (validationError) {
            return res.status(400).json({ error: validationError });
        }

        const trimmedComment = comment.trim();
        await pool.execute(
            "UPDATE reviews SET rating = ?, comment = ? WHERE id = ? AND user_id = ?",
            [rating, trimmedComment, id, req.user.id]
        );

        const review = new Review({
            id,
            user_id: req.user.id,
            movie_id: reviews[0].movie_id,
            rating,
            comment: trimmedComment,
        });

        return res.status(200).json(review.toJSON());
    } catch (error) {
        console.error("Failed to update review:", error);
        return res.status(500).json({ error: "Could not update review." });
    }
}

module.exports = { updateReview };
