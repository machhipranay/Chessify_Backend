export const asyncHandler = (fn) => async (req, res, next) => {
  try {
    await fn(req, res, next);
  } catch (error) {
    return res.status(400).json({ success : false ,error: error.message });
  }
}