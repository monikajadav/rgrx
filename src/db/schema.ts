import { pgTable, serial, text, integer, date, decimal, timestamp } from "drizzle-orm/pg-core";

// ==========================================
// Admin Authentication
// ==========================================

export const adminUser = pgTable('admin_user', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ==========================================
// Manual Daily Financial Ledger
// ==========================================

export const dailyFinancials = pgTable('daily_financials', {
  id: serial('id').primaryKey(),
  entryDate: date('entry_date').notNull().unique(),
  dayOfWeek: text('day_of_week').notNull(),
  cashEarned: decimal('cash_earned', { precision: 12, scale: 2 }).notNull().default('0'),
  onlineEarned: decimal('online_earned', { precision: 12, scale: 2 }).notNull().default('0'),
  spentOnOrders: decimal('spent_on_orders', { precision: 12, scale: 2 }).notNull().default('0'),
  pendingAmount: decimal('pending_amount', { precision: 12, scale: 2 }).notNull().default('0'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ==========================================
// Manual Expiry Tracker
// ==========================================

export const manualExpiryTracker = pgTable('manual_expiry_tracker', {
  id: serial('id').primaryKey(),
  itemName: text('item_name').notNull(),
  batchNumber: text('batch_number').notNull(),
  expiryDate: date('expiry_date').notNull(),
  quantity: integer('quantity').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ==========================================
// Customer Orders
// ==========================================

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  customerName: text('customer_name').notNull(),
  customerPhone: text('customer_phone').notNull(),
  
  // Expanded Details
  prescriptionUrl: text('prescription_url'),
  itemsRequested: text('items_requested'),
  medicineTotal: decimal('medicine_total', { precision: 10, scale: 2 }),
  deliveryFee: decimal('delivery_fee', { precision: 10, scale: 2 }),
  totalPaid: decimal('total_paid', { precision: 10, scale: 2 }),
  
  // Location
  customerLocationText: text('customer_location_text'),
  latitude: decimal('latitude', { precision: 10, scale: 8 }),
  longitude: decimal('longitude', { precision: 10, scale: 8 }),
  
  paymentStatus: text('payment_status').notNull().default('pending'), // 'pending' | 'paid' | 'refunded'
  paymentMethod: text('payment_method').notNull().default('online'), // 'online' | 'cod'
  orderStatus: text('order_status').notNull().default('pending'), // 'pending' | 'approved' | 'rejected'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
