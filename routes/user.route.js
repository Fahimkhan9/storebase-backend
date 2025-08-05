import express from 'express';
import passport from 'passport';
import '../config/passport.js'
import { handleOAuthCallback, getMe } from '../controllers/user.controller.js';
import { isAuthenticated } from '../middleware/auth.middleware.js';


const router = express.Router();

router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/auth/google/callback', 
  passport.authenticate('google', { session: false }), 
  handleOAuthCallback
);

router.get('/me', isAuthenticated, getMe);

export default router;
