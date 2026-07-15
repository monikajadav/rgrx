# RGRx - Pharmacy POS & Management System

RGRx is a modern, full-stack Point of Sale (POS) and pharmacy management web application designed to streamline daily pharmacy operations. It provides an intuitive interface for billing, tracking expiring stock, and managing daily financials.

## 🚀 Features

- **POS Billing System**: Fast and efficient billing interface with instant calculations for totals, CGST, and SGST.
- **Digital Receipts & WhatsApp Integration**: Generate professional digital receipts and instantly share them with customers via WhatsApp or save them as PDFs.
- **Expiry Tracker**: Keep track of medicine batches, quantities, and their expiration dates to prevent inventory wastage.
- **Financial Ledger & Reports**: Monitor daily cash/online earnings, orders expenditure, and pending amounts with detailed financial summaries.
- **Secure Admin Authentication**: JWT-based secure authentication to protect sensitive business data.

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Vite, TailwindCSS (v4), TanStack Router, Zustand (State Management), shadcn/ui & Radix UI.
- **Backend**: Node.js, Express.js.
- **Database**: PostgreSQL (via Drizzle ORM).
- **Authentication**: JWT (JSON Web Tokens) and bcrypt.

## 📦 Local Development Setup

### Prerequisites
- Node.js (v18 or higher)
- npm or pnpm
- PostgreSQL running locally or a cloud database URL (e.g., Supabase)

### 1. Clone & Install
Clone the repository and install dependencies:
```bash
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory and add the following variables:
```env
# Database Connection (e.g. Supabase, Neon, or Local Postgres)
DATABASE_URL="postgresql://user:password@localhost:5432/rgrx"

# API Secrets
JWT_SECRET="your-super-secret-jwt-key"
PORT=5000

# Frontend Configuration
VITE_API_URL="http://localhost:5000"
```

### 3. Run the Development Server
This project uses `concurrently` to run both the Node backend and React frontend simultaneously.

```bash
npm run dev
```

- **Frontend**: `http://localhost:5173`
- **Backend**: `http://localhost:5000`

## 🏗️ Building for Production

To build the application for deployment:

```bash
npm run build
```
This will compile the TypeScript code and generate the optimized production assets for the frontend in the `dist` folder.

## 📄 License

This project is proprietary and intended for RGRx internal use.
