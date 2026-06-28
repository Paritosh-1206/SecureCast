const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function resetAdmin() {
  await mongoose.connect('mongodb://127.0.0.1:27017/securecast');
  const users = mongoose.connection.db.collection('users');

  // 1. Delete all existing users
  const deleteResult = await users.deleteMany({});
  console.log(`Deleted ${deleteResult.deletedCount} user(s).`);

  // 2. Create the single admin user
  const hash = await bcrypt.hash('Admin@123', 12);
  const insertResult = await users.insertOne({
    name: 'Paritosh',
    email: 'paritosh.b1206@gmail.com',
    password: hash,
    role: 'admin',
    isApproved: true,
    isEmailVerified: true,
    faceSetupComplete: false,
    faceEmbedding: null,
    walletAddress: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log('Admin user created:', insertResult.insertedId);

  // 3. Verify
  const all = await users.find({}, { projection: { email: 1, role: 1, isApproved: 1, isEmailVerified: 1 } }).toArray();
  console.log('\nAll users:');
  all.forEach((u, i) =>
    console.log(`  ${i + 1}. ${u.role.toUpperCase()} | ${u.email} | approved=${u.isApproved} | verified=${u.isEmailVerified}`)
  );

  process.exit(0);
}

resetAdmin().catch(e => { console.error(e); process.exit(1); });
