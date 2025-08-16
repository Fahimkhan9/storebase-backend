import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

export const handleOAuthCallback = async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'Not authenticated' });

  const token = generateToken(req.user._id);

  // Set token as httpOnly cookie
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // secure cookie in prod
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  // Redirect to frontend (no token in URL)
  res.redirect(process.env.CLIENT_URL);
};

export const getMe = async (req, res) => {
  const user = await User.findById(req.user._id).select('-__v');
  if (!user) return res.status(404).json({ message: 'User not found' });

  res.json(user);
};

export const logout = (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'lax',
    expires: new Date(0), // delete immediately
  });

  res.status(200).json({ message: 'Logged out successfully' });
};
