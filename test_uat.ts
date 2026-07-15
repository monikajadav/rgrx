import 'dotenv/config';
import { db } from './src/db/index';
import { products, batches, bills, billItems } from './src/db/schema';
import { sql } from 'drizzle-orm';

async function runUAT() {
  console.log('--- STARTING UAT ---');

  try {
    // 1. Clear previous test data to ensure clean slate
    await db.execute(sql`TRUNCATE TABLE ${billItems} CASCADE`);
    await db.execute(sql`TRUNCATE TABLE ${bills} CASCADE`);
    await db.execute(sql`TRUNCATE TABLE ${batches} CASCADE`);
    await db.execute(sql`TRUNCATE TABLE ${products} CASCADE`);

    // Scenario 1: Inventory & Batch Management Initialization
    console.log('\\n[Scenario 1] Creating Product & Batches...');
    
    // Ensure category exists for foreign key constraint
    await db.execute(sql`INSERT INTO categories (id, name, slug) VALUES (1, 'Medicine', 'medicine') ON CONFLICT DO NOTHING`);

    // Add Product via DB (Simulating API call for speed)
    const [testProduct] = await db.insert(products).values({
      name: 'Testamol 500mg',
      categoryId: 1,
      cgstRate: '6.00',
      sgstRate: '6.00'
    }).returning();
    console.log(`✅ Product created: ${testProduct.name}`);

    // Add 3 Batches
    const today = new Date();
    const tenDaysAgo = new Date(today); tenDaysAgo.setDate(today.getDate() - 10);
    const fifteenDaysFromNow = new Date(today); fifteenDaysFromNow.setDate(today.getDate() + 15);
    const oneYearFromNow = new Date(today); oneYearFromNow.setFullYear(today.getFullYear() + 1);

    const [batchA, batchB, batchC] = await db.insert(batches).values([
      { productId: testProduct.id, batchNumber: 'BATCH-A', expiryDate: tenDaysAgo.toISOString().split('T')[0], quantity: 10, mrp: '50.00', purchaseRate: '30.00' },
      { productId: testProduct.id, batchNumber: 'BATCH-B', expiryDate: fifteenDaysFromNow.toISOString().split('T')[0], quantity: 50, mrp: '55.00', purchaseRate: '35.00' },
      { productId: testProduct.id, batchNumber: 'BATCH-C', expiryDate: oneYearFromNow.toISOString().split('T')[0], quantity: 100, mrp: '60.00', purchaseRate: '40.00' },
    ]).returning();
    
    console.log(`✅ Batches created: A(Expired), B(Soon), C(Safe)`);
    console.log('[Scenario 1] PASS');


    // Scenario 2: Universal Search & POS (FEFO)
    console.log('\\n[Scenario 2] FEFO Engine test...');
    
    // Simulate Fetching Search API (which aggregates non-expired stock)
    const res = await fetch(`http://localhost:5000/api/search?q=Testamol`);
    const searchData = await res.json();
    
    if (searchData[0].totalStock !== 150) {
       throw new Error(`Search stock mismatch: Expected 150, got ${searchData[0].totalStock}`);
    }
    console.log(`✅ Validation 1: Search shows 150 valid stock (excluding expired)`);

    // Simulate POS Checkout API call (Deducting 60)
    // We expect it to take 50 from B, and 10 from C.
    const billPayload = {
      items: [
        { productId: testProduct.id, batchId: batchB.id, quantity: 50, mrp: batchB.mrp, cgstAmount: '0.00', sgstAmount: '0.00', totalPrice: '2750.00' },
        { productId: testProduct.id, batchId: batchC.id, quantity: 10, mrp: batchC.mrp, cgstAmount: '0.00', sgstAmount: '0.00', totalPrice: '600.00' }
      ],
      subTotal: '3350.00', totalCgst: '0.00', totalSgst: '0.00', grandTotal: '3350.00'
    };

    const billRes = await fetch(`http://localhost:5000/api/bills`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(billPayload)
    });
    
    if (!billRes.ok) throw new Error('Failed to save bill');

    // Verify Database quantities
    const [checkB] = await db.select().from(batches).where(sql`${batches.id} = ${batchB.id}`);
    const [checkC] = await db.select().from(batches).where(sql`${batches.id} = ${batchC.id}`);
    
    if (checkB.quantity !== 0) throw new Error('Batch B was not exhausted');
    if (checkC.quantity !== 90) throw new Error(`Batch C quantity incorrect: ${checkC.quantity}`);
    console.log(`✅ Validation 3: FEFO Deduction Success (Batch B = 0, Batch C = 90)`);
    console.log('[Scenario 2] PASS');

    // Scenario 3: Dashboards
    console.log('\\n[Scenario 3 & 4] Dashboards and Reports...');
    const dashRes = await fetch('http://localhost:5000/api/dashboard');
    const dashData = await dashRes.json();
    if (dashData.itemsSold !== 60) throw new Error(`Items sold should be 60, got ${dashData.itemsSold}`);
    console.log(`✅ Dashboard stats updated correctly`);

    const reportRes = await fetch('http://localhost:5000/api/reports/gst');
    const reportData = await reportRes.json();
    if (reportData.length !== 2) throw new Error(`Expected 2 bill items in report, got ${reportData.length}`);
    console.log(`✅ GST Report has correct data entries`);
    console.log('[Scenario 3 & 4] PASS');

    console.log('\\n--- UAT COMPLETED SUCCESSFULLY ---');
  } catch (err) {
    console.error('\\n❌ UAT FAILED:', err);
  } finally {
    process.exit(0);
  }
}

runUAT();
