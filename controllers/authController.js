// Register accounts, verify login credentials, and issue tokens for protected routes.
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../db");

async function register(req, res) {
    const { email: rawEmail, password } = req.body || {};
    // Normalize email the same way at registration and login.
    const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";

    if (!email || typeof password !== "string" || password.length === 0) {
        return res.status(400).json({ error: "Email and password are required." });
    }

    if (email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: "A valid email address is required." });
    }

    // bcrypt uses only the first 72 bytes, so reject longer passwords during registration.
    if (Buffer.byteLength(password, "utf8") > 72) {
        return res.status(400).json({ error: "Password must be no more than 72 bytes." });
    }

    try {
        const [existingUsers] = await pool.execute(
            "SELECT id FROM users WHERE email = ?",
            [email]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({ error: "An account with this email already exists." });
        }

        // Store a salted hash so the original password does not need to be kept.
        const passwordHash = await bcrypt.hash(password, 10);
        const [result] = await pool.execute(
            "INSERT INTO users (email, password_hash) VALUES (?, ?)",
            [email, passwordHash]
        );

        return res.status(201).json({
            id: result.insertId,
            email,
        });
    } catch (error) {
        // The unique email constraint also catches concurrent registrations with the same email.
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ error: "An account with this email already exists." });
        }

        console.error("Failed to register account:", error);
        return res.status(500).json({ error: "Could not register account." });
    }
}

async function login(req, res) {
    const { email: rawEmail, password } = req.body || {};
    const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";

    if (!email || typeof password !== "string" || password.length === 0) {
        return res.status(400).json({ error: "Email and password are required." });
    }

    if (email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: "A valid email address is required." });
    }

    try {
        const [users] = await pool.execute(
            "SELECT id, email, password_hash FROM users WHERE email = ?",
            [email]
        );

        // Compare against the stored hash and use the same error for both credential failures.
        if (users.length === 0 || !(await bcrypt.compare(password, users[0].password_hash))) {
            return res.status(401).json({ error: "Invalid email or password." });
        }

        const token = jwt.sign(
            { userId: users[0].id },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        return res.status(200).json({ token });
    } catch (error) {
        console.error("Failed to log in:", error);
        return res.status(500).json({ error: "Could not log in." });
    }
}

module.exports = { register, login };
