"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  CalendarDaysIcon,
  UserIcon,
  ArrowLeftIcon,
  CreditCardIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import Header from "../components/Header";
import Footer from "../components/Footer";
import DisclaimerDialog from "../modals/DisclaimerDialog";
import { Loader2, CheckCircle } from "lucide-react";
import PaytmPaymentForm from "../components/RazorpayPaymentForm";
import CheckingPaymentModal from "../modals/CheckingPaymentModal";
import FailedTransactionModal from "../modals/FailedTransactionModal";
import BookingConfirmationDialog from "../modals/BookingConfirmationDialog";
import AnimatedSection from "../components/AnimatedSection";
import BookingFailedDialog from "../modals/BookingFailedDialog";
import { toast } from "react-hot-toast";
import { auth } from "../firebaseConfig";
import { signInWithPhoneNumber } from "firebase/auth";
import { RecaptchaVerifier } from "firebase/auth";

const RoomBookingPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Get data from location state
  const { bookingForm: initialBookingForm, availableRooms } =
    location.state || {};

  // Redirect if no booking data
  useEffect(() => {
    if (!initialBookingForm || !availableRooms) {
      navigate("/");
    }
  }, [initialBookingForm, availableRooms, navigate]);

  const [bookingForm, setBookingForm] = useState(initialBookingForm || {});
  const [step, setStep] = useState(1); // Start with guest details
  const [validationErrors, setValidationErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showError, setShowError] = useState(true);
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [isPaymentActive, setIsPaymentActive] = useState(false);
  const [isBookingConfirmed, setIsBookingConfirmed] = useState(false);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [isBookingFailed, setIsBookingFailed] = useState(false);
  const [checking, setChecking] = useState(false);
  const [isFailedModalOpen, setIsFailedModalOpen] = useState(false);

  // OTP related states
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpResendTimer, setOtpResendTimer] = useState(0);
  const [confirmationResultRef, setConfirmationResultRef] = useState(null);
  const [countryCode, setCountryCode] = useState("+91"); // Default to India

  // Refs for scrolling
  const guestDetailsRef = useRef(null);
  const bookingSummaryRef = useRef(null);
  const paymentSectionRef = useRef(null);

  useEffect(() => {
    if (isPaymentActive) {
      // Prevent scrolling
      document.body.style.overflow = "hidden";
      // Store current scroll position
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
    } else {
      // Restore scrolling
      const scrollY = document.body.style.top;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.overflow = "";
      document.body.style.width = "";
      if (scrollY) {
        window.scrollTo(0, Number.parseInt(scrollY || "0", 10) * -1);
      }
    }

    return () => {
      // Cleanup - ensure scrolling is restored when component unmounts
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.overflow = "";
      document.body.style.width = "";
    };
  }, [isPaymentActive]);

  // Timer for OTP resend countdown
  useEffect(() => {
    let timer;
    if (otpResendTimer > 0) {
      timer = setTimeout(() => setOtpResendTimer(otpResendTimer - 1), 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [otpResendTimer]);

  useEffect(() => {
    window.scrollTo(0, 0);

    const authToken = localStorage.getItem("authToken");
    const storedUserName = localStorage.getItem("userName");
    const storedUserPhone = localStorage.getItem("userPhone");

    if (authToken) {
      setBookingForm((prev) => ({
        ...prev,
        guestName: storedUserName || "",
        phone: storedUserPhone || "",
      }));

      // Skip OTP verification for logged-in users
      setIsOtpVerified(true);
    }
  }, []);

  // Effect to prevent back navigation after booking confirmation
  useEffect(() => {
    if (isBookingConfirmed) {
      // Push a new state and prevent back navigation
      window.history.pushState(null, null, window.location.href);
      window.onpopstate = () => {
        navigate("/", { replace: true }); // Redirect to home page if they try to go back
      };
    }
  }, [isBookingConfirmed, navigate]);

  // Calculate total room capacity
  const calculateTotalCapacity = () => {
    return availableRooms.reduce((sum, room) => {
      const isDorm = room.type.toLowerCase() === "dorm";
      const currentCount = bookingForm.selectedRooms[room._id] || 0;
      return sum + (isDorm ? currentCount : room.capacity * currentCount);
    }, 0);
  };

  const totalCapacity = calculateTotalCapacity();

  // Format dates
  const formatDate = (dateString) => {
    if (!dateString) return "Select dates";
    return format(new Date(dateString), "PPP");
  };

  // Calculate number of nights
  const calculateNights = () => {
    if (!bookingForm.checkIn || !bookingForm.checkOut) return 0;
    const checkInDate = new Date(bookingForm.checkIn);
    const checkOutDate = new Date(bookingForm.checkOut);
    const diffTime = Math.abs(checkOutDate - checkInDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Calculate total price
  const calculateTotalPrice = () => {
    const nights = calculateNights();
    return availableRooms.reduce((sum, room) => {
      const count = bookingForm.selectedRooms[room._id] || 0;
      return sum + room.price * count * nights;
    }, 0);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBookingForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (validationErrors[name]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validatePhone = useCallback((phone) => {
    const re = /^[0-9]{10}$/;
    return re.test(String(phone));
  }, []);

  const handleNumberChange = (e) => {
    const { name, value } = e.target;

    // Format phone number to only allow digits and limit to 10 digits
    const formattedPhone = value.replace(/\D/g, "").slice(0, 10);
    setBookingForm((prev) => ({ ...prev, [name]: formattedPhone }));

    // Reset OTP verification when phone changes
    if (isOtpSent || isOtpVerified) {
      setIsOtpSent(false);
      setIsOtpVerified(false);
      setOtp("");
      setOtpError(null);
    }

    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const sendOtp = async (e) => {
    e.preventDefault();

    // Skip OTP process if user is already logged in
    const authToken = localStorage.getItem("authToken");
    if (authToken) {
      console.log("User is already logged in, skipping OTP");
      setIsOtpVerified(true);
      return;
    }

    // Validate phone before sending OTP
    if (!validatePhone(bookingForm.phone)) {
      setOtpError("Please enter a valid 10-digit phone number");
      return;
    }

    setIsSendingOtp(true);
    setOtpError(null);

    try {
      if (!window.recaptchaVerifier) {
        throw new Error("reCAPTCHA not initialized. Please reload the page.");
      }

      const phoneNumber = `${countryCode}${bookingForm.phone}`;
      const appVerifier = window.recaptchaVerifier;

      // Request OTP via Firebase phone authentication
      const confirmationResult = await signInWithPhoneNumber(
        auth,
        phoneNumber,
        appVerifier
      );
      setConfirmationResultRef(confirmationResult);
      setIsOtpSent(true);
      setOtpResendTimer(60); // 60 seconds countdown for resend
      toast.success("OTP sent successfully. Please check your phone.");
    } catch (error) {
      console.error("Error sending OTP:", error);

      // Handle specific error types
      if (error.code === "auth/invalid-phone-number") {
        setOtpError("The phone number format is incorrect. Please try again.");
      } else if (error.code === "auth/captcha-check-failed") {
        setOtpError("CAPTCHA verification failed. Please try again.");
      } else if (error.code === "auth/quota-exceeded") {
        setOtpError("SMS quota exceeded. Please try again later.");
      } else if (error.code === "auth/too-many-requests") {
        setOtpError("Too many requests. Please try again later.");
      } else {
        setOtpError(`Error: ${error.message}`);
      }

      toast.error("Failed to send OTP. Please try again.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();

    if (!otp || otp.length < 4) {
      setOtpError("Please enter a valid OTP");
      toast.error("Please enter a valid OTP");
      return;
    }

    setIsVerifyingOtp(true);
    setOtpError(null);

    try {
      // Check if we have a confirmation result
      if (!confirmationResultRef) {
        setOtpError(
          "Verification session expired. Please restart the process."
        );
        setIsOtpSent(false);
        return;
      }

      // Create a promise race with a timeout to handle stuck verification
      const confirmPromise = confirmationResultRef.confirm(otp);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Verification timed out")), 15000)
      );

      // Race between confirmation and timeout
      const result = await Promise.race([confirmPromise, timeoutPromise]);

      toast.success("Phone verified successfully!");

      // Get user details from Firebase
      const user = result.user;
      const phoneNumber = user.phoneNumber;
      const displayName = user.displayName || bookingForm.guestName || "User";

      // Store user info
      localStorage.setItem("userPhone", phoneNumber);
      localStorage.setItem("userName", displayName);

      // Register/update the user in our backend
      try {
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
              name: displayName,
              firebaseUid: user.uid,
            }),
          }
        );

        const data = await response.json();

        if (data.success && data.token) {
          // Store the auth token in localStorage
          localStorage.setItem("authToken", data.token);
          localStorage.setItem("userName", data.user.name);
          localStorage.setItem("userPhone", data.user.phone);

          await new Promise((resolve) => setTimeout(resolve, 100));

          window.dispatchEvent(new Event("storage"));
          setIsOtpVerified(true);
        } else {
          throw new Error("Failed to complete registration");
        }
      } catch (error) {
        throw new Error("Server error: " + error.message);
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);

      if (error.message === "Verification timed out") {
        setOtpError("Verification timed out. Please try again.");
      } else if (error.code === "auth/invalid-verification-code") {
        setOtpError("Invalid verification code. Please try again.");
      } else if (error.code === "auth/code-expired") {
        setOtpError("Verification code expired. Please request a new code.");
        setIsOtpSent(false);
      } else if (error.code === "auth/too-many-requests") {
        setOtpError("Too many verification attempts. Please try again later.");
      } else {
        setOtpError(error.message || "Failed to verify OTP. Please try again.");
      }

      toast.error("Verification failed. Please try again.");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleLogout = () => {
    // Remove authentication data
    localStorage.removeItem("authToken");
    localStorage.removeItem("userName");
    localStorage.removeItem("userPhone");

    // Dispatch storage event to sync across tabs
    window.dispatchEvent(new Event("storage"));

    // Redirect user (optional)
    navigate("/"); // Redirect to home (change if needed)

    // Update UI state
    setIsOtpVerified(false);
    setBookingForm((prev) => ({
      ...prev,
      guestName: "",
      phone: "",
    }));
  };

  const validateToken = async () => {
    const authToken = localStorage.getItem("authToken");

    if (!authToken) return;

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/token/validate-token`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
            "x-api-key": process.env.REACT_APP_API_KEY,
          },
        }
      );

      if (!response.ok) {
        console.warn("Token validation failed");
        handleLogout();
      }
    } catch (error) {
      console.error("Error validating token:", error);
      handleLogout();
    }
  };

  // Generate summary text for verification status
  const getVerificationStatus = () => {
    if (isOtpVerified)
      return (
        <span className="text-green-500 flex items-center text-sm">
          ✓ Phone verified
        </span>
      );
    if (isOtpSent)
      return (
        <span className="text-amber-500 flex items-center text-sm">
          OTP sent to your phone
        </span>
      );
    return null;
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setBookingForm((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const validateStep1 = () => {
    const errors = {};
    if (!bookingForm.guestName.trim()) {
      errors.guestName = "Full name is required";
    }

    // If the phone is already verified, we don't need to validate its format
    if (!isOtpVerified) {
      // Only validate phone format if not yet verified
      if (!validatePhone(bookingForm.phone)) {
        errors.phone = "Please enter a valid 10-digit phone number";
      } else {
        // Phone format is valid but not verified yet
        errors.phone = "Phone verification is required before proceeding";
      }
    }
    // If phone is already verified, no error needed

    setValidationErrors(errors);
    return Object.keys(errors).length === 0; // Return true if no errors
  };

  const validateStep2 = () => {
    const errors = {};

    if (
      !bookingForm.numberOfGuests ||
      isNaN(bookingForm.numberOfGuests) ||
      bookingForm.numberOfGuests < 1
    ) {
      errors.numberOfGuests = "At least 1 guest is required.";
    } else if (bookingForm.numberOfGuests > totalCapacity) {
      errors.numberOfGuests = `Maximum capacity is ${totalCapacity} guests for selected rooms.`;
    }

    // Phone verification is already handled by the button being disabled if not verified

    setValidationErrors(errors);
    return Object.keys(errors).length === 0; // Return true if no errors
  };

  const handleDisclaimer = () => {
    if (!validateStep2()) {
      return; // Stop here if validation fails
    }

    setIsDisclaimerOpen(true); // Open disclaimer modal
  };

  const handlePaymentInitiation = async () => {
    try {
      setIsLoading(true);

      const authToken = localStorage.getItem("authToken");
      if (!authToken) {
        throw new Error("You must verify your phone before proceeding");
      }

      // Calculate total amount
      const totalAmount = calculateTotalPrice();

      // Prepare booking data
      const bookingData = {
        ...bookingForm,
        totalAmount,
        rooms: Object.entries(bookingForm.selectedRooms).map(
          ([roomId, quantity]) => ({
            roomId,
            quantity,
            checkIn: bookingForm.checkIn,
            checkOut: bookingForm.checkOut,
          })
        ),
      };

      setBookingForm(bookingData);

      const paymentResponse = await fetch(
        `${process.env.REACT_APP_API_URL}/api/payments/initiate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.REACT_APP_API_KEY,
            Authorization: `Bearer ${authToken}`,
          },
          credentials: "include", // Include cookies for session
          body: JSON.stringify({
            bookingData: bookingData,
            amount: totalAmount,
            customerId: bookingForm.phone,
            phone: bookingForm.phone,
          }),
        }
      );

      if (!paymentResponse.ok) {
        console.error(
          "Payment initiation failed with status:",
          paymentResponse.status
        );
        let errorData;
        try {
          errorData = await paymentResponse.json();
          console.error("Payment error details:", errorData);
        } catch (jsonError) {
          console.error("Failed to parse error response:", jsonError);
          throw new Error(
            "Failed to initialize payment: Invalid server response"
          );
        }
        throw new Error(errorData.message || "Failed to initialize payment");
      }

      const paymentData = await paymentResponse.json();

      if (paymentData.status === "SUCCESS" && paymentData.data) {
        setPaymentData(paymentData.data);
        setIsPaymentActive(true);
        setStep(3); // Move to payment step

        // Scroll to payment section
        if (paymentSectionRef.current) {
          setTimeout(() => {
            paymentSectionRef.current.scrollIntoView({ behavior: "smooth" });
          }, 100);
        }
      } else {
        throw new Error("Payment initialization failed");
      }
    } catch (error) {
      console.error("Booking/Payment Error:", error);
      setError("Failed to process booking: " + error.message);
      setIsFailedModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = (response) => {
    setIsPaymentActive(false);
    setIsBookingConfirmed(true);
  };

  const handlePaymentFailure = (errorMsg) => {
    setError(errorMsg);
    setIsBookingFailed(true);
    setIsFailedModalOpen(true);
    setIsPaymentActive(false);
  };

  // Go back to room selection
  const handleBackToRoomSelection = () => {
    navigate(-1);
  };

  // Progress to next step
  const handleNextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  // Go back to previous step
  const handlePreviousStep = () => {
    if (step === 2) {
      setStep(1);
    } else if (step === 3) {
      setStep(2);
    }
  };

  // Initialize reCAPTCHA for phone verification
  useEffect(() => {
    let recaptchaVerifier;

    // Skip reCAPTCHA setup if user is already logged in
    const authToken = localStorage.getItem("authToken");
    if (authToken) {
      console.log("User already logged in, skipping reCAPTCHA setup");
      return;
    }

    const setupRecaptcha = () => {
      try {
        // Clean up any existing recaptchaVerifier
        if (window.recaptchaVerifier) {
          // In Firebase v9 we just need to remove references
          window.recaptchaVerifier = null;
        }

        // Create the reCAPTCHA verifier using Firebase v9 syntax
        window.recaptchaVerifier = new RecaptchaVerifier(
          auth,
          "recaptcha-container",
          {
            size: "normal",
            callback: () => {
              console.log("reCAPTCHA solved");
            },
            "expired-callback": () => {
              console.log("reCAPTCHA expired");
              toast.error("CAPTCHA expired. Please try again.");
            },
          }
        );

        recaptchaVerifier = window.recaptchaVerifier;
      } catch (error) {
        console.error("Error setting up reCAPTCHA:", error);
      }
    };

    // Only set up reCAPTCHA when on step 1 and not verified
    if (step === 1 && !isOtpVerified) {
      setupRecaptcha();
    }

    return () => {
      // Clean up on unmount
      if (recaptchaVerifier) {
        try {
          // No need to explicitly clear in Firebase v9
          // The recaptchaVerifier will be garbage collected
          recaptchaVerifier = null;
          window.recaptchaVerifier = null;
        } catch (e) {
          console.log("Error clearing recaptcha on unmount:", e);
        }
      }
    };
  }, [step, isOtpVerified]);

  // Effect to validate numberOfGuests when rooms change
  useEffect(() => {
    const currentGuests = bookingForm.numberOfGuests;
    if (currentGuests > totalCapacity) {
      setValidationErrors((prev) => ({
        ...prev,
        numberOfGuests: `Maximum capacity is ${totalCapacity} guests for selected rooms`,
      }));

      setBookingForm((prev) => ({
        ...prev,
        numberOfGuests: totalCapacity,
      }));

      // Remove error when auto-adjusted
      setTimeout(() => {
        setValidationErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.numberOfGuests;
          return newErrors;
        });
      }, 500);
    }
  }, [bookingForm.numberOfGuests, totalCapacity]);

  if (!initialBookingForm || !availableRooms) {
    return null; // Don't render anything while redirecting
  }

  return (
    <AnimatedSection animation="fade-in" duration={800}>
      <Header />

      {/* Hero Section */}
      <div className="relative bg-blue-900 py-12">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-800 to-indigo-900 opacity-90"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center text-white">
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              Complete Your Booking
            </h1>
            <p className="text-lg opacity-80 max-w-2xl mx-auto">
              Just a few more details to confirm your stay from{" "}
              {formatDate(bookingForm.checkIn)} to{" "}
              {formatDate(bookingForm.checkOut)}
            </p>
          </div>
        </div>
      </div>

      {/* Booking Progress */}
      <div className="bg-gray-50 py-4 border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            <button
              onClick={handleBackToRoomSelection}
              className="flex items-center text-blue-600 hover:text-blue-800 transition-colors">
              <ArrowLeftIcon className="w-4 h-4 mr-1" />
              <span>Back to Room Selection</span>
            </button>

            <div className="hidden md:flex items-center">
              <div
                className={`flex flex-col items-center ${
                  step >= 1 ? "text-blue-600" : "text-gray-400"
                }`}>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                    step >= 1 ? "bg-blue-600 text-white" : "bg-gray-200"
                  }`}>
                  <UserCircleIcon className="w-4 h-4" />
                </div>
                <span className="text-xs">Guest Details</span>
              </div>

              <div
                className={`w-12 h-0.5 ${
                  step >= 2 ? "bg-blue-600" : "bg-gray-200"
                }`}></div>

              <div
                className={`flex flex-col items-center ${
                  step >= 2 ? "text-blue-600" : "text-gray-400"
                }`}>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                    step >= 2 ? "bg-blue-600 text-white" : "bg-gray-200"
                  }`}>
                  <UserIcon className="w-4 h-4" />
                </div>
                <span className="text-xs">Stay Details</span>
              </div>

              <div
                className={`w-12 h-0.5 ${
                  step >= 3 ? "bg-blue-600" : "bg-gray-200"
                }`}></div>

              <div
                className={`flex flex-col items-center ${
                  step >= 3 ? "text-blue-600" : "text-gray-400"
                }`}>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                    step >= 3 ? "bg-blue-600 text-white" : "bg-gray-200"
                  }`}>
                  <CreditCardIcon className="w-4 h-4" />
                </div>
                <span className="text-xs">Payment</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main Content */}
            <div className="w-full lg:w-2/3 order-2 lg:order-1">
              {/* Guest Details Section */}
              <div
                ref={guestDetailsRef}
                className={`bg-white rounded-lg shadow-md p-6 mb-6 ${
                  step !== 1 ? "opacity-70" : ""
                }`}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Guest Details</h2>
                  {step !== 1 && (
                    <Button
                      onClick={() => setStep(1)}
                      variant="outline"
                      size="sm">
                      Edit
                    </Button>
                  )}
                </div>

                {step === 1 ? (
                  <div className="space-y-4">
                    {localStorage.getItem("authToken") && (
                      <div className="p-3 mb-4 text-sm text-green-700 bg-green-100 rounded-md border border-green-300">
                        <p>
                          ✅ Your details are pre-filled from your profile.
                          You can update your profile from Profile page.
                        </p>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="guestName">Full Name</Label>
                      <Input
                        id="guestName"
                        name="guestName"
                        value={bookingForm.guestName}
                        onChange={handleInputChange}
                        required
                        readOnly={!!localStorage.getItem("authToken")} // Make read-only if logged in
                        className={`bg-gray-100 ${
                          validationErrors.guestName ? "border-red-500" : ""
                        }`}
                      />
                      {validationErrors.guestName && (
                        <p className="text-sm text-red-500">
                          {validationErrors.guestName}
                        </p>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <div className="flex gap-2">
                          <div className="flex">
                            <select
                              className="px-2 py-2 border border-gray-300 rounded-l-md bg-gray-50"
                              value={countryCode}
                              onChange={(e) => setCountryCode(e.target.value)}
                              disabled={isOtpSent}>
                              <option value="+91">+91</option>
                              <option value="+1">+1</option>
                              <option value="+44">+44</option>
                              <option value="+61">+61</option>
                              <option value="+971">+971</option>
                            </select>
                            <Input
                              id="phone"
                              name="phone"
                              type="tel"
                              value={bookingForm.phone}
                              onChange={handleNumberChange}
                              required
                              readOnly={!!localStorage.getItem("authToken")} // Make read-only if logged in
                              className={`rounded-l-none ${
                                validationErrors.phone ? "border-red-500" : ""
                              }`}
                              placeholder="10-digit number"
                            />
                          </div>
                          {!localStorage.getItem("authToken") && (
                            <Button
                              type="button"
                              onClick={sendOtp}
                              disabled={
                                !validatePhone(bookingForm.phone) ||
                                isSendingOtp ||
                                isOtpVerified ||
                                otpResendTimer > 0
                              }
                              className="whitespace-nowrap">
                              {isSendingOtp ? (
                                <div className="flex items-center">
                                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                                  <span className="text-xs">Sending...</span>
                                </div>
                              ) : isOtpVerified ? (
                                "Verified"
                              ) : isOtpSent && otpResendTimer > 0 ? (
                                `Resend (${otpResendTimer}s)`
                              ) : isOtpSent ? (
                                "Resend OTP"
                              ) : (
                                "Send OTP"
                              )}
                            </Button>
                          )}
                        </div>
                        {validationErrors.phone && (
                          <p className="text-sm text-red-500">
                            {validationErrors.phone}
                          </p>
                        )}
                        {getVerificationStatus()}
                      </div>

                      {/* reCAPTCHA container */}
                      {!localStorage.getItem("authToken") && !isOtpVerified && (
                        <div className="my-4">
                          <div
                            id="recaptcha-container"
                            className="flex justify-center"></div>
                        </div>
                      )}

                      {/* OTP field */}
                      {!localStorage.getItem("authToken") &&
                        isOtpSent &&
                        !isOtpVerified && (
                          <div className="bg-gray-50 p-3 rounded-lg space-y-3">
                            <div className="text-sm text-gray-700">
                              Enter the verification code sent to{" "}
                              <span className="font-medium">
                                {countryCode + bookingForm.phone}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <Input
                                id="otp"
                                type="text"
                                required
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                className="w-full border-gray-200 focus:ring-2 focus:ring-blue-600"
                                placeholder="Enter OTP"
                                maxLength={6}
                                disabled={isVerifyingOtp}
                              />
                              <Button
                                type="button"
                                onClick={verifyOtp}
                                disabled={!otp.trim() || isVerifyingOtp}>
                                {isVerifyingOtp ? (
                                  <div className="flex items-center">
                                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                                    <span>Verifying...</span>
                                  </div>
                                ) : (
                                  "Verify"
                                )}
                              </Button>
                            </div>
                            {otpError && (
                              <p className="text-red-500 text-sm">{otpError}</p>
                            )}
                          </div>
                        )}
                    </div>

                    <div className="pt-4">
                      <Button
                        variant="nomad"
                        onClick={handleNextStep}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        disabled={
                          !bookingForm.guestName ||
                          !bookingForm.phone ||
                          !isOtpVerified
                        }>
                        Continue to Stay Details
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <CheckCircle className="text-green-500 w-5 h-5 mr-2" />
                      <div>
                        <p className="font-medium">{bookingForm.guestName}</p>
                        <p className="text-sm text-gray-500">
                          {bookingForm.phone}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Stay Details Section */}
              <div
                ref={bookingSummaryRef}
                className={`bg-white rounded-lg shadow-md p-6 mb-6 ${
                  step !== 2 ? "opacity-70" : ""
                }`}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Stay Details</h2>
                  {step !== 2 && step > 2 && (
                    <Button
                      onClick={() => setStep(2)}
                      variant="outline"
                      size="sm">
                      Edit
                    </Button>
                  )}
                </div>

                {step === 2 ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="numberOfGuests">Number of Guests *</Label>
                      <div className="flex items-center">
                        <Input
                          id="numberOfGuests"
                          name="numberOfGuests"
                          type="number"
                          min="1"
                          max={totalCapacity}
                          value={bookingForm.numberOfGuests}
                          onChange={handleNumberChange}
                          required
                          className={
                            validationErrors.numberOfGuests
                              ? "border-red-500"
                              : ""
                          }
                        />
                        <span className="ml-2 text-xs text-gray-500">
                          Max: {totalCapacity}
                        </span>
                      </div>
                      {validationErrors.numberOfGuests && (
                        <p className="text-sm text-red-500 mt-1">
                          {validationErrors.numberOfGuests}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="numberOfChildren">
                        Number of Children
                      </Label>
                      <Input
                        id="numberOfChildren"
                        name="numberOfChildren"
                        type="number"
                        min="0"
                        value={bookingForm.numberOfChildren}
                        onChange={handleNumberChange}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="extraBeds">Extra Beds</Label>
                      <Input
                        id="extraBeds"
                        name="extraBeds"
                        type="number"
                        min="0"
                        value={bookingForm.extraBeds}
                        onChange={handleNumberChange}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        id="mealIncluded"
                        name="mealIncluded"
                        type="checkbox"
                        checked={bookingForm.mealIncluded}
                        onChange={handleCheckboxChange}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                      />
                      <Label htmlFor="mealIncluded">Include Meals</Label>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="specialRequests">Special Requests</Label>
                      <textarea
                        id="specialRequests"
                        name="specialRequests"
                        value={bookingForm.specialRequests}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded-md"
                        rows={3}
                      />
                    </div>

                    {validationErrors.otp && (
                      <div className="p-3 mb-4 text-sm text-red-500 bg-red-50 rounded-md border border-red-200">
                        <div>{validationErrors.otp}</div>
                      </div>
                    )}

                    {error && showError && (
                      <div className="p-3 mb-4 text-sm text-red-500 bg-red-50 rounded-md border border-red-200">
                        <div className="font-medium">Booking Error</div>
                        <div>{error}</div>
                        <button
                          onClick={() => setShowError(false)}
                          className="mt-2 text-sm text-red-600 underline hover:text-red-700">
                          Dismiss
                        </button>
                      </div>
                    )}

                    <div className="flex gap-2 pt-4">
                      <Button
                        onClick={handlePreviousStep}
                        variant="outline"
                        className="w-full">
                        Back
                      </Button>
                      <Button
                        onClick={handleDisclaimer}
                        variant="nomad"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        disabled={isLoading || !isOtpVerified}>
                        {isLoading ? (
                          <div className="flex items-center justify-center">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            <span>Processing...</span>
                          </div>
                        ) : (
                          "Proceed to Payment"
                        )}
                      </Button>
                    </div>
                  </div>
                ) : step > 2 ? (
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <CheckCircle className="text-green-500 w-5 h-5 mr-2" />
                      <div>
                        <p className="font-medium">
                          {bookingForm.numberOfGuests} guests •{" "}
                          {calculateNights()} nights
                        </p>
                        <p className="text-sm text-gray-500">
                          {bookingForm.mealIncluded
                            ? "Meals included"
                            : "No meals"}
                          {bookingForm.extraBeds > 0
                            ? ` • ${bookingForm.extraBeds} extra bed(s)`
                            : ""}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Payment Section - Embedded directly in the page */}
              {step === 3 && (
                <div
                  ref={paymentSectionRef}
                  className="bg-white rounded-lg shadow-md p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">Payment</h2>
                  </div>

                  {isPaymentActive && paymentData ? (
                    <div className="w-full">
                      <div className="bg-white p-6 rounded-lg border border-gray-200 w-full">
                        <PaytmPaymentForm
                          setChecking={setChecking}
                          closeModal={() => setIsPaymentActive(false)}
                          setIsBookingConfirmed={setIsBookingConfirmed}
                          paymentData={paymentData}
                          bookingForm={bookingForm}
                          onPaymentSuccess={handlePaymentSuccess}
                          onPaymentFailure={handlePaymentFailure}
                          onClose={() => setIsPaymentActive(false)}
                          setBookingDetails={setBookingDetails}
                          bookingDetails={bookingDetails}
                          isLoading={isLoading}
                          setIsLoading={setIsLoading}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500 mb-4">
                        Ready to complete your booking?
                      </p>
                      <Button
                        onClick={handlePreviousStep}
                        variant="outline"
                        className="mr-2">
                        Back to Stay Details
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Booking Summary Sidebar */}
            <div className="w-full lg:w-1/3 order-1 lg:order-2">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
                <h2 className="text-xl font-bold mb-4">Booking Summary</h2>

                <div className="space-y-4">
                  <div className="flex items-center text-sm">
                    <CalendarDaysIcon className="h-4 w-4 mr-2 text-gray-500" />
                    <div>
                      <p className="font-medium">
                        {formatDate(bookingForm.checkIn)} -{" "}
                        {formatDate(bookingForm.checkOut)}
                      </p>
                      <p className="text-gray-500">
                        {calculateNights()} night
                        {calculateNights() !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start text-sm">
                    <UserIcon className="h-4 w-4 mr-2 mt-0.5 text-gray-500" />
                    <div>
                      <p className="font-medium">
                        {bookingForm.numberOfGuests || 1} guest
                        {(bookingForm.numberOfGuests || 1) !== 1 ? "s" : ""}
                      </p>
                      {bookingForm.numberOfChildren > 0 && (
                        <p className="text-gray-500">
                          {bookingForm.numberOfChildren} children
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="border-t pt-4 mt-4">
                    <h3 className="font-medium mb-2">Selected Rooms</h3>
                    <div className="space-y-2">
                      {Object.entries(bookingForm.selectedRooms).map(
                        ([roomId, count]) => {
                          if (count <= 0) return null;
                          const room = availableRooms.find(
                            (r) => r._id === roomId
                          );
                          if (!room) return null;

                          const isDorm = room.type.toLowerCase() === "dorm";
                          const nights = calculateNights();
                          const roomTotal = room.price * count * nights;

                          return (
                            <div
                              key={roomId}
                              className="flex justify-between text-sm">
                              <div>
                                <p>{room.name || `${room.type} Room`}</p>
                                <p className="text-gray-500">
                                  {count} × {isDorm ? "bed" : "room"}
                                  {count !== 1 ? "s" : ""} × {nights} night
                                  {nights !== 1 ? "s" : ""}
                                </p>
                              </div>
                              <p className="font-medium">₹{roomTotal}</p>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>

                  {bookingForm.mealIncluded && (
                    <div className="flex justify-between text-sm">
                      <p>Meals</p>
                      <p>Included</p>
                    </div>
                  )}

                  {bookingForm.extraBeds > 0 && (
                    <div className="flex justify-between text-sm">
                      <p>Extra Beds ({bookingForm.extraBeds})</p>
                      <p>₹{bookingForm.extraBeds * 500}</p>
                    </div>
                  )}

                  <div className="border-t pt-4 mt-4">
                    <div className="flex justify-between font-bold">
                      <p>Total</p>
                      <p>₹{calculateTotalPrice()}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Inclusive of all taxes and fees
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals and Dialogs */}
      <DisclaimerDialog
        isOpen={isDisclaimerOpen}
        onClose={() => setIsDisclaimerOpen(false)}
        onAgree={() => {
          setIsDisclaimerOpen(false);
          handlePaymentInitiation();
        }}
      />

      {isBookingConfirmed && (
        <BookingConfirmationDialog
          isOpen={isBookingConfirmed}
          onClose={() => {
            setIsBookingConfirmed(false);
            navigate("/", { replace: true }); // Replace current history entry with home page
            window.history.pushState(null, null, "/"); // Ensure back button doesn't work
          }}
          booking={bookingDetails}
        />
      )}

      {isBookingFailed && (
        <BookingFailedDialog
          errorMessage="Payment processing failed. Please try again."
          onClose={() => {
            setIsBookingFailed(false);
            navigate("/", { replace: true }); // Replace current history entry with home page
            window.history.pushState(null, null, "/");
          }}
        />
      )}

      {checking && <CheckingPaymentModal isOpen={checking} />}

      {/* Payment Overlay - When payment is active, create a non-accessible background */}
      {isPaymentActive && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          aria-hidden="true"></div>
      )}

      <Footer />
    </AnimatedSection>
  );
};

export default RoomBookingPage;
