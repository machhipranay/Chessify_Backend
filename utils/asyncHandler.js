export const asyncHandler = (fn) => async (req, res, next) => {
  try {
    console.log(next);
    await fn(req, res, next);
  } catch (error) {
    next(error);
  }
}