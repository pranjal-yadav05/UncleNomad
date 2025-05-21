/**
 * Generates HTML template for a room booking ticket
 * @param {Object} booking - The room booking data
 * @param {Function} formatDateDDMMYYYY - Function to format dates as DD/MM/YYYY
 * @returns {String} HTML template as a string
 */
export const generateRoomTicketTemplate = (booking, formatDateDDMMYYYY) => {
  // Format dates
  const formattedBookingDate = formatDateDDMMYYYY(
    booking.bookingDate || new Date()
  );
  const formattedCheckIn = formatDateDDMMYYYY(booking.checkIn);
  const formattedCheckOut = formatDateDDMMYYYY(booking.checkOut);

  // Calculate duration of stay in days
  const checkInDate = new Date(booking.checkIn);
  const checkOutDate = new Date(booking.checkOut);
  const durationInDays = Math.ceil(
    (checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)
  );

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Room Booking Ticket - #${booking._id.slice(-6)}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f9f9f9;
        }
        .ticket {
          border: 1px solid #ddd;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 0 15px rgba(0,0,0,0.1);
          background-color: white;
        }
        .ticket-header {
          background: linear-gradient(135deg, #3b82f6, #1e40af);
          color: white;
          padding: 20px;
          text-align: center;
        }
        .ticket-header h1 {
          margin-bottom: 5px;
          font-size: 24px;
        }
        .booking-id {
          font-size: 14px;
          opacity: 0.9;
        }
        .logo {
          text-align: center;
          margin: 15px 0;
          font-size: 20px;
          font-weight: bold;
          color: #3b82f6;
        }
        .ticket-content {
          padding: 20px;
        }
        .ticket-section {
          margin-bottom: 20px;
          border-bottom: 1px solid #eee;
          padding-bottom: 15px;
        }
        .ticket-section:last-child {
          border-bottom: none;
        }
        .ticket-section h3 {
          margin-top: 0;
          margin-bottom: 10px;
          color: #3b82f6;
          font-size: 18px;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .info-item {
          margin-bottom: 8px;
        }
        .info-label {
          font-weight: bold;
          color: #666;
          display: block;
          font-size: 12px;
          text-transform: uppercase;
        }
        .info-value {
          display: block;
          font-size: 16px;
        }
        .ticket-footer {
          text-align: center;
          padding: 15px;
          background-color: #f8f8f8;
          color: #666;
          font-size: 12px;
        }
        .status-badge {
          display: inline-block;
          padding: 5px 10px;
          border-radius: 15px;
          font-size: 12px;
          font-weight: bold;
          text-transform: uppercase;
          margin-top: 5px;
        }
        .status-confirmed {
          background-color: #dcfce7;
          color: #166534;
        }
        .status-pending {
          background-color: #fef3c7;
          color: #92400e;
        }
        .status-cancelled {
          background-color: #fee2e2;
          color: #b91c1c;
        }
        .barcode {
          margin: 15px auto;
          text-align: center;
          font-family: 'Courier New', monospace;
          font-size: 24px;
          letter-spacing: 2px;
        }
        .qr-code {
          text-align: center;
          margin: 15px 0;
          background: #f0f0f0;
          padding: 15px;
          border-radius: 5px;
          font-weight: bold;
        }
        .rooms-list {
          margin-top: 10px;
        }
        .room-item {
          border: 1px solid #eee;
          border-radius: 5px;
          padding: 10px;
          margin-bottom: 10px;
          background-color: #fcfcfc;
        }
        .print-button {
          display: block;
          margin: 20px auto;
          padding: 10px 20px;
          background-color: #3b82f6;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
        }
        @media print {
          .print-button {
            display: none;
          }
          body {
            padding: 0;
            margin: 0;
            background-color: white;
          }
          .ticket {
            border: none;
            box-shadow: none;
          }
        }
      </style>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js" integrity="sha512-GsLlZN/3F2ErC5ifS5QtgpiJtWd43JWSuIgh7mbzZ8zBps+dvLusV+eNQATqgA/HdeKFVgA5v3S/cIrLF7QnIg==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
    </head>
    <body>
      <div id="ticket-container">
        <div class="ticket">
          <div class="ticket-header">
            <h1>Room Booking Confirmation</h1>
            <div class="booking-id">Booking #${booking._id.slice(-6)}</div>
          </div>
          
          <div class="ticket-content">
            <div class="ticket-section">
              <h3>Guest Information</h3>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Guest Name</span>
                  <span class="info-value">${
                    booking.guestName || booking.name || "N/A"
                  }</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Email</span>
                  <span class="info-value">${booking.email || "N/A"}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Phone</span>
                  <span class="info-value">${booking.phone || "N/A"}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Booked On</span>
                  <span class="info-value">${formattedBookingDate}</span>
                </div>
              </div>
              ${
                booking.specialRequests
                  ? `<div class="info-item" style="margin-top:10px;">
                  <span class="info-label">Special Requests</span>
                  <span class="info-value" style="font-size:14px;">${booking.specialRequests}</span>
                </div>`
                  : ""
              }
            </div>
            
            <div class="ticket-section">
              <h3>Reservation Details</h3>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Check-in Date</span>
                  <span class="info-value">${formattedCheckIn}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Check-out Date</span>
                  <span class="info-value">${formattedCheckOut}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Duration</span>
                  <span class="info-value">${durationInDays} Night${
    durationInDays !== 1 ? "s" : ""
  }</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Number of Guests</span>
                  <span class="info-value">${
                    booking.numberOfGuests || booking.guests || 1
                  }</span>
                </div>
              </div>
            </div>
            
            <div class="ticket-section">
              <h3>Booking Status</h3>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Status</span>
                  <span class="info-value">
                    <span class="status-badge ${
                      booking.status === "CONFIRMED" ||
                      booking.status === "Confirmed"
                        ? "status-confirmed"
                        : booking.status === "PENDING" ||
                          booking.status === "Pending"
                        ? "status-pending"
                        : "status-cancelled"
                    }">
                      ${booking.status || "Pending"}
                    </span>
                  </span>
                </div>
                <div class="info-item">
                  <span class="info-label">Payment Status</span>
                  <span class="info-value">${
                    booking.paymentStatus || "N/A"
                  }</span>
                </div>
                ${
                  booking.paymentReference
                    ? `<div class="info-item">
                    <span class="info-label">Transaction ID</span>
                    <span class="info-value" style="font-size:14px;font-family:monospace;">${booking.paymentReference}</span>
                  </div>`
                    : ""
                }
                <div class="info-item">
                  <span class="info-label">Total Amount</span>
                  <span class="info-value">₹${
                    booking.totalAmount || booking.totalPrice || "0"
                  }</span>
                </div>
              </div>
            </div>
            
            <div class="ticket-section">
              <h3>Room Details</h3>
              <div class="rooms-list">
                ${booking.rooms
                  .map(
                    (room, index) => `
                  <div class="room-item">
                    <h4 style="margin-top:0;margin-bottom:5px;">${
                      room.roomType || "Standard Room"
                    }</h4>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                      <div>
                        <span style="font-size:12px;color:#666;font-weight:bold;">Room Number</span>
                        <span style="display:block;">${
                          room.roomNumber || `Room ${index + 1}`
                        }</span>
                      </div>
                      <div>
                        <span style="font-size:12px;color:#666;font-weight:bold;">Room Rate</span>
                        <span style="display:block;">₹${
                          room.price ||
                          room.pricePerNight ||
                          (room.subtotal && room.numberOfNights
                            ? Math.round(room.subtotal / room.numberOfNights)
                            : "N/A")
                        } per night</span>
                      </div>
                      <div>
                        <span style="font-size:12px;color:#666;font-weight:bold;">Bed Type</span>
                        <span style="display:block;">${
                          room.bedType || "Standard"
                        }</span>
                      </div>
                    </div>
                    ${
                      room.amenities
                        ? `<div style="margin-top:8px;font-size:13px;">
                        <span style="font-size:12px;color:#666;font-weight:bold;">Amenities</span>
                        <span style="display:block;color:#666;">${
                          Array.isArray(room.amenities)
                            ? room.amenities.join(", ")
                            : room.amenities
                        }</span>
                      </div>`
                        : ""
                    }
                  </div>
                `
                  )
                  .join("")}
              </div>
            </div>
            
            <div class="barcode">
              ${booking._id}
            </div>
            
            <div class="qr-code">
              BOOKING ID: ${booking._id}
            </div>
          </div>
          
          <div class="ticket-footer">
            <p>Please present this ticket at the reception desk during check-in.</p>
            <p>For any inquiries, please contact our customer support at bookings@unclenomad.com</p>
            <p>Thank you for choosing Uncle Nomad!</p>
          </div>
        </div>
      </div>

      <button class="print-button" onclick="window.print(); return false;">Print Ticket</button>
      <button class="print-button" onclick="generatePDF()" style="background-color: #4CAF50;">Download PDF</button>
      
      <script>
        function generatePDF() {
          const element = document.getElementById('ticket-container');
          const opt = {
            margin: [10, 10, 10, 10],
            filename: 'room-booking-${booking._id.slice(-6)}.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
          };
          
          // All buttons should be hidden in the PDF
          const buttons = document.querySelectorAll('.print-button');
          buttons.forEach(button => button.style.display = 'none');
          
          // Generate PDF
          html2pdf().set(opt).from(element).save().then(() => {
            // Show buttons again after PDF is generated
            buttons.forEach(button => button.style.display = 'block');
          });
        }
        
        // Automatically trigger PDF download
        window.onload = function() {
          generatePDF();
        };
      </script>
    </body>
    </html>
  `;
};
