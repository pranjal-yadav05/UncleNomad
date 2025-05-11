import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Loader2 } from "lucide-react";
import { auth } from "../firebaseConfig";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

const COUNTRY_CODES = [
  { code: "+91", country: "India" },
  { code: "+1", country: "USA/Canada" },
  { code: "+44", country: "UK" },
  { code: "+61", country: "Australia" },
  { code: "+971", country: "UAE" },
  { code: "+65", country: "Singapore" },
  { code: "+86", country: "China" },
  { code: "+81", country: "Japan" },
  { code: "+82", country: "South Korea" },
  { code: "+49", country: "Germany" },
];

export default function LoginModal({ isOpen, onClose, onLogin }) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState(null);
  const recaptchaContainerRef = useRef(null);
  const [isRecaptchaReady, setIsRecaptchaReady] = useState(false);

  const formatPhoneNumber = (value) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, "");

    // Limit to 10 digits
    return digits.slice(0, 10);
  };

  const validatePhoneNumber = (number) => {
    // Check if the number has exactly 10 digits
    return number.length === 10;
  };

  useEffect(() => {
    let verifier = null;

    const initializeRecaptcha = () => {
      if (!recaptchaContainerRef.current) return;

      try {
        // Clear any existing reCAPTCHA
        if (recaptchaVerifier) {
          recaptchaVerifier.clear();
        }

        // Create new reCAPTCHA verifier
        verifier = new RecaptchaVerifier(auth, "recaptcha-container", {
          size: "normal",
          callback: (response) => {
            console.log("reCAPTCHA verified:", response);
            setIsRecaptchaReady(true);
            setError(null);
          },
          "expired-callback": () => {
            console.log("reCAPTCHA expired");
            setIsRecaptchaReady(false);
            setRecaptchaVerifier(null);
            setError("reCAPTCHA expired. Please verify again.");
          },
        });

        // Render the reCAPTCHA
        verifier.render().then(() => {
          console.log("reCAPTCHA rendered");
          setRecaptchaVerifier(verifier);
        });
      } catch (error) {
        console.error("reCAPTCHA initialization error:", error);
        setError("Failed to initialize reCAPTCHA. Please try again.");
        setIsRecaptchaReady(false);
      }
    };

    if (isOpen) {
      // Reset states when modal opens
      setIsRecaptchaReady(false);
      setError(null);

      // Initialize reCAPTCHA after a short delay
      const timer = setTimeout(initializeRecaptcha, 500);

      return () => {
        clearTimeout(timer);
        if (verifier) {
          verifier.clear();
        }
      };
    }
  }, [isOpen]);

  const handlePhoneChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
    setError(null);
  };

  const sendOtp = async () => {
    if (!recaptchaVerifier) {
      setError("Please wait for reCAPTCHA to initialize");
      return;
    }

    if (!isRecaptchaReady) {
      setError("Please complete the reCAPTCHA verification");
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      setError("Please enter a valid 10-digit phone number");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const fullPhoneNumber = `${countryCode}${phoneNumber}`;
      const confirmationResult = await signInWithPhoneNumber(
        auth,
        fullPhoneNumber,
        recaptchaVerifier
      );
      window.confirmationResult = confirmationResult;
      setIsOtpSent(true);
    } catch (error) {
      console.error("OTP Error:", error);
      setError(error.message || "Failed to send OTP");
      // Reset reCAPTCHA on error
      if (recaptchaVerifier) {
        recaptchaVerifier.clear();
        setRecaptchaVerifier(null);
        setIsRecaptchaReady(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await window.confirmationResult.confirm(otp);
      const user = result.user;

      // Store user info
      localStorage.setItem("authToken", user.accessToken);
      localStorage.setItem("userPhone", user.phoneNumber);

      // Notify header to update
      window.dispatchEvent(new Event("storage"));

      onLogin();
      onClose();
    } catch (error) {
      console.error("Verification Error:", error);
      setError(error.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Login with Phone Number</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!isOtpSent ? (
            <>
              <div className="flex gap-2">
                <Select value={countryCode} onValueChange={setCountryCode}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Code" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRY_CODES.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.code} ({country.country})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="tel"
                  placeholder="Enter 10-digit mobile number"
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  maxLength={10}
                  className="flex-1"
                />
              </div>
              <div
                id="recaptcha-container"
                ref={recaptchaContainerRef}
                className="flex justify-center my-4"
                style={{
                  position: "relative",
                  zIndex: 1000,
                  minHeight: "78px",
                  width: "100%",
                }}></div>
              <Button
                onClick={sendOtp}
                disabled={loading || !phoneNumber || !isRecaptchaReady}
                className="w-full">
                {loading ? (
                  <Loader2 className="animate-spin h-4 w-4" />
                ) : (
                  "Send OTP"
                )}
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
              <Button
                onClick={verifyOtp}
                disabled={loading || !otp}
                className="w-full">
                {loading ? (
                  <Loader2 className="animate-spin h-4 w-4" />
                ) : (
                  "Verify OTP"
                )}
              </Button>
            </>
          )}

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
