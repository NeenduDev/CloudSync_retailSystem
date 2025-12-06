const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader) {
      return res.status(401).json({ message: "No token provided" });
    }
    const token = authHeader.replace("Bearer ", "");

    // Verify the token
    const decoded = jwt.verify(token, "your_jwt_secret"); // Replace with your secret
    if (!decoded) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    const user = await User.findById(decoded._id);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Attach only necessary user info to req.user
    req.user = {
      _id: user._id,
      role: user.role,
      userID: user.userID,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(401).json({ message: "Authentication failed", error: error.message });
  }
};

module.exports = { authenticate };
