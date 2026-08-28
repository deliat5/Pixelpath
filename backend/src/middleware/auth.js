const jwt = require("jsonwebtoken");

// In a real deployment, JWT_SECRET MUST come from an environment variable,
// not this fallback - the fallback exists only so local development works
// without extra setup. Document this clearly if/when actually hosting publicly.
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-before-hosting-publicly";

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }

  const token = header.slice("Bearer ".length);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

module.exports = { authMiddleware, JWT_SECRET };
