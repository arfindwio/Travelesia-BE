const router = require("express").Router();
const { getAllNotifications, createNotification, markNotificationsAsRead } = require("../controllers/notification.controllers");
const Auth = require("../middlewares/authentication");
const checkRole = require("../middlewares/checkRole");

router.get("/", Auth, checkRole(["USER", "ADMIN"]), getAllNotifications);
router.post("/", Auth, checkRole(["ADMIN"]), createNotification);
router.put("/markAsRead", Auth, checkRole(["USER", "ADMIN"]), markNotificationsAsRead);

module.exports = router;
