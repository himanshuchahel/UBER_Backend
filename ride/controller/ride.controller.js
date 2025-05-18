const rideModel = require("../models/ride.model");
const { subscribeToQueue, publishToQueue } = require("../service/rabbit");

module.exports.createRide = async (req, res) => {
  try {
    const { pickup, destination } = req.body;
    const newRide = new rideModel({
      user: req.user._id,
      pickup,
      destination,
    });
    await newRide.save();
    publishToQueue("new-ride", JSON.stringify(newRide));
    res.send(newRide);

    //asyncronous communication -> it is loosely coupled. but resonse time is increased. liberary used amqplib
  } catch (error) {
    console.error("Error creating ride:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports.acceptRide = async (req, res) => {
  try {
    const { rideId } = req.query;
    const ride = await rideModel.findById(rideId);
    if (!ride) {
      return res.status(404).json({ message: "Ride not found" });
    }
    ride.status = "accepted";
    await ride.save();
    publishToQueue("ride-accepted", JSON.stringify(ride));
    res.send(ride);
  } catch (error) {
    console.error("Error accepting ride:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
