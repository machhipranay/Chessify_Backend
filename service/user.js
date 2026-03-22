import User from "../models/user.model.js";
import { hashPassword } from "../utils/bcrypt.js";
import { deleteImageFromCloudinaryUsingUrl } from "../utils/cloudinary.js";

export const avatarUpload = async (user,avatar) => {
  if(!user){
    throw new Error("User not found");
  }

  if(!avatar) {
    throw new Error("Avatar is required");
  }
  
  const preAvatar = user.avatar;

  if (preAvatar.startsWith("https://res.cloudinary.com/chessify/")) {
    await Promise.all([
      deleteImageFromCloudinaryUsingUrl(preAvatar),
      user.updateOne({ avatar }),
    ]);
  } else {
    user.avatar = avatar;
    await user.save();
  }
}

export const changePassword = async (userId,newPassword) => {
  if(!userId) throw new Error("UserId is required");
  if(!newPassword) throw new Error("New password is required to change");

  const user = await User.findById(userId);
  if(!user){
    throw new Error("User not found");
  }
  user.password = await hashPassword(newPassword, 10);
  await user.save();
}

export const changeField = async (userId,field,newValue) => {
  if(!userId) throw new Error("UserId is required");
  if(!field) throw new Error("Field is required to change");
  if(!newValue) throw new Error("New value is required to change");

  const user = await User.findById(userId);
  if(!user){
    throw new Error("User not found");
  }
  user[field] = newValue;
  await user.save();
}

export const followUserByUserIds = async ( userId, followingUserId, session ) => {
  if(!userId) throw new Error("User not found");
  if(!followingUserId) throw new Error("Following user not found");
  if(!session) {
    console.log("Session is required");
    throw new Error("Internal server error");
  }

  if (userId === followingUserId) {
    throw new Error("You can't follow yourself");
  }
  
  const [currUser, followingUser] = await Promise.all([User.findById(userId).session(session),User.findById(followingUserId).session(session)]);

  if (!currUser) {
    throw new Error("User not found");
  }
  if (!followingUser) {
    throw new Error("Following user not found");
  }

  if (followingUser.followers.includes(userId)) {
    throw new Error("You are already following this user");
  }

  currUser.followings.push(followingUserId);
  followingUser.followers.push(userId);

  if(currUser.followers.includes(followingUserId)) currUser.friends.push(followingUserId);
  if(followingUser.followings.includes(userId)) followingUser.friends.push(userId);
  
  await Promise.all([currUser.save({session}), followingUser.save({session})]);
}

export const unfollowUserByUserIds = async ( userId, followingUserId , session) => {
  if(!userId) throw new Error("User not found");
  if(!followingUserId) throw new Error("Following user not found");
  if(!session) {
    console.log("Session is required");
    throw new Error("Internal server error");
  }
  
  if (userId === followingUserId) {
    throw new Error("You can't unfollow yourself");
  }

  const [currUser, followingUser] = await Promise.all([User.findById(userId).session(session),User.findById(followingUserId).session(session)]);

  if (!currUser) {
    throw new Error("User not found");
  }
  if (!followingUser) {
    throw new Error("Following user not found");
  }

  if (!followingUser.followers.includes(userId)) {
    throw new Error("You are not following this user");
  }

  currUser.followings.pull(followingUserId);
  followingUser.followers.pull(userId);

  if(followingUser.friends.includes(userId)) followingUser.friends.pull(userId);
  if(currUser.friends.includes(followingUserId)) currUser.friends.pull(followingUserId);

  await Promise.all([currUser.save({session}), followingUser.save({session})]);
}

export const banUserByUserId = async (userId) => {
  if(!userId) throw new Error("UserId is required");

  const user = await User.findById(userId);
  if(!user){
    throw new Error("User not found");
  }

  user.isBanned = true;
  await user.save();
}

export const unbanUser = async (userId) => {
  if(!userId) throw new Error("UserId is required");

  const user = await User.findById(userId);
  if(!user){
    throw new Error("User not found");
  }

  user.isBanned = false;
  await user.save();
}

export const removeUser = async (userId) => {
  if(!userId) throw new Error("UserId is required");

  const user = await User.findById(userId);
  if(!user){
    throw new Error("User not found");
  }

  await user.remove();
}