import { Router } from "express";
import {
  signUpUser,
  loginUser,
  getUserProfile,
  editUserProfile,
  removeAvatar,
} from "../controller/user.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { authMiddleware } from "../utils/jwt.auth.js";
import { upload } from "../utils/multer.js";

const router = Router();

router.post("/signup", upload.single("avatar"), asyncHandler(signUpUser));

router.post("/login", upload.none(), asyncHandler(loginUser));

router.get("/profile", authMiddleware, asyncHandler(getUserProfile));

router.get(
  "/profile/avatar/delete",
  authMiddleware,
  asyncHandler(removeAvatar),
);

router.get("/logout", (req, res) => {
  res.clearCookie("token");
  return res.json({ message: "User logged out successfully" });
});

// router.get("/profile/email/verify", asyncHandler((req, res) => res.status(200).json({ message: "Email verification successful" })));

router.post(
  "/profile/edit",
  authMiddleware,
  upload.single("avatar"),
  asyncHandler(editUserProfile),
);
export default router;
