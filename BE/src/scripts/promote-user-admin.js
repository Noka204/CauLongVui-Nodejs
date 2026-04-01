/**
 * Promote a user to Admin role and optionally reset password.
 *
 * Usage:
 *   node src/scripts/promote-user-admin.js
 *   node src/scripts/promote-user-admin.js <email> <newPassword>
 *
 * Default target:
 *   email: quoctran050204@gmail.com
 *   password: abc123
 */
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const User = require('../models/user.model');
const Role = require('../models/role.model');

dotenv.config();

const DEFAULT_EMAIL = 'quoctran050204@gmail.com';
const DEFAULT_PASSWORD = 'abc123';

const targetEmail = (process.argv[2] || DEFAULT_EMAIL).trim().toLowerCase();
const newPassword = (process.argv[3] || DEFAULT_PASSWORD).trim();

async function run() {
  if (!process.env.MONGODB_URI) {
    throw new Error('Missing MONGODB_URI in environment');
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const adminRole = await Role.findOne({ roleName: 'Admin' });
  if (!adminRole) {
    throw new Error('Admin role not found. Run: node src/seeds/role.seed.js');
  }

  const user = await User.findOne({ email: targetEmail });
  if (!user) {
    throw new Error(`User with email "${targetEmail}" not found`);
  }

  const salt = await bcrypt.genSalt(10);
  user.passwordHash = await bcrypt.hash(newPassword, salt);
  user.roleId = adminRole._id;
  user.status = 'active';

  await user.save();

  console.log('Promote success:');
  console.log(`- email: ${targetEmail}`);
  console.log(`- role: Admin`);
  console.log(`- password reset: Yes`);
}

run()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error(`Promote failed: ${error.message}`);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  });

