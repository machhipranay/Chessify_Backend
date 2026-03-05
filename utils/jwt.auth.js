import jwt from "jsonwebtoken";
import { encrypt , decrypt } from "./cryptr.js";

export const generateToken = ( payload ) => {
  return encrypt(jwt.sign( payload , process.env.JWT_SECRET_KEY , { expiresIn: "7d" } ));
}

export const verifyToken = ( token ) => {
  try {
    return jwt.verify( decrypt(token) , process.env.JWT_SECRET_KEY );
  } catch (error) {
    return null;
  }
}

export const authMiddleware = ( req, res, next ) => {
  // take token from cookies

  if( !req.cookies || !req.cookies.token ) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = req.cookies.token;

  const decoded = verifyToken( token );

  if( !decoded ) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  req.user = decoded;
  next();
}