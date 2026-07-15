export {};

async function seed() {
  console.log('🌱 Starting database seed...');
  console.log('No default seeding required for current schema.');
  console.log('✅ Seeding complete!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
