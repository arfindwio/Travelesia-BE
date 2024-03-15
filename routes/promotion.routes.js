const router = require("express").Router();
const Auth = require("../middlewares/authentication");
const checkRole = require("../middlewares/checkRole");
const { getAllPromotions, createPromotion, editPromotionById, deletePromotion } = require("../controllers/promotion.controllers");

router.get("/", Auth, checkRole(["ADMIN"]), getAllPromotions);
router.post("/", Auth, checkRole(["ADMIN"]), createPromotion);
router.put("/:promotionId", Auth, checkRole(["ADMIN"]), editPromotionById);
router.delete("/:promotionId", Auth, checkRole(["ADMIN"]), deletePromotion);

module.exports = router;
