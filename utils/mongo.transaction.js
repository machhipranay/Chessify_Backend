import mongoose from "mongoose";

export const withTransaction = async (callback) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const result = await callback(session);

    await session.commitTransaction();
    return result;
    
  } catch (error) {
    await session.abortTransaction();
    throw new Error(error.message || "Something went wrong in transaction callback");
  } finally {
    session.endSession();
  }
};