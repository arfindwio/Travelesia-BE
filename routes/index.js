const router = require("express").Router();
const swaggerUi = require("swagger-ui-express");

const swaggerDocument = require("../docs/swagger.json");
const User = require("./user.routes");
const UserProfile = require("./userProfile.routes");
const Notification = require("./notification.routes");
const Airport = require("./airport.routes");
const Terminal = require("./terminal.routes");
const Airline = require("./airline.routes");
const Flight = require("./flight.routes");
const Promotion = require("./promotion.routes");
const Seat = require("./seat.routes");
const Booking = require("./booking.routes");
const Passenger = require("./passenger.routes");

// API Docs
router.use("/api-docs", swaggerUi.serve);
router.get("/api-docs", swaggerUi.setup(swaggerDocument));

// API
router.use("/api/v1/users", User);
router.use("/api/v1/user-profiles", UserProfile);
router.use("/api/v1/notifications", Notification);
router.use("/api/v1/airports", Airport);
router.use("/api/v1/terminals", Terminal);
router.use("/api/v1/airlines", Airline);
router.use("/api/v1/promotions", Promotion);
router.use("/api/v1/flights", Flight);
router.use("/api/v1/seats", Seat);
router.use("/api/v1/bookings", Booking);
router.use("/api/v1/passengers", Passenger);

module.exports = router;
