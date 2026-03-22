import { Router } from "express";
import {
  signUpUser,
  loginUser,
  getUserProfile,
  editUserProfile,
  removeAvatar,
  editUsername,
  editAbout,
  editEmail,
  editPassword,
  editAvatar,
  editCountry,
  editStatus,
  followUser,
  unfollowUser,
} from "../controller/user.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { authMiddleware } from "../utils/jwt.auth.js";
import { upload } from "../utils/multer.js";

const router = Router();

router.post("/signup", upload.single("avatar"), asyncHandler(signUpUser));

router.post("/login", asyncHandler(loginUser));

router.get("/profile", authMiddleware, asyncHandler(getUserProfile));

router.get("/profile/avatar/delete",authMiddleware,asyncHandler(removeAvatar));

router.post("/profile/edit/username", authMiddleware, asyncHandler(editUsername));
router.post("/profile/edit/email",authMiddleware, asyncHandler(editEmail));
router.post("/profile/edit/password", authMiddleware, asyncHandler(editPassword));
router.post("/profile/edit/country", authMiddleware, asyncHandler(editCountry));
router.post("/profile/edit/about", authMiddleware, asyncHandler(editAbout));
router.post("/profile/edit/status", authMiddleware, asyncHandler(editStatus));
router.post("/profile/edit/avatar", authMiddleware, upload.single("avatar"), asyncHandler(editAvatar));
router.post("/profile/follow", authMiddleware, asyncHandler(followUser));
router.post("/profile/unfollow", authMiddleware, asyncHandler(unfollowUser));

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
); // edit any profile parameter using only 1 request

export default router;
