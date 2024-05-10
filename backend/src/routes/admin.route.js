import { Router } from "express";
import { verifyAdminJWT } from "../middlewares/adminAuth.middleware.js";
import {
  loginAdmin,
  logoutAdmin,
  registerAdmin,
  refreshAccessToken,
} from "../controllers/admin.controller.js";

const router = Router();

router.route("/register").post(registerAdmin);
router.route("/login").post(loginAdmin);
// secured routes
router.route("/logout").post(verifyAdminJWT, logoutAdmin);
router.route("/refresh-token").post(refreshAccessToken);

export default router;
