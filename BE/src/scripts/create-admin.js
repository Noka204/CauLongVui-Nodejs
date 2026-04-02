require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/user.model');
const Role = require('../models/role.model');

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Tìm hoặc tạo role Admin
    let adminRole = await Role.findOne({ roleName: 'Admin' });
    
    if (!adminRole) {
      console.log('Creating Admin role...');
      adminRole = await Role.create({ roleName: 'Admin' });
    }

    // Kiểm tra admin đã tồn tại chưa
    const existingAdmin = await User.findOne({ phoneNumber: '0999999999' });
    if (existingAdmin) {
      console.log('Admin account already exists!');
      console.log('Phone: 0999999999');
      console.log('Password: admin123');
      process.exit(0);
    }

    // Hash password
    const passwordHash = await bcrypt.hash('admin123', 10);

    // Tạo admin
    const admin = await User.create({
      fullName: 'Admin',
      phoneNumber: '0999999999',
      email: 'admin@caulongvui.com',
      passwordHash,
      roleId: adminRole._id,
      balance: 0,
    });

    console.log('✅ Admin account created successfully!');
    console.log('Phone: 0999999999');
    console.log('Password: admin123');
    console.log('Role: Admin');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

createAdmin();
