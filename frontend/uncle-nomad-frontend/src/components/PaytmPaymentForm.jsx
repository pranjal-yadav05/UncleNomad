"use client"

import { useEffect, useState, useCallback } from "react"
import axios from "axios"
import { Button } from "./ui/button"
import BookingConfirmationDialog from "../modals/BookingConfirmationDialog"
import { useRef } from "react"
import FailedTransactionModal from "../modals/FailedTransactionModal"

const PaytmPaymentForm = ({
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
  const [error, setError] = useState(null)
  const [isPaytmLoaded, setIsPaytmLoaded] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [isFailedModalOpen, setIsFailedModalOpen] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState("initializing")
  // Prevent multiple initializations
  const isInitialized = useRef(false);
  const isScriptLoaded = useRef(false);

  const handleCloseConfirmation = useCallback(() => {
    setShowConfirmation(false)
    setIsBookingConfirmed(false)
    onClose?.()
  }, [onClose, setIsBookingConfirmed])

  const handlePaymentFailure = useCallback(
    (errorMsg) => {
      setError(errorMsg)
      setIsFailedModalOpen(true)
      onPaymentFailure?.(errorMsg)
    },
    [onPaymentFailure],
  )

  const handleTransactionStatus = useCallback(
    async (response) => {
      try {
        if (response.STATUS === "TXN_SUCCESS") {
          setChecking(true)
          const selectedRooms = Object.entries(bookingForm.selectedRooms)
            .filter(([roomId, quantity]) => quantity > 0)
            .map(([roomId, quantity]) => ({
              roomId,
              quantity,
              checkIn: bookingForm.checkIn,
              checkOut: bookingForm.checkOut,
            }))

          const bookingData = {
            rooms: selectedRooms,
            guestName: bookingForm.guestName,
            email: bookingForm.email,
            phone: bookingForm.phone,
            numberOfGuests: bookingForm.numberOfGuests,
            numberOfChildren: bookingForm.numberOfChildren,
            mealIncluded: bookingForm.mealIncluded,
            extraBeds: bookingForm.extraBeds,
            specialRequests: bookingForm.specialRequests,
            checkIn: bookingForm.checkIn,
            checkOut: bookingForm.checkOut,
            totalPrice: bookingForm.totalPrice,
            paymentReference: response.ORDERID,
          }

          setBookingDetails(bookingData)

          const authToken = localStorage.getItem('authToken');
          
          const bookingResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/bookings/book`, {
            method: "POST",
            headers: { "Content-Type": "application/json", 
              "x-api-key": process.env.REACT_APP_API_KEY,
              "Authorization": `Bearer ${authToken}`
            },
            body: JSON.stringify(bookingData),
          })

          if (!bookingResponse.ok) {
            throw new Error("Failed to create booking")
          }

          const bookingResult = await bookingResponse.json()
          

          const bookingUpdate = await axios.post(`${process.env.REACT_APP_API_URL}/api/payments/verify`, {
            orderId: response.ORDERID,
          },{headers:{"x-api-key": process.env.REACT_APP_API_KEY, "Authorization": `Bearer ${authToken}`}})

          setBookingDetails(bookingUpdate.data.data.bookingUpdate)

          window.Paytm.CheckoutJS.close();

          setShowConfirmation(true)
          setIsBookingConfirmed(true)
          // onPaymentSuccess?.(bookingResult)
          setChecking(false)
        } else {
          window.Paytm.CheckoutJS.close();
          handlePaymentFailure("Payment failed or was cancelled")
        }
      } catch (error) {
        
        handlePaymentFailure(error.message || "Payment verification failed")
      }
    },
    [bookingForm, onPaymentSuccess, handlePaymentFailure, setBookingDetails, setChecking, setIsBookingConfirmed],
  )

  useEffect(() => {
    if (!paymentData || !paymentData.txnToken) {
      handlePaymentFailure("Payment initialization failed: Missing payment details");
      return;
    }

    // ✅ Prevent multiple initializations
    if (isInitialized.current) {
      console.warn("Paytm already initialized, skipping...");
      return;
    }
    isInitialized.current = true;

    setIsLoading(true);
    console.log("Initializing payment - starting process");

    // ✅ Check if script is already loaded
    if (!isScriptLoaded.current) {
      const existingScript = document.getElementById("paytm-checkout-script");
      if (existingScript) {
        existingScript.remove(); // Remove any existing script to avoid conflicts
      }

      const script = document.createElement("script");
      script.src = `https://${process.env.REACT_APP_PAYTM_HOSTNAME}/merchantpgpui/checkoutjs/merchants/${process.env.REACT_APP_PAYTM_MID}.js`;
      script.async = true;
      script.id = "paytm-checkout-script";

      script.onload = () => {
        console.log("Paytm SDK loaded.");
        isScriptLoaded.current = true;

        if (!window.Paytm) {
          handlePaymentFailure("Paytm SDK not loaded");
          return;
        }

        console.log("Initializing Paytm Checkout...");

        window.Paytm.CheckoutJS.onLoad(() => {
          console.log("Paytm SDK ready. Initializing checkout...");

          const config = {
            root: "",
            flow: "DEFAULT",
            data: {
              orderId: String(paymentData.orderId),
              token: String(paymentData.txnToken),
              tokenType: "TXN_TOKEN",
              amount: String(paymentData.amount),
            },
            handler: {
              notifyMerchant: (eventName, data) => {
                console.log("Paytm event:", eventName, data);
                if (eventName === "APP_CLOSED") {
                  handlePaymentFailure("Payment window closed");
                }
              },
              transactionStatus: handleTransactionStatus,
            },
            merchant: {
              mid: process.env.REACT_APP_PAYTM_MID,
              redirect: false,
            },
            env: {
              stage: "STAGE",
            },
          };

          if (window.Paytm.CheckoutJS.init) {
            window.Paytm.CheckoutJS.init(config)
              .then(() => {
                console.log("Paytm initialization successful");
                setIsLoading(false);
                closeModal?.();
                setIsModalOpen?.(false);
                window.Paytm.CheckoutJS.invoke();
              })
              .catch((error) => {
                console.error("Paytm initialization failed:", error);
                handlePaymentFailure("Failed to initialize Paytm: " + error.message);
              });
          } else {
            handlePaymentFailure("Paytm.CheckoutJS.init is not available");
          }
        });
      };

      script.onerror = () => {
        handlePaymentFailure("Failed to load Paytm script");
      };

      document.body.appendChild(script);
    }

    return () => {
      console.log("Cleaning up Paytm script...");
    };
  }, [paymentData, handlePaymentFailure, handleTransactionStatus, setIsLoading]);
  
  if (error) {
    return (
      <div className="text-center text-red-600">
        <p className="font-medium">{error}</p>
        <Button
          onClick={() => window.location.reload()}
          className="mt-4 bg-brand-purple hover:bg-brand-purple/90 text-white"
        >
          Try Again
        </Button>
        <FailedTransactionModal
          open={isFailedModalOpen}
          onClose={() => setIsFailedModalOpen(false)}
          errorMessage={error}
        />
      </div>
    )
  }

  if (showConfirmation && bookingDetails) {
    return <BookingConfirmationDialog booking={bookingDetails} onClose={handleCloseConfirmation} />
  }

  if (paymentStatus === "initializing") {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-purple mx-auto mb-4"></div>
          <p className="text-lg font-semibold">Initializing Payment Gateway...</p>
          <p className="text-sm text-gray-500 mt-2">Please wait, this may take a moment.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="text-center w-full">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-purple mx-auto"></div>
      <p className="mt-4 font-medium">{isPaytmLoaded ? "Initializing payment..." : "Loading payment gateway..."}</p>
      <p className="text-sm text-gray-500 mt-2">Please do not refresh the page.</p>

      <FailedTransactionModal
        open={isFailedModalOpen}
        onClose={() => setIsFailedModalOpen(false)}
        errorMessage={error}
      />
    </div>
  )
}

export default PaytmPaymentForm

