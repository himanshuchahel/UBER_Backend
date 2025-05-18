const captianModel = require("../models/captain.models");
const BlacklisttokenModel = require("../models/blacklisttoken.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { subscribeToQueue } = require("../service/rabbit");

const pendingRequests = [];

module.exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if captain already exists
    const existingcaptain = await captianModel.findOne({ email });

    if (existingcaptain) {
      return res.status(400).json({ message: "captain already exists" });
    }
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    // Create new captain
    const newcaptain = new captianModel({
      name,
      email,
      password: hashedPassword,
    });
    // Save captain to database
    await newcaptain.save();
    // Generate JWT token
    const token = jwt.sign({ id: newcaptain._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    // Set token in cookie
    res.cookie("token", token);
    res.send({ message: "captain registered successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const captain = await captianModel.findOne({ email }).select("+password");
    if (!captain) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const isMatch = await bcrypt.compare(password, captain.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    // Generate JWT token
    const token = jwt.sign({ id: captain._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    // Set token in cookie
    res.cookie("token", token);
    res.send({ message: "captain logged in successfully", token });
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
    res.send({ message: "captain logged out successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports.profile = async (req, res) => {
  try {
    res.send(req.captain);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

module.exports.toggleAvailability = async (req, res) => {
  try {
    const captain = await captianModel.findById(req.captain._id);
    if (!captain) {
      return res.status(404).json({ message: "captain not found" });
    }
    captain.isAvailable = !captain.isAvailable;
    await captain.save();
    res.send({
      message: "Availability toggled successfully",
      isAvailable: captain.isAvailable,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

module.exports.waitForRide = async (req, res) => {
  req.setTimeout(30000, () => {
    res.status(204).end();
  });
  pendingRequests.push(res);
}; //long polling

subscribeToQueue("new-ride", async (data) => {
  console.log("New ride request received:", JSON.parse(data));
  const rideData = JSON.parse(data);
  pendingRequests.forEach((res) => {
    res.status(200).json({ data: rideData });
  });
  pendingRequests.length = 0; // Clear the pending requests after sending the response
  console.log("Pending requests cleared");
});
