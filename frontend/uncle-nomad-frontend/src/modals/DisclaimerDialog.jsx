"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog"
import { Button } from "../components/ui/button"
import { Label } from "../components/ui/label"
import { Checkbox } from "../components/ui/checkbox"
import { useNavigate } from "react-router-dom"

export default function DisclaimerDialog({ isOpen, onClose, onAgree}) {
  const [isChecked, setIsChecked] = useState(false)
  const navigate = useNavigate()

  const handleAgree = () => {
    if (isChecked) {
      onAgree()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:max-w-[500px] bg-white p-4 max-h-[90vh] overflow-y-auto rounded-lg shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Important Disclaimer</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-gray-700 text-sm">
          <p>
            By proceeding with your booking, you acknowledge and agree to the following terms:
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li>All bookings are subject to availability and confirmation.</li>
            <li>Cancellation policies apply. Refunds may be subject to deductions.</li>
            <li>Uncle Nomad is not responsible for unforeseen circumstances affecting your stay.</li>
            <li>Check-in and check-out times must be adhered to as per the booking details.</li>
            <li>Any damages or rule violations may result in additional charges.</li>
          </ul>
          <div className="flex items-center space-x-2">
            <Checkbox id="agree" checked={isChecked} onCheckedChange={setIsChecked} />
            <Label htmlFor="agree">I have read and agree to the terms and conditions.</Label>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button onClick={onClose} variant="outline" className="w-full">
            Cancel
          </Button>
          <Button onClick={handleAgree} className="w-full bg-brand-purple hover:bg-brand-purple/90" disabled={!isChecked}>
            Proceed to Payment
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
