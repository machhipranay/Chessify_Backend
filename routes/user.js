import { Router } from "express";
import { signUpUser, loginUser , getUserProfile } from "../controller/user.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { authMiddleware } from "../utils/jwt.auth.js";

const router = Router();

router.post("/signup", asyncHandler(signUpUser));

router.post("/login", asyncHandler(loginUser));

router.get("/profile", authMiddleware , asyncHandler(getUserProfile));

router.post("/logout", ( req, res ) => {
  res.clearCookie("token");
  return res.json({ message: "User logged out successfully" });
});

export default router;