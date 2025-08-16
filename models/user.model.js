import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    googleId: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
    },
    image: {
      type: String, // Google profile picture
    },

    // Storage Management
    storageUsed: {
      type: Number,
      default: 0, // in bytes
    },
    storageLimit: {
      type: Number,
      default: 5 * 1024 * 1024 * 1024, // 5GB free plan
    },

    // Plan / Billing
    plan: {
      type: String,
      enum: ['free', 'pro'],
      default: 'free',
    },
    stripeCustomerId: {
      type: String,
    },
    subscriptionStatus: {
      type: String,
      enum: ['active', 'canceled', 'past_due', 'unpaid'],
      default: null,
    },
    subscriptionEndsAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Useful index
userSchema.index({ googleId: 1, email: 1 });

export const User = mongoose.model('User', userSchema);
