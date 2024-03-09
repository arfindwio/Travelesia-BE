const router = require("express").Router();
const Auth = require("../middlewares/authentication");
const checkRole = require("../middlewares/checkRole");
const { getAllBookings, createBooking, payBooking, getAllBookingsByAuth } = require("../controllers/booking.controllers");

router.get("/", Auth, checkRole(["ADMIN"]), getAllBookings);
router.post("/:flightId", Auth, checkRole(["USER", "ADMIN"]), createBooking);
router.put("/:flightId", Auth, checkRole(["USER", "ADMIN"]), payBooking);
router.get("/bookingHistory", Auth, checkRole(["USER", "ADMIN"]), getAllBookingsByAuth);

module.exports = router;
