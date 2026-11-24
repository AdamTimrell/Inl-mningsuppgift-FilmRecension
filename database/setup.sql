CREATE DATABASE IF NOT EXISTS filmrecension
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE filmrecension;

DROP TABLE IF EXISTS watchlist;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS movies;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY unique_user_email (email)
);

CREATE TABLE movies (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    genre VARCHAR(100) NOT NULL,
    release_year SMALLINT UNSIGNED NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT check_movie_release_year CHECK (release_year > 0)
);

CREATE TABLE reviews (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id INT UNSIGNED NOT NULL,
    movie_id INT UNSIGNED NOT NULL,
    rating TINYINT UNSIGNED NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY unique_review_per_user_movie (user_id, movie_id),
    CONSTRAINT check_review_rating CHECK (rating BETWEEN 1 AND 10),
    CONSTRAINT fk_reviews_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_reviews_movie
        FOREIGN KEY (movie_id) REFERENCES movies (id) ON DELETE CASCADE
);

CREATE TABLE watchlist (
    user_id INT UNSIGNED NOT NULL,
    movie_id INT UNSIGNED NOT NULL,
    PRIMARY KEY (user_id, movie_id),
    CONSTRAINT fk_watchlist_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_watchlist_movie
        FOREIGN KEY (movie_id) REFERENCES movies (id) ON DELETE CASCADE
);

INSERT INTO movies (title, genre, release_year)
VALUES
    ('The Shawshank Redemption', 'Drama', 1994),
    ('Spirited Away', 'Animation', 2001),
    ('The Grand Budapest Hotel', 'Comedy', 2014);
