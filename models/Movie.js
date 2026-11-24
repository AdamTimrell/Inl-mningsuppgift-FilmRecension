class Movie {
    constructor({ id, title, genre, release_year }) {
        this.id = id;
        this.title = title;
        this.genre = genre;
        this.releaseYear = release_year;
    }

    toJSON() {
        return {
            id: this.id,
            title: this.title,
            genre: this.genre,
            release_year: this.releaseYear,
        };
    }
}

module.exports = Movie;
