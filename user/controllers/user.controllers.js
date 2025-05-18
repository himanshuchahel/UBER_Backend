const userModel = require("../models/user.models");
const BlacklisttokenModel = require("../models/blacklisttoken.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const { subscribeToQueue } = require("../service/rabbit");

module.exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await userModel.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    // Create new user
    const newUser = new userModel({
      name,
      email,
      password: hashedPassword,
    });
    // Save user to database
    await newUser.save();
    // Generate JWT token
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    // Set token in cookie
    res.cookie("token", token);
    res.send({ message: "User registered successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email }).select("+password");
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    // Set token in cookie
    res.cookie("token", token);
    res.send({ message: "User logged in successfully", token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports.logout = async (req, res) => {
  try {
    const token = req.cookies.token;
    await BlacklisttokenModel.create({ token });
    res.clearCookie("token");
    res.send({ message: "User logged out successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports.profile = async (req, res) => {
  try {
    res.send(req.user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

module.exports.acceptedRide = async (req, res) => {
  rideModel.EventEmitter.once("ride-accepted", (ride) => {
    console.log("Ride accepted:", ride);
    res.send(ride);
  });
  setTimeout(() => {
    res.status(500).send();
  }, 30000); // 30 seconds timeout
};

subscribeToQueue("ride-accepted", (message) => {
  const ride = JSON.parse(message);
  console.log("Ride accepted:", ride);
  // Handle the ride accepted event
});
