// models/User.js
import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: false,
    trim: true,
    lowercase: true,
    sparse: true, // This allows null values to be stored without triggering unique constraint
    unique: true,
  },
  name: {
    type: String,
    trim: true,
  },
  phone: {
    type: String,
    trim: true,
    unique: true,
    required: true, // Phone is now always required
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

// Drop and recreate indexes on model initialization
userSchema.pre("save", async function (next) {
  try {
    // Drop existing indexes
    await this.constructor.collection.dropIndexes();

    // Create new indexes with correct options
    await this.constructor.collection.createIndex(
      { email: 1 },
      {
        unique: true,
        sparse: true,
      }
    );
    await this.constructor.collection.createIndex(
      { phone: 1 },
      {
        unique: true,
      }
    );

    next();
  } catch (error) {
    // If indexes already exist or other error, continue
    next();
  }
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
