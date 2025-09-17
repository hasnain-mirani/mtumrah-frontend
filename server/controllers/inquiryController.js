import Inquiry from "../models/Inquiry.js";
import { getCompanyModels } from "../utils/dbManager.js";
import { sendInquiryNotificationEmail, sendInquiryResponseEmail } from "../utils/emailService.js";

// Create a new inquiry
export const createInquiry = async (req, res) => {
  try {
    // Get company-specific models
    const { Inquiry: CompanyInquiry } = await getCompanyModels(req.user.company._id);
    
    const { name, email, phone, subject, message, priority, relatedBooking } = req.body;
    
    const inquiry = new CompanyInquiry({ 
      name, 
      email, 
      phone, 
      subject, 
      message, 
      priority: priority || 'medium',
      relatedBooking 
    });
    
    await inquiry.save();
    
    // Send notification email to admin
    try {
      await sendInquiryNotificationEmail({
        name,
        email,
        phone,
        subject,
        message
      });
    } catch (emailError) {
      console.error('Failed to send inquiry notification email:', emailError);
      // Don't fail the inquiry creation if email fails
    }
    
    res.status(201).json({ success: true, data: inquiry });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all inquiries (Admin sees all, Agent sees only theirs)
export const getInquiries = async (req, res) => {
  try {
    // Get company-specific models
    const { Inquiry: CompanyInquiry } = await getCompanyModels(req.user.company._id);
    
    let filter = {};
    if (req.user.role === "agent") {
      filter = { assignedAgent: req.user._id };
    }

    const inquiries = await CompanyInquiry.find(filter)
      .populate("assignedAgent", "name email")
      .sort({ createdAt: -1 }); // latest first

    res.json({ success: true, data: inquiries });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get inquiry by ID
export const getInquiryById = async (req, res) => {
  try {
    // Get company-specific models
    const { Inquiry: CompanyInquiry } = await getCompanyModels(req.user.company._id);
    
    const inquiry = await CompanyInquiry.findById(req.params.id).populate("assignedAgent", "name email");

    if (!inquiry) return res.status(404).json({ success: false, message: "Inquiry not found" });

    // Agents can see only their inquiries
    if (req.user.role === "agent" && inquiry.assignedAgent?._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    res.json({ success: true, data: inquiry });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update inquiry
export const updateInquiry = async (req, res) => {
  try {
    // Get company-specific models
    const { Inquiry: CompanyInquiry } = await getCompanyModels(req.user.company._id);
    
    const { status, assignedAgent } = req.body;
    const inquiry = await CompanyInquiry.findById(req.params.id);
    if (!inquiry) return res.status(404).json({ success: false, message: "Inquiry not found" });

    // Agents can update only their inquiries
    if (req.user.role === "agent" && inquiry.assignedAgent?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    if (status) inquiry.status = status;
    if (assignedAgent && req.user.role === "admin") inquiry.assignedAgent = assignedAgent;

    await inquiry.save();
    res.json({ success: true, data: inquiry });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add a response
export const addResponse = async (req, res) => {
  try {
    // Get company-specific models
    const { Inquiry: CompanyInquiry } = await getCompanyModels(req.user.company._id);
    
    const { message } = req.body;
    const inquiry = await CompanyInquiry.findById(req.params.id);
    if (!inquiry) return res.status(404).json({ success: false, message: "Inquiry not found" });

    inquiry.responses.push({ message, responder: req.user._id });
    await inquiry.save();
    
    // Send response email to customer
    try {
      await sendInquiryResponseEmail({
        name: inquiry.name,
        email: inquiry.email,
        subject: inquiry.subject,
        message: inquiry.message
      }, message, req.user.name || 'MT Umrah Team');
    } catch (emailError) {
      console.error('Failed to send inquiry response email:', emailError);
      // Don't fail the response if email fails
    }
    
    res.json({ success: true, data: inquiry });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete inquiry (Admin only)
export const deleteInquiry = async (req, res) => {
  try {
    // Get company-specific models
    const { Inquiry: CompanyInquiry } = await getCompanyModels(req.user.company._id);
    
    const inquiry = await CompanyInquiry.findByIdAndDelete(req.params.id);
    if (!inquiry) return res.status(404).json({ success: false, message: "Inquiry not found" });

    res.json({ success: true, message: "Inquiry deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Approve inquiry
export const approveInquiry = async (req, res) => {
  try {
    // Get company-specific models
    const { Inquiry: CompanyInquiry } = await getCompanyModels(req.user.company._id);
    
    const inquiry = await CompanyInquiry.findById(req.params.id);
    if (!inquiry) return res.status(404).json({ success: false, message: "Inquiry not found" });

    inquiry.approvalStatus = "approved";
    inquiry.status = "responded";
    const updatedInquiry = await inquiry.save();
    
    res.json({ success: true, data: updatedInquiry });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Reject inquiry
export const rejectInquiry = async (req, res) => {
  try {
    // Get company-specific models
    const { Inquiry: CompanyInquiry } = await getCompanyModels(req.user.company._id);
    
    const inquiry = await CompanyInquiry.findById(req.params.id);
    if (!inquiry) return res.status(404).json({ success: false, message: "Inquiry not found" });

    inquiry.approvalStatus = "rejected";
    inquiry.status = "closed";
    const updatedInquiry = await inquiry.save();
    
    res.json({ success: true, data: updatedInquiry });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
