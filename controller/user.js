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
      ? await uploadOnCloudinary(avatarLocalPath, `avatar/${username}-${Date.now()}`)
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
    }
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
      ? await uploadOnCloudinary(avatarLocalPath, `avatar/${req.body.username || user.username}-${Date.now()}`)
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
      if (preAvatar.startsWith("https://res.cloudinary.com/chessify/",)){
        await Promise.all([deleteImageFromCloudinaryUsingUrl(preAvatar), user.save()]);
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
      country: user.country
    });
  } catch (error) {
    return responceHandler(res, 500, "Internal Server Error", null, {
      error: error.message,
    });
  }
};

export const editUsername = async(req,res)=>{}

export const editPassword = async(req,res)=>{
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
}

export const editEmail = async(req,res)=>{}

export const editAbout = async(req,res)=>{}

export const changeAvatar = async (req,res)=>{} 

export const changeCountry = async(req,res)=>{}

export const changeStatus = async(req,res)=>{}

export const followUser = async(req,res) => {}

export const unfollowUser = async(req,res) => {}

export const removeAvatar = async( req,res) => {
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
}