const express = require("express");
const router = express.Router();
const captainController = require("../controllers/captain.controllers");
const authMiddleWare = require("../middleware/authMiddleWare");

router.post("/register", captainController.register);
router.post("/login", captainController.login);
router.get("/logout", captainController.logout);
router.get("/profile", authMiddleWare.captainAuth, captainController.profile);
router.patch(
  "/toggle-availability",
  authMiddleWare.captainAuth,
  captainController.toggleAvailability
);
router.get(
  "/new-ride",
  authMiddleWare.captainAuth,
  captainController.waitForRide
);

module.exports = router;
