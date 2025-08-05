import jwt from "jsonwebtoken";
import { AppError } from "./error.middleware.js";
import { catchAsync } from "./error.middleware.js";
import {User} from "../models/user.model.js";

export const isAuthenticated = catchAsync(async (req, res, next) => {
  // Assuming cookie-parser middleware is used in Express app
  const token = req.cookies?.token;

  if (!token) {
    throw new AppError('Not authorized, token missing', 401);
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  req.user = await User.findById(decoded.id).select('_id email name');

  if (!req.user) {
    throw new AppError('User not found', 401);
  }

  next();
});
