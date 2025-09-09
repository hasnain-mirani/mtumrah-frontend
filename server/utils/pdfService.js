import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export const generateBookingPDF = async (booking) => {
  return new Promise((resolve, reject) => {
    try {
      // Create a new PDF document
      const doc = new PDFDocument({ 
        size: 'A4',
        margin: 50,
        info: {
          Title: `Booking Confirmation - ${booking.customerName}`,
          Author: 'MT Umrah Portal',
          Subject: 'Booking Confirmation',
          Keywords: 'umrah, hajj, booking, travel',
          Creator: 'MT Umrah Portal System'
        }
      });

      // Create buffers array to collect PDF data
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // Header
      doc.fontSize(24)
         .fillColor('#2c3e50')
         .text('MT Umrah Portal', 50, 50)
         .fontSize(16)
         .fillColor('#7f8c8d')
         .text('Booking Confirmation', 50, 85);

      // Booking ID and Date
      doc.fontSize(12)
         .fillColor('#34495e')
         .text(`Booking ID: ${booking._id}`, 50, 120)
         .text(`Booking Date: ${new Date(booking.createdAt).toLocaleDateString()}`, 50, 140)
         .text(`Status: ${booking.status.toUpperCase()}`, 50, 160)
         .text(`Approval: ${booking.approvalStatus.toUpperCase()}`, 50, 180);

      // Line separator
      doc.moveTo(50, 200)
         .lineTo(550, 200)
         .stroke('#bdc3c7');

      // Customer Information Section
      doc.fontSize(16)
         .fillColor('#2c3e50')
         .text('Customer Information', 50, 220);

      doc.fontSize(12)
         .fillColor('#34495e')
         .text(`Name: ${booking.customerName}`, 50, 250)
         .text(`Email: ${booking.customerEmail}`, 50, 270)
         .text(`Contact: ${booking.contactNumber || 'N/A'}`, 50, 290)
         .text(`Passengers: ${booking.passengers || 'N/A'}`, 50, 310)
         .text(`Adults: ${booking.adults || 'N/A'}`, 50, 330)
         .text(`Children: ${booking.children || 'N/A'}`, 50, 350);

      // Package Information Section
      doc.fontSize(16)
         .fillColor('#2c3e50')
         .text('Package Information', 50, 380);

      doc.fontSize(12)
         .fillColor('#34495e')
         .text(`Package: ${booking.package}`, 50, 410)
         .text(`Price: ${booking.packagePrice || 'N/A'}`, 50, 430)
         .text(`Total Amount: ${booking.totalAmount || 'N/A'}`, 50, 450)
         .text(`Payment Method: ${booking.paymentMethod || 'N/A'}`, 50, 470)
         .text(`Additional Services: ${booking.additionalServices || 'N/A'}`, 50, 490);

      // Travel Dates Section
      doc.fontSize(16)
         .fillColor('#2c3e50')
         .text('Travel Information', 50, 520);

      doc.fontSize(12)
         .fillColor('#34495e')
         .text(`Travel Date: ${new Date(booking.date).toLocaleDateString()}`, 50, 550)
         .text(`Departure: ${booking.departureDate ? new Date(booking.departureDate).toLocaleDateString() : 'N/A'}`, 50, 570)
         .text(`Return: ${booking.returnDate ? new Date(booking.returnDate).toLocaleDateString() : 'N/A'}`, 50, 590);

      // Flight Information (if available)
      if (booking.flight && (booking.flight.departureCity || booking.flight.arrivalCity)) {
        doc.fontSize(16)
           .fillColor('#2c3e50')
           .text('Flight Information', 50, 620);

        doc.fontSize(12)
           .fillColor('#34495e')
           .text(`From: ${booking.flight.departureCity || 'N/A'}`, 50, 650)
           .text(`To: ${booking.flight.arrivalCity || 'N/A'}`, 50, 670)
           .text(`Class: ${booking.flight.flightClass || 'N/A'}`, 50, 690);
      }

      // Hotel Information (if available)
      if (booking.hotel && booking.hotel.hotelName) {
        const hotelY = booking.flight && (booking.flight.departureCity || booking.flight.arrivalCity) ? 720 : 620;
        
        doc.fontSize(16)
           .fillColor('#2c3e50')
           .text('Hotel Information', 50, hotelY);

        doc.fontSize(12)
           .fillColor('#34495e')
           .text(`Hotel: ${booking.hotel.hotelName}`, 50, hotelY + 30)
           .text(`Room Type: ${booking.hotel.roomType || 'N/A'}`, 50, hotelY + 50)
           .text(`Check-in: ${booking.hotel.checkIn ? new Date(booking.hotel.checkIn).toLocaleDateString() : 'N/A'}`, 50, hotelY + 70)
           .text(`Check-out: ${booking.hotel.checkOut ? new Date(booking.hotel.checkOut).toLocaleDateString() : 'N/A'}`, 50, hotelY + 90);
      }

      // Visa Information (if available)
      if (booking.visa && (booking.visa.passportNumber || booking.visa.nationality)) {
        const visaY = booking.hotel && booking.hotel.hotelName ? 
          (booking.flight && (booking.flight.departureCity || booking.flight.arrivalCity) ? 820 : 720) : 
          (booking.flight && (booking.flight.departureCity || booking.flight.arrivalCity) ? 720 : 620);
        
        doc.fontSize(16)
           .fillColor('#2c3e50')
           .text('Visa Information', 50, visaY);

        doc.fontSize(12)
           .fillColor('#34495e')
           .text(`Type: ${booking.visa.visaType || 'N/A'}`, 50, visaY + 30)
           .text(`Passport: ${booking.visa.passportNumber || 'N/A'}`, 50, visaY + 50)
           .text(`Nationality: ${booking.visa.nationality || 'N/A'}`, 50, visaY + 70);
      }

      // Transport Information (if available)
      if (booking.transport && booking.transport.transportType) {
        const transportY = booking.visa && (booking.visa.passportNumber || booking.visa.nationality) ? 
          (booking.hotel && booking.hotel.hotelName ? 
            (booking.flight && (booking.flight.departureCity || booking.flight.arrivalCity) ? 920 : 820) : 
            (booking.flight && (booking.flight.departureCity || booking.flight.arrivalCity) ? 820 : 720)) : 
          (booking.hotel && booking.hotel.hotelName ? 
            (booking.flight && (booking.flight.departureCity || booking.flight.arrivalCity) ? 820 : 720) : 
            (booking.flight && (booking.flight.departureCity || booking.flight.arrivalCity) ? 720 : 620));
        
        doc.fontSize(16)
           .fillColor('#2c3e50')
           .text('Transport Information', 50, transportY);

        doc.fontSize(12)
           .fillColor('#34495e')
           .text(`Type: ${booking.transport.transportType}`, 50, transportY + 30)
           .text(`Pickup: ${booking.transport.pickupLocation || 'N/A'}`, 50, transportY + 50);
      }

      // Footer
      const footerY = doc.page.height - 100;
      doc.fontSize(10)
         .fillColor('#7f8c8d')
         .text('Thank you for choosing MT Umrah Portal', 50, footerY)
         .text('For any queries, please contact us at support@mtumrah.com', 50, footerY + 20)
         .text(`Generated on: ${new Date().toLocaleString()}`, 50, footerY + 40);

      // Finalize the PDF
      doc.end();

    } catch (error) {
      reject(error);
    }
  });
};

