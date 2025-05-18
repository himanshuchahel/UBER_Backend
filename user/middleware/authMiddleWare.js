const jwt = require("jsonwebtoken");
const userModel = require("../models/user.models");
const BlacklisttokenModel = require("../models/blacklisttoken.model");

module.exports.userAuth = async (req, res, next) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const isBlacklisted = await BlacklisttokenModel.find({ token });
    if (isBlacklisted.length) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userModel.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    req.user = user;
    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
