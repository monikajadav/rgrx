import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../src/db/index';
import { adminUser, dailyFinancials, manualExpiryTracker, orders } from '../src/db/schema';
import { eq, desc } from 'drizzle-orm';

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'rgrx-secret-key-change-in-production';

app.use(cors());
app.use(express.json());

// ==========================================
// Auth Middleware
// ==========================================
function authMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// ==========================================
// Auth Endpoints
// ==========================================
app.get('/api/auth/status', async (_req, res) => {
  try {
    const users = await db.select().from(adminUser).limit(1);
    res.json({ hasAdmin: users.length > 0 });
  } catch (error) {
    console.error('Auth status error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/auth/setup', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!password || password.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const existing = await db.select().from(adminUser).limit(1);

    if (existing.length > 0) {
      await db.update(adminUser).set({ username: username || 'admin', passwordHash }).where(eq(adminUser.id, existing[0].id));
    } else {
      await db.insert(adminUser).values({ username: username || 'admin', passwordHash });
    }
    res.json({ success: true });
  } catch (error: any) {
    console.error('Auth setup error:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const users = await db.select().from(adminUser).where(eq(adminUser.username, username || 'admin')).limit(1);

    if (users.length === 0) {
      return res.status(401).json({ error: 'No admin account found.' });
    }

    const valid = await bcrypt.compare(password, users[0].passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    const token = jwt.sign({ userId: users[0].id, username: users[0].username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, username: users[0].username });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/auth/verify', authMiddleware, (_req, res) => {
  res.json({ valid: true });
});

// ==========================================
// Daily Financials / Ledger Endpoints
// ==========================================
app.get('/api/ledger', authMiddleware, async (_req, res) => {
  try {
    const entries = await db.select().from(dailyFinancials).orderBy(desc(dailyFinancials.entryDate));
    res.json(entries);
  } catch (error) {
    console.error('Ledger GET error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/ledger', authMiddleware, async (req, res) => {
  try {
    const { entryDate, dayOfWeek, cashEarned, onlineEarned, spentOnOrders, pendingAmount } = req.body;
    const existing = await db.select().from(dailyFinancials).where(eq(dailyFinancials.entryDate, entryDate)).limit(1);

    if (existing.length > 0) {
      await db.update(dailyFinancials).set({
        dayOfWeek, cashEarned, onlineEarned, spentOnOrders, pendingAmount, updatedAt: new Date(),
      }).where(eq(dailyFinancials.id, existing[0].id));
      res.json({ ...existing[0], cashEarned, onlineEarned, spentOnOrders, pendingAmount, updated: true });
    } else {
      const [newEntry] = await db.insert(dailyFinancials).values({
        entryDate, dayOfWeek, cashEarned, onlineEarned, spentOnOrders, pendingAmount,
      }).returning();
      res.json({ ...newEntry, updated: false });
    }
  } catch (error) {
    console.error('Ledger POST error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/dashboard', authMiddleware, async (_req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const entries = await db.select().from(dailyFinancials).where(eq(dailyFinancials.entryDate, today)).limit(1);

    if (entries.length > 0) {
      res.json({ ...entries[0], hasEntry: true });
    } else {
      res.json({
        cashEarned: '0.00', onlineEarned: '0.00', spentOnOrders: '0.00', pendingAmount: '0.00', hasEntry: false,
      });
    }
  } catch (error) {
    console.error('Dashboard API Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ==========================================
// Manual Expiry Tracker
// ==========================================
app.get('/api/expiry/manual', authMiddleware, async (_req, res) => {
  try {
    const results = await db.select().from(manualExpiryTracker).orderBy(manualExpiryTracker.expiryDate);
    res.json(results);
  } catch (error) {
    console.error('Expiry GET Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/expiry/manual', authMiddleware, async (req, res) => {
  try {
    const { itemName, batchNumber, expiryDate, quantity } = req.body;
    const [newItem] = await db.insert(manualExpiryTracker).values({
      itemName, batchNumber, expiryDate, quantity: quantity || 0
    }).returning();
    res.json(newItem);
  } catch (error) {
    console.error('Expiry POST Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.delete('/api/expiry/manual/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(manualExpiryTracker).where(eq(manualExpiryTracker.id, parseInt(id)));
    res.json({ success: true });
  } catch (error) {
    console.error('Expiry DELETE Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ==========================================
// Customer Orders (Expanded)
// ==========================================
app.post('/api/orders', async (req, res) => {
  try {
    const { 
      customerName, 
      customerPhone, 
      prescriptionUrl, 
      itemsRequested,
      medicineTotal,
      deliveryFee,
      totalPaid,
      customerLocationText,
      latitude, 
      longitude,
      paymentMethod
    } = req.body;

    const [newOrder] = await db.insert(orders).values({
      customerName,
      customerPhone,
      prescriptionUrl,
      itemsRequested,
      medicineTotal,
      deliveryFee,
      totalPaid,
      customerLocationText,
      latitude,
      longitude,
      paymentMethod: paymentMethod || 'online',
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'paid', // Mock payment success for online
      orderStatus: 'pending'
    }).returning();
    res.json(newOrder);
  } catch (error) {
    console.error('Create Order Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/orders', authMiddleware, async (_req, res) => {
  try {
    const pendingOrders = await db.select().from(orders).where(eq(orders.orderStatus, 'pending')).orderBy(desc(orders.createdAt));
    res.json(pendingOrders);
  } catch (error) {
    console.error('Fetch Orders Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.patch('/api/orders/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus } = req.body; // 'approved' or 'rejected'
    const paymentStatus = orderStatus === 'rejected' ? 'refunded' : 'paid';

    const [updatedOrder] = await db.update(orders)
      .set({ orderStatus, paymentStatus })
      .where(eq(orders.id, parseInt(id)))
      .returning();
      
    res.json(updatedOrder);
  } catch (error) {
    console.error('Update Order Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
});
