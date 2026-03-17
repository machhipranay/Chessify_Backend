import jwt from "jsonwebtoken";
import { encrypt, decrypt } from "./cryptr.js";
import User from "../models/user.model.js";

export const generateAccessToken = (payload) => {
  return encrypt(
    jwt.sign(payload, process.env.JWT_ACCESS_TOKEN_KEY, { expiresIn: "1h" }),
  );
};

export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(decrypt(token), process.env.JWT_ACCESS_TOKEN_KEY);
  } catch (error) {
    return null;
  }
};

export const generateRefreshToken = (payload) => {
  return encrypt(
    jwt.sign(payload, process.env.JWT_REFRESH_TOKEN_KEY, { expiresIn: "1d" }),
  );
};

export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(decrypt(token), process.env.JWT_REFRESH_TOKEN_KEY);
  } catch (error) {
    return error || null;
  }
};

export const authMiddleware = async (req, res, next) => {
  // take token from cookies

  if (!req.cookies || !req.cookies.accessToken) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const accessToken = req.cookies.accessToken;

  const decoded = verifyAccessToken(accessToken);
  if (decoded && decoded != {}) {
    req.userId = decoded.id;
    return next();
  }

  // console.log("access token is expired...");

  // if token expired then refresh token
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    // console.log("refresh token not found...");
    return res.status(401).json({ error: "refresh token not found" });
  }

  const refreshDecoded = (verifyRefreshToken(refreshToken));
  if (!refreshDecoded) {
    return res.status(401).json({ error: refreshDecoded});
  }

  const user = await User.findById(refreshDecoded.id).select("-password");

  if (!user || user.refreshToken !== refreshToken) {
    return res.status(401).json({ error: "Refresh Token is Invalid" });
  }

  // console.log("valid refresh token...");
  // remove iat and exp from refreshDecoded
  delete refreshDecoded.iat;
  delete refreshDecoded.exp;

  const newAccessToken = generateAccessToken((refreshDecoded));
  const newRefreshToken = generateRefreshToken((refreshDecoded));

  // console.log("new tokens generated...");
  user.refreshToken = newRefreshToken;
  await user.save();

  res.cookie("refreshToken", newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.cookie("accessToken", newAccessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 1 * 24 * 60 * 60 * 1000, // 1 day
  });

  req.userId = refreshDecoded.id;
  next();
};