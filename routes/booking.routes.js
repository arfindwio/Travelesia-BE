const router = require("express").Router();
const Auth = require("../middlewares/authentication");
const checkRole = require("../middlewares/checkRole");
const { getAllBookings, getBookingByBookingCode, createBooking, payBooking, getAllBookingsByAuth } = require("../controllers/booking.controllers");

router.get("/", Auth, checkRole(["ADMIN"]), getAllBookings);
router.get("/:bookingCode", Auth, checkRole(["USER", "ADMIN"]), getBookingByBookingCode);
router.post("/:flightId", Auth, checkRole(["USER", "ADMIN"]), createBooking);
router.put("/:flightId", Auth, checkRole(["USER", "ADMIN"]), payBooking);
router.get("/payment/history", Auth, checkRole(["USER", "ADMIN"]), getAllBookingsByAuth);

module.exports = router;
