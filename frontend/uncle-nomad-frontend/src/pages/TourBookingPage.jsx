"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  ArrowLeftIcon,
  UserCircleIcon,
  CreditCardIcon,
  CalendarIcon,
  UserIcon,
  MapPinIcon,
  ClockIcon,
  CubeIcon,
} from "@heroicons/react/24/outline";
import { Loader2, CheckCircle } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import DisclaimerDialog from "../modals/DisclaimerDialog";
import FailedTransactionModal from "../modals/FailedTransactionModal";
import CheckingPaymentModal from "../modals/CheckingPaymentModal";
import TourBookingConfirmationDialog from "../modals/TourBookingConfirmationDialog";
import TourPaymentForm from "../components/TourPaymentForm";
import AnimatedSection from "../components/AnimatedSection";
import { formatDate } from "../utils/dateUtils";
import TourDatePackageSelector from "../components/TourDatePackageSelector";
import { toast } from "react-hot-toast";
import { auth } from "../firebaseConfig";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

const TourBookingPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedTour } = location.state || {};

  // Redirect if no tour data
  useEffect(() => {
    if (!selectedTour) {
      navigate("/");
    }
  }, [selectedTour, navigate]);

  const [bookingDetails, setBookingDetails] = useState({
    tourId: selectedTour?._id || "",
    guestName: "",
    email: "",
    phone: "",
    groupSize: 1,
    specialRequests: "",
    totalAmount: 0,
    selectedDate: null,
    selectedPackage: null,
  });

  const [step, setStep] = useState(1);
  const [validationErrors, setValidationErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(false);
  const [checking, setChecking] = useState(false);
  const [isPaymentActive, setIsPaymentActive] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [bookingData, setBookingData] = useState(null);
  const [isBookingConfirmed, setIsBookingConfirmed] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [isPaymentFailedOpen, setIsPaymentFailedOpen] = useState(false);
  const [paymentErrorMessage, setPaymentErrorMessage] = useState("");
  const [showError, setShowError] = useState(true);

  // email OTP related states
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpResendTimer, setOtpResendTimer] = useState(0);

  // Phone verification related states
  const [countryCode, setCountryCode] = useState("+91");
  const [confirmationResultRef, setConfirmationResultRef] = useState(null);

  // Refs for scrolling
  const guestDetailsRef = useRef(null);
  const tourSummaryRef = useRef(null);
  const paymentSectionRef = useRef(null);

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

  // Set up reCAPTCHA
  useEffect(() => {
    let recaptchaVerifier = null;

    // Skip reCAPTCHA setup if user is already logged in
    const authToken = localStorage.getItem("authToken");
    if (authToken) {
      console.log("User already logged in, skipping reCAPTCHA setup");
      return;
    }

    const setupRecaptcha = () => {
      try {
        // Clean up any existing reCAPTCHA instances
        if (window.recaptchaVerifier) {
          try {
            // Safely remove the reCAPTCHA widget
            const container = document.getElementById("recaptcha-container");
            if (container) {
              // Remove all child elements
              while (container.firstChild) {
                container.removeChild(container.firstChild);
              }
            }
            window.recaptchaVerifier = null;
          } catch (e) {
            console.log("Error cleaning up existing reCAPTCHA:", e);
          }
        }

        // Only create new reCAPTCHA if not already sent OTP
        if (!isOtpSent) {
          // Create new reCAPTCHA instance
          recaptchaVerifier = new RecaptchaVerifier(
            auth,
            "recaptcha-container",
            {
              size: "normal",
              callback: () => {
                console.log("reCAPTCHA verified");
              },
              "expired-callback": () => {
                console.log("reCAPTCHA expired");
                toast.error("CAPTCHA verification expired. Please try again.");
              },
            }
          );

          window.recaptchaVerifier = recaptchaVerifier;
        }
      } catch (error) {
        console.error("Error setting up reCAPTCHA:", error);
      }
    };

    // Only set up reCAPTCHA when on step 2, not verified, and not sent OTP
    if (step === 2 && !isOtpVerified && !isOtpSent) {
      setupRecaptcha();
    }

    return () => {
      // Clean up on unmount
      if (recaptchaVerifier) {
        try {
          // Safely remove the reCAPTCHA widget
          const container = document.getElementById("recaptcha-container");
          if (container) {
            // Remove all child elements
            while (container.firstChild) {
              container.removeChild(container.firstChild);
            }
          }
          recaptchaVerifier = null;
          window.recaptchaVerifier = null;
        } catch (e) {
          console.log("Error clearing recaptcha on unmount:", e);
        }
      }
    };
  }, [step, isOtpVerified, isOtpSent]);

  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);

    const authToken = localStorage.getItem("authToken");
    const storedUserName = localStorage.getItem("userName");
    const storedUserPhone = localStorage.getItem("userPhone");

    if (authToken) {
      setBookingDetails((prev) => ({
        ...prev,
        guestName: storedUserName || "",
        phone: storedUserPhone || "",
      }));

      // Skip OTP verification for logged-in users
      setIsOtpVerified(true);
    }
  }, []);

  const validateEmail = useCallback((email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  }, []);

  const validatePhone = useCallback((phone) => {
    const re = /^[0-9]{10}$/;
    return re.test(String(phone));
  }, []);

  // Handle input change
  const handleInputChange = (e) => {
    const { id, value } = e.target;

    if (id === "groupSize") {
      // Convert to number but don't restrict yet
      const numValue = Number.parseInt(value, 10) || "";
      setBookingDetails((prev) => ({ ...prev, [id]: numValue }));
    } else if (id === "phone") {
      // Format phone number to only allow digits and limit to 10 digits
      const formattedPhone = value.replace(/\D/g, "").slice(0, 10);
      setBookingDetails((prev) => ({ ...prev, [id]: formattedPhone }));

      // Reset OTP verification when phone changes
      if (isOtpSent || isOtpVerified) {
        setIsOtpSent(false);
        setIsOtpVerified(false);
        setOtp("");
        setOtpError(null);
      }
    } else {
      setBookingDetails((prev) => ({ ...prev, [id]: value }));
    }

    if (validationErrors[id]) {
      setValidationErrors((prev) => ({ ...prev, [id]: "" }));
    }
  };

  const sendOtp = async (e) => {
    e.preventDefault();

    // Validate phone before sending OTP
    if (!validatePhone(bookingDetails.phone)) {
      setOtpError("Please enter a valid 10-digit phone number");
      return;
    }

    setIsSendingOtp(true);
    setOtpError(null);

    try {
      if (!window.recaptchaVerifier) {
        throw new Error("reCAPTCHA not initialized. Please reload the page.");
      }

      const phoneNumber = `${countryCode}${bookingDetails.phone}`;
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
      const displayName =
        user.displayName || bookingDetails.guestName || "User";

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

  // Generate status text for verification status
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

  // Form validation
  const validateStep1 = () => {
    const errors = {};
    if (!bookingDetails.guestName.trim()) {
      errors.guestName = "Full name is required";
    }
    if (!validatePhone(bookingDetails.phone)) {
      errors.phone = "Please enter a valid 10-digit phone number";
    }
    if (!isOtpVerified) {
      errors.otp = "Phone verification is required before proceeding";
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = () => {
    const errors = {};
    const isLoggedIn = !!localStorage.getItem("authToken");

    // Check if group size is within limits
    if (!bookingDetails.groupSize || bookingDetails.groupSize < 1) {
      errors.groupSize = "Group size must be at least 1";
    } else {
      // Check against the available spots based on selected date or tour availability
      const maxAvailable = bookingDetails.selectedDate
        ? bookingDetails.selectedDate.availableSpots
        : selectedTour.groupSize - selectedTour.bookedSlots;

      if (bookingDetails.groupSize > maxAvailable) {
        errors.groupSize = `Only ${maxAvailable} spots available for this date period`;
      }
    }

    // Only validate other required fields, not date/package when moving between steps
    // Will check date/package only when proceeding to payment
    if (!bookingDetails.guestName) {
      errors.guestName = "Guest name is required";
    }

    // Only validate phone if user is not logged in
    if (!isLoggedIn && !validatePhone(bookingDetails.phone)) {
      errors.phone = "Valid phone number is required";
    }

    console.log("Validation errors in validateStep2:", errors);
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle step navigation
  const handleNextStep = () => {
    if (step === 1 && validateStep1()) {
      // When moving to step 2, ensure we preserve date/package selection
      console.log("Moving to step 2, current selection:", {
        date: bookingDetails.selectedDate,
        package: bookingDetails.selectedPackage,
      });
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      // When moving to step 3, ensure we preserve date/package selection
      console.log("Moving to step 3, current selection:", {
        date: bookingDetails.selectedDate,
        package: bookingDetails.selectedPackage,
      });
      setStep(3);
    }
  };

  const handlePreviousStep = () => {
    // Clear validation errors when navigating back
    setValidationErrors({});

    if (step === 2) {
      setStep(1); // Go back to date/package selection
    } else if (step === 3) {
      setStep(2); // Go back to guest details
    }
  };

  // Handling edit button clicks - bypass validation when editing previous steps
  const handleEditStep = (targetStep) => {
    // Clear validation errors before editing a previous step
    setValidationErrors({});
    setStep(targetStep);
  };

  // Handle disclaimer dialog
  const handleDisclaimer = () => {
    // Clear previous errors
    setValidationErrors({});

    // Manually check for date and package selections
    const errors = {};

    if (!bookingDetails.selectedDate) {
      errors.selectedDate = "Please select a tour date";
    }

    if (!bookingDetails.selectedPackage) {
      errors.selectedPackage = "Please select a package";
    }

    // Check group size
    if (!bookingDetails.groupSize || bookingDetails.groupSize < 1) {
      errors.groupSize = "Group size must be at least 1";
    } else {
      // Check against the available spots based on selected date or tour availability
      const maxAvailable = bookingDetails.selectedDate
        ? bookingDetails.selectedDate.availableSpots
        : selectedTour.groupSize - selectedTour.bookedSlots;

      if (bookingDetails.groupSize > maxAvailable) {
        errors.groupSize = `Only ${maxAvailable} spots available for this date period`;
      }
    }

    // If there are errors, show them and return
    if (Object.keys(errors).length > 0) {
      console.log("Validation errors in handleDisclaimer:", errors);
      setValidationErrors(errors);

      if (errors.selectedDate || errors.selectedPackage) {
        // If date/package errors, we need to go back to step 1
        setStep(1);
        toast.error("Please select a tour date and package before proceeding");
      }
      return;
    }

    // Debug log to see what's in bookingDetails before disclaimer
    console.log("Debug - bookingDetails before disclaimer:", {
      hasDate: !!bookingDetails.selectedDate,
      hasPackage: !!bookingDetails.selectedPackage,
      fullDetails: bookingDetails,
    });

    setIsDisclaimerOpen(true);
  };

  // Process booking after disclaimer acceptance
  const proceedToPayment = async () => {
    try {
      setIsLoading(true);

      // Debug log to see what's in bookingDetails
      console.log(
        "Start of proceedToPayment: bookingDetails =",
        bookingDetails
      );

      // Final validation before proceeding
      if (!bookingDetails.selectedDate || !bookingDetails.selectedPackage) {
        console.error("Missing date or package selection!");
        setStep(1); // Go back to date selection
        throw new Error("Please select a date and package before proceeding");
      }

      // Check authentication
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error(
          "You must verify your phone before proceeding to payment"
        );
      }

      // Calculate total amount
      const totalAmount = calculateTotalAmount();

      const bookingData = {
        tourId: selectedTour._id,
        groupSize: bookingDetails.groupSize,
        selectedDate: {
          startDate: bookingDetails.selectedDate.startDate,
          endDate: bookingDetails.selectedDate.endDate,
          availableSpots: bookingDetails.selectedDate.availableSpots,
        },
        selectedPackage: bookingDetails.selectedPackage,
        guestName: bookingDetails.guestName,
        phone: bookingDetails.phone, // Make sure phone is included
        specialRequests: bookingDetails.specialRequests || "",
        totalAmount,
        paymentStatus: "PENDING",
      };

      // Create booking
      const bookingResponse = await fetch(
        `${process.env.REACT_APP_API_URL}/api/tours/${selectedTour._id}/book`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.REACT_APP_API_KEY,
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
          body: JSON.stringify(bookingData),
        }
      );

      if (!bookingResponse.ok) {
        const errorData = await bookingResponse.json();
        console.error("Booking creation failed:", errorData);
        throw new Error(
          errorData.message || "Failed to create booking. Please try again."
        );
      }

      const bookingResult = await bookingResponse.json();
      console.log("Booking created:", bookingResult);

      // Store booking data for payment
      setBookingData(bookingResult.booking);

      // Create payment data and start payment process
      const paymentPayload = {
        tourId: selectedTour._id,
        bookingId: bookingResult.booking._id,
        amount: bookingResult.booking.totalPrice,
        guestName: bookingDetails.guestName,
        // Format phone number - remove country code prefix if present
        phone: bookingDetails.phone
          ? bookingDetails.phone.replace(/^\+\d+/, "").replace(/\D/g, "")
          : "",
        email:
          bookingDetails.email ||
          `${bookingDetails.phone.replace(/\D/g, "")}@phone-auth.user`,
        groupSize: bookingDetails.groupSize,
        specialRequests: bookingDetails.specialRequests || "",
        tourName: selectedTour.title,
      };

      // Start payment process
      setPaymentData(paymentPayload);

      // Close disclaimer dialog and show payment form
      setIsDisclaimerOpen(false);
      setIsPaymentActive(true);

      // Wait a moment for the UI to update
      setTimeout(() => {
        if (paymentSectionRef.current) {
          window.scrollTo({
            top: paymentSectionRef.current.offsetTop - 100,
            behavior: "smooth",
          });
        }
      }, 500);
    } catch (error) {
      console.error("Error in proceedToPayment:", error);
      setPaymentErrorMessage(error.message);
      setIsDisclaimerOpen(false);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle payment outcome
  const handlePaymentSuccess = async (paymentResponse) => {
    try {
      setChecking(true);
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/tours/booking/${bookingData._id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.REACT_APP_API_KEY,
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to retrieve booking details");
      }

      const updatedBooking = await response.json();
      setConfirmedBooking({
        ...updatedBooking,
        tourName: selectedTour.title,
        tourDate: selectedTour.startDate,
      });

      setChecking(false);
      setIsBookingConfirmed(true);
    } catch (error) {
      console.error("Booking confirmation error:", error);
      setPaymentErrorMessage(
        "Failed to confirm booking. Please contact support."
      );
      setIsPaymentFailedOpen(true);
    }
  };

  const handlePaymentFailure = (errorMsg) => {
    setPaymentErrorMessage(errorMsg || "Payment processing failed");
    setIsPaymentFailedOpen(true);
    setIsPaymentActive(false);
  };

  // Go back to tour details
  const handleBackToTourDetails = () => {
    navigate(-1);
  };

  // Format price
  const formatPrice = (price) => {
    return `₹${Number.parseInt(price).toLocaleString()}`;
  };

  // Calculate total price
  const calculateTotalPrice = () => {
    return selectedTour.price * (bookingDetails.groupSize || 1);
  };

  // Handle date and package selection
  const handleDatePackageSelection = (selection, event) => {
    // Prevent default scroll behavior if event exists
    if (event) {
      event.preventDefault();
    }

    // Ensure dates are properly converted to Date objects
    const selectedDate = {
      ...selection.date,
      startDate:
        selection.date.startDate instanceof Date
          ? selection.date.startDate
          : new Date(selection.date.startDate),
      endDate:
        selection.date.endDate instanceof Date
          ? selection.date.endDate
          : new Date(selection.date.endDate),
    };

    // Calculate the correct total amount based on the selected package and group size
    const totalAmount =
      selection.package.price * (bookingDetails.groupSize || 1);

    console.log("Before updating bookingDetails:", bookingDetails);

    setBookingDetails((prev) => {
      const newState = {
        ...prev,
        selectedDate: selectedDate,
        selectedPackage: selection.package,
        totalAmount: totalAmount,
      };
      console.log("After updating bookingDetails:", newState);
      return newState;
    });

    console.log("Selected date and package:", {
      date: selectedDate,
      package: selection.package,
      totalAmount,
    });

    setStep(2);

    // Smooth scroll to the next section after a short delay
    setTimeout(() => {
      const nextSection = document.querySelector('[data-step="2"]');
      if (nextSection) {
        nextSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

  // Handle payment form submission
  const handlePaymentSubmit = (paymentData) => {
    try {
      console.log("Payment form submitted with data:", paymentData);

      if (!bookingData || !bookingData._id) {
        throw new Error("Booking data not found. Please try again.");
      }

      // Create the payment payload
      const paymentPayload = {
        tourId: selectedTour._id,
        bookingId: bookingData._id,
        amount: bookingData.totalPrice,
        guestName: bookingDetails.guestName,
        phone: bookingDetails.phone,
        email:
          bookingDetails.email ||
          `${bookingDetails.phone.replace(/\D/g, "")}@phone-auth.user`, // Add a fallback email
        groupSize: bookingDetails.groupSize,
        specialRequests: bookingDetails.specialRequests,
        tourName: selectedTour.title, // Add tour name for display in payment form
      };

      console.log("Payment payload:", paymentPayload);

      // Start payment process
      setPaymentData(paymentPayload);

      // Run the actual payment in the <TourPaymentForm> component
      setChecking(true);
    } catch (error) {
      console.error("Error preparing payment:", error);
      toast.error(error.message);
    }
  };

  // Function to calculate total amount
  const calculateTotalAmount = () => {
    if (!bookingDetails.selectedPackage || !bookingDetails.groupSize) {
      return 0;
    }
    return bookingDetails.selectedPackage.price * bookingDetails.groupSize;
  };

  if (!selectedTour) {
    return null; // Don't render anything while redirecting
  }

  return (
    <AnimatedSection animation="fade-in" duration={800}>
      <Header />
      {/* Invisible reCAPTCHA container */}
      <div
        id="recaptcha-container"
        className={
          !localStorage.getItem("authToken") && !isOtpVerified && !isOtpSent
            ? "block"
            : "hidden"
        }></div>

      <div className="bg-gray-50 min-h-screen">
        {/* Page content */}
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            {/* Back button */}
            <Button
              onClick={handleBackToTourDetails}
              variant="outline"
              className="mb-6 flex items-center gap-1">
              <ArrowLeftIcon className="h-4 w-4" />
              Back to Tour
            </Button>

            {/* Hero Section */}
            <div className="relative bg-blue-900 py-12">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-800 to-indigo-900 opacity-90"></div>
              <div className="container mx-auto px-4 relative z-10">
                <div className="text-center text-white">
                  <h1 className="text-3xl md:text-4xl font-bold mb-3">
                    Book Your Tour
                  </h1>
                  <p className="text-lg opacity-80 max-w-2xl mx-auto">
                    Complete your booking for the {selectedTour.title} tour
                  </p>
                </div>
              </div>
            </div>

            {/* Booking Progress */}
            <div className="bg-white py-6 border-b shadow-sm">
              <div className="container mx-auto px-4">
                <div className="max-w-3xl mx-auto">
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={handleBackToTourDetails}
                      className="flex items-center text-blue-600 hover:text-blue-800 transition-colors">
                      <ArrowLeftIcon className="w-4 h-4 mr-1" />
                      <span className="hidden sm:inline">
                        Back to Tour Details
                      </span>
                      <span className="sm:hidden">Back</span>
                    </button>
                  </div>

                  {/* Mobile Progress Steps */}
                  <div className="md:hidden">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            step >= 1
                              ? "bg-blue-600 text-white"
                              : "bg-gray-200 text-gray-500"
                          }`}>
                          {step > 1 ? (
                            <CheckCircle className="w-5 h-5" />
                          ) : (
                            <CalendarIcon className="w-4 h-4" />
                          )}
                        </div>
                        <span className="text-xs mt-1">Date</span>
                      </div>
                      <div
                        className={`flex-1 h-0.5 mx-2 ${
                          step >= 2 ? "bg-blue-600" : "bg-gray-200"
                        }`}
                      />
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            step >= 2
                              ? "bg-blue-600 text-white"
                              : "bg-gray-200 text-gray-500"
                          }`}>
                          {step > 2 ? (
                            <CheckCircle className="w-5 h-5" />
                          ) : (
                            <UserCircleIcon className="w-4 h-4" />
                          )}
                        </div>
                        <span className="text-xs mt-1">Guest</span>
                      </div>
                      <div
                        className={`flex-1 h-0.5 mx-2 ${
                          step >= 3 ? "bg-blue-600" : "bg-gray-200"
                        }`}
                      />
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            step >= 3
                              ? "bg-blue-600 text-white"
                              : "bg-gray-200 text-gray-500"
                          }`}>
                          {step > 3 ? (
                            <CheckCircle className="w-5 h-5" />
                          ) : (
                            <CubeIcon className="w-4 h-4" />
                          )}
                        </div>
                        <span className="text-xs mt-1">Tour</span>
                      </div>
                      <div
                        className={`flex-1 h-0.5 mx-2 ${
                          step >= 4 ? "bg-blue-600" : "bg-gray-200"
                        }`}
                      />
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            step >= 4
                              ? "bg-blue-600 text-white"
                              : "bg-gray-200 text-gray-500"
                          }`}>
                          {step > 4 ? (
                            <CheckCircle className="w-5 h-5" />
                          ) : (
                            <CreditCardIcon className="w-4 h-4" />
                          )}
                        </div>
                        <span className="text-xs mt-1">Pay</span>
                      </div>
                    </div>
                    <div className="text-center text-sm font-medium text-blue-600 mt-2">
                      {step === 1 && "Select Date & Package"}
                      {step === 2 && "Enter Guest Details"}
                      {step === 3 && "Review Tour Details"}
                      {step === 4 && "Complete Payment"}
                    </div>
                  </div>

                  {/* Desktop Progress Steps */}
                  <div className="hidden md:flex items-center justify-between">
                    {/* Step 1 */}
                    <div className="flex flex-col items-center relative">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                          step >= 1
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-500"
                        }`}>
                        {step > 1 ? (
                          <CheckCircle className="w-6 h-6" />
                        ) : (
                          <CalendarIcon className="w-5 h-5" />
                        )}
                      </div>
                      <span
                        className={`text-sm font-medium ${
                          step >= 1 ? "text-blue-600" : "text-gray-500"
                        }`}>
                        Select Date & Package
                      </span>
                      {step === 1 && (
                        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                      )}
                    </div>

                    {/* Connector Line */}
                    <div
                      className={`flex-1 h-0.5 mx-4 ${
                        step >= 2 ? "bg-blue-600" : "bg-gray-200"
                      }`}
                    />

                    {/* Step 2 */}
                    <div className="flex flex-col items-center relative">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                          step >= 2
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-500"
                        }`}>
                        {step > 2 ? (
                          <CheckCircle className="w-6 h-6" />
                        ) : (
                          <UserCircleIcon className="w-5 h-5" />
                        )}
                      </div>
                      <span
                        className={`text-sm font-medium ${
                          step >= 2 ? "text-blue-600" : "text-gray-500"
                        }`}>
                        Guest Details
                      </span>
                      {step === 2 && (
                        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                      )}
                    </div>

                    {/* Connector Line */}
                    <div
                      className={`flex-1 h-0.5 mx-4 ${
                        step >= 3 ? "bg-blue-600" : "bg-gray-200"
                      }`}
                    />

                    {/* Step 3 */}
                    <div className="flex flex-col items-center relative">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                          step >= 3
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-500"
                        }`}>
                        {step > 3 ? (
                          <CheckCircle className="w-6 h-6" />
                        ) : (
                          <CubeIcon className="w-5 h-5" />
                        )}
                      </div>
                      <span
                        className={`text-sm font-medium ${
                          step >= 3 ? "text-blue-600" : "text-gray-500"
                        }`}>
                        Tour Details
                      </span>
                      {step === 3 && (
                        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                      )}
                    </div>

                    {/* Connector Line */}
                    <div
                      className={`flex-1 h-0.5 mx-4 ${
                        step >= 4 ? "bg-blue-600" : "bg-gray-200"
                      }`}
                    />

                    {/* Step 4 */}
                    <div className="flex flex-col items-center relative">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                          step >= 4
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-500"
                        }`}>
                        {step > 4 ? (
                          <CheckCircle className="w-6 h-6" />
                        ) : (
                          <CreditCardIcon className="w-5 h-5" />
                        )}
                      </div>
                      <span
                        className={`text-sm font-medium ${
                          step >= 4 ? "text-blue-600" : "text-gray-500"
                        }`}>
                        Payment
                      </span>
                      {step === 4 && (
                        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                      )}
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
                    {/* Date & Package Selection Section */}
                    <div
                      className={`bg-white rounded-lg shadow-md p-6 mb-6 transition-all duration-300 ${
                        step > 1 ? "opacity-70" : ""
                      }`}>
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold">Date & Package</h2>
                        {step > 1 && (
                          <Button
                            onClick={() => handleEditStep(1)}
                            variant="outline"
                            size="sm">
                            Edit
                          </Button>
                        )}
                      </div>

                      {step > 1 &&
                      bookingDetails.selectedDate &&
                      bookingDetails.selectedPackage ? (
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <CheckCircle className="text-green-500 w-5 h-5 mr-2" />
                            <div>
                              <p className="font-medium">
                                {formatDate(
                                  new Date(
                                    bookingDetails.selectedDate.startDate
                                  )
                                )}{" "}
                                -{" "}
                                {formatDate(
                                  new Date(bookingDetails.selectedDate.endDate)
                                )}
                              </p>
                              <p className="text-sm text-gray-500">
                                Package: {bookingDetails.selectedPackage.name}{" "}
                                (₹
                                {Number(
                                  bookingDetails.selectedPackage.price
                                ).toLocaleString()}{" "}
                                per person)
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : null}

                      {step === 1 && (
                        <TourDatePackageSelector
                          tour={selectedTour}
                          onSelectionComplete={handleDatePackageSelection}
                          initialDate={bookingDetails.selectedDate}
                          initialPackage={bookingDetails.selectedPackage}
                        />
                      )}
                    </div>

                    {/* Guest Details Section */}
                    <div
                      data-step="2"
                      className={`bg-white rounded-lg shadow-sm p-6 mb-6 transition-all duration-300 ${
                        step >= 2 ? "opacity-100" : "opacity-70"
                      }`}>
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold">Guest Details</h2>
                        {step > 2 && (
                          <Button
                            onClick={() => handleEditStep(2)}
                            variant="outline"
                            size="sm">
                            Edit
                          </Button>
                        )}
                      </div>

                      {step === 2 ? (
                        <div className="space-y-4">
                          {localStorage.getItem("authToken") && (
                            <div className="p-3 mb-4 text-sm text-green-700 bg-green-100 rounded-md border border-green-300">
                              <p>
                                ✅ Your details are pre-filled from your
                                profile. You can update your profile from
                                Profile page.
                              </p>
                            </div>
                          )}

                          <div className="space-y-2">
                            <Label htmlFor="guestName">Full Name</Label>
                            <Input
                              id="guestName"
                              value={bookingDetails.guestName}
                              onChange={handleInputChange}
                              required
                              readOnly={!!localStorage.getItem("authToken")}
                              className={
                                validationErrors.guestName
                                  ? "border-red-500"
                                  : ""
                              }
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
                                <div className="flex-shrink-0 w-24">
                                  <Select
                                    value={countryCode}
                                    onValueChange={setCountryCode}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="+91" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="+91">
                                        +91 (IN)
                                      </SelectItem>
                                      <SelectItem value="+1">
                                        +1 (US)
                                      </SelectItem>
                                      <SelectItem value="+44">
                                        +44 (UK)
                                      </SelectItem>
                                      <SelectItem value="+61">
                                        +61 (AU)
                                      </SelectItem>
                                      <SelectItem value="+65">
                                        +65 (SG)
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <Input
                                  id="phone"
                                  type="tel"
                                  value={bookingDetails.phone}
                                  onChange={handleInputChange}
                                  required
                                  readOnly={!!localStorage.getItem("authToken")}
                                  disabled={isOtpVerified || isSendingOtp}
                                  className={
                                    validationErrors.phone
                                      ? "border-red-500"
                                      : ""
                                  }
                                />
                                {!localStorage.getItem("authToken") && (
                                  <Button
                                    type="button"
                                    onClick={sendOtp}
                                    disabled={
                                      !validatePhone(bookingDetails.phone) ||
                                      isSendingOtp ||
                                      isOtpVerified ||
                                      otpResendTimer > 0
                                    }
                                    className="whitespace-nowrap">
                                    {isSendingOtp ? (
                                      <div className="flex items-center">
                                        <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                                        <span className="text-xs">
                                          Sending...
                                        </span>
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

                            {/* OTP field */}
                            {!localStorage.getItem("authToken") &&
                              isOtpSent &&
                              !isOtpVerified && (
                                <div className="bg-gray-50 p-3 rounded-lg space-y-3">
                                  <div className="text-sm text-gray-700">
                                    Enter the verification code sent to{" "}
                                    <span className="font-medium">
                                      {countryCode + bookingDetails.phone}
                                    </span>
                                  </div>
                                  <div className="flex gap-2">
                                    <Input
                                      id="otp"
                                      type="text"
                                      required
                                      value={otp}
                                      onChange={(e) => setOtp(e.target.value)}
                                      className="w-full focus:ring-2 focus:ring-blue-600"
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
                                    <p className="text-red-500 text-sm">
                                      {otpError}
                                    </p>
                                  )}
                                </div>
                              )}
                          </div>

                          <div className="pt-4">
                            <div className="flex gap-2">
                              <Button
                                onClick={handlePreviousStep}
                                variant="outline"
                                className="w-full">
                                Back to Date & Package
                              </Button>
                              <Button
                                onClick={() => {
                                  if (validateStep2()) {
                                    handleNextStep(); // Move to step 3
                                  }
                                }}
                                variant="nomad"
                                className="w-full"
                                disabled={
                                  !bookingDetails.guestName ||
                                  (!isOtpVerified &&
                                    !localStorage.getItem("authToken")) ||
                                  (!localStorage.getItem("authToken") &&
                                    !validatePhone(bookingDetails.phone))
                                }>
                                Continue to Tour Details
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : step > 2 ? (
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <CheckCircle className="text-green-500 w-5 h-5 mr-2" />
                            <div>
                              <p className="font-medium">
                                {bookingDetails.guestName}
                              </p>
                              <p className="text-sm text-gray-500">
                                {bookingDetails.phone}
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>

                    {/* Tour Details Section */}
                    <div
                      id="tourDetails"
                      ref={tourSummaryRef}
                      className={`bg-white rounded-lg shadow-md p-6 mb-6 transition-all duration-300 ${
                        step >= 3 ? "opacity-100" : "opacity-70"
                      }`}>
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold">Tour Details</h2>
                        {step > 3 && (
                          <Button
                            onClick={() => handleEditStep(3)}
                            variant="outline"
                            size="sm">
                            Edit
                          </Button>
                        )}
                      </div>

                      {step === 3 ? (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="groupSize">
                              Number of Participants *
                            </Label>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center border rounded-md overflow-hidden">
                                <button
                                  type="button"
                                  className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-500"
                                  onClick={() => {
                                    if (bookingDetails.groupSize > 1) {
                                      setBookingDetails((prev) => {
                                        const newGroupSize = prev.groupSize - 1;
                                        return {
                                          ...prev,
                                          groupSize: newGroupSize,
                                          totalAmount: prev.selectedPackage
                                            ? prev.selectedPackage.price *
                                              newGroupSize
                                            : prev.totalAmount,
                                        };
                                      });
                                    }
                                  }}
                                  disabled={bookingDetails.groupSize <= 1}>
                                  -
                                </button>
                                <span className="px-4 py-2 min-w-[40px] text-center border-l border-r">
                                  {bookingDetails.groupSize}
                                </span>
                                <button
                                  type="button"
                                  className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-500"
                                  onClick={() => {
                                    // Get max available spots
                                    const maxAvailable =
                                      bookingDetails.selectedDate
                                        ? bookingDetails.selectedDate
                                            .availableSpots
                                        : selectedTour.groupSize -
                                          selectedTour.bookedSlots;

                                    if (
                                      bookingDetails.groupSize < maxAvailable
                                    ) {
                                      setBookingDetails((prev) => {
                                        const newGroupSize = prev.groupSize + 1;
                                        return {
                                          ...prev,
                                          groupSize: newGroupSize,
                                          totalAmount: prev.selectedPackage
                                            ? prev.selectedPackage.price *
                                              newGroupSize
                                            : prev.totalAmount,
                                        };
                                      });
                                    }
                                  }}
                                  disabled={
                                    bookingDetails.groupSize >=
                                    (bookingDetails.selectedDate
                                      ? bookingDetails.selectedDate
                                          .availableSpots
                                      : selectedTour.groupSize -
                                        selectedTour.bookedSlots)
                                  }>
                                  +
                                </button>
                              </div>
                              <span className="text-sm text-gray-500">
                                Available spots:{" "}
                                {bookingDetails.selectedDate
                                  ? bookingDetails.selectedDate.availableSpots
                                  : selectedTour.groupSize -
                                    selectedTour.bookedSlots}
                              </span>
                            </div>
                            {validationErrors.groupSize && (
                              <p className="text-sm text-red-500 mt-1">
                                {validationErrors.groupSize}
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="specialRequests">
                              Special Requests (Optional)
                            </Label>
                            <textarea
                              id="specialRequests"
                              value={bookingDetails.specialRequests}
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

                          {paymentErrorMessage && showError && (
                            <div className="p-3 mb-4 text-sm text-red-500 bg-red-50 rounded-md border border-red-200">
                              <div className="font-medium">Booking Error</div>
                              <div>{paymentErrorMessage}</div>
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
                              className="w-full"
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
                      ) : step > 3 ? (
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <CheckCircle className="text-green-500 w-5 h-5 mr-2" />
                            <div>
                              <p className="font-medium">
                                {bookingDetails.groupSize}{" "}
                                {bookingDetails.groupSize === 1
                                  ? "participant"
                                  : "participants"}
                              </p>
                              {bookingDetails.specialRequests && (
                                <p className="text-sm text-gray-500">
                                  Special requests:{" "}
                                  {bookingDetails.specialRequests}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>

                    {/* Payment Section */}
                    {step === 3 && (
                      <div
                        ref={paymentSectionRef}
                        className="bg-white rounded-lg shadow-md p-6 mb-6 transition-all duration-300">
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-xl font-bold">Payment</h2>
                        </div>

                        {isPaymentActive && paymentData ? (
                          <div className="w-full">
                            <p className="text-sm mb-4 text-blue-600">
                              Payment gateway loading... If it doesn't appear
                              shortly, please check your internet connection.
                            </p>
                            <div className="mb-4 p-3 bg-gray-50 rounded-md">
                              <h3 className="text-sm font-semibold">
                                Payment details:
                              </h3>
                              <pre className="text-xs overflow-auto bg-gray-100 p-2 rounded mt-1">
                                {JSON.stringify(
                                  {
                                    bookingId: paymentData.bookingId,
                                    amount: paymentData.amount,
                                    guestName: paymentData.guestName,
                                  },
                                  null,
                                  2
                                )}
                              </pre>
                            </div>
                            <TourPaymentForm
                              paymentData={paymentData}
                              bookingForm={bookingDetails}
                              onPaymentSuccess={handlePaymentSuccess}
                              onPaymentFailure={handlePaymentFailure}
                              onClose={() => setIsPaymentActive(false)}
                              setIsCheckingOpen={setChecking}
                            />
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
                              Back to Tour Details
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Booking Summary Section */}
                  <div
                    ref={tourSummaryRef}
                    className="w-full lg:w-1/3 order-1 lg:order-2">
                    <div className="bg-white rounded-lg shadow-md p-6 sticky top-8 space-y-5">
                      <h3 className="text-lg font-bold border-b pb-3">
                        Booking Summary
                      </h3>

                      <div className="flex items-start gap-4">
                        <div className="w-20 h-20 flex-shrink-0 overflow-hidden rounded-md">
                          <img
                            src={
                              selectedTour.images && selectedTour.images[0]
                                ? selectedTour.images[0]
                                : "/placeholder.svg?height=80&width=80"
                            }
                            alt={selectedTour.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {selectedTour.title}
                          </h4>
                          <div className="text-sm text-gray-600 mt-1 flex items-center">
                            <MapPinIcon className="w-4 h-4 mr-1" />
                            {selectedTour.location}
                          </div>
                          <div className="text-sm text-gray-600 mt-1 flex items-center">
                            <ClockIcon className="w-4 h-4 mr-1" />
                            {selectedTour.duration}
                          </div>
                        </div>
                      </div>

                      {bookingDetails.selectedDate && (
                        <div className="py-3 border-t border-gray-200">
                          <h4 className="font-medium text-gray-900 mb-2">
                            Selected Date
                          </h4>
                          <div className="p-3 bg-blue-50 rounded text-sm">
                            <div className="font-medium text-blue-800">
                              {formatDate(
                                new Date(bookingDetails.selectedDate.startDate)
                              )}{" "}
                              -{" "}
                              {formatDate(
                                new Date(bookingDetails.selectedDate.endDate)
                              )}
                            </div>
                            <div className="text-blue-600 mt-1">
                              {bookingDetails.selectedDate.availableSpots} spots
                              available
                            </div>
                          </div>
                        </div>
                      )}

                      {bookingDetails.selectedPackage && (
                        <div className="py-3 border-t border-gray-200">
                          <h4 className="font-medium text-gray-900 mb-2">
                            Selected Package
                          </h4>
                          <div className="p-3 bg-green-50 rounded text-sm">
                            <div className="font-medium text-green-800">
                              {bookingDetails.selectedPackage.name}
                            </div>
                            {bookingDetails.selectedPackage.description && (
                              <div className="text-green-600 mt-1">
                                {bookingDetails.selectedPackage.description}
                              </div>
                            )}
                            <div className="font-medium text-green-800 mt-2">
                              ₹
                              {Number(
                                bookingDetails.selectedPackage.price
                              ).toLocaleString()}{" "}
                              per person
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="py-3 border-t border-gray-200">
                        <div className="space-y-2">
                          <div className="font-medium">Number of Travelers</div>
                          <div className="flex items-center border rounded-md overflow-hidden">
                            <button
                              className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-500"
                              onClick={() => {
                                if (bookingDetails.groupSize > 1) {
                                  setBookingDetails((prev) => {
                                    const newGroupSize = prev.groupSize - 1;
                                    return {
                                      ...prev,
                                      groupSize: newGroupSize,
                                      totalAmount: prev.selectedPackage
                                        ? prev.selectedPackage.price *
                                          newGroupSize
                                        : prev.totalAmount,
                                    };
                                  });
                                }
                              }}
                              disabled={bookingDetails.groupSize <= 1}>
                              -
                            </button>
                            <span className="px-4 py-2 min-w-[40px] text-center border-l border-r">
                              {bookingDetails.groupSize}
                            </span>
                            <button
                              className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-500"
                              onClick={() => {
                                // Get max available spots
                                const maxAvailable = bookingDetails.selectedDate
                                  ? bookingDetails.selectedDate.availableSpots
                                  : selectedTour.groupSize -
                                    selectedTour.bookedSlots;

                                if (bookingDetails.groupSize < maxAvailable) {
                                  setBookingDetails((prev) => {
                                    const newGroupSize = prev.groupSize + 1;
                                    return {
                                      ...prev,
                                      groupSize: newGroupSize,
                                      totalAmount: prev.selectedPackage
                                        ? prev.selectedPackage.price *
                                          newGroupSize
                                        : prev.totalAmount,
                                    };
                                  });
                                }
                              }}
                              disabled={
                                bookingDetails.groupSize >=
                                (bookingDetails.selectedDate
                                  ? bookingDetails.selectedDate.availableSpots
                                  : selectedTour.groupSize -
                                    selectedTour.bookedSlots)
                              }>
                              +
                            </button>
                          </div>
                          {!bookingDetails.selectedDate && (
                            <p className="text-xs text-amber-600">
                              Select a date and package first
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-200">
                        <div className="flex justify-between mb-2">
                          <span className="text-gray-600">
                            Price per person
                          </span>
                          <span className="font-medium">
                            {bookingDetails.selectedPackage
                              ? `₹${Number(
                                  bookingDetails.selectedPackage.price
                                ).toLocaleString()}`
                              : "Select a package"}
                          </span>
                        </div>
                        <div className="flex justify-between mb-2">
                          <span className="text-gray-600">
                            Number of travelers
                          </span>
                          <span>{bookingDetails.groupSize}</span>
                        </div>
                        <div className="flex justify-between pt-3 border-t border-dashed mt-3">
                          <span className="font-semibold">Total Amount</span>
                          <span className="font-bold text-lg">
                            {bookingDetails.selectedPackage
                              ? `₹${Number(
                                  bookingDetails.selectedPackage.price *
                                    bookingDetails.groupSize
                                ).toLocaleString()}`
                              : "Pending selection"}
                          </span>
                        </div>
                      </div>

                      {step === 2 && (
                        <div className="pt-4">
                          <Button
                            variant="custom"
                            className="w-full py-3"
                            onClick={() => {
                              if (validateStep2()) {
                                handleNextStep(); // Move to step 3
                              }
                            }}
                            disabled={
                              !bookingDetails.guestName ||
                              (!isOtpVerified &&
                                !localStorage.getItem("authToken")) ||
                              (!localStorage.getItem("authToken") &&
                                !validatePhone(bookingDetails.phone))
                            }>
                            Continue to Tour Details
                          </Button>
                          {!isOtpVerified &&
                            !localStorage.getItem("authToken") && (
                              <p className="text-xs text-center mt-2 text-red-500">
                                Please verify your phone to continue
                              </p>
                            )}
                        </div>
                      )}
                    </div>
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
          proceedToPayment();
        }}
        title="Tour Booking Disclaimer"
        message={
          <>
            <p>Please review the following information before proceeding:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>
                You are booking {bookingDetails.groupSize}{" "}
                {bookingDetails.groupSize === 1
                  ? "participant"
                  : "participants"}{" "}
                for {selectedTour?.title}
              </li>
              <li>
                Package:{" "}
                {bookingDetails.selectedPackage?.name || "Not selected"}{" "}
                {bookingDetails.selectedPackage
                  ? `(₹
                ${Number(
                  bookingDetails.selectedPackage.price
                ).toLocaleString()}{" "}
                per person)`
                  : ""}
              </li>
              <li>
                Dates:{" "}
                {bookingDetails.selectedDate
                  ? `${formatDate(
                      new Date(bookingDetails.selectedDate.startDate)
                    )} - ${formatDate(
                      new Date(bookingDetails.selectedDate.endDate)
                    )}`
                  : "Not selected"}
              </li>
              <li>
                Total amount:{" "}
                {bookingDetails.selectedPackage
                  ? `₹${Number(
                      bookingDetails.selectedPackage.price *
                        bookingDetails.groupSize
                    ).toLocaleString()}`
                  : "Pending package selection"}
              </li>
              <li>
                Cancellation policies apply as per our terms and conditions
              </li>
              <li>Payment is required to confirm your booking</li>
            </ul>
          </>
        }
      />

      {isBookingConfirmed && (
        <TourBookingConfirmationDialog
          isOpen={isBookingConfirmed}
          onClose={() => {
            console.log("TourBookingPage - Setting hasNewBooking flag");
            sessionStorage.setItem("hasNewBooking", "true");
            console.log(
              "TourBookingPage - hasNewBooking set:",
              sessionStorage.getItem("hasNewBooking")
            );

            // Add a delay before navigation
            setTimeout(() => {
              setIsBookingConfirmed(false);
              navigate("/", { replace: true }); // Replace current history entry with home page
              window.history.pushState(null, null, "/"); // Ensure back button doesn't work
            }, 500);
          }}
          tourBooking={confirmedBooking}
          tourName={selectedTour.title}
        />
      )}

      {isPaymentFailedOpen && (
        <FailedTransactionModal
          open={isPaymentFailedOpen}
          onClose={() => setIsPaymentFailedOpen(false)}
          errorMessage={paymentErrorMessage}
        />
      )}

      {checking && <CheckingPaymentModal isOpen={checking} />}

      <Footer />
    </AnimatedSection>
  );
};

export default TourBookingPage;
