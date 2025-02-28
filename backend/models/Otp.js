import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true, index: { expires: "5m" } }, // Automatically delete after 5 minutes
});

const Otp = mongoose.model("Otp", otpSchema);
export default Otp;
