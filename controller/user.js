import User from "../models/user.model.js";
import { responceHandler } from "../utils/responceHandler.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/jwt.auth.js";
import {
  deleteImageFromCloudinaryUsingUrl,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import { hashPassword, comparePassword } from "../utils/bcrypt.js";
import { userValidationSchema } from "../validation/user.js";
import { userEditProfileValidation } from "../validation/userProfileEdit.js";

export const signUpUser = async (req, res) => {
  let { username, email, password, about, country } = req.body;
  username = username ? username.trim().toLowerCase() : "";
  email = email ? email.trim().toLowerCase() : "";
  password = password ? password.trim() : "";
  about = about ? about.trim() : "";

  // validation
  const { error } = userValidationSchema.validate(req.body);

  if (error) {
    return res.status(400).json({
      error: error.details[0].message,
    });
  }

  try {
    const user = await User.findOne({ username });
    if (user)
      return responceHandler(res, 400, "User exists with same username", null);

    const avatarLocalPath = req.file ? req.file.path : "";
    const avatarResult = avatarLocalPath
      ? await uploadOnCloudinary(
          avatarLocalPath,
          `avatar/${username}-${Date.now()}`,
        )
      : {};

    const payload = {
      username,
      email,
      password: await hashPassword(password),
      about,
    };

    if (avatarResult.error)
      return responceHandler(res, 400, "Avatar upload failed", {
        error: avatarResult.error,
      });
    if (avatarResult.secure_url) payload.avatar = avatarResult.secure_url;
    if (country) payload.country = country;

    await User.create(payload);
    return responceHandler(res, 201, "User created successfully");
  } catch (error) {
    return responceHandler(res, 500, "Internal Server Error", { error: error });
  }
};

export const loginUser = async (req, res) => {
  let { username, password } = req.body;

  username = username ? username.toLowerCase() : null;

  try {
    const user = await User.findOne({ username });

    if (!user) {
      return responceHandler(res, 400, "User not found", null);
    }

    if (!(await comparePassword(password, user.password))) {
      return responceHandler(res, 400, "Wrong password", null);
    }

    const payload = {
      id: user._id,
    };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // save refreshToken in db

    user.refreshToken = refreshToken;
    await user.save();

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 1 * 24 * 60 * 60 * 1000, // 1 day
    });

    const responce_payload = {
      id: user._id,
      username: user.username,
      email: user.email,
      about: user.about,
      avatar: user.avatar,
      country: user.country,
    };
    return responceHandler(res, 200, "User logged in successfully", {
      user: responce_payload,
    });
  } catch (error) {
    return responceHandler(res, 500, "Internal Server Error", null, {
      error: error.message,
    });
  }
};

export const getUserProfile = async (req, res) => {
  const userId = req.userId;
  try {
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return responceHandler(res, 404, "User not found", null);
    }
    return responceHandler(
      res,
      200,
      "User profile retrieved successfully",
      user,
    );
  } catch (error) {
    return responceHandler(res, 500, "Internal Server Error", null, {
      error: error,
    });
  }
};

export const editUserProfile = async (req, res) => {
  const { error } = userEditProfileValidation.validate(req.body);

  if (error) return res.status(400).json({ error: error.details[0].message });

  const userId = req.userId;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return responceHandler(res, 404, "User not found", null);
    }

    const preAvatar = user.avatar;

    const avatarLocalPath = req.file ? req.file.path : "";
    const avatarResult = avatarLocalPath
      ? await uploadOnCloudinary(
          avatarLocalPath,
          `avatar/${req.body.username || user.username}-${Date.now()}`,
        )
      : {};

    if (avatarResult.error)
      return responceHandler(res, 400, "Avatar upload failed", {
        error: avatarResult.error,
      });

    user.username = req.body.username ? req.body.username : user.username;
    user.email = req.body.email ? req.body.email : user.email;
    user.about = req.body.about ? req.body.about : user.about;
    user.country = req.body.country ? req.body.country : user.country;

    if (avatarResult.secure_url) {
      user.avatar = avatarResult.secure_url;
      if (preAvatar.startsWith("https://res.cloudinary.com/chessify/")) {
        await Promise.all([
          deleteImageFromCloudinaryUsingUrl(preAvatar),
          user.save(),
        ]);
      } else {
        await user.save();
      }
    } else {
      await user.save();
    }
    return responceHandler(res, 200, "User profile edited successfully", {
      username: user.username,
      email: user.email,
      about: user.about,
      avatar: user.avatar,
      country: user.country,
    });
  } catch (error) {
    return responceHandler(res, 500, "Internal Server Error", null, {
      error: error.message,
    });
  }
};

export const editUsername = async (req, res) => {
  const userId = req.userId;

  const user = await User.findById(userId);
  if (!user) {
    return responceHandler(res, 404, "User not found", null);
  }

  user.username = req.body.username;
  await user.save();
  return responceHandler(res, 200, "Username changed successfully");
};

export const editPassword = async (req, res) => {
  const prePassword = req.body.prePassword;
  const userId = req.userId;

  const user = await User.findById(userId);
  if (!user) {
    return responceHandler(res, 404, "User not found", null);
  }

  const isMatch = await comparePassword(prePassword, user.password);
  if (!isMatch) {
    return responceHandler(res, 400, "Incorrect password", null);
  }

  const newPassword = req.body.newPassword;
  user.password = await hashPassword(newPassword, 10);
  await user.save();
  return responceHandler(res, 200, "Password changed successfully");
};

