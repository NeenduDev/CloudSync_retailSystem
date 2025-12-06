const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

// 1. Method to create super user
router.post("/create-superuser", async (req, res) => {
  try {
    const { firstName, lastName, userID, password } = req.body;

    // Check if the user already exists
    const existingUser = await User.findOne({ userID });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create the superuser
    const newUser = new User({
      firstName,
      lastName,
      userID,
      role: "superuser",
      password,
    });

    await newUser.save();
    res.status(201).json({ message: "Superuser created successfully" });
  } catch (error) {
    console.error("Error creating superuser:", error);
    res.status(500).json({ message: "Error creating superuser", error: error.message });
  }
});

// 2. Superuser and manager can create POS user and management user
router.post("/create-user", authenticate, async (req, res) => {
  try {
    const { firstName, lastName, userID, password, role } = req.body;

    // Ensure that only superuser or manager can create users
    if (!["superuser", "manager"].includes(req.user.role)) {
      return res.status(403).json({ message: "Permission denied" });
    }

    // Check if the userID already exists
    const existingUser = await User.findOne({ userID });
    if (existingUser) {
      return res.status(400).json({ message: "UserID already exists" });
    }

    // Create new user
    const newUser = new User({
      firstName,
      lastName,
      userID,
      role,
      password,
    });

    await newUser.save();
    res.status(201).json({ message: `User created as ${role}` });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ message: "Error creating user", error: error.message });
  }
});

// 3. User can update profile
router.put("/update-profile", authenticate, async (req, res) => {
  try {
    const { firstName, lastName } = req.body;

    // Update the logged-in user's profile
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { firstName, lastName },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "Profile updated successfully", updatedUser });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Error updating profile", error: error.message });
  }
});

// 4. Login API to authenticate user and generate JWT
router.post("/login", async (req, res) => {
  try {
    const { userID, password } = req.body;

    // Find user by userID
    const user = await User.findOne({ userID });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Compare password with hashed password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { _id: user._id, role: user.role }, // Payload
      "your_jwt_secret", // Secret key
      { expiresIn: "1h" } // Token expiration time
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        userID: user.userID,
        role: user.role,
      },
    });

  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
});

// 5. Password change API
router.put("/change-password", authenticate, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect old password" });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ message: "Error changing password", error: error.message });
  }
});

// 6. Get all users (superuser & manager) with filtering
router.get("/users", authenticate, async (req, res) => {
  try {
    console.log("User role in request:", req.user.role); // Debugging line

    if (!["superuser", "manager"].includes(req.user.role)) {
      return res.status(403).json({ message: "Permission denied" });
    }

    let users;
    if (req.user.role === "manager") {
      // Managers cannot see superusers
      users = await User.find({ role: { $ne: "superuser" } });
    } else {
      // Superusers can see all users
      users = await User.find();
    }

    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Error fetching users" });
  }
});

// 7. Update a user
router.put("/users/:id", authenticate, async (req, res) => {
  try {
    const { firstName, lastName, userID, role, password } = req.body;

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Manager cannot modify superuser or manager
    if (req.user.role === "manager" && targetUser.role !== "posuser") {
      return res.status(403).json({ message: "Permission denied" });
    }

    // Update fields
    if (firstName) targetUser.firstName = firstName;
    if (lastName) targetUser.lastName = lastName;
    if (userID) targetUser.userID = userID;
    if (role) targetUser.role = role;
    if (password) targetUser.password = password;

    await targetUser.save();
    res.status(200).json(targetUser);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Error updating user" });
  }
});

// 8. Delete user (superuser only)
router.delete("/users/:id", authenticate, async (req, res) => {
  try {
    if (req.user.role !== "superuser") {
      return res.status(403).json({ message: "Permission denied" });
    }

    const deletedUser = await User.findByIdAndDelete(req.params.id);

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Error deleting user" });
  }
});

module.exports = router;
