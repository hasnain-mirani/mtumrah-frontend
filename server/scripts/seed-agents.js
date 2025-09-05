import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Agent from '../models/Agent.js';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mtumrah-portal');
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

const seedAgents = async () => {
  try {
    // Check if agents already exist
    const existingAgents = await Agent.find({});
    if (existingAgents.length > 0) {
      console.log('Agents already exist, skipping...');
      return;
    }

    // Create test agents
    const agents = [
      {
        name: 'Ahmed Hassan',
        email: 'ahmed@example.com',
        passwordHash: await bcrypt.hash('password123', 10),
        phone: '+966 50 123 4567',
        monthlyTarget: 10000,
        commissionRate: 5.0,
        department: 'sales',
        isActive: true
      },
      {
        name: 'Fatima Al-Zahra',
        email: 'fatima@example.com',
        passwordHash: await bcrypt.hash('password123', 10),
        phone: '+966 50 234 5678',
        monthlyTarget: 8000,
        commissionRate: 4.5,
        department: 'sales',
        isActive: true
      },
      {
        name: 'Omar Abdullah',
        email: 'omar@example.com',
        passwordHash: await bcrypt.hash('password123', 10),
        phone: '+966 50 345 6789',
        monthlyTarget: 12000,
        commissionRate: 6.0,
        department: 'sales',
        isActive: true
      }
    ];

    await Agent.insertMany(agents);
    console.log('Test agents created successfully!');
  } catch (error) {
    console.error('Error seeding agents:', error);
  }
};

const runSeed = async () => {
  await connectDB();
  await seedAgents();
  process.exit(0);
};

runSeed();
