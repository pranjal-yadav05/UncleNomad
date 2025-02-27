import React from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "../components/ui/dialog"; // Import Dialog components

const FailedTransactionModal = ({ open, onClose, errorMessage }) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogTitle>Transaction Failed</DialogTitle>
        <DialogDescription className="text-center">
          {errorMessage || "An error occurred while processing your transaction. Please try again."}
        </DialogDescription>
        <div className="flex justify-center mt-4">
          {/* You can replace this with a custom failure icon or animation */}
          <div className="text-red-500 text-3xl">&#9888;</div> {/* Error icon */}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FailedTransactionModal;
