/**
 * ═══════════════════════════════════════════════════════════════
 *  USER ROUTES — /api/user
 * ═══════════════════════════════════════════════════════════════
 *
 *  Handles all user-related operations:
 *  - Authentication (signup, login, logout)
 *  - Profile management (view, edit individual fields, edit all at once)
 *  - Avatar upload/removal (via Cloudinary)
 *  - Social features (follow, unfollow)
 *
 *  Auth: Most routes require JWT authentication via httpOnly cookies.
 *  Public routes: POST /signup, POST /login, GET /logout
 *
 * ═══════════════════════════════════════════════════════════════
 */

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
  unfollowUser
} from "../controller/user.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { authMiddleware } from "../utils/jwt.auth.js";
import { upload } from "../utils/multer.js";

const router = Router();

// ─── Public Routes (No Auth Required) ────────────────────────────────────────

// POST /api/user/signup
// Register a new user account
// Accepts multipart/form-data for optional avatar upload
// Body: { username, email?, password, about?, country? } + file: avatar
router.post("/signup", upload.single("avatar"), asyncHandler(signUpUser));

// POST /api/user/login
// Authenticate user and set JWT cookies (accessToken + refreshToken)
// Body: { username, password }
// Sets: accessToken cookie (1 day), refreshToken cookie (7 days)
router.post("/login", asyncHandler(loginUser));

// GET /api/user/logout
// Clear authentication cookies and log out
// No body or params needed
router.get("/logout", (req, res) => {
  res.clearCookie("token");
  return res.json({ message: "User logged out successfully" });
});

// ─── Profile Routes (Auth Required) ──────────────────────────────────────────

// GET /api/user/profile
// Get the full profile of the currently logged-in user
// Returns all user fields except password and refreshToken
router.get("/profile", authMiddleware, asyncHandler(getUserProfile));

// POST /api/user/profile/edit
// Edit multiple profile fields in a single request
// Accepts multipart/form-data for optional avatar upload
// Body: { username?, email?, about?, country? } + file: avatar?
router.post(
  "/profile/edit",
  authMiddleware,
  upload.single("avatar"),
  asyncHandler(editUserProfile),
);

// ─── Individual Field Edit Routes (Auth Required) ────────────────────────────
// Each route edits a single profile field with its own validation

// POST /api/user/profile/edit/username — Body: { username }
// Username: 6-30 chars, alphanumeric + underscore only, must be unique
router.post("/profile/edit/username", authMiddleware, asyncHandler(editUsername));

// POST /api/user/profile/edit/email — Body: { email }
// Must be a valid email format
router.post("/profile/edit/email", authMiddleware, asyncHandler(editEmail));

// POST /api/user/profile/edit/password — Body: { oldPassword, password }
// Requires current password verification before changing
router.post("/profile/edit/password", authMiddleware, asyncHandler(editPassword));

// POST /api/user/profile/edit/country — Body: { country }
// Allowed: India, USA, UK, Germany, France, Russia, China, Japan
router.post("/profile/edit/country", authMiddleware, asyncHandler(editCountry));

// POST /api/user/profile/edit/about — Body: { about }
// Max 500 characters
router.post("/profile/edit/about", authMiddleware, asyncHandler(editAbout));

// POST /api/user/profile/edit/status — Body: { status }
// Allowed: None, Gold, Platinum, Diamond
router.post("/profile/edit/status", authMiddleware, asyncHandler(editStatus));

// POST /api/user/profile/edit/avatar — file: avatar (required)
// Upload a new avatar image via multipart/form-data
// Old avatar is deleted from Cloudinary if it was hosted there
router.post("/profile/edit/avatar", authMiddleware, upload.single("avatar"), asyncHandler(editAvatar));

// ─── Avatar Removal Routes (Auth Required) ───────────────────────────────────

// GET /api/user/profile/avatar/delete — Remove the user's avatar
// Deletes from Cloudinary if hosted there, resets to default
router.get("/profile/avatar/delete", authMiddleware, asyncHandler(removeAvatar));

// GET /api/user/profile/avatar/remove — Same as above (alternate URL)
router.get("/profile/avatar/remove", authMiddleware, asyncHandler(removeAvatar));

// ─── Social Routes (Auth Required) ───────────────────────────────────────────

// POST /api/user/follow — Body: { userId }
// Follow another user. Uses MongoDB transaction for atomicity.
// If both users follow each other, they automatically become "friends"
router.post("/follow", authMiddleware, asyncHandler(followUser));

// POST /api/user/unfollow — Body: { userId }
// Unfollow a user. Uses MongoDB transaction for atomicity.
// If they were friends, the friendship is removed on both sides
router.post("/unfollow", authMiddleware, asyncHandler(unfollowUser));

// ─── Disabled Routes ─────────────────────────────────────────────────────────
// router.get("/profile/email/verify", asyncHandler((req, res) => res.status(200).json({ message: "Email verification successful" })));

export default router;
