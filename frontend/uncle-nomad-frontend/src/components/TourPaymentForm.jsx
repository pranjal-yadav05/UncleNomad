import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Button } from "./ui/button";

const TourPaymentForm = ({ 
  paymentData, 
  bookingForm,
  onPaymentSuccess, 
  onPaymentFailure, 
  onClose,
  setIsCheckingOpen
}) => {
  
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
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
        console.log("Initializing payment - starting process");
        setIsLoading(true);
        setPaymentStatus('initializing_payment');

        const paymentInitData = {
          tourId: paymentData.tourId,
          bookingId: paymentData.bookingId,
          amount: paymentData.amount ? parseFloat(paymentData.amount).toFixed(2) : 0,
          email: bookingForm.email,
          phone: bookingForm.phone ? bookingForm.phone.replace(/\D/g, '') : '',
          guestName: bookingForm.guestName,
          groupSize: bookingForm.groupSize,
          specialRequests: bookingForm.specialRequests 
        };

        if (!paymentInitData.amount || isNaN(paymentInitData.amount)) {
          throw new Error('Invalid payment amount');
        }
        if (!paymentInitData.email || !validateEmail(paymentInitData.email)) {
          throw new Error('Invalid email address');
        }
        if (!paymentInitData.phone || paymentInitData.phone.length !== 10) {
          throw new Error('Invalid phone number');
        }

        const paymentResponse = await axios.post(
          `${process.env.REACT_APP_API_URL}/api/tours/${paymentData.tourId}/initiate-payment`,
          paymentInitData,
          {headers:{"x-api-key": process.env.REACT_APP_API_KEY}}
        );

        if (!paymentResponse.data.data.txnToken) {
          throw new Error('Failed to get transaction token');
        }
        
        console.log('before config');
        
        if (!process.env.REACT_APP_PAYTM_MID) {
          throw new Error('Paytm Merchant ID (MID) is not defined');
        }
        
        const config = {
          root: "",
          flow: "DEFAULT",
          data: {
            orderId: paymentResponse.data.data.orderId,
            token: paymentResponse.data.data.txnToken,
            tokenType: "TXN_TOKEN",
            amount: paymentResponse.data.data.amount
          },
          
          handler: {
            notifyMerchant: function(eventName, data) {
              console.log("Paytm event:", eventName, data);
              if (eventName === "APP_CLOSED") {
                onPaymentFailure?.("Payment window closed");
              }
              
              // Close the dialog once payment UI is ready
              if (eventName === "OPEN_CHECKOUT_FLOW") {
                if (!paymentGatewayOpened.current) {
                  paymentGatewayOpened.current = true;
                  // Delay the close slightly to ensure payment UI is fully ready
                  setTimeout(() => {
                    onClose?.();
                  }, 500);
                }
              }
            },
            transactionStatus: async (response) => {
              try {
                console.log('Transaction status received:', response);
                setPaymentStatus('processing');
                
                if (response.STATUS === 'TXN_SUCCESS') {
                  const verificationResponse = await axios.post(
                    `${process.env.REACT_APP_API_URL}/api/tours/${paymentData.tourId}/verify-payment`, 
                    {
                      orderId: response.ORDERID,
                      bookingId: paymentData.bookingId,
                      tourId: paymentData.tourId,
                      paymentStatus: 'SUCCESS',
                    }
                  );
                  
                  console.log('Payment verification response:', verificationResponse.data);
                  
                  // Close the payment gateway after successful verification
                  if (window.Paytm && window.Paytm.CheckoutJS) {
                    try {
                      window.Paytm.CheckoutJS.close();
                      console.log('Payment gateway closed');
                    } catch (closeError) {
                      console.error('Error closing payment gateway:', closeError);
                    }
                  }
                  
                  // Notify success and close the form
                  onPaymentSuccess?.(response);
                  onClose?.();
                } else {
                  // Close the payment gateway first
                  if (window.Paytm && window.Paytm.CheckoutJS) {
                    try {
                      window.Paytm.CheckoutJS.close();
                      console.log('Payment gateway closed after failure');
                    } catch (closeError) {
                      console.error('Error closing payment gateway:', closeError);
                    }
                  }
                  
                  // Then trigger the failure callback
                  const errorMessage = 'Payment failed: ' + (response.RESPMSG || 'Unknown error');
                  onPaymentFailure?.(errorMessage);
                  onClose?.();
                }
              } catch (error) {
                console.error('Error in transaction status handler:', error);
                onPaymentFailure?.(error.message);
                onClose?.();
              }
            }
          },
          merchant: {
            mid: process.env.REACT_APP_PAYTM_MID,
            redirect: false
          },
          env: {
            stage: process.env.NODE_ENV === 'production' ? 'PROD' : 'STAGE'
          }
        };
        
        console.log('after config');

        const script = document.createElement("script");
        script.src = `https://${process.env.REACT_APP_PAYTM_HOSTNAME}/merchantpgpui/checkoutjs/merchants/${process.env.REACT_APP_PAYTM_MID}.js`;
        script.async = true;
        
        script.onload = () => {
          if (!window.Paytm) {
            throw new Error('Paytm SDK not loaded');
          }

          window.Paytm.CheckoutJS.onLoad(function() {
            console.log("Paytm SDK loaded, initializing with config:", JSON.stringify(config));
            
            window.Paytm.CheckoutJS.init(config)
              .then(() => {
                console.log("Paytm initialization successful");
                if (isSubscribed) setIsLoading(false);
                
                // Set up a backup plan to close the dialog if the notifyMerchant event doesn't fire
                if (!paymentGatewayOpened.current) {
                  paymentGatewayOpened.current = true;
                  onClose?.();
                }
                
                window.Paytm.CheckoutJS.invoke();
              })
              .catch((error) => {
                console.error("Paytm initialization failed:", error);
                throw new Error('Failed to initialize Paytm: ' + error.message);
              });
          });
        };
        
        script.onerror = () => {
          throw new Error('Failed to load Paytm script');
        };
        
        document.body.appendChild(script);

      } catch (error) {
        if (isSubscribed) {
          setError(error.message);
          setIsLoading(false);
          setPaymentStatus('failed');
          onPaymentFailure?.(error.message);
        }
      }
    };

    initializePayment();

    return () => {
      isSubscribed = false;
      const script = document.querySelector(`script[src*="${process.env.REACT_APP_PAYTM_HOSTNAME}"]`);
      if (script) {
        script.remove();
      }
    };
  }, [paymentData, bookingForm, onPaymentSuccess, onPaymentFailure, onClose]);

  if (error) {
    return (
      <div className="text-center">
        <p className="font-medium text-red-600 mb-4">{error}</p>
        <div className="flex gap-2 justify-center">
          <Button 
            onClick={onClose} 
            variant="outline"
            className="border-gray-200 hover:bg-gray-50"
          >
            Close
          </Button>
          <Button 
            onClick={() => window.location.reload()}
            className="bg-brand-purple hover:bg-brand-purple/90 text-white"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center w-full">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-purple mx-auto"></div>
      <p className="mt-4 font-medium">
        {paymentStatus === 'creating_booking' && 'Creating booking...'}
        {paymentStatus === 'initializing_payment' && 'Initializing payment...'}
        {paymentStatus === 'processing' && 'Processing payment...'}
      </p>
      <p className="text-sm text-gray-500 mt-2">Please do not refresh the page.</p>
    </div>
  );
};

export default TourPaymentForm;