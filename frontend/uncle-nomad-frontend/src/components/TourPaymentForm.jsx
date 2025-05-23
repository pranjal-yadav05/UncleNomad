"use client";

import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Button } from "./ui/button";
import { loadScript } from "../utils/razorpay-utils";

const TourPaymentForm = ({
  paymentData,
  bookingForm,
  onPaymentSuccess,
  onPaymentFailure,
  onClose,
  setIsCheckingOpen,
}) => {
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState("idle");
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const initializationAttempted = useRef(false);
  const paymentGatewayOpened = useRef(false);

  useEffect(() => {
    if (initializationAttempted.current) {
      return;
    }

    let isSubscribed = true;
    initializationAttempted.current = true;

    const initializePayment = async () => {
      try {
        console.log("TourPaymentForm: Initializing payment process...");
        setIsLoading(true);
        setPaymentStatus("initializing_payment");

        const paymentInitData = {
          tourId: paymentData.tourId,
          bookingId: paymentData.bookingId,
          amount: paymentData.amount
            ? Number.parseFloat(paymentData.amount).toFixed(2)
            : 0,
          email:
            bookingForm.email ||
            `${bookingForm.phone.replace(/\D/g, "")}@phone-auth.user`,
          phone: bookingForm.phone
            ? bookingForm.phone.replace(/^\+/, "").replace(/\D/g, "")
            : "",
          guestName: bookingForm.guestName,
          groupSize: bookingForm.groupSize,
          specialRequests: bookingForm.specialRequests,
        };

        console.log(
          "TourPaymentForm: Payment init data prepared:",
          paymentInitData
        );

        if (!paymentInitData.amount || isNaN(paymentInitData.amount)) {
          throw new Error("Invalid payment amount");
        }

        if (!paymentInitData.phone || paymentInitData.phone.length < 5) {
          throw new Error("Invalid phone number");
        }

        const token = localStorage.getItem("authToken");
        console.log(
          "TourPaymentForm: Making API request to initiate payment..."
        );

        const paymentResponse = await axios.post(
          `${process.env.REACT_APP_API_URL}/api/tours/${paymentData.tourId}/initiate-payment`,
          paymentInitData,
          {
            headers: {
              "x-api-key": process.env.REACT_APP_API_KEY,
              Authorization: `Bearer ${token}`,
            },
          }
        );

        console.log(
          "TourPaymentForm: Payment initiation response:",
          paymentResponse.data
        );

        if (!paymentResponse.data.data.orderId) {
          throw new Error("Failed to get order ID");
        }

        // Load Razorpay script
        console.log("TourPaymentForm: Loading Razorpay script...");
        const res = await loadScript(
          "https://checkout.razorpay.com/v1/checkout.js"
        );
        if (!res) {
          throw new Error("Razorpay SDK failed to load");
        }

        console.log("TourPaymentForm: Razorpay script loaded successfully");
        setIsLoading(false);

        // Configure Razorpay options
        const options = {
          key: process.env.REACT_APP_RAZORPAY_KEY_ID,
          amount: paymentResponse.data.data.amount * 100, // Razorpay expects amount in paise
          currency: "INR",
          name: "Uncle Nomad",
          description: "Tour Booking Payment",
          order_id: paymentResponse.data.data.orderId,
          handler: async (response) => {
            try {
              console.log(
                "TourPaymentForm: Payment successful, handling response...",
                response
              );

              // Show checking payment modal
              setIsCheckingPayment(true);
              if (setIsCheckingOpen) {
                setIsCheckingOpen(true);
              }

              setPaymentStatus("processing");

              const token = localStorage.getItem("authToken");
              console.log("TourPaymentForm: Verifying payment with backend...");

              const verificationResponse = await axios.post(
                `${process.env.REACT_APP_API_URL}/api/tours/${paymentData.tourId}/verify-payment`,
                {
                  orderId: paymentResponse.data.data.orderId,
                  bookingId: paymentData.bookingId,
                  tourId: paymentData.tourId,
                  paymentStatus: "SUCCESS",
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                },
                {
                  headers: {
                    "x-api-key": process.env.REACT_APP_API_KEY,
                    Authorization: `Bearer ${token}`,
                  },
                }
              );

              console.log(
                "TourPaymentForm: Payment verification response:",
                verificationResponse.data
              );

              // Hide checking payment modal
              setIsCheckingPayment(false);
              if (setIsCheckingOpen) {
                setIsCheckingOpen(false);
              }

              // Notify success
              setPaymentStatus("success");
              onPaymentSuccess?.(response);
            } catch (error) {
              console.error("Error in payment verification:", error);

              // Hide checking payment modal
              setIsCheckingPayment(false);
              if (setIsCheckingOpen) {
                setIsCheckingOpen(false);
              }

              onPaymentFailure?.(error.message);
            }
          },
          prefill: {
            name: bookingForm.guestName,
            email:
              bookingForm.email ||
              `${bookingForm.phone.replace(/\D/g, "")}@phone-auth.user`,
            contact: bookingForm.phone
              ? bookingForm.phone.replace(/^\+/, "")
              : "",
          },
          notes: {
            bookingId: paymentData.bookingId,
            tourId: paymentData.tourId,
          },
          theme: {
            color: "#3399cc",
          },
          modal: {
            ondismiss: () => {
              console.log("TourPaymentForm: Payment modal dismissed by user");
              // Only handle if we haven't already processed a success
              if (paymentStatus !== "success") {
                onPaymentFailure?.("Payment window closed");
              }
            },
          },
        };

        console.log("TourPaymentForm: Razorpay options configured:", {
          key: options.key,
          orderId: options.order_id,
          amount: options.amount,
        });

        // Create Razorpay instance and open payment form
        console.log("TourPaymentForm: Opening Razorpay payment form...");
        const razorpay = new window.Razorpay(options);
        razorpay.open();
        console.log("TourPaymentForm: Razorpay payment form opened");
      } catch (error) {
        console.error(
          "TourPaymentForm: Error during payment initialization:",
          error
        );
        if (isSubscribed) {
          setError(error.message);
          setIsLoading(false);
          setPaymentStatus("failed");
          onPaymentFailure?.(error.message);
        }
      }
    };

    initializePayment();

    return () => {
      isSubscribed = false;
    };
  }, [
    paymentData,
    bookingForm,
    onPaymentSuccess,
    onPaymentFailure,
    onClose,
    setIsCheckingOpen,
    paymentStatus,
  ]);

  if (error) {
    return (
      <div className="text-center">
        <p className="font-medium text-red-600 mb-4">{error}</p>
        <div className="p-4 bg-red-50 rounded-md text-left mb-4 text-sm text-red-800">
          <p className="font-semibold">Technical details:</p>
          <p>{error}</p>
          <p className="mt-2">Please try the following:</p>
          <ul className="list-disc pl-5 mt-1">
            <li>Check your internet connection</li>
            <li>Make sure pop-ups aren't blocked in your browser</li>
            <li>Try refreshing the page</li>
          </ul>
        </div>
        <div className="flex gap-2 justify-center">
          <Button
            onClick={onClose}
            variant="outline"
            className="border-gray-200 hover:bg-gray-50">
            Close
          </Button>
          <Button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 w-full">
      <div className="text-center w-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 font-medium">
          {paymentStatus === "creating_booking" && "Creating booking..."}
          {paymentStatus === "initializing_payment" &&
            "Initializing payment gateway..."}
          {paymentStatus === "processing" && "Processing payment..."}
          {paymentStatus === "idle" && "Preparing payment..."}
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Please do not refresh the page.
        </p>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-100 text-left">
          <h3 className="font-medium text-gray-800 mb-2">Payment Summary</h3>
          <div className="flex justify-between text-sm mb-1">
            <span>Tour:</span>
            <span className="font-medium">
              {bookingForm.tourName || "Tour Booking"}
            </span>
          </div>
          <div className="flex justify-between text-sm mb-1">
            <span>Amount:</span>
            <span className="font-medium">
              ₹{Number(paymentData?.amount || 0).toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Booking ID:</span>
            <span className="font-medium">
              {paymentData?.bookingId || "Processing..."}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TourPaymentForm;
