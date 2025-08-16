import jwt from "jsonwebtoken";
import { AppError } from "./error.middleware.js";
import { catchAsync } from "./error.middleware.js";
import { User } from "../models/user.model.js";

export const isAuthenticated = catchAsync(async (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    throw new AppError("Not authorized, token missing", 401);
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    throw new AppError("Invalid or expired token", 401);
  }

  const user = await User.findById(decoded.id).select("_id email name");
  if (!user) {
    throw new AppError("User not found", 401);
  }

  // safer: store only minimal info
  req.user = {
    _id: user._id.toString(),
    email: user.email,
    name: user.name,
  };

  next();
});
