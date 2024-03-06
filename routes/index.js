const router = require("express").Router();
const swaggerUi = require("swagger-ui-express");

const swaggerDocument = require("../docs/swagger.json");
const User = require("./user.routes");
const UserProfile = require("./userProfile.routes");
const Notification = require("./notification.routes");
const Airport = require("./airport.routes");
const Airline = require("./airline.routes");

// API Docs
router.use("/api-docs", swaggerUi.serve);
router.get("/api-docs", swaggerUi.setup(swaggerDocument));

// API
router.use("/api/v1/users", User);
router.use("/api/v1/user-profiles", UserProfile);
router.use("/api/v1/notifications", Notification);
router.use("/api/v1/airports", Airport);
router.use("/api/v1/airlines", Airline);

module.exports = router;
