import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
console.log("CWD:", process.cwd());
console.log("Seeder:", path.resolve(__filename));

// Try common model locations; adjust if needed
let User;
try {
  ({ default: User } = await import("../models/User.js"));
} catch {
  try {
    ({ default: User } = await import("../src/models/User.js"));
  } catch {
    console.error("❌ Could not load User model from ../models/User.js or ../src/models/User.js");
    process.exit(1);
  }
}

// parse flags
const args = Object.fromEntries(
  process.argv
    .slice(2)
    .filter(a => a.startsWith("--"))
    .map(a => {
      const [k, v] = a.slice(2).split("=");
      return [k, v === undefined ? true : v];
    })
);

const ADMIN_EMAIL   = process.env.ADMIN_EMAIL    ?? "admin@demo.com";
const ADMIN_NAME    = process.env.ADMIN_NAME     ?? "Admin";
const DEFAULT_PASS  = process.env.ADMIN_PASSWORD ?? "ChangeMe!123";
const CONN          = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!CONN) {
  console.error("❌ No Mongo connection string. Set MONGODB_URI or MONGO_URI in server/.env");
  process.exit(1);
}

await mongoose.connect(CONN);
console.log("✅ Connected to MongoDB");

const force   = Boolean(args["force-admin"]);
const passArg = args.password || null;
const roleArg = args.role || null;

const existing = await User.findOne({ email: ADMIN_EMAIL }).lean();

// decide if we need a password hash
let passwordHash;
if (passArg) {
  passwordHash = await bcrypt.hash(passArg, 12);
} else if (!existing) {
  passwordHash = await bcrypt.hash(DEFAULT_PASS, 12); // first-time create
}

if (!existing) {
  // INSERT path: use ONLY $setOnInsert (no $set), avoids conflict
  const setOnInsert = {
    email: ADMIN_EMAIL,
    name: ADMIN_NAME,
    role: roleArg || "admin",
    ...(passwordHash ? { passwordHash } : {}) // change to { password: passwordHash } if your schema uses "password"
  };

  const res = await User.updateOne(
    { email: ADMIN_EMAIL },
    { $setOnInsert: setOnInsert },
    { upsert: true }
  );

  if (res.upsertedCount) {
    console.log("🌱 Admin created.");
  } else {
    // rare race where another process inserted meanwhile
    console.log("ℹ Admin already exists after upsert.");
  }
} else {
  // UPDATE path: use ONLY $set (no $setOnInsert)
  const setFields = {};

  if (force) {
    setFields.name = ADMIN_NAME;
    setFields.role = "admin";
  }
  if (roleArg) {
    setFields.role = roleArg; // explicit role override if provided
  }
  if (passwordHash) {
    setFields.passwordHash = passwordHash; // change to "password" if your schema uses that
  }

  if (Object.keys(setFields).length) {
    await User.updateOne({ email: ADMIN_EMAIL }, { $set: setFields });
    const changed = [
      force ? "profile" : null,
      passwordHash ? "password" : null,
      roleArg ? `role→${roleArg}` : null
    ].filter(Boolean).join(", ");
    console.log(`🔄 Admin updated (${changed}).`);
  } else {
    console.log("ℹ Admin already exists, skipping...");
  }
}

await mongoose.disconnect();
console.log("✅ Disconnected");
