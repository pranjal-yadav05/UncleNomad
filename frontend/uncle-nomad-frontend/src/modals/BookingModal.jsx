"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { CalendarDaysIcon, UserIcon, HomeIcon } from "@heroicons/react/24/outline"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog"
import { useNavigate } from "react-router-dom"
import DisclaimerDialog from "./DisclaimerDialog"
import { Loader2 } from "lucide-react"
import RazorpayPaymentForm from "../components/RazorpayPaymentForm"
import CheckingPaymentModal from "./CheckingPaymentModal"
import FailedTransactionModal from "../modals/FailedTransactionModal"

export default function BookingModal({
  isOpen,
  onClose,
  bookingForm,
  setBookingForm,
  isLoading,
  setIsLoading,
  availableRooms,
  handleRoomSelection,
  error,
  setError,
  setIsModalOpen,
  setIsBookingConfirmed,
  setChecking,
  setBookingDetails,
  bookingDetails,
  setIsBookingFailed,
}) {
  const navigate = useNavigate()
  const [paymentData, setPaymentData] = useState(null)
  const [isPaymentActive, setIsPaymentActive] = useState(false)
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(false)
  const [isFailedModalOpen, setIsFailedModalOpen] = useState(false)
  // Start from step 1 since room selection is now on RoomSelectionPage
  const [step, setStep] = useState(1)
  const [validationErrors, setValidationErrors] = useState({})
  const [showError, setShowError] = useState(true)
  
  // OTP related states
  const [otp, setOtp] = useState("")
  const [isOtpSent, setIsOtpSent] = useState(false)
  const [isOtpVerified, setIsOtpVerified] = useState(false)
  const [otpError, setOtpError] = useState(null)
  const [isSendingOtp, setIsSendingOtp] = useState(false)
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)
  const [otpResendTimer, setOtpResendTimer] = useState(0)

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

  // Calculate total room capacity
  const calculateTotalCapacity = () => {
    return availableRooms.reduce((sum, room) => {
      const isDorm = room.type.toLowerCase() === "dorm"
      const currentCount = bookingForm.selectedRooms[room._id] || 0
      return sum + (isDorm ? currentCount : room.capacity * currentCount)
    }, 0)
  }

  const totalCapacity = calculateTotalCapacity()

  const handlePaymentSuccess = (response) => {
    setIsPaymentActive(false)
    onClose()
  }

  const handlePaymentFailure = (errorMsg) => {
    setError(errorMsg)
    setIsBookingFailed(true)
    setIsFailedModalOpen(true)
    setIsPaymentActive(false)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setBookingForm((prev) => ({
      ...prev,
      [name]: value,
    }))

    if (validationErrors[name]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: "",
      }))
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

    setBookingForm((prev) => ({ ...prev, email: e.target.value }))

    if (validationErrors.email) {
      setValidationErrors((prev) => ({ ...prev, email: "" }))
    }
  }

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(String(email).toLowerCase())
  }

  const sendOtp = async (e) => {
    e.preventDefault()

    // Validate email before sending OTP
    if (!validateEmail(bookingForm.email)) {
      setOtpError("Please enter a valid email address")
      return
    }

    setIsSendingOtp(true)
    setOtpError(null)

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": process.env.REACT_APP_API_KEY },
        body: JSON.stringify({ email: bookingForm.email }),
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
    e.preventDefault();
  
    if (!otp.trim()) {
      setOtpError("Please enter the OTP");
      return;
    }
  
    setIsVerifyingOtp(true);
    setOtpError(null);
  
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          "x-api-key": process.env.REACT_APP_API_KEY 
        },
        body: JSON.stringify({ 
          email: bookingForm.email, 
          otp,
          name: bookingForm.guestName,
          phone: bookingForm.phone
        }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Invalid OTP");
      }
  
      const data = await response.json();
      
      // Store the auth token in localStorage
      localStorage.setItem('authToken', data.token);
      localStorage.setItem("userName", data.user.name);
      localStorage.setItem("userEmail", data.user.email);
      
      window.dispatchEvent(new Event("storage"));

      setIsOtpVerified(true);
      if (validationErrors.otp) {
        setValidationErrors((prev) => ({ ...prev, otp: "" }));
      }
    } catch (error) {
      setOtpError(error.message || "Invalid OTP. Please try again.");
    } finally {
      setIsVerifyingOtp(false);
    }
  };
  
  // Generate summary text for verification status
  const getVerificationStatus = () => {
    if (isOtpVerified) return <span className="text-green-500 flex items-center text-sm">✓ Email verified</span>
    if (isOtpSent) return <span className="text-amber-500 flex items-center text-sm">OTP sent to your email</span>
    return null
  }

  const handleNumberChange = (e) => {
    const { name, value } = e.target

    setBookingForm((prev) => ({
      ...prev,
      [name]: value, // Let them type freely
    }))

    // No auto-correction, no auto-fill, no validation here
  }

  // Effect to validate numberOfGuests when rooms change
  useEffect(() => {
    const currentGuests = bookingForm.numberOfGuests
    if (currentGuests > totalCapacity) {
      setValidationErrors((prev) => ({
        ...prev,
        numberOfGuests: `Maximum capacity is ${totalCapacity} guests for selected rooms`,
      }))

      setBookingForm((prev) => ({
        ...prev,
        numberOfGuests: totalCapacity,
      }))

      // Remove error when auto-adjusted
      setTimeout(() => {
        setValidationErrors((prev) => {
          const newErrors = { ...prev }
          delete newErrors.numberOfGuests
          return newErrors
        })
      }, 500)
    }
  }, [bookingForm.numberOfGuests, totalCapacity, setBookingForm])

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target
    setBookingForm((prev) => ({
      ...prev,
      [name]: checked,
    }))
  }

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="guestName">Full Name</Label>
        <Input id="guestName" name="guestName" value={bookingForm.guestName} onChange={handleInputChange} required />
        {validationErrors.guestName && <p className="text-sm text-red-500">{validationErrors.guestName}</p>}
      </div>

      <div className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="flex gap-2">
            <Input
              id="email"
              name="email"
              type="email"
              value={bookingForm.email}
              onChange={handleEmailChange}
              required
              disabled={isOtpVerified || isSendingOtp}
              className={validationErrors.email ? "border-red-500" : ""}
            />
            <Button
              type="button"
              onClick={sendOtp}
              disabled={!validateEmail(bookingForm.email) || isSendingOtp || isOtpVerified || otpResendTimer > 0}
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
          </div>
          {validationErrors.email && <p className="text-sm text-red-500">{validationErrors.email}</p>}
          {getVerificationStatus()}
        </div>

        {/* OTP field */}
        {isOtpSent && !isOtpVerified && (
          <div className="bg-gray-50 p-3 rounded-lg space-y-3">
            <div className="text-sm text-gray-700">
              Enter the verification code sent to <span className="font-medium">{bookingForm.email}</span>
            </div>
            <div className="flex gap-2">
              <Input
                id="otp"
                type="text"
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full border-gray-200 focus:ring-2 focus:ring-brand-purple"
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
        <Input id="phone" name="phone" type="tel" value={bookingForm.phone} onChange={handleInputChange} required />
        {validationErrors.phone && <p className="text-sm text-red-500">{validationErrors.phone}</p>}
      </div>
      <div className="flex gap-2">
        <Button onClick={() => onClose()} variant="outline" className="w-full">
          Back
        </Button>

        <Button
          onClick={() => {
            // Validate step 1 fields
            const errors = {}
            if (!bookingForm.guestName.trim()) {
              errors.guestName = "Full name is required"
            }
            if (!validateEmail(bookingForm.email)) {
              errors.email = "Please enter a valid email address"
            }
            if (!bookingForm.phone.trim()) {
              errors.phone = "Phone number is required"
            }
            if (!isOtpVerified) {
              errors.email = "Email verification is required before proceeding"
            }

            setValidationErrors(errors)

            if (Object.keys(errors).length === 0) {
              setStep(2)
            }
          }}
          variant="custom"
          className="w-full text-white bg-brand-purple hover:bg-brand-purple/90"
          disabled={!bookingForm.guestName || !bookingForm.email || !bookingForm.phone || !isOtpVerified}
        >
          Next
        </Button>
      </div>
    </div>
  )

  const validateStep2 = () => {
    const errors = {}

    if (!bookingForm.numberOfGuests || isNaN(bookingForm.numberOfGuests) || bookingForm.numberOfGuests < 1) {
      errors.numberOfGuests = "At least 1 guest is required."
    } else if (bookingForm.numberOfGuests > totalCapacity) {
      errors.numberOfGuests = `Maximum capacity is ${totalCapacity} guests for selected rooms.`
    }

    // Ensure email is verified before proceeding
    if (!isOtpVerified) {
      errors.otp = "Email verification is required before proceeding"
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0 // Return true if no errors
  }

  const handleStep2Submit = async (e = null) => {
    if (e) e.preventDefault() // Prevent default form submission

    try {
      setIsLoading(true)

      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        throw new Error('You must verify your email before proceeding');
      }

      // Calculate total amount
      const totalAmount = availableRooms.reduce((sum, room) => {
        const count = bookingForm.selectedRooms[room._id] || 0
        return sum + room.price * count
      }, 0)

      // Prepare booking data
      const bookingData = {
        ...bookingForm,
        totalAmount,
        rooms: Object.entries(bookingForm.selectedRooms).map(([roomId, quantity]) => ({
          roomId,
          quantity,
          checkIn: bookingForm.checkIn,
          checkOut: bookingForm.checkOut,
        })),
      }

      setBookingForm(bookingData)

      const paymentResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/payments/initiate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", 
          "x-api-key": process.env.REACT_APP_API_KEY,
          "Authorization": `Bearer ${authToken}` 
        },
        credentials: "include", // Include cookies for session
        body: JSON.stringify({
          bookingData: bookingData,
          amount: totalAmount,
          customerId: bookingForm.email,
          email: bookingForm.email,
          phone: bookingForm.phone,
        }),
      })

      if (!paymentResponse.ok) {
        console.error("Payment initiation failed with status:", paymentResponse.status)
        let errorData
        try {
          errorData = await paymentResponse.json()
          console.error("Payment error details:", errorData)
        } catch (jsonError) {
          console.error("Failed to parse error response:", jsonError)
          throw new Error("Failed to initialize payment: Invalid server response")
        }
        throw new Error(errorData.message || "Failed to initialize payment")
      }

      const paymentData = await paymentResponse.json()

      if (paymentData.status === "SUCCESS" && paymentData.data) {
        setPaymentData(paymentData.data)
        setIsPaymentActive(true)

      } else {
        throw new Error("Payment initialization failed")
      }
    } catch (error) {
      console.error("Booking/Payment Error:", error)
      setError("Failed to process booking: " + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisclaimer = () => {
    if (!validateStep2()) {
      return // Stop here if validation fails
    }

    setIsDisclaimerOpen(true) // Open disclaimer modal
  }

  const renderStep2 = () => (
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
            className={validationErrors.numberOfGuests ? "border-red-500" : ""}
          />
          <span className="ml-2 text-xs text-gray-500">Max: {totalCapacity}</span>
        </div>
        {validationErrors.numberOfGuests && (
          <p className="text-sm text-red-500 mt-1">{validationErrors.numberOfGuests}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="numberOfChildren">Number of Children</Label>
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
          className="h-4 w-4 rounded border-gray-300 text-brand-purple focus:ring-brand-purple"
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
            className="mt-2 text-sm text-red-600 underline hover:text-red-700"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="flex gap-2">
        <Button onClick={() => setStep(1)} variant="outline" className="w-full">
          Back
        </Button>
        <Button
          onClick={handleDisclaimer} // Runs validation first
          className="w-full bg-brand-purple hover:bg-brand-purple/90"
          disabled={isLoading || !isOtpVerified}
        >
          {isLoading ? "Processing..." : "Proceed to Payment"}
        </Button>
      </div>
    </div>
  )

  // Render payment form when needed
  const renderPaymentForm = () => {
    if (!isPaymentActive || !paymentData) return null

    return (
      <RazorpayPaymentForm
        setChecking={setChecking}
        closeModal={onClose}
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
    )
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-[95vw] sm:max-w-[500px] bg-white p-4 max-h-[90vh] overflow-y-auto rounded-lg shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Booking Details</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 px-2 sm:px-0">
            <div className="text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <CalendarDaysIcon className="h-4 w-4" />
                <span>
                  {format(new Date(bookingForm.checkIn), "PPP")} - {format(new Date(bookingForm.checkOut), "PPP")}
                </span>
              </div>
            </div>

            {bookingForm.numberOfGuests > 0 && (
              <div className="text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4" />
                  <span>
                    {bookingForm.numberOfGuests} guest{bookingForm.numberOfGuests > 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            )}

            {Object.entries(bookingForm.selectedRooms).map(([roomId, count]) => {
              const room = availableRooms.find((r) => r._id === roomId)
              return count > 0 && room ? (
                <div key={roomId} className="text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <HomeIcon className="h-4 w-4" />
                    <span>
                      {room.type === "Dorm"
                        ? `${count} bed${count !== 1 ? "s" : ""} in Shared Dorm`
                        : `${count} Private ${room.type} Room${count > 1 ? "s" : ""}`}
                    </span>
                  </div>
                </div>
              ) : null
            })}

            <div className="overflow-y-auto max-h-[calc(90vh-200px)] sm:max-h-none">
              {!isPaymentActive && step === 1 && renderStep1()}
              {!isPaymentActive && step === 2 && renderStep2()}
              {isPaymentActive && renderPaymentForm()}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <DisclaimerDialog
        isOpen={isDisclaimerOpen}
        onClose={() => setIsDisclaimerOpen(false)}
        onAgree={() => {
          setIsDisclaimerOpen(false)
          handleStep2Submit() // Proceed to payment after user agrees
        }}
      />

      <FailedTransactionModal
        open={isFailedModalOpen}
        onClose={() => setIsFailedModalOpen(false)}
        errorMessage={error}
      />
    </>
  )
}