export const editEmail = async (req, res) => {
  const userId = req.userId;
  const email = req.body.email;
  const user = await User.findById(userId);
  if (!user) {
    return responceHandler(res, 404, "User not found", null);
  }

  function isValidEmail(email) {
    if (!email) return true;
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  if (!isValidEmail(email)) {
    return responceHandler(res, 400, "Invalid email format", null);
  }

  user.email = email;
  await user.save();
  return responceHandler(res, 200, "Email changed successfully", { email });
};

export const editAbout = async (req, res) => {
  const userId = req.userId;
  const about = req.body.about;

  const user = await User.findById(userId);
  if (!user) {
    return responceHandler(res, 404, "User not found", null);
  }

  if (about.length > 500) {
    return responceHandler(
      res,
      400,
      "About should be less than 500 characters",
      null,
    );
  }

  user.about = about;
  await user.save();
  return responceHandler(res, 200, "About changed successfully", { about });
};

export const editAvatar = async (req, res) => {
  const userId = req.userId;
  const user = await User.findById(userId);
  if (!user) {
    return responceHandler(res, 404, "User not found", null);
  }

  const preAvatar = user.avatar;

  if (!req.file) {
    return responceHandler(res, 400, "Avatar file is required", null);
  }

  const avatarLocalPath = req.file.path;
  const avatarResult = await uploadOnCloudinary(
    avatarLocalPath,
    `avatar/${user.username}-${Date.now()}`,
  );

  if (avatarResult.error)
    return responceHandler(res, 400, "Avatar upload failed", {
      error: avatarResult.error,
    });

  user.avatar = avatarResult.secure_url;
  if (preAvatar.startsWith("https://res.cloudinary.com/chessify/")) {
    await Promise.all([
      deleteImageFromCloudinaryUsingUrl(preAvatar),
      user.save(),
    ]);
  } else {
    await user.save();
  }
  return responceHandler(res, 200, "Avatar changed successfully", {
    avatar: user.avatar,
  });
};

export const editCountry = async (req, res) => {
  const userId = req.userId;
  const country = req.body.country;

  const user = await User.findById(userId);
  if (!user) {
    return responceHandler(res, 404, "User not found", null);
  }
  const allowedCountries = [
    "India",
    "USA",
    "UK",
    "Germany",
    "France",
    "Russia",
    "China",
    "Japan",
  ];

  if (!allowedCountries.includes(country)) {
    return responceHandler(res, 400, "Invalid country name", null);
  } else {
    user.country = country;
  }

  await user.save();
  return responceHandler(res, 200, "Country changed successfully", {
    country: user.country,
  });
};

export const editStatus = async (req, res) => {
  const userId = req.userId;
  const status = req.body.status;

  const user = await User.findById(userId);
  if (!user) {
    return responceHandler(res, 404, "User not found", null);
  }

  const allowedStatus = ["None", "Gold", "Platinum", "Diamond"];

  if (!allowedStatus.includes(status)) {
    return responceHandler(res, 400, "Invalid status", null);
  }

  user.status = status;
  await user.save();
  return responceHandler(res, 200, "Status changed successfully", { status });
};

export const followUser = async (req, res) => {
  const userId = req.userId;
  const currUser = await User.findById(userId);
  const followingUserId = req.body.userId;

  if (userId === followingUserId) {
    return responceHandler(res, 400, "You can't follow yourself");
  }

  if (!currUser) {
    return responceHandler(res, 404, "User not found", null);
  }

  const followingUser = await User.findById(followingUserId);
  if (!followingUser) {
    return responceHandler(res, 404, "Following user not found", null);
  }

  if (followingUser.followers.includes(userId)) {
    return responceHandler(res, 400, "You are already following this user");
  }

  if (currUser.followers.includes(followingUserId)) {
    currUser.friends.push(followingUserId);
    followingUser.friends.push(userId);
    await Promise.all([currUser.save(), followingUser.save()]);
  } else {
    followingUser.followers.push(userId);
    await followingUser.save();
  }

  return responceHandler(res, 200, "User followed successfully");
};

export const unfollowUser = async (req, res) => {
  const userId = req.userId;
  const currUser = await User.findById(userId);
  const followingUserId = req.body.userId;

  if (userId === followingUserId) {
    return responceHandler(res, 400, "You can't unfollow yourself");
  }

  if (!currUser) {
    return responceHandler(res, 404, "User not found", null);
  }

  const followingUser = await User.findById(followingUserId);
  if (!followingUser) {
    return responceHandler(res, 404, "Following user not found", null);
  }

  if (!followingUser.followers.includes(userId)) {
    return responceHandler(res, 400, "You are not following this user");
  }

  if (currUser.followers.includes(followingUserId)) {
    currUser.friends.pull(followingUserId);
    followingUser.friends.pull(userId);
    await Promise.all([currUser.save(), followingUser.save()]);
  } else {
    followingUser.followers.pull(userId);
    await followingUser.save();
  }
  return responceHandler(res, 200, "User unfollowed successfully");
};

export const removeAvatar = async (req, res) => {
  const userId = req.userId;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return responceHandler(res, 404, "User not found", null);
    }
    let promiseArray = [];
    if (user.avatar.startsWith("https://res.cloudinary.com/chessify/")) {
      promiseArray.push(deleteImageFromCloudinaryUsingUrl(user.avatar));
    }
    user.avatar = undefined;
    promiseArray.push(user.save());
    await Promise.all(promiseArray);
    return responceHandler(res, 200, "Avatar removed successfully");
  } catch (error) {
    return responceHandler(res, 500, "Internal Server Error", null, {
      error: error.message,
    });
  }
};
