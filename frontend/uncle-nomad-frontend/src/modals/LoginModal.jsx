import {
  useState,
  useEffect,
  useRef,
  useReducer,
  useMemo,
  useCallback,
} from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { toast } from "react-hot-toast";

// For debugging and tracking reCAPTCHA verification status across sessions
const RECAPTCHA_SESSION_KEY = "recaptcha_verified";

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

// Rate limiting constants
const RATE_LIMIT_TIMEOUT = 60; // seconds

export default function LoginModal({ isOpen, onClose, onLogin }) {
  // Basic state
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [otpSendingProgress, setOtpSendingProgress] = useState(0);
  const [isOtpVerified, setIsOtpVerified] = useState(false);

  // Modal states
  const [phoneModalOpen, setPhoneModalOpen] = useState(isOpen);
  const [otpModalOpen, setOtpModalOpen] = useState(false);

  // References and other state
  const confirmationResultRef = useRef(null);
  const [cooldownTime, setCooldownTime] = useState(0);
  const [isCooldown, setIsCooldown] = useState(false);
  const cooldownTimerRef = useRef(null);
  const [verificationStatus, setVerificationStatus] = useState("not_started");
  const [developerMode, setDeveloperMode] = useState(false);

  // Add a ref for timeout tracking
  const timeoutIdRef = useRef(null);

  // Update phoneModalOpen when isOpen changes from parent
  useEffect(() => {
    setPhoneModalOpen(isOpen);
    if (isOpen && !loading) {
      setError(null);
      cleanupRecaptcha();
    }
  }, [isOpen, loading]);

  // Clean up reCAPTCHA and timers on unmount
  useEffect(() => {
    return () => {
      // Thoroughly cleanup all Firebase auth resources
      cleanupRecaptcha();
      completelyResetRecaptcha();

      // Clear any toast notifications
      toast.dismiss();

      // Clear any timers
      if (cooldownTimerRef.current) {
        clearInterval(cooldownTimerRef.current);
      }

      // Reset internal refs
      confirmationResultRef.current = null;

      // Attempt to cleanup window objects
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
          window.recaptchaVerifier = null;
        } catch (e) {
          console.log("Error during cleanup:", e);
        }
      }

      // Clear any pending timeouts
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
    };
  }, []);

  // Handle cooldown timer
  useEffect(() => {
    if (isCooldown && cooldownTime > 0) {
      cooldownTimerRef.current = setInterval(() => {
        setCooldownTime((prev) => {
          if (prev <= 1) {
            clearInterval(cooldownTimerRef.current);
            setIsCooldown(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (cooldownTimerRef.current) {
        clearInterval(cooldownTimerRef.current);
      }
    };
  }, [isCooldown, cooldownTime]);

  // When OTP is sent successfully, show OTP modal and close phone modal
  useEffect(() => {
    if (verificationStatus === "otp_sent") {
      console.log("OTP was sent successfully, showing OTP modal");

      // Delay modal switching slightly to avoid reCAPTCHA cleanup issues
      setTimeout(() => {
        setPhoneModalOpen(false);
        setOtpModalOpen(true);
      }, 50);
    }
  }, [verificationStatus]);

  // Add global error handler for reCAPTCHA errors
  useEffect(() => {
    // Capture and handle reCAPTCHA related errors globally
    const originalError = window.onerror;
    window.onerror = function (message, source, lineno, colno, error) {
      // Check if it's a reCAPTCHA error
      if (
        (source && source.includes("recaptcha")) ||
        (message && message.includes("recaptcha")) ||
        message.includes("grecaptcha")
      ) {
        console.log("Suppressed reCAPTCHA error:", message);
        return true; // Prevents default error handling
      }
      // Pass to original handler
      return originalError
        ? originalError(message, source, lineno, colno, error)
        : false;
    };

    return () => {
      // Restore original error handler
      window.onerror = originalError;
    };
  }, []);

  const formatPhoneNumber = (value) => {
    return value.replace(/\D/g, "").slice(0, 10);
  };

  const validatePhoneNumber = (number) => {
    return number.length === 10;
  };

  // Helper to safely get recaptcha badge elements
  const safeGetRecaptchaBadges = () => {
    try {
      return document.querySelectorAll(".grecaptcha-badge");
    } catch (e) {
      console.log("Error getting recaptcha badges:", e);
      return [];
    }
  };

  const cleanupRecaptcha = () => {
    try {
      // Clean up window recaptcha verifier
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (e) {
          console.log("Error clearing window recaptcha verifier:", e);
        }
        window.recaptchaVerifier = null;
      }

      // Hide badges but don't remove them - with better null checking
      try {
        const badges = safeGetRecaptchaBadges();
        if (badges && badges.length > 0) {
          badges.forEach((badge) => {
            if (badge && typeof badge === "object") {
              try {
                // Safe property access
                if (badge.style !== undefined && badge.style !== null) {
                  badge.style.visibility = "hidden";
                }
              } catch (styleError) {
                console.log("Error setting badge style:", styleError);
              }
            }
          });
        }
      } catch (badgeError) {
        console.log("Error hiding reCAPTCHA badges:", badgeError);
      }

      // Clear any pending timeouts
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
    } catch (e) {
      console.error("Error cleaning up reCAPTCHA:", e);
    }
  };

  const completelyResetRecaptcha = () => {
    try {
      // Clean up window recaptcha verifier
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (e) {
          console.log("Error clearing window recaptcha verifier:", e);
        }
        window.recaptchaVerifier = null;
      }

      // Clean up any grecaptcha artifacts
      if (window.grecaptcha && window.grecaptcha.reset) {
        try {
          window.grecaptcha.reset();
        } catch (e) {
          console.log("Error resetting grecaptcha:", e);
        }
      }

      // Remove badges with better null checking
      try {
        const badges = document.querySelectorAll(".grecaptcha-badge");
        if (badges && badges.length > 0) {
          badges.forEach((badge) => {
            if (badge && badge.parentNode) {
              try {
                badge.parentNode.removeChild(badge);
              } catch (removeError) {
                console.log("Error removing badge:", removeError);
                // Fallback to hiding if removal fails
                if (badge.style) {
                  badge.style.visibility = "hidden";
                }
              }
            }
          });
        }
      } catch (badgeError) {
        console.log("Error removing reCAPTCHA badges:", badgeError);
      }

      // Remove iframes with better null checking
      try {
        const iframes = document.querySelectorAll('iframe[src*="recaptcha"]');
        if (iframes && iframes.length > 0) {
          iframes.forEach((iframe) => {
            if (iframe && iframe.parentNode) {
              try {
                iframe.parentNode.removeChild(iframe);
              } catch (removeError) {
                console.log("Error removing iframe:", removeError);
                // Fallback to hiding if removal fails
                if (iframe.style) {
                  iframe.style.visibility = "hidden";
                }
              }
            }
          });
        }
      } catch (iframeError) {
        console.log("Error removing reCAPTCHA iframes:", iframeError);
      }

      // Clear session storage
      try {
        sessionStorage.removeItem(RECAPTCHA_SESSION_KEY);
      } catch (storageError) {
        console.log("Error clearing session storage:", storageError);
      }
    } catch (e) {
      console.error("Error completely resetting reCAPTCHA:", e);
    }
  };

  // Update the handleOtpModalClose to prevent accidental closing
  const handleOtpModalClose = useCallback((open) => {
    if (!open) {
      const shouldClose = window.confirm(
        "Are you sure you want to cancel verification? You'll need to start over."
      );
      if (shouldClose) {
        setOtpModalOpen(false);
        setPhoneModalOpen(true);
        cleanupRecaptcha();
      } else {
        // If user cancels, keep the OTP modal open
        setOtpModalOpen(true);
      }
    }
  }, []);

  // Update the handlePhoneModalClose to prevent it from showing up after wrong OTP
  const handlePhoneModalClose = useCallback(
    (open) => {
      // Only allow closing the phone modal if we're not in OTP verification
      if (!open && !otpModalOpen) {
        onClose();
      }
      setPhoneModalOpen(open);
    },
    [onClose, otpModalOpen]
  );

  const handlePhoneChange = useCallback(
    (e) => {
      const formatted = formatPhoneNumber(e.target.value);
      if (formatted !== phoneNumber) {
        setPhoneNumber(formatted);
        setError(null);
      }
    },
    [phoneNumber]
  );

  const startCooldown = () => {
    setCooldownTime(RATE_LIMIT_TIMEOUT);
    setIsCooldown(true);
  };

  // Add this new function to handle the progress animation
  const startOtpSendingAnimation = () => {
    setOtpSendingProgress(0);
    const interval = setInterval(() => {
      setOtpSendingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2;
      });
    }, 30);
    return interval;
  };

  // Direct send OTP function for developer mode
  const sendOTPDirectly = async () => {
    if (!validatePhoneNumber(phoneNumber)) {
      setError("Please enter a valid 10-digit phone number");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const fullPhoneNumber = `${countryCode}${phoneNumber}`;
      console.log("Sending OTP directly to:", fullPhoneNumber);

      if (!window.recaptchaVerifier) {
        // Create a temporary reCAPTCHA verifier
        window.recaptchaVerifier = new RecaptchaVerifier(
          auth,
          "invisible-recaptcha",
          {
            size: "invisible",
          }
        );
      }

      const confirmation = await signInWithPhoneNumber(
        auth,
        fullPhoneNumber,
        window.recaptchaVerifier
      );

      // Store confirmation result
      confirmationResultRef.current = confirmation;

      // Update UI and state
      setVerificationStatus("otp_sent");
      console.log("OTP sent via direct method, transitioning to OTP screen");
      toast.success("OTP sent successfully! Check your phone.");
    } catch (error) {
      console.error("Error sending OTP directly:", error);
      setError(`Failed to send OTP: ${error.message}`);
      toast.error("Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const sendOTP = async () => {
    if (!validatePhoneNumber(phoneNumber)) {
      setError("Please enter a valid 10-digit phone number");
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }

    if (isCooldown) {
      setError(`Please wait ${cooldownTime} seconds before trying again`);
      toast.error(`Rate limit reached. Please wait ${cooldownTime} seconds.`);
      return;
    }

    setLoading(true);
    setError(null);
    setVerificationStatus("initializing");
    const progressInterval = startOtpSendingAnimation();

    try {
      // Full phone number with country code
      const fullPhoneNumber = `${countryCode}${phoneNumber}`;
      console.log("Starting phone verification for:", fullPhoneNumber);

      // Completely reset any existing reCAPTCHA
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (e) {
          console.log("Error clearing reCAPTCHA:", e);
        }
        window.recaptchaVerifier = null;
      }

      setVerificationStatus("waiting");
      // Create new reCAPTCHA verifier with minimal configuration
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "send-otp-button",
        {
          size: "invisible",
        }
      );

      console.log("reCAPTCHA verifier created successfully");
      setVerificationStatus("verified");

      // Attempt to send verification code
      const confirmationResult = await signInWithPhoneNumber(
        auth,
        fullPhoneNumber,
        window.recaptchaVerifier
      );

      console.log("OTP sent successfully!");

      // Store confirmation result
      confirmationResultRef.current = confirmationResult;

      // Update UI state
      setVerificationStatus("otp_sent");
      toast.success("OTP sent successfully! Check your phone.");

      // Transition to OTP screen
      setPhoneModalOpen(false);
      setOtpModalOpen(true);
    } catch (error) {
      console.error("Firebase Phone Auth Error:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);

      // Handle specific error types
      if (error.code === "auth/invalid-phone-number") {
        setError("The phone number format is incorrect. Please try again.");
      } else if (error.code === "auth/captcha-check-failed") {
        setError("CAPTCHA verification failed. Please try again.");
      } else if (error.code === "auth/quota-exceeded") {
        setError("SMS quota exceeded. Please try again later.");
        startCooldown();
      } else if (error.code === "auth/too-many-requests") {
        setError("Too many requests. Please try again later.");
        startCooldown();
      } else {
        setError(`Error: ${error.message}`);
      }

      setVerificationStatus("error");
      toast.error("Failed to send OTP. Please try again.");
    } finally {
      clearInterval(progressInterval);
      setOtpSendingProgress(100);
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp || otp.length < 4) {
      setError("Please enter a valid OTP");
      toast.error("Please enter a valid OTP");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Check if we have a confirmation result
      if (!confirmationResultRef.current) {
        setError("Verification session expired. Please restart the process.");
        setOtpModalOpen(false);
        setPhoneModalOpen(true);
        return;
      }

      // Create a promise race with a timeout to handle stuck verification
      const confirmPromise = confirmationResultRef.current.confirm(otp);
      const timeoutPromise = new Promise((_, reject) => {
        timeoutIdRef.current = setTimeout(() => {
          reject(new Error("Verification timed out"));
        }, 30000);
      });

      // Race between confirmation and timeout
      const result = await Promise.race([confirmPromise, timeoutPromise]);

      // Clear the timeout if verification succeeds
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }

      toast.success("Phone verified successfully!");

      // Get user details from Firebase
      const user = result.user;

      // Complete verification
      await handlePhoneVerificationComplete(user);
    } catch (error) {
      console.error("Error verifying OTP:", error);

      // Clear the timeout if there's an error
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }

      if (error.message === "Verification timed out") {
        setError("Verification timed out. Please try again.");
        setOtp("");
      } else if (error.code === "auth/invalid-verification-code") {
        setError("Invalid verification code. Please try again.");
        setOtp("");
      } else if (error.code === "auth/code-expired") {
        setError("Verification code expired. Please request a new code.");
        setOtpModalOpen(false);
        setPhoneModalOpen(true);
      } else if (error.code === "auth/too-many-requests") {
        setError("Too many verification attempts. Please try again later.");
        startCooldown();
      } else {
        setError(error.message || "Failed to verify OTP. Please try again.");
        setOtp("");
      }

      toast.error("Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const processAuthSuccess = (data) => {
    try {
      // Store authentication data in localStorage
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("userName", data.user?.name || "");
      if (data.user?.email) {
        localStorage.setItem("userEmail", data.user.email);
      }

      // Completely reset reCAPTCHA to prevent any lingering issues
      completelyResetRecaptcha();

      // Close both modals
      setPhoneModalOpen(false);
      setOtpModalOpen(false);

      // Reset state
      setOtp("");
      setPhoneNumber("");
      setError(null);
      setLoading(false);

      // Call onLogin callback to notify parent component
      if (onLogin) {
        onLogin(data.user?.name);
      }

      // Call onClose to ensure the parent component is notified
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error("Error in processAuthSuccess:", error);
      // Still try to close everything even if there was an error
      setPhoneModalOpen(false);
      setOtpModalOpen(false);
      if (onClose) onClose();
    }
  };

  const handlePhoneVerificationComplete = async (user) => {
    try {
      // Extract user information from the Firebase user object
      const phoneNumber = user.phoneNumber;
      const uid = user.uid;

      // Register/update the user in our backend
      let retryCount = 0;
      const maxRetries = 3;
      let success = false;

      while (retryCount < maxRetries && !success) {
        try {
          // Create AbortController for timeout handling
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000); // Increased to 15 seconds

          const response = await fetch(
            `${process.env.REACT_APP_API_URL}/api/users/create-phone-user`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-api-key": process.env.REACT_APP_API_KEY || "",
              },
              body: JSON.stringify({
                phone: phoneNumber,
                firebaseUid: uid,
              }),
              signal: controller.signal,
            }
          );

          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();

          if (data.success && data.token) {
            // Store user info from backend response
            localStorage.setItem("userPhone", phoneNumber);
            localStorage.setItem("userName", data.user.name);
            localStorage.setItem("authToken", data.token);

            // Set OTP as verified
            setIsOtpVerified(true);

            // Clean up reCAPTCHA before proceeding
            cleanupRecaptcha();

            // Use the processAuthSuccess helper function to store token and user data
            processAuthSuccess(data);
            success = true;
          } else {
            throw new Error(data.message || "Failed to complete registration");
          }
        } catch (error) {
          console.error(`Attempt ${retryCount + 1} failed:`, error);
          if (error.name === "AbortError") {
            console.log("Request timed out, retrying...");
          }
          retryCount++;
          if (retryCount < maxRetries) {
            // Wait for 1 second before retrying
            await new Promise((resolve) => setTimeout(resolve, 1000));
          } else {
            throw new Error(
              "Failed to complete registration after multiple attempts"
            );
          }
        }
      }
    } catch (error) {
      console.error("Error in handlePhoneVerificationComplete:", error);
      setError("Failed to complete registration. Please try again.");
      toast.error("Registration failed. Please try again.");
      // Reset the verification state
      setIsOtpVerified(false);
      setOtpModalOpen(false);
      setPhoneModalOpen(true);
    }
  };

  // Helper to get a readable status message
  const getStatusMessage = () => {
    switch (verificationStatus) {
      case "not_started":
        return "";
      case "initializing":
        return "Initializing verification...";
      case "waiting":
        return "Waiting for verification...";
      case "verified":
        return "Verification successful! Sending OTP...";
      case "otp_sent":
        return "OTP sent successfully!";
      case "expired":
        return "Verification expired. Please try again.";
      case "error":
        return "Verification error. Please try again.";
      default:
        return "";
    }
  };

  // Get color based on status
  const getStatusColor = () => {
    switch (verificationStatus) {
      case "verified":
      case "otp_sent":
        return "text-green-600";
      case "error":
      case "expired":
        return "text-red-600";
      case "waiting":
      case "initializing":
        return "text-yellow-600";
      default:
        return "text-gray-600";
    }
  };

  // Update the phoneInputModal JSX to remove development-related content
  const phoneInputModal = useMemo(
    () => (
      <Dialog
        open={phoneModalOpen && !otpModalOpen}
        onOpenChange={handlePhoneModalClose}
        forceMount>
        <DialogContent className="max-w-md z-50">
          <DialogHeader>
            <DialogTitle>Login with Phone Number</DialogTitle>
            <DialogDescription>
              Verify your phone number to continue
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex gap-2 items-center">
              <div className="w-[30%] flex-shrink-0">
                <Select value={countryCode} onValueChange={setCountryCode}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Code" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px] overflow-y-auto">
                    {COUNTRY_CODES.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.code} ({country.country})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-[70%]">
                <Input
                  type="tel"
                  placeholder="Enter 10-digit mobile number"
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  maxLength={10}
                  className="w-full"
                />
              </div>
            </div>

            <Button
              id="send-otp-button"
              onClick={sendOTP}
              disabled={loading || !phoneNumber || isCooldown}
              className="w-full mb-2 relative overflow-hidden">
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  {verificationStatus === "initializing" && "Initializing..."}
                  {verificationStatus === "waiting" &&
                    "Waiting for verification..."}
                  {verificationStatus === "verified" && "Sending OTP..."}
                </>
              ) : isCooldown ? (
                `Retry in ${cooldownTime}s`
              ) : (
                "Send OTP"
              )}
              {loading && (
                <div
                  className="absolute bottom-0 left-0 h-1 bg-blue-500 transition-all duration-300"
                  style={{ width: `${otpSendingProgress}%` }}
                />
              )}
            </Button>

            {/* Only show status message if there's an actual status to show */}
            {verificationStatus !== "not_started" && (
              <div className="text-center mb-2">
                <p className={`text-sm font-medium ${getStatusColor()}`}>
                  {getStatusMessage()}
                </p>
              </div>
            )}

            {/* Invisible element for reCAPTCHA */}
            <div id="invisible-recaptcha" style={{ display: "none" }}></div>

            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    ),
    [
      phoneModalOpen,
      otpModalOpen,
      handlePhoneModalClose,
      countryCode,
      phoneNumber,
      sendOTP,
      loading,
      isCooldown,
      cooldownTime,
      getStatusColor,
      getStatusMessage,
      verificationStatus,
      error,
      handlePhoneChange,
      otpSendingProgress,
    ]
  );

  const otpVerificationModal = useMemo(
    () => (
      <Dialog open={otpModalOpen} onOpenChange={handleOtpModalClose} forceMount>
        <DialogContent className="max-w-md z-50">
          <DialogHeader>
            <DialogTitle>Verify OTP</DialogTitle>
            <DialogDescription>
              Enter the verification code sent to your phone
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="text-center mb-2 text-sm text-gray-600">
              We've sent a verification code to {countryCode} {phoneNumber}
            </div>

            <Input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="text-center text-xl letter-spacing-wide"
              autoFocus
            />

            <Button
              onClick={verifyOtp}
              disabled={loading || !otp}
              className="w-full">
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Verifying...
                </>
              ) : (
                "Verify OTP"
              )}
            </Button>
            <div className="text-center">
              <Button
                variant="link"
                onClick={() => {
                  setOtp("");
                  setOtpModalOpen(false);
                  setPhoneModalOpen(true);
                  cleanupRecaptcha();
                }}
                className="text-sm">
                Change phone number
              </Button>
            </div>

            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    ),
    [
      otpModalOpen,
      handleOtpModalClose,
      countryCode,
      phoneNumber,
      otp,
      setOtp,
      verifyOtp,
      loading,
      error,
    ]
  );

  // Add timeout handling for OTP verification
  useEffect(() => {
    let timeoutId;
    if (otpModalOpen && !isOtpVerified) {
      // Set a 5-minute timeout for OTP verification
      timeoutId = setTimeout(() => {
        setError("OTP verification timed out. Please request a new code.");
        setOtpModalOpen(false);
        setPhoneModalOpen(true);
        cleanupRecaptcha();
      }, 5 * 60 * 1000); // 5 minutes
    }
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [otpModalOpen, isOtpVerified]);

  return (
    <>
      {phoneInputModal}
      {otpVerificationModal}
    </>
  );
}
