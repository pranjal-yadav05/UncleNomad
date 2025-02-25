"use client"

import { useState, useCallback, useEffect } from "react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import TourPaymentForm from "./TourPaymentForm"
import TourBookingConfirmationDialog from "./TourBookingConfirmationDialog"

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

  const [validationErrors, setValidationErrors] = useState({})
  const [paymentStep, setPaymentStep] = useState(false)
  const [bookingData, setBookingData] = useState(null)
  const [paymentData, setPaymentData] = useState(null)
  const [modalOpen, setModalOpen] = useState(true)
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false)  // New state for confirmation dialog
  const [isLoading, setIsLoading] = useState(false)
  

  useEffect(() => {
    if (isOpen) {
      setModalOpen(true);
    }
  }, [isOpen]);

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
    if (bookingDetails.groupSize < 1) {
      errors.groupSize = "Group size must be at least 1";
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [bookingDetails, validateEmail, validatePhone]);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setBookingDetails((prev) => ({ ...prev, [id]: value }));
    if (validationErrors[id]) {
      setValidationErrors((prev) => ({ ...prev, [id]: "" }));
    }
  };

  const handleBookingSubmit = async (e) => {
    setIsLoading(true)
    e.preventDefault();
    if (validateForm()) {
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
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bookingData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to create booking");
        }

        const result = await response.json();
        setBookingData(result.booking);
        setIsLoading(false)
        setPaymentStep(true);

      } catch (error) {
        console.error("Booking Error:", error);
        alert("Failed to create booking: " + error.message);
      }
    }
  };

  const handlePaymentSuccess = async (paymentResponse) => {
    try {
      setIsCheckingOpen(true)
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/tours/booking/${bookingData._id}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to retrieve booking details");
      }

      const updatedBooking = await response.json();

      console.log("detaislsss",bookingDetails)
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
              alert(`Payment failed: ${error}`);
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-900">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={bookingDetails.email}
                  onChange={handleInputChange}
                  className="w-full border-gray-200 focus:ring-2 focus:ring-brand-purple"
                />
                {validationErrors.email && <p className="text-red-500 text-sm mt-1">{validationErrors.email}</p>}
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
                />
                {validationErrors.phone && <p className="text-red-500 text-sm mt-1">{validationErrors.phone}</p>}
              </div>
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
                variant="custom"
                disabled={isLoading}
                className="flex-1 bg-brand-purple hover:bg-brand-purple/90 text-white"
              >
                {isLoading ? "proceeding..." : "Proceed to Payment"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>

    {/* Confirmation Dialog */}
    {isConfirmationOpen && (
          <TourBookingConfirmationDialog
            isOpen={true}
            tourBooking={paymentData.confirmedBooking}
            onClose={() => {
              handleClose();
              setIsConfirmationOpen(false);  // Reset confirmation dialog state
            }}
          />
        )}
    </>
  );
}
