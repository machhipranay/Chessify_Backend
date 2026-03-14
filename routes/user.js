import { Router } from "express";
import { signUpUser, loginUser, getUserProfile } from "../controller/user.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { authMiddleware } from "../utils/jwt.auth.js";
import { upload } from "../utils/multer.js";

const router = Router();

router.post(
  "/signup",
  upload.single("avatar"),
  asyncHandler(signUpUser),
);

router.post("/login",upload.none(), asyncHandler(loginUser));

router.get("/profile", authMiddleware, asyncHandler(getUserProfile));

router.get("/logout", (req, res) => {
  res.clearCookie("token");
  return res.json({ message: "User logged out successfully" });
});

export default router;
