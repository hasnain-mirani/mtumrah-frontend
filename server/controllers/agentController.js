import Agent from "../models/Agent.js";
import Booking from "../models/Booking.js";
import generateToken from "../utils/generateToken.js";

// Register Agent
export const registerAgent = async (req, res) => {
  const { 
    name, 
    email, 
    password, 
    phone, 
    monthlyTarget, 
    commissionRate, 
    department 
  } = req.body;

  const agentExists = await Agent.findOne({ email });
  if (agentExists) return res.status(400).json({ message: "Agent already exists" });

  const agent = await Agent.create({ 
    name, 
    email, 
    passwordHash: password, 
    phone,
    monthlyTarget: monthlyTarget || 5000,
    commissionRate: commissionRate || 5.0,
    department: department || 'sales'
  });

  if (agent) {
    res.status(201).json({
      _id: agent._id,
      name: agent.name,
      email: agent.email,
      role: agent.role,
      token: generateToken(agent._id, agent.role),
    });
  } else {
    res.status(400).json({ message: "Invalid agent data" });
  }
};

// Login Agent
export const loginAgent = async (req, res) => {
  const { email, password } = req.body;
  const agent = await Agent.findOne({ email });

  if (agent && (await agent.matchPassword(password))) {
    res.json({
      _id: agent._id,
      name: agent.name,
      email: agent.email,
      phone: agent.phone,
      role: agent.role,
      token: generateToken(agent._id, agent.role),
    });
  } else {
    res.status(401).json({ message: "Invalid email or password" });
  }
};

// Get All Agents (Admin only)
export const getAgents = async (req, res) => {
  const agents = await Agent.find({});
  res.json(agents);
};

// Get Single Agent
export const getAgentById = async (req, res) => {
  const agent = await Agent.findById(req.params.id);
  if (agent) res.json(agent);
  else res.status(404).json({ message: "Agent not found" });
};

// Update Agent (Admin or Self)
export const updateAgent = async (req, res) => {
  const agent = await Agent.findById(req.params.id);
  if (!agent) return res.status(404).json({ message: "Agent not found" });

  // Only admin or the agent himself can update
  if (req.user.role !== "admin" && req.user._id.toString() !== agent._id.toString()) {
    return res.status(403).json({ message: "Not authorized" });
  }

  agent.name = req.body.name || agent.name;
  agent.email = req.body.email || agent.email;
  agent.phone = req.body.phone || agent.phone;
  agent.monthlyTarget = req.body.monthlyTarget || agent.monthlyTarget;
  agent.commissionRate = req.body.commissionRate || agent.commissionRate;
  agent.department = req.body.department || agent.department;
  if (req.body.password) agent.passwordHash = req.body.password;

  const updatedAgent = await agent.save();
  res.json(updatedAgent);
};

// Delete Agent (Admin only)
export const deleteAgent = async (req, res) => {
  const agent = await Agent.findById(req.params.id);
  if (!agent) return res.status(404).json({ message: "Agent not found" });

  await agent.deleteOne();
  res.json({ message: "Agent removed" });
};

// Calculate agent performance from booking data
export const calculateAgentPerformance = async (agentId) => {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  // Get all bookings for this agent
  const allBookings = await Booking.find({ agent: agentId });
  
  // Calculate total statistics
  const totalBookings = allBookings.length;
  const totalRevenue = allBookings.reduce((sum, booking) => {
    const amount = parseFloat(booking.totalAmount) || 0;
    return sum + amount;
  }, 0);
  
  // Calculate monthly statistics
  const monthlyBookings = allBookings.filter(booking => {
    const bookingDate = new Date(booking.createdAt);
    return bookingDate.getMonth() === currentMonth && bookingDate.getFullYear() === currentYear;
  }).length;
  
  const monthlyRevenue = allBookings
    .filter(booking => {
      const bookingDate = new Date(booking.createdAt);
      return bookingDate.getMonth() === currentMonth && bookingDate.getFullYear() === currentYear;
    })
    .reduce((sum, booking) => {
      const amount = parseFloat(booking.totalAmount) || 0;
      return sum + amount;
    }, 0);
  
  // Get recent bookings (last 5)
  const recentBookings = allBookings
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)
    .map(booking => ({
      id: booking._id,
      customer: booking.customerName,
      amount: parseFloat(booking.totalAmount) || 0,
      date: booking.createdAt
    }));
  
  return {
    totalBookings,
    totalRevenue,
    monthlyBookings,
    monthlyRevenue,
    recentBookings
  };
};

// Update agent performance statistics
export const updateAgentPerformance = async (req, res) => {
  try {
    const { agentId } = req.params;
    
    // Calculate performance
    const performance = await calculateAgentPerformance(agentId);
    
    // Update agent with new performance data
    const agent = await Agent.findByIdAndUpdate(
      agentId,
      {
        totalBookings: performance.totalBookings,
        totalRevenue: performance.totalRevenue,
        monthlyBookings: performance.monthlyBookings,
        monthlyRevenue: performance.monthlyRevenue,
        lastActivity: new Date()
      },
      { new: true }
    );
    
    if (!agent) {
      return res.status(404).json({ message: "Agent not found" });
    }
    
    res.json({
      agent,
      performance
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating agent performance", error: error.message });
  }
};

// Get agent performance statistics
export const getAgentPerformance = async (req, res) => {
  try {
    const { agentId } = req.params;
    
    const performance = await calculateAgentPerformance(agentId);
    const agent = await Agent.findById(agentId);
    
    if (!agent) {
      return res.status(404).json({ message: "Agent not found" });
    }
    
    res.json({
      agent: {
        ...agent.toObject(),
        ...performance
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Error getting agent performance", error: error.message });
  }
};

// Get all agents with performance data
export const getAgentsWithPerformance = async (req, res) => {
  try {
    const agents = await Agent.find({});
    const agentsWithPerformance = await Promise.all(
      agents.map(async (agent) => {
        const performance = await calculateAgentPerformance(agent._id);
        return {
          ...agent.toObject(),
          ...performance
        };
      })
    );
    
    res.json(agentsWithPerformance);
  } catch (error) {
    res.status(500).json({ message: "Error getting agents with performance", error: error.message });
  }
};
