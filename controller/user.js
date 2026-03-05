import User from "../models/user.model.js";
import { responceHandler } from "../utils/responceHandler.js";
import { encrypt, decrypt } from "../utils/cryptr.js";
import { generateToken } from "../utils/jwt.auth.js";

export const signUpUser = async ( req, res ) => {

  let { username , email , password , about , isAdmin , isBanned , country} = req.body;
  username = username ? username.trim().toLowerCase() : "";
  email = email ? email.trim().toLowerCase() : "";
  password = password ? password.trim() : "";
  about = about ? about.trim() : "";

  // validation
  

  try {

    const user = await User.findOne({ username });
    if( user ) {
      return responceHandler( res , 400 , "User exists with same username" , null );
    }

    const newUser = await User.create({ username , email , password: encrypt(password), about , isAdmin , isBanned , country});
    return responceHandler( res , 201 , "User created successfully" , newUser );
  } catch (error) {
    return responceHandler( res , 500 , "Internal Server Error" , error );
  }
}

export const loginUser = async ( req, res ) => {
  let { username , email , password } = req.body;

  username = username ? username.toLowerCase() : null;
  email = email ? email.toLowerCase() : null;

  try {
    const conditions = [];
    if(username) conditions.push({ username });
    if( email ) conditions.push({ email });

    const user = await User.findOne({
      $or: conditions
    });
    
    if( !user ) {
      return responceHandler( res , 400 , "User not found" , null );
    }
    
    if( decrypt(user.password) != password ) {
      return responceHandler( res , 400 , "Wrong password" , null );
    }
    
    const payload = {
      id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      about: user.about,
      isAdmin: user.isAdmin,
      isBanned: user.isBanned,
      country: user.country,
      rating : user.rating,
      status: user.status
    };

    const token = generateToken( payload );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return responceHandler( res , 200 , "User logged in successfully" , { token } );
  } catch (error) {
    return responceHandler( res , 500 , "Internal Server Error" , null );
  }
}

export const getUserProfile = async ( req, res ) => {
  const userId = req.user.id;
  try {
    const user = await User.findById(userId).select("-password");
    if( !user ) {
      return responceHandler( res , 404 , "User not found" , null );
    }
    return responceHandler( res , 200 , "User profile retrieved successfully" , user );
  } catch (error) {
    return responceHandler( res , 500 , "Internal Server Error" , null );
  }
}