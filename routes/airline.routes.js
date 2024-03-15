const router = require("express").Router();
const Auth = require("../middlewares/authentication");
const checkRole = require("../middlewares/checkRole");
const { getAllAirlines, createAirline, editAirlineById, deleteAirline } = require("../controllers/airline.controllers");

router.get("/", getAllAirlines);
router.post("/", Auth, checkRole(["ADMIN"]), createAirline);
router.put("/:airlineId", Auth, checkRole(["ADMIN"]), editAirlineById);
router.delete("/:airlineId", Auth, checkRole(["ADMIN"]), deleteAirline);

module.exports = router;
