// Quick script to disable all MongoDB transactions for non-replica set environments
const fs = require('fs');
const path = require('path');

const files = [
  'src/services/payment.service.js',
  'src/services/booking-exchange.service.js',
];

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Comment out session creation and transaction start
  content = content.replace(
    /const session = await mongoose\.startSession\(\);/g,
    '// const session = await mongoose.startSession(); // Disabled for non-replica set'
  );
  
  content = content.replace(
    /session\.startTransaction\(\);/g,
    '// session.startTransaction(); // Disabled'
  );
  
  // Remove session parameter from operations
  content = content.replace(/\.session\(session\)/g, '');
  content = content.replace(/\{ session \}/g, '{}');
  content = content.replace(/, \{ session \}/g, '');
  
  // Comment out commit/abort
  content = content.replace(/await session\.commitTransaction\(\);/g, '// await session.commitTransaction();');
  content = content.replace(/session\.endSession\(\);/g, '// session.endSession();');
  content = content.replace(/await session\.abortTransaction\(\);/g, '// await session.abortTransaction();');
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ Disabled transactions in ${file}`);
});

console.log('\n✅ All transactions disabled successfully!');
