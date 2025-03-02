// models/User.js
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  name: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  hashedPassword: {
    type: String
  },
  isEmailVerified: {
    type: Boolean,
    default: true // Since we're creating accounts after OTP verification
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Generate a random password for auto-created accounts
userSchema.methods.generateRandomPassword = function() {
  return crypto.randomBytes(16).toString('hex');
};

// We'll use JWT for authentication
userSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { id: this._id, email: this.email, isVerified: this.isEmailVerified },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

const User = mongoose.model('User', userSchema);
export default User;