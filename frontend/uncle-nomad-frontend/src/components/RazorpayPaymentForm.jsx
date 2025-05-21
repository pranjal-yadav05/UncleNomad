"use client";

import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Button } from "./ui/button";
import BookingConfirmationDialog from "../modals/BookingConfirmationDialog";
import { useRef } from "react";
import FailedTransactionModal from "../modals/FailedTransactionModal";
import { loadScript } from "../utils/razorpay-utils";

const RazorpayPaymentForm = ({
  paymentData,
  bookingForm,
  setIsModalOpen,
  setBookingDetails,
  bookingDetails,
  isLoading,
  onPaymentSuccess,
  onPaymentFailure,
  closeModal,
  setIsBookingConfirmed,
  onClose,
  setChecking,
  setIsLoading,
}) => {
  const [error, setError] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isFailedModalOpen, setIsFailedModalOpen] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState("initializing");
  // Prevent multiple initializations
  const isInitialized = useRef(false);
  const paymentProcessed = useRef(false);

  const handleCloseConfirmation = useCallback(() => {
    setShowConfirmation(false);
    setIsBookingConfirmed(false);
    onClose?.();
  }, [onClose, setIsBookingConfirmed]);

  const handlePaymentFailure = useCallback(
    (errorMsg) => {
      // Only handle failure if we haven't already processed a successful payment
      if (!paymentProcessed.current) {
        setError(errorMsg);
        setIsFailedModalOpen(true);
        onPaymentFailure?.(errorMsg);
      }
    },
    [onPaymentFailure]
  );

  useEffect(() => {
    if (!paymentData || !paymentData.orderId) {
      handlePaymentFailure(
        "Payment initialization failed: Missing payment details"
      );
      return;
    }

    // Prevent multiple initializations
    if (isInitialized.current) {
      console.warn("Razorpay already initialized, skipping...");
      return;
    }
    isInitialized.current = true;

    setIsLoading(true);
    setPaymentStatus("initializing_payment");

    const initializeRazorpay = async () => {
      try {
        // Load Razorpay script
        const res = await loadScript(
          "https://checkout.razorpay.com/v1/checkout.js"
        );
        if (!res) {
          throw new Error("Razorpay SDK failed to load");
        }

        setIsLoading(false);
        closeModal?.();
        setIsModalOpen?.(false);
        setPaymentStatus("idle");

        // Configure Razorpay options
        const options = {
          key: process.env.REACT_APP_RAZORPAY_KEY_ID,
          amount: paymentData.amount * 100, // Razorpay expects amount in paise
          currency: "INR",
          name: "Uncle Nomad",
          description: "Booking Payment",
          order_id: paymentData.orderId,
          handler: async (response) => {
            try {
              // Mark as processed to prevent duplicate handling
              paymentProcessed.current = true;

              // Show checking payment modal
              setChecking(true);
              setPaymentStatus("processing");

              const selectedRooms = Object.entries(bookingForm.selectedRooms)
                .filter(([roomId, quantity]) => quantity > 0)
                .map(([roomId, quantity]) => ({
                  roomId,
                  quantity,
                  checkIn: bookingForm.checkIn,
                  checkOut: bookingForm.checkOut,
                }));

              const bookingData = {
                rooms: selectedRooms,
                guestName: bookingForm.guestName,
                ...(bookingForm.email && { email: bookingForm.email }),
                phone: bookingForm.phone,
                numberOfGuests: bookingForm.numberOfGuests,
                numberOfChildren: bookingForm.numberOfChildren,
                mealIncluded: bookingForm.mealIncluded,
                extraBeds: bookingForm.extraBeds,
                specialRequests: bookingForm.specialRequests,
                checkIn: bookingForm.checkIn,
                checkOut: bookingForm.checkOut,
                totalPrice: bookingForm.totalPrice,
                paymentReference: response.razorpay_payment_id,
              };

              setBookingDetails(bookingData);

              const authToken = localStorage.getItem("authToken");

              const bookingResponse = await fetch(
                `${process.env.REACT_APP_API_URL}/api/bookings/book`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "x-api-key": process.env.REACT_APP_API_KEY,
                    Authorization: `Bearer ${authToken}`,
                  },
                  body: JSON.stringify(bookingData),
                }
              );

              if (!bookingResponse.ok) {
                throw new Error("Failed to create booking");
              }

              const bookingResult = await bookingResponse.json();

              const bookingUpdate = await axios.post(
                `${process.env.REACT_APP_API_URL}/api/payments/verify`,
                {
                  orderId: paymentData.orderId,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                },
                {
                  headers: {
                    "x-api-key": process.env.REACT_APP_API_KEY,
                    Authorization: `Bearer ${authToken}`,
                  },
                }
              );

              setBookingDetails(bookingUpdate.data.data.bookingUpdate);

              // Hide checking modal
              setChecking(false);

              setShowConfirmation(true);
              setIsBookingConfirmed(true);
            } catch (error) {
              // Hide checking modal in case of error
              setChecking(false);
              handlePaymentFailure(
                error.message || "Payment verification failed"
              );
            }
          },
          prefill: {
            name: bookingForm.guestName,
            ...(bookingForm.email && { email: bookingForm.email }),
            contact: bookingForm.phone,
          },
          notes: {
            booking_id: bookingForm.bookingId,
          },
          theme: {
            color: "#3399cc",
          },
          modal: {
            ondismiss: () => {
              // Only handle if we haven't already processed a success
              if (!paymentProcessed.current) {
                handlePaymentFailure("Payment window closed");
              }
            },
          },
        };

        // Create Razorpay instance and open payment form
        const razorpay = new window.Razorpay(options);
        razorpay.open();
      } catch (error) {
        setIsLoading(false);
        handlePaymentFailure(error.message || "Failed to initialize payment");
      }
    };

    initializeRazorpay();

    return () => {};
  }, [
    paymentData,
    bookingForm,
    handlePaymentFailure,
    setIsLoading,
    closeModal,
    setIsModalOpen,
    setChecking,
    setBookingDetails,
    setIsBookingConfirmed,
  ]);

  if (error) {
    return (
      <div className="text-center text-red-600">
        <p className="font-medium">{error}</p>
        <Button
          onClick={() => window.location.reload()}
          className="mt-4 bg-brand-purple hover:bg-brand-purple/90 text-white">
          Try Again
        </Button>
        <FailedTransactionModal
          open={isFailedModalOpen}
          onClose={() => setIsFailedModalOpen(false)}
          errorMessage={error}
        />
      </div>
    );
  }

  if (showConfirmation && bookingDetails) {
    return (
      <BookingConfirmationDialog
        booking={bookingDetails}
        onClose={handleCloseConfirmation}
      />
    );
  }

  if (paymentStatus === "initializing") {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-purple mx-auto mb-4"></div>
          <p className="text-lg font-semibold">
            Initializing Payment Gateway...
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Please wait, this may take a moment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center w-full">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-purple mx-auto"></div>
      <p className="mt-4 font-medium">Loading payment gateway...</p>
      <p className="text-sm text-gray-500 mt-2">
        Please do not refresh the page.
      </p>
    </div>
  );
};

export default RazorpayPaymentForm;
