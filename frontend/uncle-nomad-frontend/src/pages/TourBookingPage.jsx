"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { ArrowLeftIcon, UserCircleIcon, CreditCardIcon } from "@heroicons/react/24/outline"
import { Loader2, CheckCircle, Calendar, User, MapPin, Clock } from "lucide-react"
import Header from "../components/Header"
import Footer from "../components/Footer"
import DisclaimerDialog from "../modals/DisclaimerDialog"
import FailedTransactionModal from "../modals/FailedTransactionModal"
import CheckingPaymentModal from "../modals/CheckingPaymentModal"
import TourBookingConfirmationDialog from '../modals/TourBookingConfirmationDialog'
import TourPaymentForm from "../components/TourPaymentForm"
import AnimatedSection from "../components/AnimatedSection"



const TourBookingPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { selectedTour } = location.state || {}

  // Redirect if no tour data
  useEffect(() => {
    if (!selectedTour) {
      navigate("/")
    }
  }, [selectedTour, navigate])

  const [bookingDetails, setBookingDetails] = useState({
    tourId: selectedTour?._id || "",
    guestName: "",
    email: "",
    phone: "",
    groupSize: 1,
    specialRequests: "",
    totalAmount: 0,
  })

  const [step, setStep] = useState(1)
  const [validationErrors, setValidationErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(false)
  const [checking, setChecking] = useState(false)
  const [isPaymentActive, setIsPaymentActive] = useState(false)
  const [paymentData, setPaymentData] = useState(null)
  const [bookingData, setBookingData] = useState(null)
  const [isBookingConfirmed, setIsBookingConfirmed] = useState(false)
  const [confirmedBooking, setConfirmedBooking] = useState(null)
  const [isPaymentFailedOpen, setIsPaymentFailedOpen] = useState(false)
  const [paymentErrorMessage, setPaymentErrorMessage] = useState("")
  const [showError, setShowError] = useState(true)

  // email OTP related states
  const [otp, setOtp] = useState("")
  const [isOtpSent, setIsOtpSent] = useState(false)
  const [isOtpVerified, setIsOtpVerified] = useState(false)
  const [otpError, setOtpError] = useState(null)
  const [isSendingOtp, setIsSendingOtp] = useState(false)
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)
  const [otpResendTimer, setOtpResendTimer] = useState(0)



  // Refs for scrolling
  const guestDetailsRef = useRef(null)
  const tourSummaryRef = useRef(null)
  const paymentSectionRef = useRef(null)

  // Timer for OTP resend countdown
  useEffect(() => {
    let timer
    if (otpResendTimer > 0) {
      timer = setTimeout(() => setOtpResendTimer(otpResendTimer - 1), 1000)
    }
    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [otpResendTimer])

  // Effect to prevent back navigation after booking confirmation
  useEffect(() => {
    if (isBookingConfirmed) {
      // Push a new state and prevent back navigation
      window.history.pushState(null, null, window.location.href)
      window.onpopstate = () => {
        navigate("/", { replace: true }) // Redirect to home page if they try to go back
      }
    }
  }, [isBookingConfirmed, navigate])

  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0)

    const authToken = localStorage.getItem("authToken")
    const storedUserName = localStorage.getItem("userName")
    const storedUserEmail = localStorage.getItem("userEmail")

    if (authToken) {
      setBookingDetails((prev) => ({
        ...prev,
        guestName: storedUserName || "",
        email: storedUserEmail || "",
      }))

      // Skip OTP verification for logged-in users
      setIsOtpVerified(true)
    }
  }, [])

  const validateEmail = useCallback((email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(String(email).toLowerCase())
  }, [])

  const validatePhone = useCallback((phone) => {
    const re = /^[0-9]{10}$/
    return re.test(String(phone))
  }, [])

  // Handle input change
  const handleInputChange = (e) => {
    const { id, value } = e.target

    if (id === "groupSize") {
      // Convert to number but don't restrict yet
      const numValue = Number.parseInt(value, 10) || ""
      setBookingDetails((prev) => ({ ...prev, [id]: numValue }))
    } else {
      setBookingDetails((prev) => ({ ...prev, [id]: value }))
    }

    if (validationErrors[id]) {
      setValidationErrors((prev) => ({ ...prev, [id]: "" }))
    }
  }

  const handleEmailChange = (e) => {
    // Reset OTP verification when email changes
    if (isOtpSent || isOtpVerified) {
      setIsOtpSent(false)
      setIsOtpVerified(false)
      setOtp("")
      setOtpError(null)
    }

    setBookingDetails((prev) => ({ ...prev, email: e.target.value }))

    if (validationErrors.email) {
      setValidationErrors((prev) => ({ ...prev, email: "" }))
    }
  }

  const sendOtp = async (e) => {
    e.preventDefault()

    // Validate email before sending OTP
    if (!validateEmail(bookingDetails.email)) {
      setOtpError("Please enter a valid email address")
      return
    }

    setIsSendingOtp(true)
    setOtpError(null)

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": process.env.REACT_APP_API_KEY },
        body: JSON.stringify({ email: bookingDetails.email }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to send OTP")
      }

      setIsOtpSent(true)
      setOtpResendTimer(60) // 60 seconds countdown for resend
    } catch (error) {
      setOtpError(error.message || "Failed to send OTP. Please try again.")
    } finally {
      setIsSendingOtp(false)
    }
  }

  const verifyOtp = async (e) => {
    e.preventDefault()

    if (!otp.trim()) {
      setOtpError("Please enter the OTP")
      return
    }

    setIsVerifyingOtp(true)
    setOtpError(null)

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.REACT_APP_API_KEY,
        },
        body: JSON.stringify({
          email: bookingDetails.email,
          otp,
          name: bookingDetails.guestName,
          phone: bookingDetails.phone,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Invalid OTP")
      }

      const data = await response.json()

      // Store the auth token in localStorage
      localStorage.setItem("authToken", data.token)
      localStorage.setItem("userName", data.user.name)
      localStorage.setItem("userEmail", data.user.email)

      await new Promise((resolve) => setTimeout(resolve, 100))

      window.dispatchEvent(new Event("storage"))

      setIsOtpVerified(true)

    } catch (error) {
      setOtpError(error.message || "Invalid OTP. Please try again.")
    } finally {
      setIsVerifyingOtp(false)
    }
  }

  const handleLogout = () => {
    console.log("Logging out...")

    // Remove authentication data
    localStorage.removeItem("authToken")
    localStorage.removeItem("userName")
    localStorage.removeItem("userEmail")

    // Dispatch storage event to sync across tabs
    window.dispatchEvent(new Event("storage"))

    // Redirect user (optional)
    navigate("/") // Redirect to home (change if needed)

    // Update UI state
    setIsOtpVerified(false)
    setBookingDetails((prev) => ({
      ...prev,
      guestName: "",
      email: "",
      phone: "",
    }))
  }

  const validateToken = async () => {
    const authToken = localStorage.getItem("authToken")

    if (!authToken) return

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/token/validate-token`, {
        method: "GET",
        headers: { Authorization: `Bearer ${authToken}`, "Content-Type": "application/json" },
      })

      if (!response.ok) {
        console.warn("Token validation failed")
        handleLogout()
      }
    } catch (error) {
      console.error("Error validating token:", error)
      handleLogout()
    }
  }

  // Generate summary text for verification status
  const getVerificationStatus = () => {
    if (isOtpVerified) return <span className="text-green-500 flex items-center text-sm">✓ Email verified</span>
    if (isOtpSent) return <span className="text-amber-500 flex items-center text-sm">OTP sent to your email</span>
    return null
  }

  // Form validation
  const validateStep1 = () => {
    const errors = {};
    if (!bookingDetails.guestName.trim()) {
        errors.guestName = "Full name is required";
    }
    if (!validateEmail(bookingDetails.email)) {
        errors.email = "Please enter a valid email address";
    }
    if (!validatePhone(bookingDetails.phone)) {
        errors.phone = "Please enter a valid 10-digit phone number";
    }
    if (!isOtpVerified) {
        errors.otp = "Email verification is required before proceeding";
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
};


  const validateStep2 = () => {
    const errors = {}

    // Check if group size is within limits
    const availableSlots = selectedTour.groupSize - selectedTour.bookedSlots
    if (!bookingDetails.groupSize || bookingDetails.groupSize < 1) {
      errors.groupSize = "Group size must be at least 1"
    } else if (bookingDetails.groupSize > availableSlots) {
      errors.groupSize = `Only ${availableSlots} slots available for this tour`
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle step navigation
  const handleNextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2)
    } else if (step === 2 && validateStep2()) {
      setStep(3)
    }
  }

  const handlePreviousStep = () => {
    if (step === 2) {
      setStep(1)
    } else if (step === 3) {
      setStep(2)
    }
  }

  // Handle disclaimer dialog
  const handleDisclaimer = () => {
    if (!validateStep2()) {
      return // Stop here if validation fails
    }

    setIsDisclaimerOpen(true)
  }

  // Process booking after disclaimer acceptance
  const proceedToPayment = async () => {
    try {
      setIsLoading(true)

      const totalAmount = selectedTour.price * Number.parseInt(bookingDetails.groupSize)

      const bookingData = {
        ...bookingDetails,
        totalAmount: totalAmount,
        bookingDate: new Date(),
        tourId: selectedTour._id,
      }

      const token = localStorage.getItem("authToken")
      if (!token) {
        throw new Error("You must verify your email before proceeding")
      }

      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/tours/${selectedTour._id}/book`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.REACT_APP_API_KEY,
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bookingData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to create booking")
      }

      const result = await response.json()
      setBookingData(result.booking)

      // Prepare payment data
      setPaymentData({
        amount: totalAmount,
        tourId: selectedTour._id,
        bookingId: result.booking._id,
      })

      setIsPaymentActive(true)
      setStep(3)

      // Scroll to payment section
      if (paymentSectionRef.current) {
        setTimeout(() => {
          paymentSectionRef.current.scrollIntoView({ behavior: "smooth" })
        }, 100)
      }
    } catch (error) {
      console.error("Booking Error:", error)
      setPaymentErrorMessage(error.message || "Failed to create booking")
      setIsPaymentFailedOpen(true)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle payment outcome
  const handlePaymentSuccess = async (paymentResponse) => {
    try {
      setChecking(true)
      const token = localStorage.getItem("authToken")
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/tours/booking/${bookingData._id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.REACT_APP_API_KEY,
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to retrieve booking details")
      }

      const updatedBooking = await response.json()
      setConfirmedBooking({
        ...updatedBooking,
        tourName: selectedTour.title,
        tourDate: selectedTour.startDate
      })

      setChecking(false)
      setIsBookingConfirmed(true)
    } catch (error) {
      console.error("Booking confirmation error:", error)
      setPaymentErrorMessage("Failed to confirm booking. Please contact support.")
      setIsPaymentFailedOpen(true)
    }
  }

  const handlePaymentFailure = (errorMsg) => {
    setPaymentErrorMessage(errorMsg || "Payment processing failed")
    setIsPaymentFailedOpen(true)
    setIsPaymentActive(false)
  }

  // Go back to tour details
  const handleBackToTourDetails = () => {
    navigate(-1)
  }

  // Format price
  const formatPrice = (price) => {
    return `₹${Number.parseInt(price).toLocaleString()}`
  }

  // Calculate total price
  const calculateTotalPrice = () => {
    return selectedTour.price * (bookingDetails.groupSize || 1)
  }

  if (!selectedTour) {
    return null // Don't render anything while redirecting
  }

  return (
    <AnimatedSection animation="fade-in" duration={800}>
      <Header />

      {/* Hero Section */}
      <div className="relative bg-blue-900 py-12">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-800 to-indigo-900 opacity-90"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center text-white">
            <h1 className="text-3xl md:text-4xl font-bold mb-3">Book Your Tour</h1>
            <p className="text-lg opacity-80 max-w-2xl mx-auto">
              Complete your booking for the {selectedTour.title} tour
            </p>
          </div>
        </div>
      </div>

      {/* Booking Progress */}
      <div className="bg-gray-50 py-4 border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            <button
              onClick={handleBackToTourDetails}
              className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-1" />
              <span>Back to Tour Details</span>
            </button>

            <div className="hidden md:flex items-center">
              <div className={`flex flex-col items-center ${step >= 1 ? "text-blue-600" : "text-gray-400"}`}>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${step >= 1 ? "bg-blue-600 text-white" : "bg-gray-200"}`}
                >
                  <UserCircleIcon className="w-4 h-4" />
                </div>
                <span className="text-xs">Guest Details</span>
              </div>

              <div className={`w-12 h-0.5 ${step >= 2 ? "bg-blue-600" : "bg-gray-200"}`}></div>

              <div className={`flex flex-col items-center ${step >= 2 ? "text-blue-600" : "text-gray-400"}`}>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${step >= 2 ? "bg-blue-600 text-white" : "bg-gray-200"}`}
                >
                  <CreditCardIcon className="w-4 h-4" />
                </div>
                <span className="text-xs">Tour Details</span>
              </div>

              <div className={`w-12 h-0.5 ${step >= 3 ? "bg-blue-600" : "bg-gray-200"}`}></div>

              <div className={`flex flex-col items-center ${step >= 3 ? "text-blue-600" : "text-gray-400"}`}>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${step >= 3 ? "bg-blue-600 text-white" : "bg-gray-200"}`}
                >
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
                className={`bg-white rounded-lg shadow-md p-6 mb-6 ${step !== 1 ? "opacity-70" : ""}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Guest Details</h2>
                  {step !== 1 && (
                    <Button onClick={() => setStep(1)} variant="outline" size="sm">
                      Edit
                    </Button>
                  )}
                </div>

                {step === 1 ? (
                  <div className="space-y-4">
                    {localStorage.getItem("authToken") && (
                      <div className="p-3 mb-4 text-sm text-green-700 bg-green-100 rounded-md border border-green-300">
                        <p>✅ Your details are pre-filled from your profile. Only phone number can be updated.</p>
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
                        className={validationErrors.guestName ? "border-red-500" : ""}
                      />
                      {validationErrors.guestName && (
                        <p className="text-sm text-red-500">{validationErrors.guestName}</p>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <div className="flex gap-2">
                          <Input
                            id="email"
                            type="email"
                            value={bookingDetails.email}
                            onChange={handleEmailChange}
                            required
                            readOnly={!!localStorage.getItem("authToken")}
                            disabled={isOtpVerified || isSendingOtp}
                            className={validationErrors.email ? "border-red-500" : ""}
                          />
                          {!localStorage.getItem("authToken") && (
                            <Button
                              type="button"
                              onClick={sendOtp}
                              disabled={
                                !validateEmail(bookingDetails.email) ||
                                isSendingOtp ||
                                isOtpVerified ||
                                otpResendTimer > 0
                              }
                              className="whitespace-nowrap"
                            >
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
                        {validationErrors.email && <p className="text-sm text-red-500">{validationErrors.email}</p>}
                        {getVerificationStatus()}
                      </div>

                      {/* OTP field */}
                      {!localStorage.getItem("authToken") && isOtpSent && !isOtpVerified && (
                        <div className="bg-gray-50 p-3 rounded-lg space-y-3">
                          <div className="text-sm text-gray-700">
                            Enter the verification code sent to{" "}
                            <span className="font-medium">{bookingDetails.email}</span>
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
                            <Button type="button" onClick={verifyOtp} disabled={!otp.trim() || isVerifyingOtp}>
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
                          {otpError && <p className="text-red-500 text-sm">{otpError}</p>}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={bookingDetails.phone}
                        onChange={handleInputChange}
                        required
                        className={validationErrors.phone ? "border-red-500" : ""}
                      />
                      {validationErrors.phone && <p className="text-sm text-red-500">{validationErrors.phone}</p>}
                    </div>

                    <div className="pt-4">
                      <Button
                        onClick={handleNextStep}
                        variant='nomad'
                        className="w-full"
                        disabled={
                          !bookingDetails.guestName || !bookingDetails.email || !bookingDetails.phone || !isOtpVerified
                        }
                      >
                        Continue to Tour Details
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <CheckCircle className="text-green-500 w-5 h-5 mr-2" />
                      <div>
                        <p className="font-medium">{bookingDetails.guestName}</p>
                        <p className="text-sm text-gray-500">
                          {bookingDetails.email} • {bookingDetails.phone}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Tour Details Section */}
              <div
                id="tourDetails"
                ref={tourSummaryRef}
                className={`bg-white rounded-lg shadow-md p-6 mb-6 ${step !== 2 ? "opacity-70" : ""}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Tour Details</h2>
                  {step !== 2 && step > 2 && (
                    <Button onClick={() => setStep(2)} variant="outline" size="sm">
                      Edit
                    </Button>
                  )}
                </div>

                {step === 2 ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="groupSize">Number of Participants *</Label>
                      <div className="flex items-center">
                        <Input
                          id="groupSize"
                          type="number"
                          min="1"
                          max={selectedTour.groupSize - selectedTour.bookedSlots}
                          value={bookingDetails.groupSize}
                          onChange={handleInputChange}
                          required
                          className={validationErrors.groupSize ? "border-red-500" : ""}
                        />
                        <span className="ml-2 text-xs text-gray-500">
                          Max: {selectedTour.groupSize - selectedTour.bookedSlots}
                        </span>
                      </div>
                      {validationErrors.groupSize && (
                        <p className="text-sm text-red-500 mt-1">{validationErrors.groupSize}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="specialRequests">Special Requests (Optional)</Label>
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
                          className="mt-2 text-sm text-red-600 underline hover:text-red-700"
                        >
                          Dismiss
                        </button>
                      </div>
                    )}

                    <div className="flex gap-2 pt-4">
                      <Button onClick={handlePreviousStep} variant="outline" className="w-full">
                        Back
                      </Button>
                      <Button
                        onClick={handleDisclaimer}
                        variant="nomad"
                        className="w-full"
                        disabled={isLoading || !isOtpVerified}
                      >
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
                          {bookingDetails.groupSize} {bookingDetails.groupSize === 1 ? "participant" : "participants"}
                        </p>
                        {bookingDetails.specialRequests && (
                          <p className="text-sm text-gray-500">Special requests: {bookingDetails.specialRequests}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Payment Section - Embedded directly in the page */}
              {step === 3 && (
                <div ref={paymentSectionRef} className="bg-white rounded-lg shadow-md p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">Payment</h2>
                  </div>

                  {isPaymentActive && paymentData ? (
                    <div className="w-full">
                      <TourPaymentForm
                        setIsCheckingOpen={setChecking}
                        paymentData={paymentData}
                        bookingForm={bookingDetails}
                        onPaymentSuccess={handlePaymentSuccess}
                        onPaymentFailure={handlePaymentFailure}
                        onClose={() => setIsPaymentActive(false)}
                      />
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500 mb-4">Ready to complete your booking?</p>
                      <Button onClick={handlePreviousStep} variant="outline" className="mr-2">
                        Back to Tour Details
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Tour Summary Sidebar */}
            <div className="w-full lg:w-1/3 order-1 lg:order-2">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
                <h2 className="text-xl font-bold mb-4">Tour Summary</h2>

                <div className="space-y-4">
                  <div className="flex items-start border-b pb-4">
                    <div className="w-20 h-20 rounded-md overflow-hidden bg-gray-100 mr-3 flex-shrink-0">
                      <img
                        src={selectedTour.images?.[0] || "/placeholder.svg?height=80&width=80"}
                        alt={selectedTour.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="font-medium text-lg">{selectedTour.title}</h3>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span>{selectedTour.location}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                      <div>
                        <p className="font-medium">Dates</p>
                        <p className="text-gray-600">
                          {new Date(selectedTour.startDate).toLocaleDateString()} -{" "}
                          {new Date(selectedTour.endDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-gray-500" />
                      <div>
                        <p className="font-medium">Duration</p>
                        <p className="text-gray-600">{selectedTour.duration} days</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <User className="h-4 w-4 mr-2 mt-1 text-gray-500" />
                      <div>
                        <p className="font-medium">Group Size</p>
                        <p className="text-gray-600">
                          {bookingDetails.groupSize || 1}{" "}
                          {(bookingDetails.groupSize || 1) === 1 ? "participant" : "participants"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4 mt-4">
                    <div className="flex justify-between text-sm">
                      <span>Price per person</span>
                      <span>{formatPrice(selectedTour.price)}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-2">
                      <span>Participants</span>
                      <span>× {bookingDetails.groupSize || 1}</span>
                    </div>

                    <div className="flex justify-between font-bold text-lg mt-4 pt-4 border-t">
                      <span>Total</span>
                      <span>{formatPrice(calculateTotalPrice())}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 text-right">Inclusive of all taxes and fees</p>
                  </div>

                  {step === 1 && (
                    <Button
                      onClick={handleNextStep}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-4"
                      disabled={
                        !bookingDetails.guestName || !bookingDetails.email || !bookingDetails.phone || !isOtpVerified
                      }
                    >
                      Continue to Tour Details
                    </Button>
                  )}
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
          setIsDisclaimerOpen(false)
          proceedToPayment()
        }}
        title="Tour Booking Disclaimer"
        message={
          <>
            <p>Please review the following information before proceeding:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>
                You are booking {bookingDetails.groupSize}{" "}
                {bookingDetails.groupSize === 1 ? "participant" : "participants"} for {selectedTour?.title}
              </li>
              <li>Total amount: {formatPrice(calculateTotalPrice())}</li>
              <li>Cancellation policies apply as per our terms and conditions</li>
              <li>Payment is required to confirm your booking</li>
            </ul>
          </>
        }
      />

      {isBookingConfirmed && (
        <TourBookingConfirmationDialog
          isOpen={isBookingConfirmed}
          onClose={() => {
            setIsBookingConfirmed(false)
            navigate("/", { replace: true }) // Replace current history entry with home page
            window.history.pushState(null, null, "/") // Ensure back button doesn't work
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
  )
}

export default TourBookingPage

