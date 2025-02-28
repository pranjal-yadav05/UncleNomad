import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Button } from "./ui/button";
import BookingConfirmationDialog from "../modals/BookingConfirmationDialog";
import BookingFailedDialog from "../modals/BookingFailedDialog";

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
  const [paymentStatus, setPaymentStatus] = useState('idle');
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
        console.log("Initializing payment with data:", paymentData);
        setPaymentStatus('initializing_payment');

        if (!paymentData || !paymentData.txnToken) {
          throw new Error("Payment initialization failed: Missing payment details");
        }

        // Create the script element directly
        const script = document.createElement("script");
        script.src = `https://${process.env.REACT_APP_PAYTM_HOSTNAME}/merchantpgpui/checkoutjs/merchants/${paymentData.mid}.js`;
        script.async = true;
        script.crossOrigin = "anonymous";
        
        script.onload = () => {
          if (!window.Paytm) {
            throw new Error('Paytm SDK not loaded');
          }

          console.log("Paytm script loaded successfully");
          
          const config = {
            root: "",
            flow: "DEFAULT",
            data: {
              orderId: String(paymentData.orderId),
              token: String(paymentData.txnToken),
              tokenType: "TXN_TOKEN",
              amount: String(paymentData.amount)
            },
            handler: {
              notifyMerchant: function(eventName, data) {
                console.log("Paytm event:", eventName, data);
                if (eventName === "APP_CLOSED") {
                  console.error("Payment window closed by user");
                  setError("Payment window was closed");
                  setIsBookingFailed(true);
                  onPaymentFailure?.("Payment cancelled by user");
                }
                
                // Close the dialog once payment UI is ready
                if (eventName === "OPEN_CHECKOUT_FLOW") {
                  if (!paymentGatewayOpened.current) {
                    paymentGatewayOpened.current = true;
                    // Delay the close slightly to ensure payment UI is fully ready
                    setTimeout(() => {
                      setIsModalOpen(false);
                      onClose?.();
                    }, 500);
                  }
                }
              },
              transactionStatus: async (response) => {
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

                  try {
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
                    setIsBookingConfirmed(true);
                    onPaymentSuccess?.(bookingResult);
                    
                    // Close the payment gateway
                    if (window.Paytm && window.Paytm.CheckoutJS) {
                      try {
                        window.Paytm.CheckoutJS.close();
                      } catch (closeError) {
                        console.error('Error closing payment gateway:', closeError);
                      }
                    }
                  } catch (error) {
                    console.error("Booking creation failed:", error);
                    setIsBookingFailed(true);
                    onPaymentFailure?.(error.message);
                  } finally {
                    setChecking(false);
                  }
                } else {
                  console.error("Payment failed or was cancelled");
                  setIsBookingFailed(true);
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
              }
            },
            merchant: {
              mid: String(paymentData.mid),
              redirect: false
            },
            env: {
              stage: process.env.NODE_ENV === 'production' ? 'PROD' : 'STAGE'
            }
          };

          window.Paytm.CheckoutJS.onLoad(function() {
            console.log("Paytm SDK loaded, initializing payment");
            
            window.Paytm.CheckoutJS.init(config)
              .then(() => {
                console.log("Paytm initialization successful");
                setPaymentStatus('initialized');
                
                // Set up a backup plan to close the dialog if the notifyMerchant event doesn't fire
                if (!paymentGatewayOpened.current) {
                  setTimeout(() => {
                    paymentGatewayOpened.current = true;
                    setIsModalOpen(false);
                    onClose?.();
                  }, 500);
                }
                
                window.Paytm.CheckoutJS.invoke();
              })
              .catch((error) => {
                console.error("Paytm initialization failed:", error);
                setError('Failed to initialize payment');
                setIsBookingFailed(true);
                onPaymentFailure?.(error.message);
              });
          });
        };
        
        script.onerror = () => {
          const errorMsg = 'Failed to load Paytm script';
          console.error(errorMsg);
          setError(errorMsg);
          setIsBookingFailed(true);
          onPaymentFailure?.(errorMsg);
        };
        
        document.body.appendChild(script);

      } catch (error) {
        console.error("Payment initialization error:", error);
        setError(error.message);
        setIsBookingFailed(true);
        onPaymentFailure?.(error.message);
      }
    };

    initializePayment();

    return () => {
      isSubscribed = false;
      // Clean up the script element only on unmount
      const script = document.querySelector(`script[src*="${process.env.REACT_APP_PAYTM_HOSTNAME}"]`);
      if (script) {
        script.remove();
      }
      
      // Try to close the payment window if it's open
      if (window.Paytm && window.Paytm.CheckoutJS) {
        try {
          window.Paytm.CheckoutJS.close();
        } catch (e) {
          console.error("Error closing Paytm gateway on unmount:", e);
        }
      }
    };
  }, []);

  return (
    <div className="text-center w-full">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-purple mx-auto"></div>
      <p className="mt-4 font-medium">
        {paymentStatus === 'idle' && 'Loading payment gateway...'}
        {paymentStatus === 'initializing_payment' && 'Initializing payment...'}
        {paymentStatus === 'initialized' && 'Opening payment gateway...'}
      </p>
      <p className="text-sm text-gray-500 mt-2">Please do not refresh the page.</p>
    </div>
  );
};

export default PaytmPaymentForm;