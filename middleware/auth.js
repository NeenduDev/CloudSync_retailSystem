// middleware/auth.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authenticate = async (req, res, next) => {
  try {
    const token = req.header("Authorization").replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    // Verify the token
    const decoded = jwt.verify(token, "your_jwt_secret"); // Replace with your secret key
    if (!decoded) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    // Find the user by decoded _id
    const user = await User.findById(decoded._id);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user; // Attach the user to the request object
    next(); // Continue to the next middleware or route handler
  } catch (error) {
    console.error("Authentication error:", error);
    res
      .status(401)
      .json({ message: "Authentication failed", error: error.message });
  }
};

module.exports = { authenticate };
