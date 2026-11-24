require("dotenv").config();

const requiredEnvironmentVariables = [
    "DB_HOST",
    "DB_USER",
    "DB_PASSWORD",
    "DB_NAME",
    "JWT_SECRET",
];
const missingEnvironmentVariables = requiredEnvironmentVariables.filter(
    (name) => !process.env[name]
);

if (missingEnvironmentVariables.length > 0) {
    console.error(
        `Missing required environment variables: ${missingEnvironmentVariables.join(", ")}`
    );
    process.exit(1);
}

const express = require("express");
const pool = require("./db");
const authRoutes = require("./routes/auth");
const movieRoutes = require("./routes/movies");
const reviewRoutes = require("./routes/reviews");
const watchlistRoutes = require("./routes/watchlist");

const app = express();
const port = Number(process.env.PORT || 3000);

app.use(express.json({ limit: "32kb" }));
app.use("/api/auth", authRoutes);
app.use("/api/movies", movieRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/watchlist", watchlistRoutes);

app.use((req, res) => {
    res.status(404).json({ error: "Route not found." });
});

app.use((error, req, res, next) => {
    if (error.type === "entity.parse.failed") {
        return res.status(400).json({ error: "Invalid JSON request body." });
    }

    if (error.type === "entity.too.large") {
        return res.status(413).json({ error: "Request body is too large." });
    }

    console.error("Unhandled server error:", error);
    return res.status(500).json({ error: "An unexpected server error occurred." });
});

async function startServer() {
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        console.error("PORT must be an integer between 1 and 65535.");
        process.exitCode = 1;
        return;
    }

    try {
        await pool.query("SELECT 1");
    } catch (error) {
        console.error(
            "Could not connect to MySQL. Check the database service and DB settings.",
            error.message
        );
        await pool.end();
        process.exitCode = 1;
        return;
    }

    app.listen(port, () => {
        console.log(`FilmRecension API is running on port ${port}.`);
    });
}

startServer();
