import { useEffect, useState, useCallback } from "react"
import axios from "axios"
import { Button } from "./ui/button"
import BookingConfirmationDialog from "../modals/BookingConfirmationDialog"

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
  setChecking
}) => {
  const [error, setError] = useState(null)
  const [isPaytmLoaded, setIsPaytmLoaded] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)

  const handleCloseConfirmation = useCallback(() => {
    setShowConfirmation(false)
    setIsBookingConfirmed(false)
    onClose?.()
  }, [onClose, setIsBookingConfirmed])

  const loadPaytmScript = useCallback(() => {
    return new Promise((resolve, reject) => {
      const existingScript = document.querySelector(`script[src*="paytm.in"]`)
      if (existingScript) {
        existingScript.remove()
      }

      const script = document.createElement("script")
      script.src = `https://${process.env.REACT_APP_PAYTM_HOSTNAME}/merchantpgpui/checkoutjs/merchants/${paymentData.mid}.js`
      script.async = true
      script.crossOrigin = "anonymous"

      script.onload = () => {
        setIsPaytmLoaded(true)
        resolve()
      }

      script.onerror = () => {
        reject(new Error("Failed to load Paytm script"))
      }

      document.body.appendChild(script)
    })
  }, [paymentData])

  const handleTransactionStatus = useCallback(async (response) => {
    try {
      if (response.STATUS === 'TXN_SUCCESS') {

        setChecking(true)
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

        setBookingDetails(bookingData)

        const bookingResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/bookings/book`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bookingData)
        });

        if (!bookingResponse.ok) {
          throw new Error('Failed to create booking');
        }

        const bookingResult = await bookingResponse.json();
        
        await axios.post(`${process.env.REACT_APP_API_URL}/api/payments/verify`, {
          orderId: response.ORDERID
        });

        setBookingDetails(bookingResult)
        setShowConfirmation(true)
        setIsBookingConfirmed(true)
        onPaymentSuccess?.(bookingResult);
        setChecking(false)

      } else {
        throw new Error('Payment failed or was cancelled');
      }
    } catch (error) {
      onPaymentFailure?.(error.message || "Payment verification failed");
    }
  }, [bookingForm, onPaymentSuccess, onPaymentFailure]);

  useEffect(() => {
    if (!paymentData || !paymentData.txnToken) {
      setError("Payment initialization failed: Missing payment details");
      return;
    }

    loadPaytmScript().catch((error) => {
      setError("Failed to load payment gateway");
      onPaymentFailure?.(error.message);
    });

    return () => {
      const script = document.querySelector('script[src*="paytm.in"]');
      if (script) {
        script.remove();
      }
    }
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
                setError("Payment window was closed");
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

        window.Paytm.CheckoutJS.onLoad(function executeAfterCompleteLoad() {
          window.Paytm.CheckoutJS.init(config)
            .then(function onSuccess() {
              setIsModalOpen(false)
              onClose?.();
              window.Paytm.CheckoutJS.invoke();
            })
            .catch(function onError(error) {
              setError("Failed to initialize payment");
              onPaymentFailure?.(error.message);
            });
        });

      } catch (error) {
        setError("Failed to initialize payment");
        onPaymentFailure?.(error.message);
      }
    };

    initializePayment();
  }, [isPaytmLoaded, paymentData, handleTransactionStatus, onPaymentFailure]);

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
      </div>
    );
  }

  // if (showConfirmation && bookingDetails) {
  //   return (
  //     <BookingConfirmationDialog
  //       booking={bookingDetails}
  //       onClose={handleCloseConfirmation}
  //     />
  //   );
  // }

  return (
    <div className="text-center w-full">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-purple mx-auto"></div>
      <p className="mt-4 font-medium">{isPaytmLoaded ? "Initializing payment..." : "Loading payment gateway..."}</p>
      <p className="text-sm text-gray-500 mt-2">Please do not refresh the page.</p>
    </div>
  );
};

export default PaytmPaymentForm
