const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
    const authorization = req.headers.authorization || "";
    const match = authorization.match(/^Bearer\s+(.+)$/i);

    if (!match) {
        return res.status(401).json({ error: "Authentication token is required." });
    }

    try {
        const payload = jwt.verify(match[1], process.env.JWT_SECRET);

        if (!Number.isInteger(payload.userId) || payload.userId < 1) {
            return res.status(401).json({ error: "Invalid authentication token." });
        }

        req.user = { id: payload.userId };
        return next();
    } catch (error) {
        return res.status(401).json({ error: "Invalid or expired authentication token." });
    }
}

module.exports = authenticateToken;
