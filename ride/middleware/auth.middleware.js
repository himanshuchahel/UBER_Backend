const jwt = require("jsonwebtoken");
const axios = require("axios");

module.exports.userAuth = async (req, res, next) => {
  try {
    const rawtoken = req.headers["authorization"];
    if (!rawtoken) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const token = rawtoken.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const response = await axios.get(`${process.env.BASE_URL}/user/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }); //syncronous communication it depends uppon the user service that is the disadvantage if user stops his communication ride also gets stops.
    const user = response.data;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

module.exports.captainAuth = async (req, res, next) => {
  try {
    const rawtoken = req.headers["authorization"];
    if (!rawtoken) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const token = rawtoken.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const response = await axios.get(
      `${process.env.BASE_URL}/captain/profile`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const captain = response.data;
    if (!captain) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    req.captain = captain;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
