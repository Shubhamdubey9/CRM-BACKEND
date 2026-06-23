import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import sendResponse from '../utils/sendResponse.js';

const generateToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '2h',
  });

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) return sendResponse(res, 409, { message: 'Email already registered.' });

  const user = await User.create({ name, email, password });
  const token = generateToken(user._id);

  sendResponse(res, 201, { message: 'Account created successfully.', token, user });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user) return sendResponse(res, 401, { message: 'Invalid email or password.' });

  const isMatch = await user.comparePassword(password);
  if (!isMatch) return sendResponse(res, 401, { message: 'Invalid email or password.' });

  const token = generateToken(user._id);
  sendResponse(res, 200, { message: 'Login successful.', token, user });
});

const getMe = (req, res) => sendResponse(res, 200, { user: req.user });

export { register, login, getMe };
