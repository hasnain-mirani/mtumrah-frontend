import PDFDocument from 'pdfkit';

export const generateBookingPDF = async (booking) => {
  return new Promise((resolve, reject) => {
    try {
      // Create a new PDF document
      const doc = new PDFDocument({ 
        size: 'A4',
        margin: 30,
        info: {
          Title: `Marwah Booking Details - ${booking.customerName || 'Unknown'}`,
          Author: 'Marwah Travel',
          Subject: 'Booking Details',
          Keywords: 'umrah, hajj, booking, travel, marwah',
          Creator: 'Marwah Travel System'
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
      const safeGet = (obj, key, defaultValue = '') => {
        try {
          return obj && obj[key] ? obj[key] : defaultValue;
        } catch {
          return defaultValue;
        }
      };

      // Helper function to format dates
      const formatDate = (date) => {
        try {
          return date ? new Date(date).toLocaleDateString() : '';
        } catch {
          return '';
        }
      };

      // Helper function to create table
      const createTable = (doc, x, y, headers, data, colWidths) => {
        const rowHeight = 20;
        const headerHeight = 25;
        
        // Draw table headers
        doc.fontSize(9).font('Helvetica-Bold');
        let currentX = x;
        headers.forEach((header, index) => {
          doc.rect(currentX, y, colWidths[index], headerHeight).stroke();
          doc.text(header, currentX + 3, y + 6, { width: colWidths[index] - 6, align: 'left' });
          currentX += colWidths[index];
        });
        
        // Draw data rows
        doc.font('Helvetica');
        data.forEach((row, rowIndex) => {
          const rowY = y + headerHeight + (rowIndex * rowHeight);
          currentX = x;
          row.forEach((cell, colIndex) => {
            doc.rect(currentX, rowY, colWidths[colIndex], rowHeight).stroke();
            doc.text(cell || '', currentX + 3, rowY + 6, { width: colWidths[colIndex] - 6, align: 'left' });
            currentX += colWidths[colIndex];
          });
        });
        
        return y + headerHeight + (data.length * rowHeight) + 15;
      };

      // Main title
      doc.fontSize(18).font('Helvetica-Bold').fillColor('black');
      doc.text('Marwah Booking Details', 30, 30, { align: 'center' });

      let currentY = 70;

      // CREDIT CARD INFO section
      doc.fontSize(12).font('Helvetica-Bold').fillColor('black');
      doc.text('CREDIT CARD INFO', 30, currentY, { align: 'center' });
      currentY += 25;

      const creditCardHeaders = ['CARD NUMBER', 'CARD HOLDER NAME', 'CARD EXPIRY', 'CVC'];
      const creditCardData = [[
        safeGet(booking.payment, 'cardNumber', ''),
        safeGet(booking.payment, 'cardholderName', ''),
        safeGet(booking.payment, 'expiryDate', ''),
        safeGet(booking.payment, 'cvv', '')
      ]];
      const creditCardWidths = [100, 100, 80, 50];
      currentY = createTable(doc, 30, currentY, creditCardHeaders, creditCardData, creditCardWidths);

      // CONTACT DETAILS section
      doc.fontSize(12).font('Helvetica-Bold').fillColor('black');
      doc.text('CONTACT DETAILS', 30, currentY, { align: 'center' });
      currentY += 25;

      const contactHeaders = ['FULL NAME', 'PASSENGERS', 'ADULT(S)', 'CHILD(S)', 'EMAIL', 'CONTACT'];
      const contactData = [[
        safeGet(booking, 'customerName', ''),
        safeGet(booking, 'passengers', ''),
        safeGet(booking, 'adults', ''),
        safeGet(booking, 'children', ''),
        safeGet(booking, 'customerEmail', ''),
        safeGet(booking, 'contactNumber', '')
      ]];
      const contactWidths = [80, 60, 50, 50, 100, 80];
      currentY = createTable(doc, 30, currentY, contactHeaders, contactData, contactWidths);

      // Flight details text
      doc.fontSize(10).font('Helvetica');
      doc.text('Airline Name:', 30, currentY);
      doc.text('Departure Airport:', 150, currentY);
      currentY += 20;

      // FLIGHT DETAILS section
      doc.fontSize(12).font('Helvetica-Bold');
      doc.text('FLIGHT DETAILS', 30, currentY, { align: 'center' });
      currentY += 25;

      const flightHeaders = ['SG NO', 'IATA CODE', 'FLIGHT NO', 'DATE', 'FROM', 'TO', 'DEPT TIME', 'NEXT'];
      const flightData = [[
        '', // SG NO
        '', // IATA CODE
        '', // FLIGHT NO
        formatDate(booking.departureDate),
        safeGet(booking.flight, 'departureCity', ''),
        safeGet(booking.flight, 'arrivalCity', ''),
        '', // DEPT TIME
        formatDate(booking.returnDate)
      ]];
      const flightWidths = [50, 50, 60, 60, 60, 60, 60, 50];
      currentY = createTable(doc, 30, currentY, flightHeaders, flightData, flightWidths);

      // HOTEL RESERVATIONS section
      doc.fontSize(12).font('Helvetica-Bold');
      doc.text('HOTEL RESERVATIONS', 30, currentY, { align: 'center' });
      currentY += 25;

      const hotelHeaders = ['CITY', 'HOTEL NAME', 'ROOM TYPE', 'EXTRA', 'NIGHTS', 'CHECKIN', 'CHECKOUT'];
      const hotelData = [
        [
          'makkah',
          safeGet(booking.hotel, 'hotelName', ''),
          safeGet(booking.hotel, 'roomType', 'double'),
          'bb',
          '',
          formatDate(booking.hotel?.checkIn),
          formatDate(booking.hotel?.checkOut)
        ],
        [
          '',
          '',
          'single',
          'bb',
          '',
          '',
          ''
        ]
      ];
      const hotelWidths = [60, 80, 60, 40, 50, 60, 60];
      currentY = createTable(doc, 30, currentY, hotelHeaders, hotelData, hotelWidths);

      // TRANSPORTATION section
      doc.fontSize(12).font('Helvetica-Bold');
      doc.text('TRANSPORTATION', 30, currentY, { align: 'center' });
      currentY += 25;

      const transportHeaders = ['ARRIVAL AIRPORT', 'DESTINATION', 'CAR TYPE', 'LUGGAGE', 'ZIYARAT'];
      const transportData = [[
        '',
        '',
        safeGet(booking.transport, 'transportType', 'sedan'),
        '',
        'yes'
      ]];
      const transportWidths = [80, 80, 60, 60, 60];
      currentY = createTable(doc, 30, currentY, transportHeaders, transportData, transportWidths);

      // VISA DETAILS section
      doc.fontSize(12).font('Helvetica-Bold');
      doc.text('VISA DETAILS', 30, currentY, { align: 'center' });
      currentY += 25;

      const visaHeaders = ['PASSENGER NAME', 'AGE', 'NATIONALITY', 'GREEN CARD HOLDER'];
      const visaData = [[
        safeGet(booking, 'customerName', ''),
        'adult',
        safeGet(booking.visa, 'nationality', ''),
        'yes'
      ]];
      const visaWidths = [100, 50, 80, 80];
      currentY = createTable(doc, 30, currentY, visaHeaders, visaData, visaWidths);

      // COSTING section
      doc.fontSize(12).font('Helvetica-Bold');
      doc.text('COSTING', 30, currentY, { align: 'center' });
      currentY += 25;

      const costingHeaders = ['NAME', 'UNITS', 'COST/UNIT', 'SALE/UNIT', 'TOTAL COST', 'TOTAL SALE', 'PROFIT'];
      const costingData = [
        ['Flight(s)', '1', '$0', '$0', '0', '0', '0'],
        ['Makkah Hotel', '1', '$0', '$0', '0', '0', '0'],
        ['Madina Hotel', '0', '$0', '$0', '0', '0', '0'],
        ['Other Hotels', '1', '$0', '$0', '0', '0', '0'],
        ['Visa(s)', '1', '$0', '$0', '0', '0', '0'],
        ['Transportation', '1', '$0', '$0', '0', '0', '0'],
        ['Total Profit', '', '', '', '', '', '0']
      ];
      const costingWidths = [80, 50, 60, 60, 60, 60, 60];
      currentY = createTable(doc, 30, currentY, costingHeaders, costingData, costingWidths);

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
        margin: 30,
        info: {
          Title: `Marwah Booking Details - ${booking.customerName || 'Unknown'}`,
          Author: 'Marwah Travel',
          Subject: 'Booking Details',
          Keywords: 'umrah, hajj, booking, travel, marwah',
          Creator: 'Marwah Travel System'
        }
      });

      // Pipe the PDF to a file
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Same content as above...
      // Main title
      doc.fontSize(18).font('Helvetica-Bold').fillColor('black');
      doc.text('Marwah Booking Details', 30, 30, { align: 'center' });

      // ... rest of the content would be the same as above

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