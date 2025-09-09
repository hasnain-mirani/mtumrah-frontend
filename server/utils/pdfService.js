import PDFDocument from 'pdfkit';

export const generateBookingPDF = async (booking) => {
  return new Promise((resolve, reject) => {
    try {
      // Create a new PDF document
      const doc = new PDFDocument({ 
        size: 'A4',
        margin: 50,
        info: {
          Title: `Booking Confirmation - ${booking.customerName || 'Unknown'}`,
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
      
      doc.on('error', (error) => {
        console.error('PDF generation error:', error);
        reject(error);
      });

      // Helper function to safely get values
      const safeGet = (obj, key, defaultValue = 'N/A') => {
        try {
          return obj && obj[key] ? obj[key] : defaultValue;
        } catch {
          return defaultValue;
        }
      };

      // Helper function to format dates
      const formatDate = (date) => {
        try {
          return date ? new Date(date).toLocaleDateString() : 'N/A';
        } catch {
          return 'N/A';
        }
      };

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
         .text(`Booking ID: ${safeGet(booking, '_id')}`, 50, 120)
         .text(`Booking Date: ${formatDate(booking.createdAt)}`, 50, 140)
         .text(`Status: ${safeGet(booking, 'status', 'pending').toUpperCase()}`, 50, 160)
         .text(`Approval: ${safeGet(booking, 'approvalStatus', 'pending').toUpperCase()}`, 50, 180);

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
         .text(`Name: ${safeGet(booking, 'customerName')}`, 50, 250)
         .text(`Email: ${safeGet(booking, 'customerEmail')}`, 50, 270)
         .text(`Contact: ${safeGet(booking, 'contactNumber')}`, 50, 290)
         .text(`Passengers: ${safeGet(booking, 'passengers')}`, 50, 310)
         .text(`Adults: ${safeGet(booking, 'adults')}`, 50, 330)
         .text(`Children: ${safeGet(booking, 'children')}`, 50, 350);

      // Package Information Section
      doc.fontSize(16)
         .fillColor('#2c3e50')
         .text('Package Information', 50, 380);

      doc.fontSize(12)
         .fillColor('#34495e')
         .text(`Package: ${safeGet(booking, 'package')}`, 50, 410)
         .text(`Price: ${safeGet(booking, 'packagePrice')}`, 50, 430)
         .text(`Total Amount: ${safeGet(booking, 'totalAmount')}`, 50, 450)
         .text(`Payment Method: ${safeGet(booking, 'paymentMethod')}`, 50, 470)
         .text(`Additional Services: ${safeGet(booking, 'additionalServices')}`, 50, 490);

      // Travel Dates Section
      doc.fontSize(16)
         .fillColor('#2c3e50')
         .text('Travel Information', 50, 520);

      doc.fontSize(12)
         .fillColor('#34495e')
         .text(`Travel Date: ${formatDate(booking.date)}`, 50, 550)
         .text(`Departure: ${formatDate(booking.departureDate)}`, 50, 570)
         .text(`Return: ${formatDate(booking.returnDate)}`, 50, 590);

      // Flight Information (if available)
      if (booking.flight && (booking.flight.departureCity || booking.flight.arrivalCity)) {
        doc.fontSize(16)
           .fillColor('#2c3e50')
           .text('Flight Information', 50, 620);

        doc.fontSize(12)
           .fillColor('#34495e')
           .text(`From: ${safeGet(booking.flight, 'departureCity')}`, 50, 650)
           .text(`To: ${safeGet(booking.flight, 'arrivalCity')}`, 50, 670)
           .text(`Class: ${safeGet(booking.flight, 'flightClass')}`, 50, 690);
      }

      // Hotel Information (if available)
      if (booking.hotel && booking.hotel.hotelName) {
        const hotelY = booking.flight && (booking.flight.departureCity || booking.flight.arrivalCity) ? 720 : 620;
        
        doc.fontSize(16)
           .fillColor('#2c3e50')
           .text('Hotel Information', 50, hotelY);

        doc.fontSize(12)
           .fillColor('#34495e')
           .text(`Hotel: ${safeGet(booking.hotel, 'hotelName')}`, 50, hotelY + 30)
           .text(`Room Type: ${safeGet(booking.hotel, 'roomType')}`, 50, hotelY + 50)
           .text(`Check-in: ${formatDate(booking.hotel.checkIn)}`, 50, hotelY + 70)
           .text(`Check-out: ${formatDate(booking.hotel.checkOut)}`, 50, hotelY + 90);
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
           .text(`Type: ${safeGet(booking.visa, 'visaType')}`, 50, visaY + 30)
           .text(`Passport: ${safeGet(booking.visa, 'passportNumber')}`, 50, visaY + 50)
           .text(`Nationality: ${safeGet(booking.visa, 'nationality')}`, 50, visaY + 70);
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
           .text(`Type: ${safeGet(booking.transport, 'transportType')}`, 50, transportY + 30)
           .text(`Pickup: ${safeGet(booking.transport, 'pickupLocation')}`, 50, transportY + 50);
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
      console.error('PDF generation error:', error);
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
          Title: `Booking Confirmation - ${booking.customerName || 'Unknown'}`,
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
         .text(`Booking ID: ${booking._id || 'N/A'}`, 50, 120)
         .text(`Booking Date: ${booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : 'N/A'}`, 50, 140)
         .text(`Status: ${(booking.status || 'pending').toUpperCase()}`, 50, 160)
         .text(`Approval: ${(booking.approvalStatus || 'pending').toUpperCase()}`, 50, 180);

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