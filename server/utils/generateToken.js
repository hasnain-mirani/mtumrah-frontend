import jwt from "jsonwebtoken";

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || "your-super-secret-jwt-key-change-this-in-production",
    { expiresIn: process.env.JWT_EXPIRES || "7d" }
  );
};

export default generateToken;
