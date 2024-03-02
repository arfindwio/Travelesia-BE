const router = require("express").Router();
const { updateProfile } = require("../controllers/userProfile.controllers");
const { image } = require("../libs/multer");
const Auth = require("../middlewares/authentication");
const checkRole = require("../middlewares/checkRole");

router.put("/update-profile", Auth, checkRole(["USER", "ADMIN"]), image.single("image"), updateProfile);

module.exports = router;
