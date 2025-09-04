import Agent from "../models/Agent.js";
import generateToken from "../utils/generateToken.js";

// Register Agent
export const registerAgent = async (req, res) => {
  const { name, email, password, phone } = req.body;

  const agentExists = await Agent.findOne({ email });
  if (agentExists) return res.status(400).json({ message: "Agent already exists" });

  const agent = await Agent.create({ name, email, passwordHash: password, phone });

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
