import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Loader2 } from "lucide-react";

export default function LoginModal({ isOpen, onClose, onLogin }) {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpError, setOtpError] = useState(null);

  const sendOtp = async () => {
    setLoading(true);
    setOtpError(null);

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json", 'x-api-key': process.env.REACT_APP_API_KEY },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to send OTP");
      }

      setIsOtpSent(true);
    } catch (error) {
      setOtpError(error.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setLoading(true);
    setOtpError(null);

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key" : process.env.REACT_APP_API_KEY },
        body: JSON.stringify({ email, otp }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Invalid OTP");
      }

      const data = await response.json();

      // Store JWT and user info
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("userName", data.user.name);
      localStorage.setItem("userEmail", data.user.email);

      // Notify header to update
      window.dispatchEvent(new Event("storage"));

      setIsOtpVerified(true);
      onLogin();
      onClose();
    } catch (error) {
      setOtpError(error.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Login with Email OTP</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!isOtpSent ? (
            <>
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button onClick={sendOtp} disabled={loading || !email}>
                {loading ? <Loader2 className="animate-spin h-4 w-4" /> : "Send OTP"}
              </Button>
            </>
          ) : (
            <>
              <Input
                type="text"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
              <Button onClick={verifyOtp} disabled={loading || !otp}>
                {loading ? <Loader2 className="animate-spin h-4 w-4" /> : "Verify OTP"}
              </Button>
            </>
          )}

          {otpError && <p className="text-red-500 text-sm">{otpError}</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