export const generateBookingPDFFile = async (booking, filePath) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        size: 'A4',
        margin: 50,
        info: {
          Title: `Booking Confirmation - ${booking.customerName}`,
          Author: 'MT Umrah Portal',
          Subject: 'Booking Confirmation',
          Keywords: 'umrah, hajj, booking, travel',
          Creator: 'MT Umrah Portal System'
        }
      });

      // Pipe the PDF to a file
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Same content as above...
      // Header
      doc.fontSize(24)
         .fillColor('#2c3e50')
         .text('MT Umrah Portal', 50, 50)
         .fontSize(16)
         .fillColor('#7f8c8d')
         .text('Booking Confirmation', 50, 85);

      // Booking ID and Date
      doc.fontSize(12)
         .fillColor('#34495e')
         .text(`Booking ID: ${booking._id}`, 50, 120)
         .text(`Booking Date: ${new Date(booking.createdAt).toLocaleDateString()}`, 50, 140)
         .text(`Status: ${booking.status.toUpperCase()}`, 50, 160)
         .text(`Approval: ${booking.approvalStatus.toUpperCase()}`, 50, 180);

      // Line separator
      doc.moveTo(50, 200)
         .lineTo(550, 200)
         .stroke('#bdc3c7');

      // Customer Information Section
      doc.fontSize(16)
         .fillColor('#2c3e50')
         .text('Customer Information', 50, 220);

      doc.fontSize(12)
         .fillColor('#34495e')
         .text(`Name: ${booking.customerName}`, 50, 250)
         .text(`Email: ${booking.customerEmail}`, 50, 270)
         .text(`Contact: ${booking.contactNumber || 'N/A'}`, 50, 290)
         .text(`Passengers: ${booking.passengers || 'N/A'}`, 50, 310)
         .text(`Adults: ${booking.adults || 'N/A'}`, 50, 330)
         .text(`Children: ${booking.children || 'N/A'}`, 50, 350);

      // Package Information Section
      doc.fontSize(16)
         .fillColor('#2c3e50')
         .text('Package Information', 50, 380);

      doc.fontSize(12)
         .fillColor('#34495e')
         .text(`Package: ${booking.package}`, 50, 410)
         .text(`Price: ${booking.packagePrice || 'N/A'}`, 50, 430)
         .text(`Total Amount: ${booking.totalAmount || 'N/A'}`, 50, 450)
         .text(`Payment Method: ${booking.paymentMethod || 'N/A'}`, 50, 470)
         .text(`Additional Services: ${booking.additionalServices || 'N/A'}`, 50, 490);

      // Travel Dates Section
      doc.fontSize(16)
         .fillColor('#2c3e50')
         .text('Travel Information', 50, 520);

      doc.fontSize(12)
         .fillColor('#34495e')
         .text(`Travel Date: ${new Date(booking.date).toLocaleDateString()}`, 50, 550)
         .text(`Departure: ${booking.departureDate ? new Date(booking.departureDate).toLocaleDateString() : 'N/A'}`, 50, 570)
         .text(`Return: ${booking.returnDate ? new Date(booking.returnDate).toLocaleDateString() : 'N/A'}`, 50, 590);

      // Footer
      const footerY = doc.page.height - 100;
      doc.fontSize(10)
         .fillColor('#7f8c8d')
         .text('Thank you for choosing MT Umrah Portal', 50, footerY)
         .text('For any queries, please contact us at support@mtumrah.com', 50, footerY + 20)
         .text(`Generated on: ${new Date().toLocaleString()}`, 50, footerY + 40);

      stream.on('finish', () => {
        resolve(filePath);
      });

      stream.on('error', (error) => {
        reject(error);
      });

      // Finalize the PDF
      doc.end();

    } catch (error) {
      reject(error);
    }
  });
};
