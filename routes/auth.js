const router = require("express").Router();
const authController = require("../controllers/authController");
const authMiddleware = require("../middlewares/auth");
router.post("/register", authController.registerAccount);
router.post("/login", authController.loginAccount);
router.post("/logout", authMiddleware.verifyToken,authController.logoutAccount);
router.post("/refresh", authController.requestRefreshToken);
router.post("/change-password/:id", authController.changePassword);

module.exports = router;