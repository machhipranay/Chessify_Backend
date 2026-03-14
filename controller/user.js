import User from "../models/user.model.js";
import { responceHandler } from "../utils/responceHandler.js";
import { encrypt, decrypt } from "../utils/cryptr.js";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.auth.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { hashPassword, comparePassword } from "../utils/bcrypt.js";

export const signUpUser = async (req, res) => {
  let { username, email, password, about, country , titles } =
    req.body;
  username = username ? username.trim().toLowerCase() : "";
  email = email ? email.trim().toLowerCase() : "";
  password = password ? password.trim() : "";
  about = about ? about.trim() : "";
  // validation

  try {
    const user = await User.findOne( { username } );
    if (user)
      return responceHandler(res, 400, "User exists with same username", null);

    const avatarLocalPath = req.file ? req.file.path : "";
    const avatarResult = avatarLocalPath? await uploadOnCloudinary(
      avatarLocalPath,
      `avatar/${username}`,
    ) : {};

    const payload = {
      username,
      email,
      password: await hashPassword(password),
      about,
    };

    if (avatarResult.error)
      return responceHandler(res, 400, "Avatar upload failed", { error : avatarResult.error });
    if (avatarResult.secure_url) payload.avatar = avatarResult.secure_url;
    if (titles) payload.titles = titles;
    if (country) payload.country = country;
    await User.create(payload);

    return responceHandler(res, 201, "User created successfully");
  } catch (error) {
    return responceHandler(res, 500, "Internal Server Error", {error : error});
  }
};

export const loginUser = async (req, res) => {
  let { username, password } = req.body;

  username = username ? username.toLowerCase() : null;

  try {
    const user = await User.findOne({username});

    if (!user) {
      return responceHandler(res, 400, "User not found", null);
    }

    if (!await comparePassword(password,user.password)) {
      return responceHandler(res, 400, "Wrong password", null);
    }

    const payload = {
      id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      about: user.about,
      country: user.country,
      rating: user.rating,
      status: user.status,
    };
    const accessToken = generateAccessToken((payload));
    const refreshToken = generateRefreshToken((payload));

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

    return responceHandler(res, 200, "User logged in successfully", { user : payload });
  } catch (error) {
    return responceHandler(res, 500, "Internal Server Error", null, { error : error.message });
  }
};

export const getUserProfile = async (req, res) => {
  const userId = req.user.id;
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
    return responceHandler(res, 500, "Internal Server Error", null, { error : error });
  }
};
