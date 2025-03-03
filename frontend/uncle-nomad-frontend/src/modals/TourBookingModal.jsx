"use client"

import { useState, useCallback, useEffect } from "react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Loader2 } from "lucide-react" // Import loading spinner
import TourPaymentForm from "../components/TourPaymentForm"
import TourBookingConfirmationDialog from "../modals/TourBookingConfirmationDialog"
import { useNavigate } from "react-router-dom"
import FailedTransactionModal from "./FailedTransactionModal"
import { Alert, AlertDescription, AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogCancel } from "../components/ui/alert"
import CheckingPaymentModal from "./CheckingPaymentModal"

export default function TourBookingModal({ isOpen, onClose, selectedTour, setIsCheckingOpen, isCheckingOpen }) {
  const [bookingDetails, setBookingDetails] = useState({
    tourId: "",
    guestName: "",
    email: "",
    phone: "",
    groupSize: 1,
    specialRequests: "",
    totalAmount: 0,
  })

  const navigate = useNavigate();

  const [validationErrors, setValidationErrors] = useState({})
  const [paymentStep, setPaymentStep] = useState(false)
  const [bookingData, setBookingData] = useState(null)
  const [paymentData, setPaymentData] = useState(null)
  const [modalOpen, setModalOpen] = useState(true)
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false)
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isPaymentFailedOpen, setIsPaymentFailedOpen] = useState(false);
  const [paymentErrorMessage, setPaymentErrorMessage] = useState("");

  // OTP related states
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpResendTimer, setOtpResendTimer] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setModalOpen(true);
    }
  }, [isOpen]);

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

  const validateEmail = useCallback((email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  }, []);

  const validatePhone = useCallback((phone) => {
    const re = /^[0-9]{10}$/;
    return re.test(String(phone));
  }, []);

  const validateForm = useCallback(() => {
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
    
    // Check if group size is within limits
    const availableSlots = selectedTour.groupSize - selectedTour.bookedSlots;
    if (bookingDetails.groupSize < 1) {
      errors.groupSize = "Group size must be at least 1";
    } else if (bookingDetails.groupSize > availableSlots) {
      errors.groupSize = `Only ${availableSlots} slots available for this tour`;
    }
    
    // Check if OTP is verified
    if (!isOtpVerified) {
      errors.otp = "Email verification is required before proceeding";
    }
    
    setIsLoading(false)
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [bookingDetails, validateEmail, validatePhone, selectedTour, isOtpVerified]);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
  
    // Allow any input for groupSize without immediate restrictions
    if (id === "groupSize") {
      // Convert to number but don't restrict yet
      const numValue = parseInt(value, 10) || ""; // Allow empty string if parsing fails
      setBookingDetails((prev) => ({ ...prev, [id]: numValue }));
    } else {
      // For all other input fields (name, email, phone, specialRequests)
      setBookingDetails((prev) => ({ ...prev, [id]: value }));
    }
  
    if (validationErrors[id]) {
      setValidationErrors((prev) => ({ ...prev, [id]: "" }));
    }
  };

  const handleEmailChange = (e) => {
    // Reset OTP verification when email changes
    if (isOtpSent || isOtpVerified) {
      setIsOtpSent(false);
      setIsOtpVerified(false);
      setOtp("");
      setOtpError(null);
    }
    setBookingDetails(prev => ({ ...prev, email: e.target.value }));
    if (validationErrors.email) {
      setValidationErrors(prev => ({ ...prev, email: "" }));
    }
  };

  const sendOtp = async (e) => {
    e.preventDefault();
    
    // Validate email before sending OTP
    if (!validateEmail(bookingDetails.email)) {
      setOtpError("Please enter a valid email address");
      return;
    }
    
    setIsSendingOtp(true);
    setOtpError(null);
    
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": process.env.REACT_APP_API_KEY },
        body: JSON.stringify({ email: bookingDetails.email })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to send OTP");
      }
      
      setIsOtpSent(true);
      setOtpResendTimer(60); // 60 seconds countdown for resend
    } catch (error) {
      setOtpError(error.message || "Failed to send OTP. Please try again.");
    } finally {
      setIsSendingOtp(false);
    }
  };

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
        headers: { "Content-Type": "application/json", "x-api-key": process.env.REACT_APP_API_KEY },
        body: JSON.stringify({ email: bookingDetails.email, otp })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Invalid OTP");
      }
      
      setIsOtpVerified(true);
      if (validationErrors.otp) {
        setValidationErrors(prev => ({ ...prev, otp: "" }));
      }
    } catch (error) {
      setOtpError(error.message || "Invalid OTP. Please try again.");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    if (!isOtpVerified) {
      setValidationErrors(prev => ({ ...prev, otp: "Email verification is required before proceeding" }));
      setIsLoading(false);
      return;
    }
    
    if (validateForm()) {
      // Show disclaimer dialog instead of proceeding directly
      setIsDisclaimerOpen(true);
    } else {
      setIsLoading(false);
    }
  };

  const proceedToPayment = async () => {
    try {
      const totalAmount = selectedTour.price * Number.parseInt(bookingDetails.groupSize);

      const bookingData = {
        ...bookingDetails,
        totalAmount: totalAmount,
        bookingDate: new Date(),
        tourId: selectedTour._id,
      };

      if (!bookingData.tourId || !bookingData.groupSize || !bookingData.bookingDate || !bookingData.guestName || !bookingData.email || !bookingData.phone) {
        console.error("Missing required fields:", bookingData);
        alert("Please make sure all required fields are filled in.");
        return;
      }

      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/tours/${selectedTour._id}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": process.env.REACT_APP_API_KEY },
        body: JSON.stringify(bookingData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create booking");
      }

      const result = await response.json();
      setBookingData(result.booking);
      setPaymentStep(true);

    } catch (error) {
      console.error("Booking Error:", error);
      alert("Failed to create booking: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = async (paymentResponse) => {
    try {
      setIsCheckingOpen(true)
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/tours/booking/${bookingData._id}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json", "x-api-key": process.env.REACT_APP_API_KEY },
        }
      );


      if (!response.ok) {
        throw new Error("Failed to retrieve booking details");
      }

      const updatedBooking = await response.json();

      setPaymentData({
        ...paymentData,
        confirmedBooking: {
          ...updatedBooking,
          tourName: selectedTour.title,
        },
      });
      setIsCheckingOpen(false)
      setIsConfirmationOpen(true);  // Show confirmation dialog after successful payment
    } catch (error) {
      console.error("Booking confirmation error:", error);
      onClose()
      alert("Failed to confirm booking. Please contact support.");
    }
  };

  const handleClose = () => {
    setPaymentStep(false);
    setBookingData(null);
    setBookingDetails({
      tourId: "",
      guestName: "",
      email: "",
      phone: "",
      groupSize: 1,
      specialRequests: "",
      totalAmount: 0,
    });
    setValidationErrors({});
    setIsOtpSent(false);
    setIsOtpVerified(false);
    setOtp("");
    setOtpError(null);
    onClose();
  };

  const handlePaymentFormClose = () => {
    setModalOpen(false);
  };

  const handlePaymentComplete = (success) => {
    if (success) {
      handlePaymentSuccess(success);
    } else {
      handleClose();
    }
  };

  const handleConfirmationClose = () => {
    setIsConfirmationOpen(false);

    // Redirect to home
    navigate("/", { replace: true });

    // Prevent back navigation
    window.history.pushState(null, null, "/");
    window.onpopstate = () => {
      navigate("/", { replace: true });
    };
  };

  const handleAgreeToDisclaimer = () => {
    setIsDisclaimerOpen(false);
    proceedToPayment();
  };

  const handleCancelDisclaimer = () => {
    setIsDisclaimerOpen(false);
    setIsLoading(false);
  };

  // Generate summary text for verification status
  const getVerificationStatus = () => {
    if (isOtpVerified) return <span className="text-green-500 flex items-center text-sm">✓ Email verified</span>;
    if (isOtpSent) return <span className="text-amber-500 flex items-center text-sm">OTP sent to your email</span>;
    return null;
  };

  return (
    <>
    <Dialog open={isOpen && modalOpen} onOpenChange={handleClose}>
      <DialogContent className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] sm:w-[500px] max-h-[90vh] overflow-y-auto bg-white p-4 sm:p-6 rounded-lg shadow-xl">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-2xl font-bold text-gray-900">
            {paymentStep ? "Complete Payment" : "Book Your Tour"}
          </DialogTitle>
          <div className="mt-4">
            {selectedTour && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-lg text-gray-900 mb-2">{selectedTour.title}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-brand-purple font-medium">₹{selectedTour.price}</div>
                  <div className="text-gray-600">{selectedTour.duration} days</div>
                </div>
              </div>
            )}
          </div>
        </DialogHeader>

        {paymentStep ? (
          <TourPaymentForm
            setIsCheckingOpen={setIsCheckingOpen}
            paymentData={{
              amount: selectedTour.price * bookingDetails.groupSize,
              tourId: selectedTour._id,
              bookingId: bookingData._id, 
            }}
            bookingForm={bookingDetails}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentFailure={(error) => {
              setPaymentErrorMessage(error);
              setIsPaymentFailedOpen(true);
              setPaymentStep(false);
              setModalOpen(true);
            }}
            onClose={handlePaymentFormClose}
          />
        ) : (
          <form onSubmit={handleBookingSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="guestName" className="text-sm font-medium text-gray-900">
                Full Name
              </Label>
              <Input
                id="guestName"
                type="text"
                required
                value={bookingDetails.guestName}
                onChange={handleInputChange}
                className="w-full border-gray-200 focus:ring-2 focus:ring-brand-purple"
              />
              {validationErrors.guestName && <p className="text-red-500 text-sm mt-1">{validationErrors.guestName}</p>}
            </div>

            <div className="space-y-3">
              {/* Email field with verification button */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-900">
                  Email
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="email"
                    type="email"
                    required
                    value={bookingDetails.email}
                    onChange={handleEmailChange}
                    className="w-full border-gray-200 focus:ring-2 focus:ring-brand-purple"
                    disabled={isOtpVerified || isSendingOtp}
                    placeholder="Enter your email"
                  />
                  <Button 
                    type="button"
                    onClick={sendOtp} 
                    disabled={!validateEmail(bookingDetails.email) || isSendingOtp || isOtpVerified || otpResendTimer > 0}
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
                {validationErrors.email && <p className="text-red-500 text-sm">{validationErrors.email}</p>}
                {getVerificationStatus()}
              </div>

              {/* OTP field */}
              {isOtpSent && !isOtpVerified && (
                <div className="bg-gray-50 p-3 rounded-lg space-y-3">
                  <div className="text-sm text-gray-700">
                    Enter the verification code sent to <span className="font-medium">{bookingDetails.email}</span>
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
                    <Button 
                      type="button" 
                      onClick={verifyOtp}
                      disabled={!otp.trim() || isVerifyingOtp}
                    >
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
              <Label htmlFor="phone" className="text-sm font-medium text-gray-900">
                Phone Number
              </Label>
              <Input
                id="phone"
                type="tel"
                required
                value={bookingDetails.phone}
                onChange={handleInputChange}
                className="w-full border-gray-200 focus:ring-2 focus:ring-brand-purple"
                placeholder="10-digit phone number"
                maxLength={10}
              />
              {validationErrors.phone && <p className="text-red-500 text-sm mt-1">{validationErrors.phone}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="groupSize" className="text-sm font-medium text-gray-900">
                Number of Participants
              </Label>
              <Input
                id="groupSize"
                type="number"
                min="1"
                required
                value={bookingDetails.groupSize}
                onChange={handleInputChange}
                className="w-full border-gray-200 focus:ring-2 focus:ring-brand-purple"
              />
              <div className="text-sm text-gray-500">
                Available slots: {selectedTour.groupSize - selectedTour.bookedSlots}
              </div>
              {validationErrors.groupSize && <p className="text-red-500 text-sm mt-1">{validationErrors.groupSize}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialRequests" className="text-sm font-medium text-gray-900">
                Special Requests (Optional)
              </Label>
              <textarea
                id="specialRequests"
                className="w-full border border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-brand-purple"
                rows="3"
                value={bookingDetails.specialRequests}
                onChange={handleInputChange}
              />
            </div>

            {validationErrors.otp && (
              <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800">
                <AlertDescription>{validationErrors.otp}</AlertDescription>
              </Alert>
            )}

            <DialogFooter className="flex gap-3 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 border-gray-200 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !isOtpVerified}
                className={`flex-1 ${isOtpVerified 
                  ? "bg-brand-purple hover:bg-brand-purple/90" 
                  : "bg-gray-400 cursor-not-allowed"}`}
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
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>

    {/* Disclaimer Dialog */}
    <AlertDialog open={isDisclaimerOpen} onOpenChange={setIsDisclaimerOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Tour Booking Disclaimer</AlertDialogTitle>
          <AlertDescription>
            <p>Please review the following information before proceeding:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>You are booking {bookingDetails.groupSize} {bookingDetails.groupSize === 1 ? 'participant' : 'participants'} for {selectedTour?.title}</li>
              <li>Total amount: ₹{selectedTour?.price * bookingDetails.groupSize}</li>
              <li>Cancellation policies apply as per our terms and conditions</li>
              <li>Payment is required to confirm your booking</li>
            </ul>
          </AlertDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancelDisclaimer}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleAgreeToDisclaimer}>Agree & Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    {/* Confirmation Dialog */}
    {isConfirmationOpen && (
      <TourBookingConfirmationDialog
        isOpen={true}
        tourBooking={paymentData.confirmedBooking}
        onClose={handleConfirmationClose}
      />
    )}
    
    {isCheckingOpen && (
      <CheckingPaymentModal
        isOpen={isCheckingOpen}
        onClose={()=>setIsCheckingOpen(false)}
      />
    )}


    <FailedTransactionModal
      open={isPaymentFailedOpen}
      onClose={() => setIsPaymentFailedOpen(false)}
      errorMessage={paymentErrorMessage}
    />
    </>
  );
}