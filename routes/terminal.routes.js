const router = require("express").Router();
const Auth = require("../middlewares/authentication");
const checkRole = require("../middlewares/checkRole");
const { getAllTerminals, createTerminal, editTerminalById, deleteTerminal } = require("../controllers/terminal.controllers");

router.get("/", getAllTerminals);
router.post("/", Auth, checkRole(["ADMIN"]), createTerminal);
router.put("/:terminalId", Auth, checkRole(["ADMIN"]), editTerminalById);
router.delete("/:terminalId", Auth, checkRole(["ADMIN"]), deleteTerminal);

module.exports = router;
