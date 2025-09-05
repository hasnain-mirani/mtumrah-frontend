import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
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

const seedBookings = async () => {
  try {
    // Get agents (use existing ones)
    const agents = await Agent.find({ role: 'agent' }).limit(2);
    console.log('Found agents:', agents.map(a => ({ id: a._id, name: a.name })));

    if (agents.length === 0) {
      console.log('No agents found, skipping booking creation');
      return;
    }

    // Create test bookings for agents
    const bookings = [
      {
        customerName: 'Ahmed Hassan',
        customerEmail: 'ahmed@example.com',
        contactNumber: '+966 50 123 4567',
        package: 'Premium Umrah Package',
        totalAmount: '3500',
        date: new Date(),
        agent: agents[0]._id,
        status: 'confirmed',
        approvalStatus: 'approved',
        createdAt: new Date()
      },
      {
        customerName: 'Fatima Al-Zahra',
        customerEmail: 'fatima@example.com',
        contactNumber: '+966 50 234 5678',
        package: 'Standard Umrah Package',
        totalAmount: '2500',
        date: new Date(),
        agent: agents[0]._id,
        status: 'confirmed',
        approvalStatus: 'approved',
        createdAt: new Date()
      },
      {
        customerName: 'Omar Abdullah',
        customerEmail: 'omar@example.com',
        contactNumber: '+966 50 345 6789',
        package: 'Deluxe Umrah Package',
        totalAmount: '4500',
        date: new Date(),
        agent: agents[1]._id,
        status: 'confirmed',
        approvalStatus: 'approved',
        createdAt: new Date()
      },
      {
        customerName: 'Aisha Mohammed',
        customerEmail: 'aisha@example.com',
        contactNumber: '+966 50 456 7890',
        package: 'Economy Umrah Package',
        totalAmount: '1800',
        date: new Date(),
        agent: agents[1]._id,
        status: 'pending',
        approvalStatus: 'pending',
        createdAt: new Date()
      },
      {
        customerName: 'Yusuf Ali',
        customerEmail: 'yusuf@example.com',
        contactNumber: '+966 50 567 8901',
        package: 'Premium Umrah Package',
        totalAmount: '3800',
        date: new Date(),
        agent: agents[0]._id,
        status: 'confirmed',
        approvalStatus: 'approved',
        createdAt: new Date()
      }
    ];

    await Booking.insertMany(bookings);
    console.log('Test bookings created successfully!');
    
    // Update agent performance
    for (const agent of agents) {
      const agentBookings = await Booking.find({ agent: agent._id });
      const totalBookings = agentBookings.length;
      const totalRevenue = agentBookings.reduce((sum, booking) => {
        return sum + (parseFloat(booking.totalAmount) || 0);
      }, 0);
      
      await Agent.findByIdAndUpdate(agent._id, {
        totalBookings,
        totalRevenue,
        lastActivity: new Date()
      });
      
      console.log(`Updated agent ${agent.name}: ${totalBookings} bookings, $${totalRevenue} revenue`);
    }
  } catch (error) {
    console.error('Error seeding bookings:', error);
  }
};

const runSeed = async () => {
  await connectDB();
  await seedBookings();
  process.exit(0);
};

runSeed();
