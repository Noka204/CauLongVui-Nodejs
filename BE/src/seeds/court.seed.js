require('dotenv').config();
const mongoose = require('mongoose');
const Court = require('../models/court.model');

const DEFAULT_COURTS = [
  {
    courtName: 'Sân A1',
    description: 'Sân tiêu chuẩn quốc tế, có mái che, ánh sáng tốt',
    basePrice: 80000,
    imageUrl: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800',
    isMaintenance: false,
  },
  {
    courtName: 'Sân A2',
    description: 'Sân VIP, có điều hòa, phù hợp thi đấu chuyên nghiệp',
    basePrice: 100000,
    imageUrl: 'https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=800',
    isMaintenance: false,
  },
  {
    courtName: 'Sân B1',
    description: 'Sân ngoài trời, thoáng mát, view đẹp',
    basePrice: 70000,
    imageUrl: 'https://images.unsplash.com/photo-1594623930572-300a3011d9ae?w=800',
    isMaintenance: false,
  },
  {
    courtName: 'Sân B2',
    description: 'Sân trong nhà, mặt sàn gỗ cao cấp',
    basePrice: 90000,
    imageUrl: 'https://images.unsplash.com/photo-1622163642998-1ea32b0bbc67?w=800',
    isMaintenance: false,
  },
];

async function seedCourts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected for court seeding...');

    const existing = await Court.find().lean();
    
    if (existing.length > 0) {
      console.log(`Already have ${existing.length} courts in database`);
      existing.forEach(court => {
        console.log(`  - ${court.courtName}: ${court.basePrice} VND`);
      });
      await mongoose.disconnect();
      process.exit(0);
    }

    let createdCount = 0;
    for (const court of DEFAULT_COURTS) {
      await Court.create(court);
      createdCount += 1;
      console.log(`Created: ${court.courtName} | ${court.basePrice} VND`);
    }

    console.log(`\n✅ Created ${createdCount} courts successfully!`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Court seed error:', error.message);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
}

seedCourts();
