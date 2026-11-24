class Review {
    constructor({ id, user_id, movie_id, rating, comment }) {
        this.id = id;
        this.userId = user_id;
        this.movieId = movie_id;
        this.rating = rating;
        this.comment = comment;
    }

    static validationError(rating, comment) {
        if (!Number.isInteger(rating) || rating < 1 || rating > 10) {
            return "Rating must be a whole number from 1 to 10.";
        }

        if (typeof comment !== "string" || comment.trim().length === 0) {
            return "Comment must not be empty.";
        }

        return null;
    }

    toJSON() {
        return {
            id: this.id,
            user_id: this.userId,
            movie_id: this.movieId,
            rating: this.rating,
            comment: this.comment,
        };
    }
}

module.exports = Review;
