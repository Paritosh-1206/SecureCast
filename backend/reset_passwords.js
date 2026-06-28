const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function updateRoles() {
  await mongoose.connect('mongodb://127.0.0.1:27017/securecast');
  const users = mongoose.connection.db.collection('users');

  // 1. Demote admin@securecast.com to voter
  const r1 = await users.updateOne(
    { email: 'admin@securecast.com' },
    { $set: { role: 'voter' } }
  );
  console.log('admin@securecast.com -> voter:', r1.modifiedCount ? 'DONE' : 'NOT FOUND');

  // 2. Upsert vivekthakare2711@gmail.com as admin with password Admin@123
  const hash = await bcrypt.hash('Admin@123', 12);
  const r2 = await users.updateOne(
    { email: 'vivekthakare2711@gmail.com' },
    {
      $set: {
        email: 'vivekthakare2711@gmail.com',
        password: hash,
        role: 'admin',
        isApproved: true,
        isEmailVerified: true
      },
      $setOnInsert: {
        createdAt: new Date(),
        updatedAt: new Date()
      }
    },
    { upsert: true }
  );
  console.log('vivekthakare2711@gmail.com -> admin:', r2.upsertedCount ? 'CREATED' : 'UPDATED');

  // Print final state
  const all = await users.find({}, { projection: { email: 1, role: 1, isApproved: 1 } }).toArray();
  console.log('\nAll users:');
  all.forEach((u, i) => console.log(`  ${i + 1}. ${u.role.toUpperCase()} | ${u.email} | approved=${u.isApproved}`));

  process.exit(0);
}

updateRoles().catch(e => { console.error(e); process.exit(1); });
