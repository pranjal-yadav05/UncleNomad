import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Button } from "./ui/button";
import BookingConfirmationDialog from "../modals/BookingConfirmationDialog";
import BookingFailedDialog from "../modals/BookingFailedDialog"; // Import failed dialog

const PaytmPaymentForm = ({ 
  paymentData, 
  bookingForm, 
  setIsModalOpen,
  setBookingDetails,
  bookingDetails,
  isLoading, 
  onPaymentSuccess, 
  onPaymentFailure, 
  setIsBookingConfirmed,
  onClose,
  setChecking,
  setIsBookingFailed
}) => {
  const [error, setError] = useState(null);
  const [isPaytmLoaded, setIsPaytmLoaded] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isFailed, setIsFailed] = useState(false); // Track failure state

  const handleCloseConfirmation = useCallback(() => {
    setShowConfirmation(false);
    setIsBookingConfirmed(false);
    onClose?.();
  }, [onClose, setIsBookingConfirmed]);

  const handleCloseFailed = () => {
    setIsBookingFailed(false);
    setIsFailed(false);
    onClose?.();
  };

  const loadPaytmScript = useCallback(() => {
    return new Promise((resolve, reject) => {
      const existingScript = document.querySelector(`script[src*="paytm.in"]`);
      if (existingScript) {
        existingScript.remove();
      }

      const script = document.createElement("script");
      script.src = `https://${process.env.REACT_APP_PAYTM_HOSTNAME}/merchantpgpui/checkoutjs/merchants/${paymentData.mid}.js`;
      script.async = true;
      script.crossOrigin = "anonymous";

      script.onload = () => {
        setIsPaytmLoaded(true);
        resolve();
      };

      script.onerror = () => {
        reject(new Error("Failed to load Paytm script"));
      };

      document.body.appendChild(script);
    });
  }, [paymentData]);

  const handleTransactionStatus = useCallback(async (response) => {
    try {
      if (response.STATUS === 'TXN_SUCCESS') {
        setChecking(true);
        const selectedRooms = Object.entries(bookingForm.selectedRooms)
          .filter(([roomId, quantity]) => quantity > 0)
          .map(([roomId, quantity]) => ({
            roomId,
            quantity,
            checkIn: bookingForm.checkIn,
            checkOut: bookingForm.checkOut
          }));

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
          paymentReference: response.ORDERID
        };

        setBookingDetails(bookingData);

        const bookingResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/bookings/book`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bookingData)
        });

        if (!bookingResponse.ok) {
          throw new Error('Failed to create booking');
        }

        const bookingResult = await bookingResponse.json();
        
        const bookingUpdate = await axios.post(`${process.env.REACT_APP_API_URL}/api/payments/verify`, {
          orderId: response.ORDERID
        });
        
        console.log('booking result', bookingUpdate.data.data.bookingUpdate);
        setBookingDetails(bookingUpdate.data.data.bookingUpdate);
        setShowConfirmation(true);
        setIsBookingConfirmed(true);
        onPaymentSuccess?.(bookingResult);
        setChecking(false);

      } else {
        console.error("Payment failed or was cancelled");
        setIsBookingFailed(true);
        setIsFailed(true);
        onPaymentFailure?.("Payment failed or was cancelled");

        // Close the Paytm payment gateway
        if (window.Paytm && window.Paytm.CheckoutJS) {
          try {
            window.Paytm.CheckoutJS.close();
          } catch (error) {
            console.error("Error closing Paytm gateway:", error);
          }
        }
      }
    } catch (error) {
      console.error("Payment verification failed:", error);
      setIsBookingFailed(true);
      setIsFailed(true);
      onPaymentFailure?.(error.message || "Payment verification failed");
    }
  }, [bookingForm, onPaymentSuccess, onPaymentFailure]);

  useEffect(() => {
    if (!paymentData || !paymentData.txnToken) {
      console.error("Payment initialization failed: Missing payment details");
      return;
    }
  
    loadPaytmScript()
      .then(() => {
        console.log("Paytm script loaded successfully");
      })
      .catch((error) => {
        console.error("Failed to load payment gateway:", error.message);
        setTimeout(() => {
          setError("Failed to load payment gateway");
          setIsBookingFailed(true);
          setIsFailed(true);
          onPaymentFailure?.(error.message);
        }, 3000);
      });
  
    return () => {
      const script = document.querySelector('script[src*="paytm.in"]');
      if (script) {
        script.remove();
      }
    };
  }, [loadPaytmScript, paymentData, onPaymentFailure]);

  useEffect(() => {
    if (!isPaytmLoaded || !paymentData?.txnToken) return;

    const initializePayment = async () => {
      try {
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
              if (eventName === "APP_CLOSED") {
                console.error("Payment window closed by user");
                setError("Payment window was closed");
                setIsBookingFailed(true);
                setIsFailed(true);
                onPaymentFailure?.("Payment cancelled by user");
              }
            },
            transactionStatus: (response) => {
              if (!window.paymentProcessed) {
                window.paymentProcessed = true;
                handleTransactionStatus(response);
                if (response.STATUS === 'TXN_SUCCESS') {
                  window.Paytm.CheckoutJS.close();
                }
              }
            },
          },
          merchant: {
            mid: String(process.env.PAYTM_MID || paymentData.mid),
            redirect: false,
          },
          env: {
            stage: paymentData.environment === "PROD" ? "PROD" : "STAGE",
          },
          payMode: {
            mode: "NONE",
            channels: ["CC", "DC", "NB", "UPI", "PPBL", "BALANCE"],
            featured: []
          },
        };

        window.Paytm.CheckoutJS.onLoad(() => {
          window.Paytm.CheckoutJS.init(config)
            .then(() => {
              setIsModalOpen(false);
              onClose?.();
              window.Paytm.CheckoutJS.invoke();
            })
            .catch((error) => {
              console.error("Failed to initialize payment:", error);
              setError("Failed to initialize payment");
              setIsBookingFailed(true);
              setIsFailed(true);
              onPaymentFailure?.(error.message);
            });
        });

      } catch (error) {
        console.error("Failed to initialize payment:", error);
        setError("Failed to initialize payment");
        setIsBookingFailed(true);
        setIsFailed(true);
        onPaymentFailure?.(error.message);
      }
    };

    initializePayment();
  }, [isPaytmLoaded, paymentData, handleTransactionStatus, onPaymentFailure]);

  return isFailed ? (
    <BookingFailedDialog errorMessage="Payment failed or was cancelled." onClose={handleCloseFailed} />
  ) : (
    <div className="text-center w-full">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-purple mx-auto"></div>
      <p className="mt-4 font-medium">{isPaytmLoaded ? "Initializing payment..." : "Loading payment gateway..."}</p>
      <p className="text-sm text-gray-500 mt-2">Please do not refresh the page.</p>
    </div>
  );
};

export default PaytmPaymentForm;
