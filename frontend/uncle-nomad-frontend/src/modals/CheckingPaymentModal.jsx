import React from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "../components/ui/dialog"; // Import your Dialog components

const CheckingPaymentModal = ({ open, onClose }) => {
  return (
    <Dialog open={open}>
      <DialogContent>
        <DialogTitle>Checking Payment...</DialogTitle>
        <DialogDescription className="text-center">
          Please wait while we verify your payment status.
        </DialogDescription>
        <div className="flex justify-center mt-4">
          {/* Spinner or loading animation */}
          <div className="spinner-border animate-spin border-t-2 border-b-2 border-blue-500 rounded-full w-8 h-8"></div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CheckingPaymentModal;
