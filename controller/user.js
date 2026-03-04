import User from "../models/user.model.js";
import { responceHandler } from "../utils/responceHandler.js";
import { encrypt } from "../utils/cryptr.js";

export const signUpUser = async ( req, res ) => {

  const { username , email , password } = req.body;

  // validation

  try {
    const user = await User.findOne({ username });

    if( user ) {
      return responceHandler( res , 400 , "User exists with same username" , null );
    }
    
    let encryptedString = encrypt(password);
    const newUser = await User.create({ username , email , password: encryptedString });
    return responceHandler( res , 201 , "User created successfully" , newUser );
  } catch (error) {
    return responceHandler( res , 500 , "Internal Server Error" , null );
  }
}