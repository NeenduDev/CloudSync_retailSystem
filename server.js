// app.js
const express = require("express");
const mongoose = require("mongoose");
const userRoutes = require("./routes/userRoute");
const { authenticate, authorizeRoles } = require("./middleware/auth");

const app = express();

// Middleware to parse JSON requests
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(
    "mongodb+srv://neenduwickremasinghe_db_user:D2ccPAdZ8tHCIxIR@pos.5mijvco.mongodb.net/?appName=POS"
  )
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

// Use routes
app.use("/api/users", userRoutes);

// Port
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
