import Company from "../models/Company.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

// @desc    Create new company
// @route   POST /api/companies
// @access  Private (Super Admin only)
export const createCompany = async (req, res) => {
  try {
    const { name, description, contactInfo, primaryColor } = req.body;
    
    // Generate database URI and name for this company
    const dbName = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const databaseConfig = {
      uri: process.env.MONGO_URI,
      dbName: `company_${dbName}`
    };
    
    const company = await Company.create({
      name,
      description,
      contactInfo,
      primaryColor,
      databaseConfig
    });

    // Create admin user for this company
    const adminEmail = contactInfo.email || `${company.slug}@admin.com`;
    const hashedPassword = await bcrypt.hash("admin123", 10);
    
    const adminUser = await User.create({
      name: `${name} Admin`,
      email: adminEmail,
      passwordHash: hashedPassword,
      role: "admin",
      company: company._id
    });

    res.status(201).json({
      company,
      adminUser: {
        email: adminUser.email,
        password: "admin123"
      }
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all companies
// @route   GET /api/companies
// @access  Private (Super Admin only)
export const getCompanies = async (req, res) => {
  try {
    const companies = await Company.find();
    res.json(companies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get company by ID
// @route   GET /api/companies/:id
// @access  Private
export const getCompanyById = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }
    res.json(company);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
