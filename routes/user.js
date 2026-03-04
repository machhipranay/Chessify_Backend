import { Router } from "express";
import { signUpUser } from "../controller/user.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.post("/signup", asyncHandler(signUpUser));

export default router;