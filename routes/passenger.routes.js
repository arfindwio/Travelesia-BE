const router = require("express").Router();
const Auth = require("../middlewares/authentication");
const checkRole = require("../middlewares/checkRole");
const { getAllPassengers, createPassenger, getAllPassengersByBookingId } = require("../controllers/passenger.controllers");

router.get("/", Auth, checkRole(["ADMIN"]), getAllPassengers);
router.post("/", Auth, checkRole(["USER", "ADMIN"]), createPassenger);
router.get("/:bookingId", Auth, checkRole(["ADMIN"]), getAllPassengersByBookingId);

module.exports = router;
