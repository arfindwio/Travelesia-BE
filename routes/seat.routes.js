const router = require("express").Router();
const Auth = require("../middlewares/authentication");
const checkRole = require("../middlewares/checkRole");
const { getAllSeatsByFlightId, createManySeats, reserveSeatById, deleteManySeatsByFlightId } = require("../controllers/seat.controllers");

router.post("/", Auth, checkRole(["ADMIN"]), createManySeats);
router.put("/:seatId", Auth, checkRole(["USER", "ADMIN"]), reserveSeatById);
router.get("/:flightId", Auth, checkRole(["USER", "ADMIN"]), getAllSeatsByFlightId);
router.delete("/:flightId", Auth, checkRole(["ADMIN"]), deleteManySeatsByFlightId);

module.exports = router;
