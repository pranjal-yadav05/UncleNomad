/**
 * Generates HTML template for a tour booking ticket
 * @param {Object} booking - The tour booking data
 * @param {Function} formatDateDDMMYYYY - Function to format dates as DD/MM/YYYY
 * @returns {String} HTML template as a string
 */
export const generateTourTicketTemplate = (booking, formatDateDDMMYYYY) => {
  // Format dates for display
  const formattedBookingDate = formatDateDDMMYYYY(
    booking.bookingDate || new Date()
  );
  const formattedTourDate = formatDateDDMMYYYY(booking.tourDate);
  const formattedEndDate = formatDateDDMMYYYY(booking.tourEndDate);

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Travel Ticket - ${booking.tourName || "Tour Package"}</title>
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
        .tour-info {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 20px;
        }
        .tour-image {
          width: 100%;
          height: 180px;
          object-fit: cover;
          border-radius: 4px;
          margin-bottom: 10px;
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
            <h1>${booking.tourName || "Tour Package"}</h1>
            <div class="booking-id">Booking #${
              booking._id ? booking._id.slice(-6) : "New"
            }</div>
          </div>
          
          <div class="ticket-content">
            <div class="tour-info">
              ${
                booking.tourImage
                  ? `<img src="${booking.tourImage}" alt="${
                      booking.tourName || "Tour"
                    }" class="tour-image">`
                  : '<div style="width:100%;height:180px;background:#eee;display:flex;justify-content:center;align-items:center;border-radius:4px;">No Image Available</div>'
              }
              <div style="font-size:18px;font-weight:bold;">${
                booking.tourName || "Tour Package"
              }</div>
              ${
                booking.location
                  ? `<div style="color:#666;">${booking.location}</div>`
                  : ""
              }
            </div>
            
            <div class="ticket-section">
              <h3>Tour Details</h3>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Tour Dates</span>
                  <span class="info-value">${formattedTourDate} - ${formattedEndDate}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Duration</span>
                  <span class="info-value">${booking.duration || "N/A"}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Participants</span>
                  <span class="info-value">${
                    booking.participants || booking.groupSize || "N/A"
                  }</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Price Per Person</span>
                  <span class="info-value">₹${
                    booking.pricePerPerson ||
                    (booking.totalPrice && booking.groupSize
                      ? Math.round(booking.totalPrice / booking.groupSize)
                      : "N/A")
                  }</span>
                </div>
              </div>
            </div>
            
            <div class="ticket-section">
              <h3>Guest Information</h3>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Guest Name</span>
                  <span class="info-value">${booking.guestName || "N/A"}</span>
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
                    booking.paymentStatus || "Pending"
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
            
            ${
              booking.itinerary && booking.itinerary.length > 0
                ? `<div class="ticket-section">
                <h3>Tour Itinerary</h3>
                <div style="font-size:14px;">
                  ${booking.itinerary
                    .map(
                      (day) => `
                    <div style="margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid #eee;">
                      <div style="font-weight:bold;">Day ${day.day}: ${day.title}</div>
                      <div style="font-size:13px;color:#666;margin-top:3px;">${day.description}</div>
                    </div>
                  `
                    )
                    .join("")}
                </div>
              </div>`
                : ""
            }
            
            <div class="barcode">
              ${booking._id || "NEW BOOKING"}
            </div>
            
            <div class="qr-code">
              BOOKING ID: ${booking._id || "NEW BOOKING"}
            </div>
          </div>
          
          <div class="ticket-footer">
            <p>Please present this ticket at the meeting point on the day of your tour.</p>
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
            filename: 'tour-booking-${
              booking._id ? booking._id.slice(-6) : "new"
            }.pdf',
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
