const router = require("express").Router();
const Auth = require("../middlewares/authentication");
const checkRole = require("../middlewares/checkRole");
const { image } = require("../libs/multer");
const { getAllFlights, createFlight, getFlightById, editFlightById, deleteFlight } = require("../controllers/flight.controllers");

router.get("/", getAllFlights);
router.post("/", Auth, checkRole(["ADMIN"]), image.single("image"), createFlight);
router.get("/:flightId", Auth, checkRole(["USER", "ADMIN"]), getFlightById);
router.put("/:flightId", Auth, checkRole(["ADMIN"]), image.single("image"), editFlightById);
router.delete("/:flightId", Auth, checkRole(["ADMIN"]), deleteFlight);

module.exports = router;
