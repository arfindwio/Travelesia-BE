const router = require("express").Router();
const Auth = require("../middlewares/authentication");
const checkRole = require("../middlewares/checkRole");
const { image } = require("../libs/multer");
const { getAllFlights, createFlight, editFlight, deleteFlight } = require("../controllers/flight.controllers");

router.post("/", getAllFlights);
router.post("/", Auth, checkRole(["ADMIN"]), image.single("image"), createFlight);
router.post("/:flightId", Auth, checkRole(["ADMIN"]), image.single("image"), editFlight);
router.post("/:flightId", Auth, checkRole(["ADMIN"]), deleteFlight);

module.exports = router;
