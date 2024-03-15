const router = require("express").Router();
const Auth = require("../middlewares/authentication");
const checkRole = require("../middlewares/checkRole");
const { createAirport, getAllAirports, editAirportById, deleteAirport } = require("../controllers/airport.controllers");

router.get("/", getAllAirports);
router.post("/", Auth, checkRole(["ADMIN"]), createAirport);
router.put("/:airportId", Auth, checkRole(["ADMIN"]), editAirportById);
router.delete("/:airportId", Auth, checkRole(["ADMIN"]), deleteAirport);

module.exports = router;
