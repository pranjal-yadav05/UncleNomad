// models/User.js
import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: function () {
      return !this.phone; // Email is required only if phone is not provided
    },
    unique: true,
    trim: true,
    lowercase: true,
  },
  name: {
    type: String,
    trim: true,
  },
  phone: {
    type: String,
    trim: true,
    unique: true,
    required: function () {
      return !this.email; // Phone is required only if email is not provided
    },
  },
  hashedPassword: {
    type: String,
  },
  lastLogin: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Generate a random password for auto-created accounts
userSchema.methods.generateRandomPassword = function () {
  return crypto.randomBytes(16).toString("hex");
};

// We'll use JWT for authentication
userSchema.methods.generateAuthToken = function () {
  const payload = { id: this._id };
  if (this.email) payload.email = this.email;
  if (this.phone) payload.phone = this.phone;

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "24h",
  });
};

const User = mongoose.model("User", userSchema);
export default User;
