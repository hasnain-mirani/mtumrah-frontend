import nodemailer from 'nodemailer';

// Create transporter (using Gmail as example - you can change this)
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail', // You can use other services like 'outlook', 'yahoo', etc.
    auth: {
      user: process.env.EMAIL_USER || 'your-email@gmail.com',
      pass: process.env.EMAIL_PASS || 'your-app-password'
    }
  });
};

// Send booking confirmation email
export const sendBookingConfirmationEmail = async (bookingData) => {
  try {
    console.log('📧 Attempting to send booking confirmation email...');
    console.log('📧 Email config:', {
      user: process.env.EMAIL_USER,
      hasPass: !!process.env.EMAIL_PASS
    });
    console.log('📧 Booking data:', {
      customerEmail: bookingData.customerEmail,
      package: bookingData.package
    });
    
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: bookingData.customerEmail,
      subject: `Booking Confirmation - ${bookingData.package}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Booking Confirmation</h2>
          
          <p>Dear ${bookingData.customerName},</p>
          
          <p>Thank you for your booking! We're excited to help you with your ${bookingData.package}.</p>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e40af; margin-top: 0;">Booking Details</h3>
            <p><strong>Package:</strong> ${bookingData.package}</p>
            <p><strong>Total Amount:</strong> ${bookingData.totalAmount || 'TBD'}</p>
            <p><strong>Travel Date:</strong> ${bookingData.departureDate ? new Date(bookingData.departureDate).toLocaleDateString() : 'TBD'}</p>
            <p><strong>Status:</strong> ${bookingData.status}</p>
          </div>
          
          <p>If you have any questions or need to make changes to your booking, please don't hesitate to contact us:</p>
          
          <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="color: #92400e; margin-top: 0;">Need Help?</h4>
            <p>Email us at: <a href="mailto:inquiries@mtumrah.com" style="color: #2563eb;">inquiries@mtumrah.com</a></p>
            <p>Or reply to this email with your questions.</p>
          </div>
          
          <p>We look forward to serving you!</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            Best regards,<br>
            MT Umrah Portal Team
          </p>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Booking confirmation email sent:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending booking confirmation email:', error);
    return { success: false, error: error.message };
  }
};

// Send inquiry notification email to admin
export const sendInquiryNotificationEmail = async (inquiryData) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: process.env.ADMIN_EMAIL || 'admin@mtumrah.com',
      subject: `New Inquiry from ${inquiryData.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">New Customer Inquiry</h2>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e40af; margin-top: 0;">Customer Details</h3>
            <p><strong>Name:</strong> ${inquiryData.name}</p>
            <p><strong>Email:</strong> ${inquiryData.email}</p>
            <p><strong>Phone:</strong> ${inquiryData.phone || 'Not provided'}</p>
            <p><strong>Subject:</strong> ${inquiryData.subject}</p>
          </div>
          
          <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="color: #92400e; margin-top: 0;">Message</h4>
            <p style="white-space: pre-wrap;">${inquiryData.message}</p>
          </div>
          
          <p>Please respond to this inquiry as soon as possible.</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            This inquiry was submitted through the MT Umrah Portal.
          </p>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Inquiry notification email sent:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending inquiry notification email:', error);
    return { success: false, error: error.message };
  }
};

// Send inquiry response to customer
export const sendInquiryResponseEmail = async (inquiryData, responseMessage, responderName = 'MT Umrah Team') => {
  try {
    console.log('📧 Sending inquiry response to customer...');
    console.log('📧 Customer:', inquiryData.email);
    console.log('📧 Subject:', inquiryData.subject);
    
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: inquiryData.email,
      subject: `Re: ${inquiryData.subject} - MT Umrah Portal`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Response to Your Inquiry</h2>
          
          <p>Dear ${inquiryData.name},</p>
          
          <p>Thank you for contacting us regarding: <strong>${inquiryData.subject}</strong></p>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
            <h3 style="color: #1e40af; margin-top: 0;">Our Response</h3>
            <p style="white-space: pre-wrap; line-height: 1.6;">${responseMessage}</p>
          </div>
          
          <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="color: #92400e; margin-top: 0;">Your Original Inquiry</h4>
            <p style="white-space: pre-wrap; line-height: 1.6;">${inquiryData.message}</p>
          </div>
          
          <p>If you have any further questions or need additional assistance, please don't hesitate to contact us.</p>
          
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="color: #374151; margin-top: 0;">Contact Information</h4>
            <p><strong>Email:</strong> ${process.env.EMAIL_USER}</p>
            <p><strong>Phone:</strong> +92-XXX-XXXXXXX</p>
          </div>
          
          <p style="color: #6b7280; font-size: 14px;">
            Best regards,<br>
            ${responderName}<br>
            MT Umrah Portal Team
          </p>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Inquiry response email sent:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Error sending inquiry response email:', error);
    return { success: false, error: error.message };
  }
};
