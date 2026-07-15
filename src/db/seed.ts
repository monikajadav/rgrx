import { db } from './index';
import { categories, products, batches } from './schema';
import { addDays, subDays } from 'date-fns';

async function seed() {
  console.log('🌱 Starting database seed...');

  // 1. Seed Categories
  const categoryData = [
    { name: 'Medicine', slug: 'medicine' },
    { name: 'Skincare', slug: 'skincare' },
    { name: 'Haircare', slug: 'haircare' },
    { name: 'Baby', slug: 'baby' },
    { name: 'Supplements', slug: 'supplements' }
  ];

  await db.delete(batches);
  await db.delete(products);
  await db.delete(categories);

  console.log('Inserting categories...');
  const insertedCategories = await db.insert(categories).values(categoryData).returning();

  // 2. Seed Products
  console.log('Inserting products...');
  const productData = [
    { name: 'Paracetamol 500mg', composition: 'Paracetamol', barcode: '1234567890123', categoryId: insertedCategories[0].id, cgstRate: '2.50', sgstRate: '2.50' },
    { name: 'Amoxicillin 250mg', composition: 'Amoxicillin', barcode: '1234567890124', categoryId: insertedCategories[0].id, cgstRate: '6.00', sgstRate: '6.00' },
    { name: 'Cetaphil Cleanser', composition: 'Gentle Skin Cleanser', barcode: '1234567890125', categoryId: insertedCategories[1].id, cgstRate: '9.00', sgstRate: '9.00' },
    { name: 'Sunscreen SPF 50', composition: 'Zinc Oxide, Titanium Dioxide', barcode: '1234567890126', categoryId: insertedCategories[1].id, cgstRate: '9.00', sgstRate: '9.00' },
    { name: 'Minoxidil 5%', composition: 'Minoxidil Topical Solution', barcode: '1234567890127', categoryId: insertedCategories[2].id, cgstRate: '6.00', sgstRate: '6.00' },
    { name: 'Anti-Dandruff Shampoo', composition: 'Ketoconazole 2%', barcode: '1234567890128', categoryId: insertedCategories[2].id, cgstRate: '9.00', sgstRate: '9.00' },
    { name: 'Baby Lotion', composition: 'Oatmeal, Shea Butter', barcode: '1234567890129', categoryId: insertedCategories[3].id, cgstRate: '2.50', sgstRate: '2.50' },
    { name: 'Diaper Rash Cream', composition: 'Zinc Oxide 40%', barcode: '1234567890130', categoryId: insertedCategories[3].id, cgstRate: '2.50', sgstRate: '2.50' },
    { name: 'Vitamin C 1000mg', composition: 'Ascorbic Acid', barcode: '1234567890131', categoryId: insertedCategories[4].id, cgstRate: '6.00', sgstRate: '6.00' },
    { name: 'Omega 3 Fish Oil', composition: 'EPA, DHA', barcode: '1234567890132', categoryId: insertedCategories[4].id, cgstRate: '6.00', sgstRate: '6.00' }
  ];

  const insertedProducts = await db.insert(products).values(productData).returning();

  // 3. Seed Batches
  console.log('Inserting batches...');
  const today = new Date();
  const batchData = [];

  for (const product of insertedProducts) {
    // Expired Batch
    batchData.push({
      productId: product.id,
      batchNumber: `B-EXP-${product.id}`,
      expiryDate: subDays(today, 30).toISOString().split('T')[0], // 30 days ago
      quantity: 50,
      purchaseRate: '10.00',
      mrp: '15.00'
    });

    // Expiring Soon Batch
    batchData.push({
      productId: product.id,
      batchNumber: `B-SOON-${product.id}`,
      expiryDate: addDays(today, 15).toISOString().split('T')[0], // 15 days from now
      quantity: 100,
      purchaseRate: '12.00',
      mrp: '18.00'
    });

    // Safe Batch
    batchData.push({
      productId: product.id,
      batchNumber: `B-SAFE-${product.id}`,
      expiryDate: addDays(today, 365).toISOString().split('T')[0], // 1 year from now
      quantity: 200,
      purchaseRate: '11.00',
      mrp: '20.00'
    });
  }

  await db.insert(batches).values(batchData);
  
  console.log('✅ Seeding complete!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
